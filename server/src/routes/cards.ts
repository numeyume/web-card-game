import { Router } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import type { AuthRequest, ApiResponse, Card } from '@/types'

const router = Router()

// Standard cards (basic game cards)
const standardCards: Card[] = [
  {
    id: 'copper',
    name: 'Copper',
    cost: 0,
    type: 'Treasure',
    effects: [{ type: 'gain_coin', value: 1 }],
    description: 'Gain 1 coin.'
  },
  {
    id: 'silver',
    name: 'Silver',
    cost: 3,
    type: 'Treasure',
    effects: [{ type: 'gain_coin', value: 2 }],
    description: 'Gain 2 coins.'
  },
  {
    id: 'gold',
    name: 'Gold',
    cost: 6,
    type: 'Treasure',
    effects: [{ type: 'gain_coin', value: 3 }],
    description: 'Gain 3 coins.'
  },
  {
    id: 'estate',
    name: 'Estate',
    cost: 2,
    type: 'Victory',
    effects: [],
    description: 'Worth 1 Victory Point.'
  },
  {
    id: 'duchy',
    name: 'Duchy',
    cost: 5,
    type: 'Victory',
    effects: [],
    description: 'Worth 3 Victory Points.'
  },
  {
    id: 'province',
    name: 'Province',
    cost: 8,
    type: 'Victory',
    effects: [],
    description: 'Worth 6 Victory Points.'
  },
  {
    id: 'village',
    name: 'Village',
    cost: 3,
    type: 'Action',
    effects: [
      { type: 'draw', value: 1 },
      { type: 'gain_action', value: 2 }
    ],
    description: 'Draw 1 card. +2 Actions.'
  },
  {
    id: 'smithy',
    name: 'Smithy',
    cost: 4,
    type: 'Action',
    effects: [{ type: 'draw', value: 3 }],
    description: 'Draw 3 cards.'
  },
  {
    id: 'market',
    name: 'Market',
    cost: 5,
    type: 'Action',
    effects: [
      { type: 'draw', value: 1 },
      { type: 'gain_action', value: 1 },
      { type: 'gain_buy', value: 1 },
      { type: 'gain_coin', value: 1 }
    ],
    description: 'Draw 1 card. +1 Action, +1 Buy, +1 Coin.'
  }
]

// Mock custom cards storage (will be replaced with MongoDB)
const customCards: Map<string, Card> = new Map()

// GET /api/cards - Get all cards (standard + custom)
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { type, creatorId } = req.query

  let allCards = [...standardCards, ...Array.from(customCards.values())]

  // Filter by type if specified
  if (type && typeof type === 'string') {
    allCards = allCards.filter(card => card.type === type)
  }

  // Filter by creator if specified
  if (creatorId && typeof creatorId === 'string') {
    allCards = allCards.filter(card => card.creatorId === creatorId)
  }

  const response: ApiResponse<Card[]> = {
    success: true,
    data: allCards
  }

  res.json(response)
}))

// POST /api/cards - Create a custom card
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }

  const { name, cost, type, effects, description } = req.body

  // Validation
  if (!name || !description || cost < 0 || cost > 10) {
    return res.status(400).json({
      success: false,
      error: 'Invalid card data. Name and description are required, cost must be 0-10.'
    })
  }

  if (!effects || !Array.isArray(effects) || effects.length === 0 || effects.length > 3) {
    return res.status(400).json({
      success: false,
      error: 'Effects must be an array with 1-3 effects.'
    })
  }

  // Validate effects
  for (const effect of effects) {
    if (!effect.type || !effect.value || effect.value < 1 || effect.value > 10) {
      return res.status(400).json({
        success: false,
        error: 'Each effect must have a type and value (1-10).'
      })
    }
  }

  const cardId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const newCard: Card = {
    id: cardId,
    name,
    cost,
    type: type || 'Custom',
    effects,
    description,
    creatorId: req.user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  customCards.set(cardId, newCard)

  const response: ApiResponse<Card> = {
    success: true,
    data: newCard,
    message: 'Card created successfully'
  }

  res.status(201).json(response)
}))

// GET /api/cards/:id - Get specific card
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const cardId = req.params.id
  
  // Check standard cards first
  const standardCard = standardCards.find(card => card.id === cardId)
  if (standardCard) {
    return res.json({
      success: true,
      data: standardCard
    })
  }

  // Check custom cards
  const customCard = customCards.get(cardId)
  if (customCard) {
    return res.json({
      success: true,
      data: customCard
    })
  }

  res.status(404).json({
    success: false,
    error: 'Card not found'
  })
}))

// PUT /api/cards/:id - Update custom card (only creator)
router.put('/:id', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }

  const card = customCards.get(req.params.id)

  if (!card) {
    return res.status(404).json({
      success: false,
      error: 'Card not found'
    })
  }

  if (card.creatorId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'You can only edit your own cards'
    })
  }

  const { name, cost, type, effects, description } = req.body

  // Update card
  const updatedCard: Card = {
    ...card,
    name: name || card.name,
    cost: cost !== undefined ? cost : card.cost,
    type: type || card.type,
    effects: effects || card.effects,
    description: description || card.description,
    updatedAt: new Date()
  }

  customCards.set(req.params.id, updatedCard)

  const response: ApiResponse<Card> = {
    success: true,
    data: updatedCard,
    message: 'Card updated successfully'
  }

  res.json(response)
}))

// DELETE /api/cards/:id - Delete custom card (only creator)
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }

  const card = customCards.get(req.params.id)

  if (!card) {
    return res.status(404).json({
      success: false,
      error: 'Card not found'
    })
  }

  if (card.creatorId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'You can only delete your own cards'
    })
  }

  customCards.delete(req.params.id)

  const response: ApiResponse = {
    success: true,
    message: 'Card deleted successfully'
  }

  res.json(response)
}))

export default router