export interface Card {
  id: string
  name: string
  cost: number
  type: 'Action' | 'Treasure' | 'Victory' | 'Curse' | 'Custom'
  effects: CardEffect[]
  creatorId?: string
  description: string
  createdAt?: Date
  updatedAt?: Date
}

export interface CardEffect {
  type: 'draw' | 'gain_coin' | 'gain_action' | 'gain_buy' | 'gain_card' | 'attack' | 'custom'
  value: number
  target?: 'self' | 'opponent' | 'all'
  condition?: string
}

export interface Player {
  id: string
  name: string
  isConnected: boolean
  hand: Card[]
  deck: Card[]
  discard: Card[]
  actions: number
  buys: number
  coins: number
  score: number
  totalScore?: number
  creatorScore?: number
}

export interface Room {
  id: string
  name: string
  players: Player[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  currentPlayerIndex: number
  turn: number
  phase: 'action' | 'buy' | 'cleanup'
  supply: { [cardId: string]: number }
  createdAt: Date
  updatedAt: Date
  gameSettings: GameSettings
  endConditions: EndCondition[]
  winner?: string
}

export interface GameSettings {
  maxTurns?: number
  timeLimit?: number
  customCards: Card[]
  startingDeck: Card[]
  endConditions: EndCondition[]
}

export interface EndCondition {
  type: 'province_exhausted' | 'three_pile_exhausted' | 'time_limit' | 'max_turns'
  value?: number
  met?: boolean
}

export interface GameState {
  room: Room
  currentPlayer: Player
  phase: 'action' | 'buy' | 'cleanup'
  timeRemaining: number
  log: GameLogEntry[]
  supply: { [cardId: string]: number }
}

export interface GameLogEntry {
  id: string
  playerId: string
  playerName: string
  action: string
  timestamp: Date
  details?: any
}

export interface ScoreResult {
  playerId: string
  playerName: string
  gameScore: number
  creatorScore: number
  totalScore: number
  rank: number
  cardsUsed: Card[]
  victories: number
}

export interface MatchResult {
  roomId: string
  players: ScoreResult[]
  duration: number
  totalTurns: number
  endCondition: string
  timestamp: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface AuthRequest extends Request {
  user?: {
    id: string
    name: string
    isAnonymous: boolean
  }
}

export interface SocketData {
  userId: string
  userName: string
  roomId?: string
}

export interface ServerToClientEvents {
  gameState: (state: GameState) => void
  roomJoined: (room: Room) => void
  roomLeft: () => void
  playerJoined: (player: Player) => void
  playerLeft: (player: Player) => void
  gameStarted: () => void
  gameEnded: (results: MatchResult) => void
  error: (error: { message: string, code?: string }) => void
  pong: () => void
}

export interface ClientToServerEvents {
  ping: () => void
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  createRoom: (settings: Partial<GameSettings>) => void
  playCard: (cardId: string, targets?: string[]) => void
  buyCard: (cardId: string) => void
  endTurn: () => void
  ready: () => void
}