export interface Card {
  id: string
  name: string
  cost: number
  type: 'Action' | 'Treasure' | 'Victory' | 'Curse' | 'Custom'
  effects?: CardEffect[]
  victoryPoints?: number  // ドミニオン勝利点カード用
  creatorId?: string
  description: string
  createdAt?: string
  createdBy?: string
  version?: string
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
}

export interface Room {
  id: string
  name: string
  players: Player[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  currentPlayer: string
  turn: number
  phase: 'action' | 'buy' | 'cleanup'
  supply: { [cardId: string]: number }
  createdAt: Date
  gameSettings: GameSettings
}

export interface GameSettings {
  maxTurns?: number
  timeLimit?: number // seconds per turn
  customCards: Card[]
  startingDeck: Card[]
}

export interface DeckState {
  handSize: number
  deckSize: number
  discardSize: number
  fieldSize: number
  totalCards: number
  hand: Card[]
  field: Card[]
}

export interface GameStats {
  players: {
    [playerId: string]: {
      totalCards: number
      victoryPoints: number
      handSize: number
      deckSize: number
      discardSize: number
    }
  }
  supply: number
  trash: number
}

export interface EndConditionStatus {
  isGameEnd: boolean
  reason: string | null
  message: string
  status?: {
    remainingTurns?: number
    remainingTime?: number
    emptyPiles?: string[]
  }
  emptyCount?: number
  finalTurn?: number
  elapsedTime?: number
}

export interface GameEndResult {
  roomId: string
  endReason: string
  endTime: Date
  gameDuration: number
  totalTurns: number
  finalScores: FinalScores
}

export interface FinalScores {
  rankings: PlayerRanking[]
  gameStats: GameStatistics
}

export interface PlayerRanking {
  playerId: string
  playerName: string
  gameScore: number
  creatorScore: number
  totalScore: number
  rank: number
  victoryPoints: number
  cardsCreated?: number
  cardsUsed?: number
}

export interface GameStatistics {
  totalTurns: number
  gameDuration: number
  endReason: string
  averageScore?: number
  topCards?: CardUsageStats[]
}

export interface CardUsageStats {
  cardId: string
  cardName: string
  usageCount: number
  uniquePlayers: number
}

export interface VotingSession {
  isActive: boolean
  timeLimit: number
  availableCards: CardUsageStats[]
  startTime: number
  timeRemaining?: number
  participatingPlayers?: number
  totalVotes?: number
  cardVotingStatus?: CardVoteStatus[]
  results?: VotingResults
}

export interface CardVoteStatus {
  cardId: string
  cardName: string
  likes: number
  dislikes: number
  score: number
  totalVotes: number
}

export interface VotingResults {
  cardResults: CardVoteResults[]
  topRatedCards: CardVoteResults[]
  mostPopularCards: CardVoteResults[]
  controversialCards: CardVoteResults[]
  stats: VotingStats
  insights: VotingInsight[]
}

export interface CardVoteResults {
  cardId: string
  cardName: string
  likes: number
  dislikes: number
  score: number
  totalVotes: number
  likesPercentage: number
  engagement: number
  usageCount: number
  uniquePlayers: number
  popularityRank: number
  qualityRank: number
}

export interface VotingStats {
  totalParticipants: number
  totalVotes: number
  averageVotesPerCard: number
  votingDuration: number
  engagementRate: number
}

export interface VotingInsight {
  type: 'engagement' | 'quality' | 'controversy' | 'balance'
  message: string
  severity: 'info' | 'warning' | 'error'
}

export interface GameState {
  room: Room | null
  currentPlayer: Player | null
  phase: 'action' | 'buy' | 'cleanup'
  timeRemaining: number
  log: GameLogEntry[]
  deckState?: DeckState
  supplyState?: Card[]
  gameStats?: GameStats
  endConditions?: EndConditionStatus
  isGameEnded?: boolean
  gameEndResult?: GameEndResult
  votingSession?: VotingSession
  cardUsageStats?: any
  // CPU対戦用
  cpuGameState?: any
  playerHand?: Card[]
}

export interface GameLogEntry {
  id: string
  playerId: string
  playerName: string
  action: string
  timestamp: Date
  details?: any
}

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: Date
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'