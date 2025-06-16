/**
 * Achievement Engine - REDESIGNED FOR CARD CREATION FOCUS
 * 
 * カード作成と創造性に特化したアチーブメントシステム
 * 当初の設計思想「創造による貢献」を重視
 */

export class AchievementEngine {
  constructor() {
    console.log('🏆 AchievementEngine redesigned - celebrating creativity!');
    this.achievements = this.initializeCreativeAchievements();
    this.playerProgress = new Map();
  }

  /**
   * カード作成特化アチーブメント定義
   */
  initializeCreativeAchievements() {
    return {
      // カード作成の段階的成長
      'first_creation': {
        id: 'first_creation',
        name: '初の創造者',
        description: '最初のオリジナルカードを作成',
        icon: '🎨',
        category: 'creation',
        condition: { cardsCreated: 1 },
        reward: { experience: 50, message: 'Welcome to the creative community!' }
      },
      
      'creative_mind': {
        id: 'creative_mind',
        name: 'クリエイティブ・マインド',
        description: '5枚のユニークなカードを作成',
        icon: '🧠',
        category: 'creation',
        condition: { cardsCreated: 5 },
        reward: { experience: 200, message: 'Your creativity is flourishing!' }
      },

      'card_artist': {
        id: 'card_artist',
        name: 'カード・アーティスト',
        description: '10枚の多様なカードを作成',
        icon: '🎭',
        category: 'creation',
        condition: { cardsCreated: 10 },
        reward: { experience: 500, title: 'Card Artist' }
      },

      'master_creator': {
        id: 'master_creator',
        name: 'マスター・クリエイター',
        description: '20枚のカードで創造性を証明',
        icon: '👑',
        category: 'creation',
        condition: { cardsCreated: 20 },
        reward: { experience: 1000, title: 'Master Creator', badge: 'golden_crown' }
      },

      // 他者への貢献（創造者スコア重視）
      'community_favorite': {
        id: 'community_favorite',
        name: 'コミュニティのお気に入り',
        description: 'あなたのカードが他者に100回使用される',
        icon: '❤️',
        category: 'community',
        condition: { othersUsedYourCards: 100 },
        reward: { experience: 300, message: 'Your cards bring joy to others!' }
      },

      'beloved_creator': {
        id: 'beloved_creator',
        name: '愛されるクリエイター',
        description: 'あなたのカードが他者に500回使用される',
        icon: '💖',
        category: 'community',
        condition: { othersUsedYourCards: 500 },
        reward: { experience: 1000, title: 'Beloved Creator' }
      },

      'legendary_designer': {
        id: 'legendary_designer',
        name: '伝説のデザイナー',
        description: 'あなたのカードが他者に1000回使用される',
        icon: '🌟',
        category: 'community',
        condition: { othersUsedYourCards: 1000 },
        reward: { experience: 2000, title: 'Legendary Designer', badge: 'star_crown' }
      },

      // カードタイプの多様性
      'versatile_creator': {
        id: 'versatile_creator',
        name: '万能クリエイター',
        description: '全てのカードタイプ（Action/Treasure/Victory）を作成',
        icon: '🎯',
        category: 'variety',
        condition: { cardTypesCreated: 3 },
        reward: { experience: 400, message: 'Versatility is your strength!' }
      },

      // Formula 4.4 関連
      'balanced_player': {
        id: 'balanced_player',
        name: 'バランス・マスター',
        description: 'ゲームスコアと創造者スコアが同程度の試合で勝利',
        icon: '⚖️',
        category: 'gameplay',
        condition: { balancedVictory: true },
        reward: { experience: 300, message: 'Perfect balance of play and creation!' }
      },

      'pure_creator': {
        id: 'pure_creator',
        name: '純粋なクリエイター',
        description: '創造者スコアのみで試合に勝利',
        icon: '✨',
        category: 'gameplay',
        condition: { creatorOnlyVictory: true },
        reward: { experience: 500, message: 'Victory through pure creativity!' }
      }
    };
  }

  /**
   * プレイヤー進捗更新（創造性重視）
   */
  updatePlayerProgress(playerId, gameData) {
    if (!this.playerProgress.has(playerId)) {
      this.playerProgress.set(playerId, {
        cardsCreated: 0,
        cardTypesCreated: new Set(),
        othersUsedYourCards: 0,
        gamesWon: 0,
        totalCreatorScore: 0,
        totalGameScore: 0,
        achievements: new Set()
      });
    }

    const progress = this.playerProgress.get(playerId);
    const newAchievements = [];

    // データ更新
    if (gameData.cardsCreated) {
      progress.cardsCreated += gameData.cardsCreated;
    }
    
    if (gameData.cardTypesCreated) {
      gameData.cardTypesCreated.forEach(type => progress.cardTypesCreated.add(type));
    }
    
    if (gameData.othersUsedYourCards) {
      progress.othersUsedYourCards += gameData.othersUsedYourCards;
    }
    
    if (gameData.won) {
      progress.gamesWon++;
    }
    
    if (gameData.creatorScore) {
      progress.totalCreatorScore += gameData.creatorScore;
    }
    
    if (gameData.gameScore) {
      progress.totalGameScore += gameData.gameScore;
    }

    // アチーブメントチェック
    for (const [achievementId, achievement] of Object.entries(this.achievements)) {
      if (progress.achievements.has(achievementId)) continue;
      
      if (this.checkAchievementCondition(progress, achievement.condition, gameData)) {
        progress.achievements.add(achievementId);
        newAchievements.push({
          ...achievement,
          unlockedAt: new Date()
        });
      }
    }

    return {
      simplified: true,
      creativity_focused: true,
      newAchievements,
      totalAchievements: progress.achievements.size,
      progress: {
        cardsCreated: progress.cardsCreated,
        cardTypesCreated: progress.cardTypesCreated.size,
        othersUsedYourCards: progress.othersUsedYourCards,
        communityContribution: Math.floor(progress.othersUsedYourCards / 10)
      },
      message: newAchievements.length > 0 
        ? `🎉 New achievement unlocked: ${newAchievements.map(a => a.name).join(', ')}`
        : 'Keep creating and sharing your unique cards!'
    };
  }

  /**
   * アチーブメント条件チェック
   */
  checkAchievementCondition(progress, condition, gameData) {
    // カード作成数
    if (condition.cardsCreated && progress.cardsCreated >= condition.cardsCreated) {
      return true;
    }
    
    // カードタイプの多様性
    if (condition.cardTypesCreated && progress.cardTypesCreated.size >= condition.cardTypesCreated) {
      return true;
    }
    
    // 他者の使用回数
    if (condition.othersUsedYourCards && progress.othersUsedYourCards >= condition.othersUsedYourCards) {
      return true;
    }
    
    // バランスの取れた勝利
    if (condition.balancedVictory && gameData.won) {
      const gameScore = gameData.gameScore || 0;
      const creatorScore = gameData.creatorScore || 0;
      const ratio = creatorScore > 0 ? gameScore / creatorScore : 0;
      return ratio >= 0.5 && ratio <= 2.0; // 2:1以内の比率
    }
    
    // 創造者スコアのみの勝利
    if (condition.creatorOnlyVictory && gameData.won) {
      const gameScore = gameData.gameScore || 0;
      const creatorScore = gameData.creatorScore || 0;
      return creatorScore > gameScore * 2; // 創造者スコアが圧倒的
    }
    
    return false;
  }

  /**
   * プレイヤーアチーブメント取得
   */
  getPlayerAchievements(playerId) {
    const progress = this.playerProgress.get(playerId);
    if (!progress) return { achievements: [], progress: {} };
    
    const unlockedAchievements = Array.from(progress.achievements).map(id => ({
      ...this.achievements[id],
      unlocked: true
    }));
    
    return {
      achievements: unlockedAchievements,
      progress: {
        cardsCreated: progress.cardsCreated,
        cardTypesCreated: progress.cardTypesCreated.size,
        othersUsedYourCards: progress.othersUsedYourCards,
        totalUnlocked: progress.achievements.size,
        totalAvailable: Object.keys(this.achievements).length
      }
    };
  }

  /**
   * 推奨次ステップ
   */
  getRecommendedAchievements(playerId) {
    const progress = this.playerProgress.get(playerId);
    if (!progress) return [];
    
    return Object.values(this.achievements)
      .filter(achievement => !progress.achievements.has(achievement.id))
      .slice(0, 3)
      .map(achievement => ({
        ...achievement,
        suggestion: this.getAchievementSuggestion(achievement, progress)
      }));
  }

  getAchievementSuggestion(achievement, progress) {
    if (achievement.condition.cardsCreated) {
      const remaining = achievement.condition.cardsCreated - progress.cardsCreated;
      return `Create ${remaining} more card${remaining !== 1 ? 's' : ''} to unlock!`;
    }
    return 'Keep playing and creating!';
  }

  // 複雑な機能を無効化
  generateAchievementPlan() { return { simplified: true }; }
  calculateAchievementScore() { return { simplified: true }; }
  updateAchievementMetrics() { return { simplified: true }; }
}

export default AchievementEngine;