// カード投票システム
// プレイヤーがカードに対して投票（いいね/よくない）し、コミュニティ評価を作成

class VotingEngine {
  constructor() {
    // ルーム別投票データ
    this.roomVotes = new Map()
    // グローバル投票データ（全ゲーム）
    this.globalVotes = new Map()
    // 投票セッション管理
    this.votingSessions = new Map()
  }

  /**
   * 投票セッション開始
   */
  startVotingSession(roomId, gameEndResult, timeLimit = 300000) { // 5分
    const session = {
      roomId,
      gameEndResult,
      startTime: Date.now(),
      endTime: Date.now() + timeLimit,
      isActive: true,
      votes: new Map(), // cardId -> { likes: [], dislikes: [], score: number }
      playerVotes: new Map(), // playerId -> { cardId: vote }
      totalVotes: 0,
      participatingPlayers: new Set(),
      cardResults: new Map()
    }

    // 投票対象カードを初期化（ゲームで使用されたカード）
    if (gameEndResult?.finalScores?.gameStats?.topCards) {
      gameEndResult.finalScores.gameStats.topCards.forEach(card => {
        session.votes.set(card.cardId, {
          cardId: card.cardId,
          cardName: card.cardName,
          likes: [],
          dislikes: [],
          score: 0,
          usageCount: card.usageCount,
          uniquePlayers: card.uniquePlayers
        })
      })
    }

    this.votingSessions.set(roomId, session)
    console.log(`🗳️ Voting session started for room ${roomId} (${timeLimit/1000}s duration)`)
    
    // タイムアウト設定
    setTimeout(() => {
      this.endVotingSession(roomId)
    }, timeLimit)

    return session
  }

  /**
   * 投票実行
   */
  castVote(roomId, playerId, cardId, voteType) {
    const session = this.votingSessions.get(roomId)
    if (!session || !session.isActive) {
      return { error: 'Voting session not active' }
    }

    if (Date.now() > session.endTime) {
      this.endVotingSession(roomId)
      return { error: 'Voting session expired' }
    }

    if (!session.votes.has(cardId)) {
      return { error: 'Card not available for voting' }
    }

    // 既存投票をチェック
    const playerVoteHistory = session.playerVotes.get(playerId) || {}
    const previousVote = playerVoteHistory[cardId]

    const cardVotes = session.votes.get(cardId)

    // 前の投票を削除
    if (previousVote) {
      if (previousVote === 'like') {
        const index = cardVotes.likes.indexOf(playerId)
        if (index > -1) cardVotes.likes.splice(index, 1)
      } else if (previousVote === 'dislike') {
        const index = cardVotes.dislikes.indexOf(playerId)
        if (index > -1) cardVotes.dislikes.splice(index, 1)
      }
    }

    // 新しい投票を追加（同じ投票の場合はトグル削除）
    if (voteType !== previousVote) {
      if (voteType === 'like') {
        cardVotes.likes.push(playerId)
      } else if (voteType === 'dislike') {
        cardVotes.dislikes.push(playerId)
      }
      playerVoteHistory[cardId] = voteType
    } else {
      // 同じ投票の場合は削除（トグル）
      delete playerVoteHistory[cardId]
    }

    // スコア更新
    cardVotes.score = cardVotes.likes.length - cardVotes.dislikes.length

    // プレイヤー投票履歴更新
    session.playerVotes.set(playerId, playerVoteHistory)
    session.participatingPlayers.add(playerId)
    session.totalVotes++

    console.log(`🗳️ Vote cast: ${playerId} ${voteType === previousVote ? 'removed' : voteType} ${cardId}`)

    // グローバル投票データ更新
    this.updateGlobalVotes(cardId, voteType, playerId, voteType !== previousVote)

    return {
      success: true,
      cardVotes: {
        cardId,
        likes: cardVotes.likes.length,
        dislikes: cardVotes.dislikes.length,
        score: cardVotes.score,
        userVote: voteType !== previousVote ? voteType : null
      }
    }
  }

  /**
   * 投票セッション終了
   */
  endVotingSession(roomId) {
    const session = this.votingSessions.get(roomId)
    if (!session) return null

    session.isActive = false
    session.endTime = Date.now()

    // 最終結果計算
    const results = this.calculateVotingResults(session)
    session.finalResults = results

    console.log(`🏁 Voting session ended for room ${roomId}`)
    console.log(`📊 Results: ${results.topRatedCards.length} cards rated by ${session.participatingPlayers.size} players`)

    // ルーム投票データに保存
    this.roomVotes.set(roomId, {
      sessionData: session,
      results,
      timestamp: Date.now()
    })

    return results
  }

  /**
   * 投票結果計算
   */
  calculateVotingResults(session) {
    const cardResults = []
    
    for (const [cardId, votes] of session.votes) {
      const totalVotes = votes.likes.length + votes.dislikes.length
      const likesPercentage = totalVotes > 0 ? (votes.likes.length / totalVotes * 100) : 0
      const engagement = totalVotes / session.participatingPlayers.size * 100

      cardResults.push({
        cardId: votes.cardId,
        cardName: votes.cardName,
        likes: votes.likes.length,
        dislikes: votes.dislikes.length,
        score: votes.score,
        totalVotes,
        likesPercentage: Math.round(likesPercentage),
        engagement: Math.round(engagement),
        usageCount: votes.usageCount,
        uniquePlayers: votes.uniquePlayers,
        popularityRank: 0, // 後で計算
        qualityRank: 0     // 後で計算
      })
    }

    // ランキング計算
    // 人気ランキング（総投票数）
    const popularityRanked = [...cardResults].sort((a, b) => b.totalVotes - a.totalVotes)
    popularityRanked.forEach((card, index) => {
      card.popularityRank = index + 1
    })

    // 品質ランキング（スコア）
    const qualityRanked = [...cardResults].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.totalVotes - a.totalVotes // 同点の場合は投票数で判定
    })
    qualityRanked.forEach((card, index) => {
      card.qualityRank = index + 1
    })

    // トップカード抽出
    const topRatedCards = qualityRanked.filter(card => card.totalVotes >= 2).slice(0, 5)
    const mostPopularCards = popularityRanked.filter(card => card.totalVotes > 0).slice(0, 5)
    const controversialCards = cardResults
      .filter(card => card.totalVotes >= 3)
      .sort((a, b) => Math.abs(50 - a.likesPercentage) - Math.abs(50 - b.likesPercentage))
      .slice(0, 3)

    const stats = {
      totalParticipants: session.participatingPlayers.size,
      totalVotes: session.totalVotes,
      averageVotesPerCard: session.totalVotes / session.votes.size,
      votingDuration: session.endTime - session.startTime,
      engagementRate: (session.participatingPlayers.size / (session.gameEndResult?.finalScores?.rankings?.length || 1)) * 100
    }

    return {
      cardResults,
      topRatedCards,
      mostPopularCards,
      controversialCards,
      stats,
      insights: this.generateVotingInsights(cardResults, stats)
    }
  }

  /**
   * 投票洞察生成
   */
  generateVotingInsights(cardResults, stats) {
    const insights = []

    // 参加率分析
    if (stats.engagementRate < 50) {
      insights.push({
        type: 'engagement',
        message: '投票参加率が低めです。投票への参加を促す工夫を検討してください。',
        severity: 'warning'
      })
    }

    // 評価分散分析
    const highQualityCards = cardResults.filter(card => card.score > 2 && card.totalVotes >= 3)
    if (highQualityCards.length === 0) {
      insights.push({
        type: 'quality',
        message: '高評価カードがありません。カードバランスを見直してください。',
        severity: 'info'
      })
    }

    // 論争カード分析
    const controversialCards = cardResults.filter(card => 
      card.totalVotes >= 3 && card.likesPercentage >= 40 && card.likesPercentage <= 60
    )
    if (controversialCards.length > 0) {
      insights.push({
        type: 'controversy',
        message: `${controversialCards.length}枚のカードで意見が分かれています。デザインを再検討してください。`,
        severity: 'info'
      })
    }

    // 使用と評価の相関分析
    const highUsageLowRating = cardResults.filter(card => 
      card.usageCount > 3 && card.score < 0
    )
    if (highUsageLowRating.length > 0) {
      insights.push({
        type: 'balance',
        message: '頻繁に使用されるが評価が低いカードがあります。強さ調整が必要かもしれません。',
        severity: 'warning'
      })
    }

    return insights
  }

  /**
   * 現在の投票状況取得
   */
  getVotingStatus(roomId) {
    const session = this.votingSessions.get(roomId)
    if (!session) return null

    const now = Date.now()
    const timeRemaining = Math.max(0, session.endTime - now)
    const progress = Math.min(100, ((now - session.startTime) / (session.endTime - session.startTime)) * 100)

    const cardVotingStatus = Array.from(session.votes.values()).map(votes => ({
      cardId: votes.cardId,
      cardName: votes.cardName,
      likes: votes.likes.length,
      dislikes: votes.dislikes.length,
      score: votes.score,
      totalVotes: votes.likes.length + votes.dislikes.length
    }))

    return {
      isActive: session.isActive,
      timeRemaining,
      progress: Math.round(progress),
      participatingPlayers: session.participatingPlayers.size,
      totalVotes: session.totalVotes,
      cardVotingStatus
    }
  }

  /**
   * プレイヤーの投票履歴取得
   */
  getPlayerVotes(roomId, playerId) {
    const session = this.votingSessions.get(roomId)
    if (!session) return {}

    return session.playerVotes.get(playerId) || {}
  }

  /**
   * グローバル投票データ更新
   */
  updateGlobalVotes(cardId, voteType, playerId, isAdd) {
    if (!this.globalVotes.has(cardId)) {
      this.globalVotes.set(cardId, {
        cardId,
        totalLikes: 0,
        totalDislikes: 0,
        totalVoters: new Set(),
        score: 0,
        firstVoted: Date.now(),
        lastVoted: Date.now()
      })
    }

    const globalVote = this.globalVotes.get(cardId)
    
    if (isAdd) {
      if (voteType === 'like') {
        globalVote.totalLikes++
      } else if (voteType === 'dislike') {
        globalVote.totalDislikes++
      }
      globalVote.totalVoters.add(playerId)
    }

    globalVote.score = globalVote.totalLikes - globalVote.totalDislikes
    globalVote.lastVoted = Date.now()
  }

  /**
   * ルーム投票データクリア
   */
  clearRoomVotes(roomId) {
    this.votingSessions.delete(roomId)
    this.roomVotes.delete(roomId)
    console.log(`🧹 Voting data cleared for room ${roomId}`)
  }

  /**
   * グローバル投票統計取得
   */
  getGlobalVotingStats() {
    const globalArray = Array.from(this.globalVotes.values()).map(vote => ({
      ...vote,
      totalVoters: vote.totalVoters.size,
      likesPercentage: vote.totalLikes + vote.totalDislikes > 0 
        ? Math.round(vote.totalLikes / (vote.totalLikes + vote.totalDislikes) * 100)
        : 0
    }))

    return {
      totalCards: globalArray.length,
      totalVotes: globalArray.reduce((sum, card) => sum + card.totalLikes + card.totalDislikes, 0),
      topRatedGlobally: globalArray.sort((a, b) => b.score - a.score).slice(0, 10),
      mostVotedGlobally: globalArray.sort((a, b) => (b.totalLikes + b.totalDislikes) - (a.totalLikes + a.totalDislikes)).slice(0, 10)
    }
  }
}

// シングルトンインスタンス
const votingEngine = new VotingEngine()

module.exports = votingEngine