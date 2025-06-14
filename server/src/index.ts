import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

import { errorHandler } from '@/middleware/errorHandler'
import { authMiddleware } from '@/middleware/auth'
import roomRoutes from '@/routes/rooms'
import cardRoutes from '@/routes/cards'
import { setupSocketHandlers } from '@/socket/index'
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from '@/types'

const app = express()
const server = createServer(app)

const io = new Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'

// Security middleware
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false
}))

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})
app.use('/api/', limiter)

// Basic middleware
app.use(compression())
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Authentication middleware
app.use(authMiddleware)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: NODE_ENV
  })
})

// API routes
app.use('/api/rooms', roomRoutes)
app.use('/api/cards', cardRoutes)

// Setup Socket.IO handlers
setupSocketHandlers(io)

// Error handling
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌍 Environment: ${NODE_ENV}`)
  console.log(`📡 Socket.IO ready for connections`)
  
  if (NODE_ENV === 'development') {
    console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export { app, server, io }