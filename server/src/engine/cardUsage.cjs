// カード使用統計エンジン
// プレイヤーのカード使用を追跡し、人気度や使用パターンを分析

class CardUsageEngine {
  constructor() {
    // 各ルームのカード使用データ
    this.roomUsageData = new Map()
    // グローバルカード統計（全ゲーム）
    this.globalStats = new Map()
  }

  /**
   * ゲーム開始時の初期化
   */
  initializeRoom(roomId, playerIds, customCards = []) {
    const roomData = {
      roomId,
      playerIds: [...playerIds],
      cardUsage: new Map(), // cardId -> { count, users: Set, playLog: [] }
      playerStats: new Map(), // playerId -> { cardsPlayed: [], cardsBought: [], cardsCreated: [] }
      customCards: [...customCards],
      gameStartTime: Date.now(),
      totalActions: 0
    }

    // プレイヤー統計初期化
    playerIds.forEach(playerId => {
      roomData.playerStats.set(playerId, {
        cardsPlayed: [],
        cardsBought: [],
        cardsCreated: [],
        totalPlays: 0,
        totalBuys: 0,
        favoritecards: new Map() // cardId -> count
      })
    })

    this.roomUsageData.set(roomId, roomData)
    console.log(`📈 Card usage tracking initialized for room ${roomId}`)
    return roomData
  }

  /**
   * カードプレイの記録
   */
  recordCardPlay(roomId, playerId, cardId, cardData = null) {
    const roomData = this.roomUsageData.get(roomId)
    if (!roomData) {
      console.error(`❌ Room ${roomId} not found for card play tracking`)
      return
    }

    const timestamp = Date.now()
    
    // カード使用統計更新
    if (!roomData.cardUsage.has(cardId)) {
      roomData.cardUsage.set(cardId, {
        cardId,
        cardName: cardData?.name || cardId,
        cardType: cardData?.type || 'Unknown',
        usageCount: 0,
        uniquePlayers: new Set(),
        playLog: [],
        firstUsed: timestamp,
        lastUsed: timestamp
      })
    }

    const cardUsage = roomData.cardUsage.get(cardId)
    cardUsage.usageCount++
    cardUsage.uniquePlayers.add(playerId)
    cardUsage.lastUsed = timestamp
    cardUsage.playLog.push({
      playerId,
      timestamp,
      action: 'play'
    })

    // プレイヤー統計更新
    const playerStats = roomData.playerStats.get(playerId)
    if (playerStats) {
      playerStats.cardsPlayed.push({
        cardId,
        timestamp,
        cardData
      })
      playerStats.totalPlays++
      
      // お気に入りカード更新
      const currentCount = playerStats.favoritecards.get(cardId) || 0
      playerStats.favoritecards.set(cardId, currentCount + 1)
    }

    roomData.totalActions++
    
    console.log(`🃏 Card play recorded: ${playerId} played ${cardData?.name || cardId}`)
    
    // グローバル統計更新
    this.updateGlobalStats(cardId, 'play', playerId)
    
    return cardUsage
  }

  /**
   * カード購入の記録
   */
  recordCardBuy(roomId, playerId, cardId, cardData = null) {
    const roomData = this.roomUsageData.get(roomId)
    if (!roomData) return

    const timestamp = Date.now()

    // カード使用統計更新（購入も使用の一種として扱う）
    if (!roomData.cardUsage.has(cardId)) {
      roomData.cardUsage.set(cardId, {
        cardId,
        cardName: cardData?.name || cardId,
        cardType: cardData?.type || 'Unknown',
        usageCount: 0,
        uniquePlayers: new Set(),
        playLog: [],
        firstUsed: timestamp,
        lastUsed: timestamp
      })
    }

    const cardUsage = roomData.cardUsage.get(cardId)
    cardUsage.usageCount++
    cardUsage.uniquePlayers.add(playerId)
    cardUsage.lastUsed = timestamp
    cardUsage.playLog.push({
      playerId,
      timestamp,
      action: 'buy'
    })

    // プレイヤー統計更新
    const playerStats = roomData.playerStats.get(playerId)
    if (playerStats) {
      playerStats.cardsBought.push({
        cardId,
        timestamp,
        cardData
      })
      playerStats.totalBuys++
    }

    console.log(`💰 Card buy recorded: ${playerId} bought ${cardData?.name || cardId}`)
    
    this.updateGlobalStats(cardId, 'buy', playerId)
    return cardUsage
  }

  /**
   * カード作成の記録
   */
  recordCardCreation(roomId, playerId, cardId, cardData) {
    const roomData = this.roomUsageData.get(roomId)
    if (!roomData) return

    const playerStats = roomData.playerStats.get(playerId)
    if (playerStats) {
      playerStats.cardsCreated.push({
        cardId,
        timestamp: Date.now(),
        cardData
      })
    }

    // カスタムカードリストに追加
    roomData.customCards.push({
      ...cardData,
      creatorId: playerId,
      createdAt: Date.now()
    })

    console.log(`🎨 Card creation recorded: ${playerId} created ${cardData.name}`)
    
    this.updateGlobalStats(cardId, 'create', playerId)
  }

  /**
   * ルームの統計取得
   */
  getRoomStats(roomId) {
    const roomData = this.roomUsageData.get(roomId)
    if (!roomData) return null

    // カード使用統計を配列に変換
    const cardUsageArray = Array.from(roomData.cardUsage.values()).map(usage => ({
      ...usage,
      uniquePlayers: usage.uniquePlayers.size,
      efficiency: usage.usageCount / usage.uniquePlayers.size // 1人あたりの使用回数
    }))

    // プレイヤー統計を配列に変換
    const playerStatsArray = Array.from(roomData.playerStats.entries()).map(([playerId, stats]) => ({
      playerId,
      totalPlays: stats.totalPlays,
      totalBuys: stats.totalBuys,
      cardsCreated: stats.cardsCreated.length,
      favoriteCard: this.getMostUsedCard(stats.favoritecards),
      diversity: stats.favoritecards.size, // 使用したカード種類数
      playStyle: this.analyzePlayStyle(stats)
    }))

    const gameStats = {
      totalActions: roomData.totalActions,
      uniqueCardsUsed: roomData.cardUsage.size,
      totalCustomCards: roomData.customCards.length,
      gameDuration: Date.now() - roomData.gameStartTime,
      avgActionsPerPlayer: roomData.totalActions / roomData.playerIds.length,
      cardUsageDistribution: this.calculateUsageDistribution(cardUsageArray)
    }

    return {
      roomId,
      cardUsage: cardUsageArray,
      playerStats: playerStatsArray,
      gameStats,
      customCards: roomData.customCards
    }
  }

  /**
   * 最終統計（ゲーム終了時）
   */
  generateFinalStats(roomId) {
    const stats = this.getRoomStats(roomId)
    if (!stats) return null

    // トップカードランキング
    const topCards = stats.cardUsage
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map((card, index) => ({
        rank: index + 1,
        cardId: card.cardId,
        cardName: card.cardName,
        usageCount: card.usageCount,
        uniquePlayers: card.uniquePlayers,
        efficiency: card.efficiency,
        popularity: (card.usageCount / stats.gameStats.totalActions * 100).toFixed(1) + '%'
      }))

    // プレイヤー分析
    const playerAnalysis = stats.playerStats.map(player => ({
      ...player,
      engagement: this.calculateEngagement(player, stats.gameStats),
      creativity: this.calculateCreativity(player, stats.customCards),
      efficiency: player.totalPlays > 0 ? (player.totalPlays / stats.gameStats.avgActionsPerPlayer).toFixed(2) : '0'
    }))

    return {
      ...stats,
      topCards,
      playerAnalysis,
      insights: this.generateInsights(stats)
    }
  }

  /**
   * プレイスタイル分析
   */
  analyzePlayStyle(playerStats) {
    const totalActions = playerStats.totalPlays + playerStats.totalBuys
    if (totalActions === 0) return 'Observer'

    const playRatio = playerStats.totalPlays / totalActions
    const diversity = playerStats.favoritecards.size
    const creativity = playerStats.cardsCreated.length

    if (creativity > 2) return 'Creator'
    if (playRatio > 0.7 && diversity > 5) return 'Strategist'
    if (playRatio > 0.8) return 'Aggressive'
    if (diversity > 7) return 'Explorer'
    if (playRatio < 0.4) return 'Builder'
    return 'Balanced'
  }

  /**
   * エンゲージメント計算
   */
  calculateEngagement(player, gameStats) {
    const actions = player.totalPlays + player.totalBuys
    const avgActions = gameStats.avgActionsPerPlayer
    return Math.min(100, Math.round((actions / avgActions) * 100))
  }

  /**
   * 創造性スコア計算
   */
  calculateCreativity(player, customCards) {
    const playerCards = customCards.filter(card => card.creatorId === player.playerId)
    const baseScore = playerCards.length * 20
    // TODO: カードの使用回数や評価も考慮
    return Math.min(100, baseScore)
  }

  /**
   * 使用分布計算
   */
  calculateUsageDistribution(cardUsage) {
    if (cardUsage.length === 0) return { balanced: 100 }

    const total = cardUsage.reduce((sum, card) => sum + card.usageCount, 0)
    const avg = total / cardUsage.length
    const variance = cardUsage.reduce((sum, card) => sum + Math.pow(card.usageCount - avg, 2), 0) / cardUsage.length
    const standardDeviation = Math.sqrt(variance)
    const coefficient = standardDeviation / avg

    if (coefficient < 0.5) return { balanced: 80, concentrated: 20 }
    if (coefficient < 1) return { balanced: 50, concentrated: 50 }
    return { balanced: 20, concentrated: 80 }
  }

  /**
   * 最も使用されたカード
   */
  getMostUsedCard(favoriteCards) {
    if (favoriteCards.size === 0) return null

    let maxCount = 0
    let mostUsed = null

    for (const [cardId, count] of favoriteCards) {
      if (count > maxCount) {
        maxCount = count
        mostUsed = cardId
      }
    }

    return { cardId: mostUsed, count: maxCount }
  }

  /**
   * ゲーム洞察生成
   */
  generateInsights(stats) {
    const insights = []

    // カードバランス分析
    if (stats.gameStats.cardUsageDistribution.concentrated > 70) {
      insights.push({
        type: 'balance',
        message: '特定のカードに使用が集中しています。バランス調整を検討してください。',
        severity: 'warning'
      })
    }

    // エンゲージメント分析
    const avgActions = stats.gameStats.avgActionsPerPlayer
    if (avgActions < 5) {
      insights.push({
        type: 'engagement',
        message: 'プレイヤーのアクション数が少なめです。ゲームペースを上げることを検討してください。',
        severity: 'info'
      })
    }

    // 創造性分析
    if (stats.gameStats.totalCustomCards === 0) {
      insights.push({
        type: 'creativity',
        message: 'カスタムカードが作成されませんでした。カード作成を促す要素を追加してください。',
        severity: 'info'
      })
    }

    return insights
  }

  /**
   * グローバル統計更新
   */
  updateGlobalStats(cardId, action, playerId) {
    if (!this.globalStats.has(cardId)) {
      this.globalStats.set(cardId, {
        cardId,
        totalUsage: 0,
        totalPlayers: new Set(),
        actions: { play: 0, buy: 0, create: 0 },
        firstSeen: Date.now(),
        lastSeen: Date.now()
      })
    }

    const stats = this.globalStats.get(cardId)
    stats.totalUsage++
    stats.totalPlayers.add(playerId)
    stats.actions[action]++
    stats.lastSeen = Date.now()
  }

  /**
   * ルームデータクリア
   */
  clearRoom(roomId) {
    this.roomUsageData.delete(roomId)
    console.log(`🧹 Card usage data cleared for room ${roomId}`)
  }

  /**
   * 全ルーム統計取得
   */
  getAllRoomsStats() {
    const allStats = []
    for (const [roomId, roomData] of this.roomUsageData) {
      allStats.push(this.getRoomStats(roomId))
    }
    return allStats
  }

  /**
   * グローバル統計取得
   */
  getGlobalStats() {
    const globalArray = Array.from(this.globalStats.values()).map(stats => ({
      ...stats,
      totalPlayers: stats.totalPlayers.size,
      popularity: stats.totalUsage,
      retention: (stats.lastSeen - stats.firstSeen) / (1000 * 60 * 60 * 24) // days
    }))

    return {
      totalCards: globalArray.length,
      totalUsage: globalArray.reduce((sum, card) => sum + card.totalUsage, 0),
      topCards: globalArray.sort((a, b) => b.totalUsage - a.totalUsage).slice(0, 10),
      statistics: globalArray
    }
  }
}

// シングルトンインスタンス
const cardUsageEngine = new CardUsageEngine()

module.exports = cardUsageEngine