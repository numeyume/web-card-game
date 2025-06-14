import { Server } from 'socket.io'
import { verifyToken } from '@/middleware/auth'
import { MatchmakerService } from '@/services/matchmaker'
import { setupGameHandlers } from './game'
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from '@/types'

export const setupSocketHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>) => {
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
    
    if (token) {
      const decoded = verifyToken(token) as any
      if (decoded) {
        socket.data = {
          userId: decoded.id,
          userName: decoded.name
        }
        return next()
      }
    }

    // Allow anonymous connections
    const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    socket.data = {
      userId: anonymousId,
      userName: `Anonymous_${anonymousId.slice(5, 13)}`
    }
    
    next()
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.userName} (${socket.data.userId})`)

    // Setup game-specific handlers
    setupGameHandlers(io, socket)

    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong')
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.data.userName} (${reason})`)
      
      // Mark player as disconnected in matchmaker
      MatchmakerService.disconnectPlayer(socket.data.userId)
      
      if (socket.data.roomId) {
        socket.to(socket.data.roomId).emit('playerLeft', {
          id: socket.data.userId,
          name: socket.data.userName
        } as any)
      }
    })

    // Handle reconnection
    socket.on('connect', () => {
      const room = MatchmakerService.reconnectPlayer(socket.data.userId)
      if (room) {
        socket.join(room.id)
        socket.data.roomId = room.id
        socket.emit('roomJoined', room)
      }
    })

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  })

  console.log('Socket.IO handlers set up successfully')
}