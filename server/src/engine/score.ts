import type { Player, Card, Room, ScoreResult, MatchResult } from '@/types'

export interface ScoreBreakdown {
  gameScore: number
  creatorScore: number
  totalScore: number
  victoryPoints: number
  cardUseCount: number
  customCardsUsed: Card[]
  baseMultiplier: number
  creatorBonus: number
}

/**
 * Calculate game score based on victory points earned during the match
 * Formula: Victory Points * Base Multiplier (1.0 for standard games)
 */
export function calcGameScore(player: Player, room: Room): number {
  const victoryPoints = calculateVictoryPoints(player)
  const baseMultiplier = room.gameSettings.customCards.length > 0 ? 1.2 : 1.0
  
  return Math.round(victoryPoints * baseMultiplier)
}

/**
 * Calculate creator score based on custom cards used by all players
 * Formula: (Custom Cards Used by Others * 10) + (Own Custom Cards Used * 5)
 */
export function calcCreatorScore(player: Player, room: Room): number {
  let creatorScore = 0
  
  // Get all custom cards this player created
  const playerCustomCards = room.gameSettings.customCards.filter(
    card => card.creatorId === player.id
  )
  
  if (playerCustomCards.length === 0) {
    return 0
  }
  
  // Count usage of player's custom cards by all players
  room.players.forEach(roomPlayer => {
    const allPlayerCards = [
      ...roomPlayer.hand,
      ...roomPlayer.deck,
      ...roomPlayer.discard
    ]
    
    playerCustomCards.forEach(customCard => {
      const usageCount = allPlayerCards.filter(card => card.id === customCard.id).length
      
      if (roomPlayer.id === player.id) {
        // Own usage: 5 points per card
        creatorScore += usageCount * 5
      } else {
        // Others' usage: 10 points per card
        creatorScore += usageCount * 10
      }
    })
  })
  
  return creatorScore
}

/**
 * Calculate total score combining game score and creator score
 * Formula 4.4: TotalScore = GameScore + CreatorScore
 */
export function totalScore(gameScore: number, creatorScore: number): number {
  return gameScore + creatorScore
}

/**
 * Calculate detailed score breakdown for a player
 */
export function getScoreBreakdown(player: Player, room: Room): ScoreBreakdown {
  const victoryPoints = calculateVictoryPoints(player)
  const gameScore = calcGameScore(player, room)
  const creatorScore = calcCreatorScore(player, room)
  const total = totalScore(gameScore, creatorScore)
  
  // Get custom cards used by this player
  const allPlayerCards = [...player.hand, ...player.deck, ...player.discard]
  const customCardsUsed = allPlayerCards.filter(card => 
    room.gameSettings.customCards.some(customCard => customCard.id === card.id)
  )
  
  const uniqueCustomCards = Array.from(
    new Map(customCardsUsed.map(card => [card.id, card])).values()
  )
  
  return {
    gameScore,
    creatorScore,
    totalScore: total,
    victoryPoints,
    cardUseCount: allPlayerCards.length,
    customCardsUsed: uniqueCustomCards,
    baseMultiplier: room.gameSettings.customCards.length > 0 ? 1.2 : 1.0,
    creatorBonus: creatorScore
  }
}

/**
 * Calculate final match results with rankings
 */
export function calculateMatchResults(room: Room): MatchResult {
  const playerResults: ScoreResult[] = room.players.map(player => {
    const breakdown = getScoreBreakdown(player, room)
    const allPlayerCards = [...player.hand, ...player.deck, ...player.discard]
    
    return {
      playerId: player.id,
      playerName: player.name,
      gameScore: breakdown.gameScore,
      creatorScore: breakdown.creatorScore,
      totalScore: breakdown.totalScore,
      rank: 0, // Will be set after sorting
      cardsUsed: allPlayerCards,
      victories: breakdown.victoryPoints
    }
  })
  
  // Sort by total score (descending) and assign ranks
  playerResults.sort((a, b) => b.totalScore - a.totalScore)
  playerResults.forEach((result, index) => {
    result.rank = index + 1
  })
  
  // Calculate game duration
  const duration = Math.round((room.updatedAt.getTime() - room.createdAt.getTime()) / 1000)
  
  // Determine end condition
  const endCondition = room.endConditions.find(ec => ec.met)?.type || 'manual'
  
  return {
    roomId: room.id,
    players: playerResults,
    duration,
    totalTurns: room.turn,
    endCondition,
    timestamp: new Date()
  }
}

/**
 * Calculate victory points from all cards owned by a player
 */
function calculateVictoryPoints(player: Player): number {
  let victoryPoints = 0
  
  // Combine all cards from hand, deck, and discard pile
  const allCards = [...player.hand, ...player.deck, ...player.discard]
  
  allCards.forEach(card => {
    switch (card.id) {
      case 'estate':
        victoryPoints += 1
        break
      case 'duchy':
        victoryPoints += 3
        break
      case 'province':
        victoryPoints += 6
        break
      case 'curse':
        victoryPoints -= 1
        break
      default:
        // Check for custom victory cards
        if (card.type === 'Victory') {
          // Custom victory cards could have victory point values in their effects
          const victoryEffect = card.effects.find(effect => effect.type === 'victory_points')
          if (victoryEffect) {
            victoryPoints += victoryEffect.value
          }
        }
        break
    }
  })
  
  return Math.max(0, victoryPoints) // Ensure non-negative
}

/**
 * Get leaderboard for analytics
 */
export function getLeaderboard(results: ScoreResult[]): ScoreResult[] {
  return results
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((result, index) => ({
      ...result,
      rank: index + 1
    }))
}

/**
 * Calculate player statistics across multiple games
 */
export interface PlayerStats {
  playerId: string
  playerName: string
  gamesPlayed: number
  totalScore: number
  averageScore: number
  wins: number
  winRate: number
  customCardsCreated: number
  customCardsUsed: number
}

export function calculatePlayerStats(
  playerId: string, 
  matchResults: MatchResult[]
): PlayerStats {
  const playerMatches = matchResults.filter(match => 
    match.players.some(p => p.playerId === playerId)
  )
  
  if (playerMatches.length === 0) {
    return {
      playerId,
      playerName: 'Unknown',
      gamesPlayed: 0,
      totalScore: 0,
      averageScore: 0,
      wins: 0,
      winRate: 0,
      customCardsCreated: 0,
      customCardsUsed: 0
    }
  }
  
  const playerName = playerMatches[0].players.find(p => p.playerId === playerId)?.playerName || 'Unknown'
  const totalScore = playerMatches.reduce((sum, match) => {
    const playerResult = match.players.find(p => p.playerId === playerId)
    return sum + (playerResult?.totalScore || 0)
  }, 0)
  
  const wins = playerMatches.filter(match => 
    match.players.find(p => p.playerId === playerId)?.rank === 1
  ).length
  
  // Count custom cards (this would need to be tracked separately in a real implementation)
  let customCardsCreated = 0
  let customCardsUsed = 0
  
  return {
    playerId,
    playerName,
    gamesPlayed: playerMatches.length,
    totalScore,
    averageScore: Math.round(totalScore / playerMatches.length),
    wins,
    winRate: Math.round((wins / playerMatches.length) * 100),
    customCardsCreated,
    customCardsUsed
  }
}