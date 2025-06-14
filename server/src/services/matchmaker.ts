import { v4 as uuidv4 } from 'uuid'
import type { Room, Player, GameSettings, Card } from '@/types'

// In-memory storage (will be replaced with MongoDB)
const rooms = new Map<string, Room>()
const playerRoomMap = new Map<string, string>() // playerId -> roomId

// Standard starting deck
const getStartingDeck = (): Card[] => {
  const deck: Card[] = []
  
  // 7 Copper
  for (let i = 0; i < 7; i++) {
    deck.push({
      id: 'copper',
      name: 'Copper',
      cost: 0,
      type: 'Treasure',
      effects: [{ type: 'gain_coin', value: 1 }],
      description: 'Gain 1 coin.'
    })
  }
  
  // 3 Estate
  for (let i = 0; i < 3; i++) {
    deck.push({
      id: 'estate',
      name: 'Estate',
      cost: 2,
      type: 'Victory',
      effects: [],
      description: 'Worth 1 Victory Point.'
    })
  }
  
  return deck
}

// Standard supply for 2-4 players
const getStandardSupply = (playerCount: number): { [cardId: string]: number } => {
  const baseSupply = {
    // Treasure cards
    copper: 60 - (playerCount * 7), // Minus starting copper
    silver: 40,
    gold: 30,
    
    // Victory cards
    estate: 12 + (playerCount * 3), // Base estates plus starting estates
    duchy: 12,
    province: 12,
    
    // Action cards
    village: 10,
    smithy: 10,
    market: 10,
    workshop: 10,
    militia: 10,
    remodel: 10,
    cellar: 10,
    chapel: 10,
    moat: 10,
    woodcutter: 10
  }
  
  // Adjust province count based on player count
  if (playerCount === 2) {
    baseSupply.province = 8
  } else if (playerCount === 3) {
    baseSupply.province = 12
  } else {
    baseSupply.province = 12
  }
  
  return baseSupply
}

export class MatchmakerService {
  static createRoom(
    creatorId: string, 
    creatorName: string, 
    roomName?: string, 
    settings?: Partial<GameSettings>
  ): Room {
    const roomId = `room_${Date.now()}_${uuidv4().slice(0, 8)}`
    
    const defaultSettings: GameSettings = {
      maxTurns: 50,
      timeLimit: 120, // 2 minutes per turn
      customCards: [],
      startingDeck: getStartingDeck(),
      endConditions: [
        { type: 'province_exhausted', met: false },
        { type: 'three_pile_exhausted', met: false }
      ]
    }
    
    const gameSettings = { ...defaultSettings, ...settings }
    
    const room: Room = {
      id: roomId,
      name: roomName || `${creatorName}'s Room`,
      players: [],
      maxPlayers: 4,
      status: 'waiting',
      currentPlayerIndex: 0,
      turn: 0,
      phase: 'action',
      supply: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      gameSettings,
      endConditions: gameSettings.endConditions
    }
    
    rooms.set(roomId, room)
    
    // Add creator to room
    this.addPlayerToRoom(roomId, creatorId, creatorName)
    
    console.log(`Created room ${roomId} by ${creatorName}`)
    return room
  }
  
  static addPlayerToRoom(roomId: string, playerId: string, playerName: string): { room: Room; player: Player } | null {
    const room = rooms.get(roomId)
    if (!room) {
      throw new Error('Room not found')
    }
    
    if (room.status !== 'waiting') {
      throw new Error('Room is not accepting new players')
    }
    
    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full')
    }
    
    // Check if player is already in another room
    const existingRoomId = playerRoomMap.get(playerId)
    if (existingRoomId && existingRoomId !== roomId) {
      this.removePlayerFromRoom(existingRoomId, playerId)
    }
    
    // Check if player is already in this room
    const existingPlayer = room.players.find(p => p.id === playerId)
    if (existingPlayer) {
      existingPlayer.isConnected = true
      room.updatedAt = new Date()
      return { room, player: existingPlayer }
    }
    
    const player: Player = {
      id: playerId,
      name: playerName,
      isConnected: true,
      hand: [],
      deck: [...room.gameSettings.startingDeck],
      discard: [],
      actions: 1,
      buys: 1,
      coins: 0,
      score: 0
    }
    
    room.players.push(player)
    playerRoomMap.set(playerId, roomId)
    room.updatedAt = new Date()
    
    console.log(`Player ${playerName} joined room ${roomId}`)
    
    // Start game if room is full or has minimum players and all are ready
    if (room.players.length >= 2 && room.players.length === room.maxPlayers) {
      this.startGame(roomId)
    }
    
    return { room, player }
  }
  
  static removePlayerFromRoom(roomId: string, playerId: string): Room | null {
    const room = rooms.get(roomId)
    if (!room) {
      return null
    }
    
    const playerIndex = room.players.findIndex(p => p.id === playerId)
    if (playerIndex === -1) {
      return room
    }
    
    room.players.splice(playerIndex, 1)
    playerRoomMap.delete(playerId)
    room.updatedAt = new Date()
    
    console.log(`Player ${playerId} left room ${roomId}`)
    
    // If room is empty, delete it
    if (room.players.length === 0) {
      rooms.delete(roomId)
      console.log(`Deleted empty room ${roomId}`)
      return null
    }
    
    // If game was in progress and current player left, advance to next player
    if (room.status === 'playing' && room.currentPlayerIndex >= room.players.length) {
      room.currentPlayerIndex = 0
    }
    
    return room
  }
  
  static startGame(roomId: string): Room | null {
    const room = rooms.get(roomId)
    if (!room || room.status !== 'waiting') {
      return null
    }
    
    if (room.players.length < 2) {
      throw new Error('Need at least 2 players to start game')
    }
    
    // Set up supply
    room.supply = getStandardSupply(room.players.length)
    
    // Shuffle and deal initial hands
    room.players.forEach(player => {
      player.deck = this.shuffleDeck([...room.gameSettings.startingDeck])
      player.hand = player.deck.splice(0, 5) // Draw 5 cards
      player.actions = 1
      player.buys = 1
      player.coins = 0
    })
    
    room.status = 'playing'
    room.currentPlayerIndex = 0
    room.turn = 1
    room.phase = 'action'
    room.updatedAt = new Date()
    
    console.log(`Started game in room ${roomId} with ${room.players.length} players`)
    return room
  }
  
  static endGame(roomId: string, reason: string): Room | null {
    const room = rooms.get(roomId)
    if (!room || room.status !== 'playing') {
      return null
    }
    
    // Calculate final scores
    room.players.forEach(player => {
      let victoryPoints = 0
      
      // Count victory points from all cards (hand + deck + discard)
      const allCards = [...player.hand, ...player.deck, ...player.discard]
      allCards.forEach(card => {
        if (card.id === 'estate') victoryPoints += 1
        else if (card.id === 'duchy') victoryPoints += 3
        else if (card.id === 'province') victoryPoints += 6
        // Add custom victory card scoring here
      })
      
      player.score = victoryPoints
    })
    
    // Sort players by score (descending)
    room.players.sort((a, b) => b.score - a.score)
    
    room.status = 'finished'
    room.winner = room.players[0].id
    room.updatedAt = new Date()
    
    console.log(`Game ended in room ${roomId}. Winner: ${room.players[0].name} with ${room.players[0].score} points`)
    return room
  }
  
  static getRoom(roomId: string): Room | null {
    return rooms.get(roomId) || null
  }
  
  static getAllRooms(): Room[] {
    return Array.from(rooms.values())
  }
  
  static getPlayerRoom(playerId: string): Room | null {
    const roomId = playerRoomMap.get(playerId)
    return roomId ? rooms.get(roomId) || null : null
  }
  
  static disconnectPlayer(playerId: string): void {
    const roomId = playerRoomMap.get(playerId)
    if (roomId) {
      const room = rooms.get(roomId)
      if (room) {
        const player = room.players.find(p => p.id === playerId)
        if (player) {
          player.isConnected = false
          room.updatedAt = new Date()
          
          // If all players are disconnected, mark room for cleanup
          const connectedPlayers = room.players.filter(p => p.isConnected)
          if (connectedPlayers.length === 0) {
            // Set cleanup timeout (e.g., 5 minutes)
            setTimeout(() => {
              if (room.players.every(p => !p.isConnected)) {
                rooms.delete(roomId)
                console.log(`Cleaned up abandoned room ${roomId}`)
              }
            }, 5 * 60 * 1000) // 5 minutes
          }
        }
      }
    }
  }
  
  static reconnectPlayer(playerId: string): Room | null {
    const roomId = playerRoomMap.get(playerId)
    if (roomId) {
      const room = rooms.get(roomId)
      if (room) {
        const player = room.players.find(p => p.id === playerId)
        if (player) {
          player.isConnected = true
          room.updatedAt = new Date()
          return room
        }
      }
    }
    return null
  }
  
  private static shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}