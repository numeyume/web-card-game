/**
 * Usage Tracking Engine - カード使用統計追跡
 * リアルタイムでカードの使用頻度、プレイヤー分析を記録
 */

export class UsageTrackingEngine {
  constructor() {
    this.cardUsageStats = new Map();
    this.playerStats = new Map();
    this.votingStats = new Map();
  }

  /**
   * カード使用を記録
   */
  recordCardUsage(playerId, cardId, cardData, actionType = 'play') {
    // カード使用統計を更新
    if (!this.cardUsageStats.has(cardId)) {
      this.cardUsageStats.set(cardId, {
        cardId,
        cardName: cardData.name,
        cardType: cardData.type,
        totalUsage: 0,
        playCount: 0,
        buyCount: 0,
        playerUsage: {},
        createdBy: cardData.createdBy || null,
        firstUsed: new Date(),
        lastUsed: new Date()
      });
    }

    const cardStats = this.cardUsageStats.get(cardId);
    cardStats.totalUsage++;
    cardStats.lastUsed = new Date();
    
    if (actionType === 'play') {
      cardStats.playCount++;
    } else if (actionType === 'buy') {
      cardStats.buyCount++;
    }

    // プレイヤー別使用回数
    if (!cardStats.playerUsage[playerId]) {
      cardStats.playerUsage[playerId] = 0;
    }
    cardStats.playerUsage[playerId]++;

    // プレイヤー統計を更新
    this.updatePlayerStats(playerId, cardId, cardData, actionType);

    return cardStats;
  }

  /**
   * プレイヤー統計更新
   */
  updatePlayerStats(playerId, cardId, cardData, actionType) {
    if (!this.playerStats.has(playerId)) {
      this.playerStats.set(playerId, {
        playerId,
        totalActions: 0,
        cardsPlayed: 0,
        cardsBought: 0,
        uniqueCardsUsed: new Set(),
        cardTypeDistribution: {
          treasure: 0,
          victory: 0,
          action: 0,
          curse: 0,
          custom: 0
        },
        cardsCreated: 0,
        playStyle: 'Unknown',
        firstAction: new Date(),
        lastAction: new Date()
      });
    }

    const playerStats = this.playerStats.get(playerId);
    playerStats.totalActions++;
    playerStats.lastAction = new Date();
    playerStats.uniqueCardsUsed.add(cardId);

    if (actionType === 'play') {
      playerStats.cardsPlayed++;
    } else if (actionType === 'buy') {
      playerStats.cardsBought++;
    }

    // カードタイプ分布更新
    const cardType = cardData.type || 'custom';
    if (playerStats.cardTypeDistribution[cardType] !== undefined) {
      playerStats.cardTypeDistribution[cardType]++;
    }

    // 作成カード数更新
    if (cardData.createdBy === playerId) {
      playerStats.cardsCreated++;
    }

    // プレイスタイル更新
    playerStats.playStyle = this.analyzePlayStyle(playerStats);

    return playerStats;
  }

  /**
   * プレイスタイル分析
   */
  analyzePlayStyle(playerStats) {
    const { cardsPlayed, cardsBought, cardsCreated, cardTypeDistribution, uniqueCardsUsed } = playerStats;
    const totalCards = cardsPlayed + cardsBought;
    
    // 創造者タイプ
    if (cardsCreated >= 3) {
      return 'Creator';
    }
    
    // アグレッシブタイプ（アクション中心）
    const playRatio = totalCards > 0 ? cardsPlayed / totalCards : 0;
    if (playRatio > 0.7 && cardTypeDistribution.action > cardTypeDistribution.treasure) {
      return 'Aggressive';
    }
    
    // エクスプローラータイプ（多様性重視）
    if (uniqueCardsUsed.size >= 8) {
      return 'Explorer';
    }
    
    // ビルダータイプ（財宝重視）
    if (cardTypeDistribution.treasure > cardTypeDistribution.action * 2) {
      return 'Builder';
    }
    
    // バランス型
    return 'Balanced';
  }

  /**
   * カード投票記録
   */
  recordCardVote(playerId, cardId, voteType, gameId) {
    if (!this.votingStats.has(cardId)) {
      this.votingStats.set(cardId, {
        cardId,
        likes: 0,
        dislikes: 0,
        totalVotes: 0,
        voters: new Set(),
        gameVotes: {},
        controversy: 0,
        firstVote: new Date(),
        lastVote: new Date()
      });
    }

    const voteStats = this.votingStats.get(cardId);
    
    // 既存の投票があるかチェック
    const existingVote = voteStats.gameVotes[gameId]?.[playerId];
    
    if (existingVote) {
      // 既存投票を取り消し
      if (existingVote === 'like') {
        voteStats.likes--;
      } else if (existingVote === 'dislike') {
        voteStats.dislikes--;
      }
      voteStats.totalVotes--;
    }

    // 新しい投票が既存と同じ場合は取り消し（トグル）
    if (existingVote === voteType) {
      if (!voteStats.gameVotes[gameId]) {
        voteStats.gameVotes[gameId] = {};
      }
      delete voteStats.gameVotes[gameId][playerId];
    } else {
      // 新しい投票を記録
      if (voteType === 'like') {
        voteStats.likes++;
      } else if (voteType === 'dislike') {
        voteStats.dislikes++;
      }
      
      voteStats.totalVotes++;
      voteStats.voters.add(playerId);
      voteStats.lastVote = new Date();
      
      if (!voteStats.gameVotes[gameId]) {
        voteStats.gameVotes[gameId] = {};
      }
      voteStats.gameVotes[gameId][playerId] = voteType;
    }

    // 物議度計算
    voteStats.controversy = this.calculateControversy(voteStats);

    return voteStats;
  }

  /**
   * 物議度計算
   */
  calculateControversy(voteStats) {
    if (voteStats.totalVotes < 3) return 0;
    
    const likeRatio = voteStats.likes / voteStats.totalVotes;
    const dislikeRatio = voteStats.dislikes / voteStats.totalVotes;
    
    // 50:50に近いほど物議を醸している
    const balance = Math.abs(likeRatio - dislikeRatio);
    return Math.round((1 - balance) * 100);
  }

  /**
   * カード人気度ランキング取得
   */
  getCardPopularityRanking(limit = 10) {
    const cards = Array.from(this.cardUsageStats.values())
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, limit);

    return cards.map((card, index) => ({
      rank: index + 1,
      cardId: card.cardId,
      cardName: card.cardName,
      totalUsage: card.totalUsage,
      uniqueUsers: Object.keys(card.playerUsage).length,
      averageUsage: card.totalUsage / Object.keys(card.playerUsage).length,
      createdBy: card.createdBy
    }));
  }

  /**
   * 投票結果ランキング取得
   */
  getVotingRanking(sortBy = 'likes', limit = 10) {
    const cards = Array.from(this.votingStats.values());
    
    let sortFunction;
    switch (sortBy) {
      case 'likes':
        sortFunction = (a, b) => b.likes - a.likes;
        break;
      case 'dislikes':
        sortFunction = (a, b) => b.dislikes - a.dislikes;
        break;
      case 'controversial':
        sortFunction = (a, b) => b.controversy - a.controversy;
        break;
      case 'totalVotes':
        sortFunction = (a, b) => b.totalVotes - a.totalVotes;
        break;
      default:
        sortFunction = (a, b) => b.likes - a.likes;
    }

    return cards
      .sort(sortFunction)
      .slice(0, limit)
      .map((card, index) => ({
        rank: index + 1,
        cardId: card.cardId,
        likes: card.likes,
        dislikes: card.dislikes,
        totalVotes: card.totalVotes,
        controversy: card.controversy,
        likeRatio: card.totalVotes > 0 ? (card.likes / card.totalVotes * 100).toFixed(1) : 0
      }));
  }

  /**
   * プレイヤー分析取得
   */
  getPlayerAnalysis(playerId) {
    const stats = this.playerStats.get(playerId);
    if (!stats) return null;

    return {
      playerId: stats.playerId,
      playStyle: stats.playStyle,
      totalActions: stats.totalActions,
      cardsPlayed: stats.cardsPlayed,
      cardsBought: stats.cardsBought,
      cardsCreated: stats.cardsCreated,
      uniqueCardsUsed: stats.uniqueCardsUsed.size,
      cardTypeDistribution: stats.cardTypeDistribution,
      efficiency: {
        playRatio: stats.totalActions > 0 ? (stats.cardsPlayed / stats.totalActions * 100).toFixed(1) : 0,
        diversity: stats.uniqueCardsUsed.size,
        creativity: stats.cardsCreated
      }
    };
  }

  /**
   * ゲーム統計取得
   */
  getGameStatistics() {
    const cardStats = Array.from(this.cardUsageStats.values());
    const playerStats = Array.from(this.playerStats.values());
    const voteStats = Array.from(this.votingStats.values());

    return {
      totalCards: cardStats.length,
      totalUsage: cardStats.reduce((sum, card) => sum + card.totalUsage, 0),
      totalPlayers: playerStats.length,
      totalVotes: voteStats.reduce((sum, vote) => sum + vote.totalVotes, 0),
      popularCards: this.getCardPopularityRanking(5),
      topVotedCards: this.getVotingRanking('likes', 5),
      controversialCards: this.getVotingRanking('controversial', 5),
      playStyleDistribution: this.getPlayStyleDistribution()
    };
  }

  /**
   * プレイスタイル分布取得
   */
  getPlayStyleDistribution() {
    const distribution = {};
    
    for (const stats of this.playerStats.values()) {
      distribution[stats.playStyle] = (distribution[stats.playStyle] || 0) + 1;
    }
    
    return distribution;
  }

  /**
   * データクリア
   */
  clearGameData() {
    this.cardUsageStats.clear();
    this.playerStats.clear();
    this.votingStats.clear();
  }

  /**
   * 統計データエクスポート
   */
  exportStatistics() {
    return {
      cardUsage: Array.from(this.cardUsageStats.entries()),
      playerStats: Array.from(this.playerStats.entries()),
      votingStats: Array.from(this.votingStats.entries()),
      exportedAt: new Date()
    };
  }

  /**
   * 統計データインポート
   */
  importStatistics(data) {
    if (data.cardUsage) {
      this.cardUsageStats = new Map(data.cardUsage);
    }
    if (data.playerStats) {
      this.playerStats = new Map(data.playerStats);
    }
    if (data.votingStats) {
      this.votingStats = new Map(data.votingStats);
    }
  }
}

export default UsageTrackingEngine;