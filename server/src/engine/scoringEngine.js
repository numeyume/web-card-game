/**
 * Scoring Engine - Formula 4.4 実装
 * GameScore + CreatorScore による総合スコア計算
 */

export class ScoringEngine {
  constructor() {
    this.formula = '4.4';
    this.gameScoreMultiplier = 1.0;
    this.creatorScoreMultipliers = {
      othersUsage: 10,
      selfUsage: 5
    };
  }

  /**
   * ゲームスコア計算
   * GameScore = 勝利点 × ベース倍率
   */
  calculateGameScore(victoryPoints) {
    return Math.round(victoryPoints * this.gameScoreMultiplier);
  }

  /**
   * 創造者スコア計算
   * CreatorScore = (他者使用 × 10) + (自己使用 × 5)
   */
  calculateCreatorScore(cardUsageStats, playerId) {
    let creatorScore = 0;
    
    for (const [cardId, usage] of Object.entries(cardUsageStats)) {
      if (usage.createdBy === playerId) {
        // このプレイヤーが作成したカード
        const othersUsage = usage.totalUsage - (usage.playerUsage[playerId] || 0);
        const selfUsage = usage.playerUsage[playerId] || 0;
        
        creatorScore += (othersUsage * this.creatorScoreMultipliers.othersUsage) +
                       (selfUsage * this.creatorScoreMultipliers.selfUsage);
      }
    }
    
    return Math.round(creatorScore);
  }

  /**
   * 総合スコア計算
   */
  calculateTotalScore(gameScore, creatorScore) {
    return gameScore + creatorScore;
  }

  /**
   * プレイヤーの最終スコア計算
   */
  calculatePlayerScore(playerId, victoryPoints, cardUsageStats) {
    const gameScore = this.calculateGameScore(victoryPoints);
    const creatorScore = this.calculateCreatorScore(cardUsageStats, playerId);
    const totalScore = this.calculateTotalScore(gameScore, creatorScore);
    
    return {
      playerId,
      gameScore,
      creatorScore,
      totalScore,
      victoryPoints,
      formula: this.formula
    };
  }

  /**
   * ゲーム終了時の最終ランキング計算
   */
  calculateFinalRankings(players, cardUsageStats) {
    const playerScores = players.map(player => {
      const score = this.calculatePlayerScore(
        player.id,
        player.victoryPoints || 0,
        cardUsageStats
      );
      
      return {
        ...score,
        playerName: player.name,
        cardsCreated: this.getCardsCreatedCount(player.id, cardUsageStats),
        cardsUsed: this.getTotalCardsUsed(player.id, cardUsageStats),
        playStyle: this.analyzePlayStyle(player.id, cardUsageStats, players.length)
      };
    });
    
    // 総合スコア順でソート
    playerScores.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // 同点の場合はゲームスコア優先
      if (b.gameScore !== a.gameScore) {
        return b.gameScore - a.gameScore;
      }
      // それでも同点の場合は創造者スコア優先
      return b.creatorScore - a.creatorScore;
    });
    
    // ランク付け
    playerScores.forEach((player, index) => {
      player.rank = index + 1;
    });
    
    return playerScores;
  }

  /**
   * カード作成数取得
   */
  getCardsCreatedCount(playerId, cardUsageStats) {
    return Object.values(cardUsageStats)
      .filter(usage => usage.createdBy === playerId).length;
  }

  /**
   * カード使用総数取得
   */
  getTotalCardsUsed(playerId, cardUsageStats) {
    return Object.values(cardUsageStats)
      .reduce((total, usage) => total + (usage.playerUsage[playerId] || 0), 0);
  }

  /**
   * プレイスタイル分析
   */
  analyzePlayStyle(playerId, cardUsageStats, totalPlayers) {
    const cardsCreated = this.getCardsCreatedCount(playerId, cardUsageStats);
    const cardsUsed = this.getTotalCardsUsed(playerId, cardUsageStats);
    const cardTypes = this.getCardTypeDistribution(playerId, cardUsageStats);
    
    // 創造者タイプ
    if (cardsCreated >= 3) {
      return 'Creator';
    }
    
    // アグレッシブタイプ
    if (cardsUsed > 15 && cardTypes.action > cardTypes.treasure) {
      return 'Aggressive';
    }
    
    // エクスプローラータイプ
    const uniqueCardsUsed = Object.values(cardUsageStats)
      .filter(usage => usage.playerUsage[playerId] > 0).length;
    if (uniqueCardsUsed >= 8) {
      return 'Explorer';
    }
    
    // ビルダータイプ
    if (cardTypes.treasure > cardTypes.action * 2) {
      return 'Builder';
    }
    
    // デフォルトはバランス型
    return 'Balanced';
  }

  /**
   * カードタイプ分布取得
   */
  getCardTypeDistribution(playerId, cardUsageStats) {
    const distribution = { action: 0, treasure: 0, victory: 0, curse: 0 };
    
    for (const usage of Object.values(cardUsageStats)) {
      const playerUsage = usage.playerUsage[playerId] || 0;
      if (playerUsage > 0 && usage.cardType) {
        distribution[usage.cardType] += playerUsage;
      }
    }
    
    return distribution;
  }

  /**
   * ゲーム統計計算
   */
  calculateGameStats(players, cardUsageStats, gameData) {
    const totalTurns = gameData.totalTurns || 0;
    const gameDuration = gameData.gameDuration || 0;
    const endReason = gameData.endReason || 'unknown';
    
    // トップカード統計
    const topCards = Object.entries(cardUsageStats)
      .map(([cardId, usage]) => ({
        cardId,
        cardName: usage.cardName,
        totalUsage: usage.totalUsage,
        uniqueUsers: Object.keys(usage.playerUsage).length,
        averageUsage: usage.totalUsage / players.length,
        createdBy: usage.createdBy,
        controversial: this.isCardControversial(usage)
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 10);
    
    return {
      totalTurns,
      gameDuration,
      endReason,
      topCards,
      playerCount: players.length,
      totalCardsCreated: Object.values(cardUsageStats).filter(u => u.createdBy).length,
      averageCardsPerPlayer: Object.values(cardUsageStats)
        .reduce((sum, u) => sum + u.totalUsage, 0) / players.length
    };
  }

  /**
   * カードが物議を醸しているか判定
   */
  isCardControversial(usage) {
    // 使用回数のばらつきが大きい場合は物議を醸していると判定
    const usageValues = Object.values(usage.playerUsage);
    if (usageValues.length < 2) return false;
    
    const avg = usageValues.reduce((a, b) => a + b, 0) / usageValues.length;
    const variance = usageValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / usageValues.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > avg * 0.5; // 標準偏差が平均の50%以上の場合
  }

  /**
   * スコア履歴追加
   */
  addScoreHistory(gameId, rankings, gameStats) {
    return {
      gameId,
      timestamp: new Date(),
      rankings,
      gameStats,
      formula: this.formula
    };
  }
}

export default ScoringEngine;