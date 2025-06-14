import { Server, Socket } from 'socket.io'
import { MatchmakerService } from '@/services/matchmaker'
import type { ServerToClientEvents, ClientToServerEvents, SocketData, GameState, GameLogEntry } from '@/types'

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>
type GameServer = Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>

export const setupGameHandlers = (io: GameServer, socket: GameSocket) => {
  // Join room handler
  socket.on('joinRoom', async (roomId: string) => {
    try {
      console.log(`${socket.data.userName} attempting to join room ${roomId}`)
      
      // Leave current room if any
      if (socket.data.roomId) {
        socket.leave(socket.data.roomId)
        const oldRoom = MatchmakerService.getRoom(socket.data.roomId)
        if (oldRoom) {
          socket.to(socket.data.roomId).emit('playerLeft', {
            id: socket.data.userId,
            name: socket.data.userName
          } as any)
        }
      }
      
      // Join new room
      const result = MatchmakerService.addPlayerToRoom(roomId, socket.data.userId, socket.data.userName)
      if (!result) {
        socket.emit('error', { message: 'Failed to join room' })
        return
      }
      
      const { room, player } = result
      socket.join(roomId)
      socket.data.roomId = roomId
      
      // Notify player they joined
      socket.emit('roomJoined', room)
      
      // Notify other players
      socket.to(roomId).emit('playerJoined', player)
      
      // Send game state to all players in room
      broadcastGameState(io, room)
      
      // Add log entry
      addGameLogEntry(room, player.id, player.name, 'joined the game')
      
      console.log(`${socket.data.userName} successfully joined room ${roomId}`)
      
    } catch (error) {
      console.error('Error joining room:', error)
      socket.emit('error', { 
        message: error instanceof Error ? error.message : 'Failed to join room' 
      })
    }
  })

  // Leave room handler
  socket.on('leaveRoom', () => {
    if (!socket.data.roomId) return
    
    const room = MatchmakerService.removePlayerFromRoom(socket.data.roomId, socket.data.userId)
    
    // Notify other players
    socket.to(socket.data.roomId).emit('playerLeft', {
      id: socket.data.userId,
      name: socket.data.userName
    } as any)
    
    socket.leave(socket.data.roomId)
    socket.data.roomId = undefined
    socket.emit('roomLeft')
    
    if (room) {
      broadcastGameState(io, room)
      addGameLogEntry(room, socket.data.userId, socket.data.userName, 'left the game')
    }
    
    console.log(`${socket.data.userName} left their room`)
  })

  // Create room handler
  socket.on('createRoom', async (settings) => {
    try {
      const room = MatchmakerService.createRoom(
        socket.data.userId,
        socket.data.userName,
        settings?.roomName,
        settings
      )
      
      socket.join(room.id)
      socket.data.roomId = room.id
      socket.emit('roomJoined', room)
      
      broadcastGameState(io, room)
      
      console.log(`${socket.data.userName} created room ${room.id}`)
      
    } catch (error) {
      console.error('Error creating room:', error)
      socket.emit('error', { 
        message: error instanceof Error ? error.message : 'Failed to create room' 
      })
    }
  })

  // Play card handler
  socket.on('playCard', (cardId: string, targets?: string[]) => {
    if (!socket.data.roomId) {
      socket.emit('error', { message: 'Not in a room' })
      return
    }
    
    const room = MatchmakerService.getRoom(socket.data.roomId)
    if (!room || room.status !== 'playing') {
      socket.emit('error', { message: 'Game not in progress' })
      return
    }
    
    const currentPlayer = room.players[room.currentPlayerIndex]
    if (currentPlayer.id !== socket.data.userId) {
      socket.emit('error', { message: 'Not your turn' })
      return
    }
    
    if (room.phase !== 'action') {
      socket.emit('error', { message: 'Not action phase' })
      return
    }
    
    try {
      const cardIndex = currentPlayer.hand.findIndex(card => card.id === cardId)
      if (cardIndex === -1) {
        socket.emit('error', { message: 'Card not in hand' })
        return
      }
      
      const card = currentPlayer.hand[cardIndex]
      if (card.type !== 'Action') {
        socket.emit('error', { message: 'Card is not an action card' })
        return
      }
      
      if (currentPlayer.actions <= 0) {
        socket.emit('error', { message: 'No actions remaining' })
        return
      }
      
      // Remove card from hand and put in play/discard
      currentPlayer.hand.splice(cardIndex, 1)
      currentPlayer.discard.push(card)
      currentPlayer.actions--
      
      // Apply card effects
      applyCardEffects(currentPlayer, card, room, targets)
      
      room.updatedAt = new Date()
      
      // Broadcast game state
      broadcastGameState(io, room)
      
      // Add log entry
      addGameLogEntry(room, currentPlayer.id, currentPlayer.name, `played ${card.name}`)
      
      console.log(`${socket.data.userName} played ${card.name}`)
      
    } catch (error) {
      console.error('Error playing card:', error)
      socket.emit('error', { 
        message: error instanceof Error ? error.message : 'Failed to play card' 
      })
    }
  })

  // Buy card handler
  socket.on('buyCard', (cardId: string) => {
    if (!socket.data.roomId) {
      socket.emit('error', { message: 'Not in a room' })
      return
    }
    
    const room = MatchmakerService.getRoom(socket.data.roomId)
    if (!room || room.status !== 'playing') {
      socket.emit('error', { message: 'Game not in progress' })
      return
    }
    
    const currentPlayer = room.players[room.currentPlayerIndex]
    if (currentPlayer.id !== socket.data.userId) {
      socket.emit('error', { message: 'Not your turn' })
      return
    }
    
    if (room.phase !== 'buy') {
      socket.emit('error', { message: 'Not buy phase' })
      return
    }
    
    try {
      if (currentPlayer.buys <= 0) {
        socket.emit('error', { message: 'No buys remaining' })
        return
      }
      
      if (!room.supply[cardId] || room.supply[cardId] <= 0) {
        socket.emit('error', { message: 'Card not available in supply' })
        return
      }
      
      // Get card cost (this would come from a card database)
      const cardCost = getCardCost(cardId)
      if (currentPlayer.coins < cardCost) {
        socket.emit('error', { message: 'Not enough coins' })
        return
      }
      
      // Purchase card
      currentPlayer.coins -= cardCost
      currentPlayer.buys--
      room.supply[cardId]--
      
      // Add card to discard pile
      const purchasedCard = createCardFromId(cardId)
      currentPlayer.discard.push(purchasedCard)
      
      room.updatedAt = new Date()
      
      // Check end conditions
      checkEndConditions(room)
      
      // Broadcast game state
      broadcastGameState(io, room)
      
      // Add log entry
      addGameLogEntry(room, currentPlayer.id, currentPlayer.name, `bought ${purchasedCard.name}`)
      
      console.log(`${socket.data.userName} bought ${purchasedCard.name}`)
      
    } catch (error) {
      console.error('Error buying card:', error)
      socket.emit('error', { 
        message: error instanceof Error ? error.message : 'Failed to buy card' 
      })
    }
  })

  // End turn handler
  socket.on('endTurn', () => {
    if (!socket.data.roomId) {
      socket.emit('error', { message: 'Not in a room' })
      return
    }
    
    const room = MatchmakerService.getRoom(socket.data.roomId)
    if (!room || room.status !== 'playing') {
      socket.emit('error', { message: 'Game not in progress' })
      return
    }
    
    const currentPlayer = room.players[room.currentPlayerIndex]
    if (currentPlayer.id !== socket.data.userId) {
      socket.emit('error', { message: 'Not your turn' })
      return
    }
    
    try {
      // Cleanup phase
      room.phase = 'cleanup'
      
      // Discard hand
      currentPlayer.discard.push(...currentPlayer.hand)
      currentPlayer.hand = []
      
      // Draw new hand (5 cards)
      drawCards(currentPlayer, 5)
      
      // Reset for next turn
      currentPlayer.actions = 1
      currentPlayer.buys = 1
      currentPlayer.coins = 0
      
      // Next player's turn
      room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length
      
      // If back to first player, increment turn counter
      if (room.currentPlayerIndex === 0) {
        room.turn++
      }
      
      room.phase = 'action'
      room.updatedAt = new Date()
      
      // Check end conditions
      checkEndConditions(room)
      
      // Broadcast game state
      broadcastGameState(io, room)
      
      // Add log entry
      addGameLogEntry(room, currentPlayer.id, currentPlayer.name, 'ended their turn')
      
      console.log(`${socket.data.userName} ended their turn`)
      
    } catch (error) {
      console.error('Error ending turn:', error)
      socket.emit('error', { 
        message: error instanceof Error ? error.message : 'Failed to end turn' 
      })
    }
  })

  // Ready handler (for game start)
  socket.on('ready', () => {
    if (!socket.data.roomId) {
      socket.emit('error', { message: 'Not in a room' })
      return
    }
    
    const room = MatchmakerService.getRoom(socket.data.roomId)
    if (!room) {
      socket.emit('error', { message: 'Room not found' })
      return
    }
    
    if (room.status === 'waiting' && room.players.length >= 2) {
      try {
        const startedRoom = MatchmakerService.startGame(room.id)
        if (startedRoom) {
          io.to(room.id).emit('gameStarted')
          broadcastGameState(io, startedRoom)
          addGameLogEntry(startedRoom, 'system', 'System', 'Game started!')
        }
      } catch (error) {
        console.error('Error starting game:', error)
        socket.emit('error', { 
          message: error instanceof Error ? error.message : 'Failed to start game' 
        })
      }
    }
  })
}

// Helper functions
function broadcastGameState(io: GameServer, room: any) {
  const gameState: GameState = {
    room,
    currentPlayer: room.players[room.currentPlayerIndex],
    phase: room.phase,
    timeRemaining: room.gameSettings.timeLimit || 120,
    log: (room as any).log || [],
    supply: room.supply
  }
  
  io.to(room.id).emit('gameState', gameState)
}

function addGameLogEntry(room: any, playerId: string, playerName: string, action: string) {
  if (!room.log) room.log = []
  
  const logEntry: GameLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    playerId,
    playerName,
    action,
    timestamp: new Date()
  }
  
  room.log.push(logEntry)
  
  // Keep only last 50 entries
  if (room.log.length > 50) {
    room.log = room.log.slice(-50)
  }
}

function applyCardEffects(player: any, card: any, room: any, targets?: string[]) {
  card.effects.forEach((effect: any) => {
    switch (effect.type) {
      case 'draw':
        drawCards(player, effect.value)
        break
      case 'gain_coin':
        player.coins += effect.value
        break
      case 'gain_action':
        player.actions += effect.value
        break
      case 'gain_buy':
        player.buys += effect.value
        break
      case 'attack':
        // Apply attack to other players
        room.players.forEach((otherPlayer: any) => {
          if (otherPlayer.id !== player.id) {
            // Attack logic here
          }
        })
        break
    }
  })
}

function drawCards(player: any, count: number) {
  for (let i = 0; i < count; i++) {
    if (player.deck.length === 0) {
      // Shuffle discard pile into deck
      if (player.discard.length > 0) {
        player.deck = shuffleArray([...player.discard])
        player.discard = []
      }
    }
    
    if (player.deck.length > 0) {
      player.hand.push(player.deck.pop())
    }
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getCardCost(cardId: string): number {
  const costs: { [key: string]: number } = {
    copper: 0,
    silver: 3,
    gold: 6,
    estate: 2,
    duchy: 5,
    province: 8,
    village: 3,
    smithy: 4,
    market: 5,
    workshop: 3,
    militia: 4,
    remodel: 4,
    cellar: 2,
    chapel: 2,
    moat: 2,
    woodcutter: 3
  }
  return costs[cardId] || 0
}

function createCardFromId(cardId: string): any {
  const cardDefinitions: { [key: string]: any } = {
    copper: {
      id: 'copper',
      name: 'Copper',
      cost: 0,
      type: 'Treasure',
      effects: [{ type: 'gain_coin', value: 1 }],
      description: 'Gain 1 coin.'
    },
    silver: {
      id: 'silver',
      name: 'Silver',
      cost: 3,
      type: 'Treasure',
      effects: [{ type: 'gain_coin', value: 2 }],
      description: 'Gain 2 coins.'
    },
    gold: {
      id: 'gold',
      name: 'Gold',
      cost: 6,
      type: 'Treasure',
      effects: [{ type: 'gain_coin', value: 3 }],
      description: 'Gain 3 coins.'
    },
    estate: {
      id: 'estate',
      name: 'Estate',
      cost: 2,
      type: 'Victory',
      effects: [],
      description: 'Worth 1 Victory Point.'
    },
    duchy: {
      id: 'duchy',
      name: 'Duchy',
      cost: 5,
      type: 'Victory',
      effects: [],
      description: 'Worth 3 Victory Points.'
    },
    province: {
      id: 'province',
      name: 'Province',
      cost: 8,
      type: 'Victory',
      effects: [],
      description: 'Worth 6 Victory Points.'
    },
    village: {
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
    smithy: {
      id: 'smithy',
      name: 'Smithy',
      cost: 4,
      type: 'Action',
      effects: [{ type: 'draw', value: 3 }],
      description: 'Draw 3 cards.'
    },
    market: {
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
  }
  
  return cardDefinitions[cardId] || null
}

function checkEndConditions(room: any) {
  // Check province exhaustion
  if (room.supply.province <= 0) {
    room.endConditions.find((ec: any) => ec.type === 'province_exhausted').met = true
    MatchmakerService.endGame(room.id, 'Province pile exhausted')
    return
  }
  
  // Check three pile exhaustion
  const emptyPiles = Object.values(room.supply).filter((count: any) => count <= 0).length
  if (emptyPiles >= 3) {
    room.endConditions.find((ec: any) => ec.type === 'three_pile_exhausted').met = true
    MatchmakerService.endGame(room.id, 'Three supply piles exhausted')
    return
  }
  
  // Check max turns
  if (room.gameSettings.maxTurns && room.turn >= room.gameSettings.maxTurns) {
    MatchmakerService.endGame(room.id, 'Maximum turns reached')
    return
  }
}