import { Router } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import type { AuthRequest, ApiResponse, Room } from '@/types'

const router = Router()

// Mock rooms storage (will be replaced with MongoDB)
const rooms: Map<string, Room> = new Map()

// GET /api/rooms - Get all rooms
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const roomsList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    playerCount: room.players.length,
    maxPlayers: room.maxPlayers,
    status: room.status,
    createdAt: room.createdAt
  }))

  const response: ApiResponse<any[]> = {
    success: true,
    data: roomsList
  }

  res.json(response)
}))

// POST /api/rooms - Create a new room
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }

  const { name, maxPlayers = 4, gameSettings } = req.body

  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const newRoom: Room = {
    id: roomId,
    name: name || `${req.user.name}'s Room`,
    players: [],
    maxPlayers: Math.min(Math.max(maxPlayers, 2), 4), // Ensure 2-4 players
    status: 'waiting',
    currentPlayerIndex: 0,
    turn: 0,
    phase: 'action',
    supply: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    gameSettings: {
      maxTurns: gameSettings?.maxTurns || 50,
      timeLimit: gameSettings?.timeLimit || 120,
      customCards: gameSettings?.customCards || [],
      startingDeck: gameSettings?.startingDeck || [],
      endConditions: gameSettings?.endConditions || [
        { type: 'province_exhausted' },
        { type: 'three_pile_exhausted' }
      ]
    },
    endConditions: gameSettings?.endConditions || [
      { type: 'province_exhausted' },
      { type: 'three_pile_exhausted' }
    ]
  }

  rooms.set(roomId, newRoom)

  const response: ApiResponse<Room> = {
    success: true,
    data: newRoom,
    message: 'Room created successfully'
  }

  res.status(201).json(response)
}))

// GET /api/rooms/:id - Get specific room
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const room = rooms.get(req.params.id)

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Room not found'
    })
  }

  const response: ApiResponse<Room> = {
    success: true,
    data: room
  }

  res.json(response)
}))

// DELETE /api/rooms/:id - Delete room (only creator or admin)
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const room = rooms.get(req.params.id)

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Room not found'
    })
  }

  // Only room creator or admin can delete
  // For now, allow any authenticated user
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }

  rooms.delete(req.params.id)

  const response: ApiResponse = {
    success: true,
    message: 'Room deleted successfully'
  }

  res.json(response)
}))

export default router