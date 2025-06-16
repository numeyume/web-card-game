/**
 * Progression Engine - SIMPLIFIED FOR ORIGINAL DESIGN FOCUS
 * 
 * 複雑な進行システムを簡素化し、カード作成とゲームプレイに集中
 * 当初の設計思想を損なわない最小限の進行システム
 */

export class ProgressionEngine {
  constructor() {
    console.log('📈 ProgressionEngine simplified - focusing on core creativity');
    this.simplified = true;
    this.playerStats = new Map(); // Simple stats only
  }

  /**
   * シンプルな経験値システム（カード作成重視）
   */
  updatePlayerProgression(playerId, gameData) {
    if (!this.playerStats.has(playerId)) {
      this.playerStats.set(playerId, {
        gamesPlayed: 0,
        cardsCreated: 0,
        totalScore: 0,
        creatorScore: 0,
        level: 1,
        experience: 0
      });
    }

    const stats = this.playerStats.get(playerId);
    
    // 基本経験値（ゲーム参加）
    let expGained = 10;
    
    // カード作成ボーナス（重要！）
    if (gameData.cardsCreated > 0) {
      expGained += gameData.cardsCreated * 50; // カード作成を重視
    }
    
    // 創造者スコアボーナス
    if (gameData.creatorScore > 0) {
      expGained += Math.floor(gameData.creatorScore / 10);
    }
    
    // 勝利ボーナス（控えめ）
    if (gameData.won) {
      expGained += 25;
    }

    // 統計更新
    stats.gamesPlayed++;
    stats.cardsCreated += gameData.cardsCreated || 0;
    stats.totalScore += gameData.finalScore || 0;
    stats.creatorScore += gameData.creatorScore || 0;
    stats.experience += expGained;
    
    // レベルアップ計算（シンプル）
    const newLevel = Math.floor(stats.experience / 1000) + 1;
    const leveledUp = newLevel > stats.level;
    stats.level = newLevel;

    return {
      simplified: true,
      experienceGained: expGained,
      totalExperience: stats.experience,
      currentLevel: stats.level,
      leveledUp,
      stats: { ...stats },
      message: leveledUp 
        ? `Level up! Now level ${stats.level} - keep creating!`
        : `+${expGained} XP earned through creativity!`
    };
  }

  /**
   * プレイヤー統計取得
   */
  getPlayerStats(playerId) {
    return this.playerStats.get(playerId) || {
      gamesPlayed: 0,
      cardsCreated: 0,
      totalScore: 0,
      creatorScore: 0,
      level: 1,
      experience: 0
    };
  }

  /**
   * リーダーボード（簡素版）
   */
  getSimpleLeaderboard(sortBy = 'creatorScore') {
    const allStats = Array.from(this.playerStats.entries()).map(([playerId, stats]) => ({
      playerId,
      ...stats
    }));

    return allStats.sort((a, b) => {
      switch (sortBy) {
        case 'cardsCreated':
          return b.cardsCreated - a.cardsCreated;
        case 'level':
          return b.level - a.level;
        case 'creatorScore':
        default:
          return b.creatorScore - a.creatorScore;
      }
    }).slice(0, 10);
  }

  // 複雑な機能を無効化（互換性維持）
  updateDailyChallenges() { 
    return { simplified: true, message: 'Focus on card creation instead!' }; 
  }
  
  updateSeasonPass() { 
    return { simplified: true, message: 'Original game design is the focus' }; 
  }
  
  openCardPack() { 
    return { simplified: true, message: 'Create your own cards!' }; 
  }
  
  generateDailyRewards() { 
    return { simplified: true, message: 'The reward is creative expression' }; 
  }

  // Legacy method compatibility
  initializeDailyChallenges() { return []; }
  initializeSeasonPasses() { return {}; }
  getCurrentSeason() { return { id: 'classic', name: 'Classic Creative Mode' }; }
  initializeRewardPools() { return {}; }
}

export default ProgressionEngine;