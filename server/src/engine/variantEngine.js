/**
 * Variant Engine - ゲームモードバリエーション・ランダムイベントシステム
 * リプレイアビリティ向上のための多様なゲーム体験を提供
 */

export class VariantEngine {
  constructor() {
    this.gameVariants = this.initializeGameVariants();
    this.randomEvents = this.initializeRandomEvents();
    this.modifiers = this.initializeModifiers();
    this.seasonalEvents = this.initializeSeasonalEvents();
    this.activeEvents = new Map(); // gameId -> active events
    this.eventHistory = new Map(); // track event occurrences
  }

  /**
   * ゲームバリアント初期化
   */
  initializeGameVariants() {
    return {
      classic: {
        id: 'classic',
        name: 'クラシック',
        description: '標準的なゲームルール',
        icon: '🎯',
        settings: {
          startingCards: 10,
          startingCoins: 3,
          handSize: 5,
          actionCount: 1,
          buyCount: 1,
          maxTurns: 50,
          timeLimit: 30
        },
        modifiers: []
      },

      blitz: {
        id: 'blitz',
        name: 'ブリッツ',
        description: '高速ゲーム（15分制限）',
        icon: '⚡',
        settings: {
          startingCards: 8,
          startingCoins: 4,
          handSize: 6,
          actionCount: 2,
          buyCount: 1,
          maxTurns: 30,
          timeLimit: 15
        },
        modifiers: ['fast_paced', 'reduced_complexity']
      },

      marathon: {
        id: 'marathon',
        name: 'マラソン',
        description: '長期戦（60ターン制限なし）',
        icon: '🏃‍♂️',
        settings: {
          startingCards: 12,
          startingCoins: 2,
          handSize: 4,
          actionCount: 1,
          buyCount: 1,
          maxTurns: 100,
          timeLimit: 60
        },
        modifiers: ['extended_play', 'deep_strategy']
      },

      creative: {
        id: 'creative',
        name: 'クリエイティブ',
        description: 'カード作成に特化したモード',
        icon: '🎨',
        settings: {
          startingCards: 10,
          startingCoins: 5,
          handSize: 6,
          actionCount: 2,
          buyCount: 2,
          maxTurns: 40,
          timeLimit: 35,
          creationBonus: true
        },
        modifiers: ['creation_focus', 'innovation_bonus']
      },

      chaos: {
        id: 'chaos',
        name: 'カオス',
        description: 'ランダムイベント多発モード',
        icon: '🌪️',
        settings: {
          startingCards: 10,
          startingCoins: 3,
          handSize: 5,
          actionCount: 1,
          buyCount: 1,
          maxTurns: 50,
          timeLimit: 30,
          eventFrequency: 0.7
        },
        modifiers: ['high_variance', 'unpredictable']
      },

      cooperative: {
        id: 'cooperative',
        name: '協力モード',
        description: 'プレイヤー同士で協力',
        icon: '🤝',
        settings: {
          startingCards: 10,
          startingCoins: 4,
          handSize: 5,
          actionCount: 1,
          buyCount: 1,
          maxTurns: 60,
          timeLimit: 40,
          sharedObjective: true
        },
        modifiers: ['team_based', 'shared_victory']
      },

      puzzle: {
        id: 'puzzle',
        name: 'パズル',
        description: '特定の条件をクリアするモード',
        icon: '🧩',
        settings: {
          startingCards: 8,
          startingCoins: 2,
          handSize: 4,
          actionCount: 1,
          buyCount: 1,
          maxTurns: 20,
          timeLimit: 25,
          predefinedChallenge: true
        },
        modifiers: ['limited_resources', 'specific_goals']
      },

      draft: {
        id: 'draft',
        name: 'ドラフト',
        description: 'カードを選択してデッキを構築',
        icon: '📋',
        settings: {
          startingCards: 0,
          startingCoins: 0,
          handSize: 5,
          actionCount: 1,
          buyCount: 1,
          maxTurns: 40,
          timeLimit: 35,
          draftPhase: true
        },
        modifiers: ['deck_building', 'strategic_choice']
      }
    };
  }

  /**
   * ランダムイベント初期化
   */
  initializeRandomEvents() {
    return [
      {
        id: 'market_crash',
        name: '市場崩壊',
        description: '全てのカードのコストが1減少',
        icon: '📉',
        type: 'global',
        rarity: 'uncommon',
        duration: 3, // ターン数
        effects: {
          cardCostModifier: -1,
          minCost: 0
        },
        triggerConditions: {
          turn: { min: 10, max: 30 },
          probability: 0.15
        }
      },

      {
        id: 'golden_age',
        name: '黄金時代',
        description: '全プレイヤーが追加で1コイン獲得',
        icon: '🌟',
        type: 'global',
        rarity: 'rare',
        duration: 5,
        effects: {
          bonusCoins: 1,
          experienceMultiplier: 1.2
        },
        triggerConditions: {
          turn: { min: 15, max: 35 },
          probability: 0.1
        }
      },

      {
        id: 'innovation_surge',
        name: 'イノベーション急増',
        description: 'カード作成コストが半減',
        icon: '💡',
        type: 'global',
        rarity: 'rare',
        duration: 4,
        effects: {
          creationCostModifier: 0.5,
          creationSpeedBonus: true
        },
        triggerConditions: {
          turn: { min: 5, max: 25 },
          probability: 0.12,
          requiresCreativePlayer: true
        }
      },

      {
        id: 'lucky_draw',
        name: 'ラッキードロー',
        description: '次のターン、手札を1枚多く引ける',
        icon: '🍀',
        type: 'individual',
        rarity: 'common',
        duration: 1,
        effects: {
          bonusCardDraw: 1,
          luckBonus: true
        },
        triggerConditions: {
          turn: { min: 3 },
          probability: 0.2
        }
      },

      {
        id: 'time_warp',
        name: 'タイムワープ',
        description: '追加ターンを獲得',
        icon: '⏰',
        type: 'individual',
        rarity: 'epic',
        duration: 1,
        effects: {
          extraTurn: true,
          timeBonus: 30
        },
        triggerConditions: {
          turn: { min: 8, max: 40 },
          probability: 0.05
        }
      },

      {
        id: 'supply_shortage',
        name: '供給不足',
        description: 'ランダムなカードが一時的に購入不可',
        icon: '📦',
        type: 'global',
        rarity: 'uncommon',
        duration: 3,
        effects: {
          disableRandomCards: 2,
          scarcityBonus: true
        },
        triggerConditions: {
          turn: { min: 12, max: 35 },
          probability: 0.13
        }
      },

      {
        id: 'inspiration_strike',
        name: 'インスピレーション',
        description: '即座に新しいカードのアイデアを獲得',
        icon: '✨',
        type: 'individual',
        rarity: 'rare',
        duration: 0, // 即座に発動
        effects: {
          instantCardIdea: true,
          creationBonus: 2
        },
        triggerConditions: {
          turn: { min: 5 },
          probability: 0.08,
          requiresCreativeAction: true
        }
      },

      {
        id: 'viral_trend',
        name: 'バイラルトレンド',
        description: '最も人気のカードが全員の手札に追加',
        icon: '🔥',
        type: 'global',
        rarity: 'epic',
        duration: 1,
        effects: {
          popularCardBonus: true,
          socialBenefit: true
        },
        triggerConditions: {
          turn: { min: 20 },
          probability: 0.06,
          requiresPopularCard: true
        }
      },

      {
        id: 'mystery_box',
        name: 'ミステリーボックス',
        description: 'ランダムな有益な効果を獲得',
        icon: '🎁',
        type: 'individual',
        rarity: 'uncommon',
        duration: 1,
        effects: {
          randomBenefit: true,
          surpriseFactor: true
        },
        triggerConditions: {
          turn: { min: 1 },
          probability: 0.15
        }
      },

      {
        id: 'perfect_harmony',
        name: '完璧な調和',
        description: '全プレイヤーの創造性が向上',
        icon: '☯️',
        type: 'global',
        rarity: 'legendary',
        duration: 7,
        effects: {
          globalCreativityBonus: 1.5,
          harmonyBonus: true,
          experienceBonus: 1.3
        },
        triggerConditions: {
          turn: { min: 25 },
          probability: 0.03,
          requiresBalance: true
        }
      }
    ];
  }

  /**
   * ゲーム修飾子初期化
   */
  initializeModifiers() {
    return {
      fast_paced: {
        name: '高速進行',
        effects: {
          turnTimeReduction: 0.8,
          quickDecisions: true
        }
      },
      
      creation_focus: {
        name: '創造重視',
        effects: {
          creationBonusMultiplier: 1.5,
          creationCostReduction: 0.8
        }
      },
      
      high_variance: {
        name: '高い変動性',
        effects: {
          eventFrequencyMultiplier: 2.0,
          randomnessIncrease: true
        }
      },
      
      team_based: {
        name: 'チーム戦',
        effects: {
          sharedResources: true,
          cooperativeBonus: true
        }
      },
      
      limited_resources: {
        name: '限定的リソース',
        effects: {
          resourceConstraints: true,
          strategicDepth: true
        }
      }
    };
  }

  /**
   * 季節イベント初期化
   */
  initializeSeasonalEvents() {
    return {
      spring_festival: {
        id: 'spring_festival',
        name: '春の祭典',
        description: '創造性が開花する季節',
        duration: 7 * 24 * 60 * 60 * 1000, // 7日間
        season: 'spring',
        effects: {
          creationBonusGlobal: 1.3,
          experienceBonusCreative: 1.5,
          specialCards: ['cherry_blossom', 'spring_breeze']
        },
        rewards: {
          participation: { title: 'Spring Creator', cardPacks: 3 },
          achievement: { cosmetic: 'sakura_frame', badge: 'spring_master' }
        }
      },
      
      summer_games: {
        id: 'summer_games',
        name: '夏の大会',
        description: '競技的な季節イベント',
        duration: 14 * 24 * 60 * 60 * 1000, // 14日間
        season: 'summer',
        effects: {
          tournamentBonus: 1.4,
          competitiveMultiplier: 1.2,
          specialModes: ['beach_battle', 'sunset_showdown']
        },
        rewards: {
          ranking: {
            top1: { title: 'Summer Champion', exclusive_card: 'solar_crown' },
            top10: { title: 'Summer Star', cosmetic: 'sun_avatar' },
            top100: { cardPacks: 5, coins: 1000 }
          }
        }
      },
      
      autumn_harvest: {
        id: 'autumn_harvest',
        name: '秋の収穫祭',
        description: '豊穣の季節、報酬が増加',
        duration: 10 * 24 * 60 * 60 * 1000, // 10日間
        season: 'autumn',
        effects: {
          rewardMultiplier: 1.5,
          harvestBonus: true,
          specialMechanics: ['resource_gathering', 'abundance_mode']
        },
        rewards: {
          daily: { coins: 100, cardPacks: 2 },
          completion: { title: 'Harvest Master', special_currency: 500 }
        }
      },
      
      winter_wonderland: {
        id: 'winter_wonderland',
        name: '冬のワンダーランド',
        description: '神秘的な冬の魔法',
        duration: 21 * 24 * 60 * 60 * 1000, // 21日間
        season: 'winter',
        effects: {
          mysticalBonus: 1.4,
          frozenTimeEvents: true,
          specialVariants: ['ice_palace', 'aurora_arena']
        },
        rewards: {
          milestone: {
            week1: { cosmetic: 'ice_frame', title: 'Winter Visitor' },
            week2: { exclusive_card: 'frost_gem', coins: 2000 },
            week3: { legendary_cosmetic: 'aurora_avatar', title: 'Winter Legend' }
          }
        }
      }
    };
  }

  /**
   * ゲームバリアント選択
   */
  selectGameVariant(gameId, variantId, customSettings = {}) {
    const variant = this.gameVariants[variantId];
    if (!variant) {
      return { error: 'Invalid variant' };
    }

    // カスタム設定をマージ
    const finalSettings = {
      ...variant.settings,
      ...customSettings
    };

    // アクティブなイベントをチェック
    const activeEvents = this.getActiveSeasonalEvents();
    
    return {
      variant: {
        ...variant,
        settings: finalSettings
      },
      activeEvents,
      modifiers: this.applyVariantModifiers(variant.modifiers, activeEvents)
    };
  }

  /**
   * ランダムイベント判定
   */
  checkRandomEvents(gameId, gameState) {
    const activeGameEvents = this.activeEvents.get(gameId) || [];
    const newEvents = [];

    // ゲームバリアント設定取得
    const variant = gameState.variant || this.gameVariants.classic;
    const eventFrequency = variant.settings.eventFrequency || 0.3;

    // 各イベントの発生判定
    this.randomEvents.forEach(event => {
      if (this.shouldTriggerEvent(event, gameState, eventFrequency)) {
        newEvents.push(this.triggerEvent(gameId, event, gameState));
      }
    });

    // 期限切れイベントの削除
    const updatedEvents = activeGameEvents.filter(event => 
      this.isEventStillActive(event, gameState.currentTurn)
    );

    // 新しいイベントを追加
    updatedEvents.push(...newEvents);
    this.activeEvents.set(gameId, updatedEvents);

    return {
      newEvents,
      activeEvents: updatedEvents,
      eventEffects: this.calculateEventEffects(updatedEvents)
    };
  }

  /**
   * イベント発生判定
   */
  shouldTriggerEvent(event, gameState, frequencyMultiplier = 1.0) {
    const conditions = event.triggerConditions;
    const currentTurn = gameState.currentTurn || 0;

    // ターン数条件
    if (conditions.turn) {
      if (currentTurn < (conditions.turn.min || 0)) return false;
      if (conditions.turn.max && currentTurn > conditions.turn.max) return false;
    }

    // 特別条件チェック
    if (conditions.requiresCreativePlayer && !this.hasCreativePlayer(gameState)) {
      return false;
    }

    if (conditions.requiresPopularCard && !this.hasPopularCard(gameState)) {
      return false;
    }

    if (conditions.requiresBalance && !this.hasBalancedGame(gameState)) {
      return false;
    }

    // 確率判定
    const probability = conditions.probability * frequencyMultiplier;
    return Math.random() < probability;
  }

  /**
   * イベント発動
   */
  triggerEvent(gameId, eventTemplate, gameState) {
    const event = {
      ...eventTemplate,
      id: `${eventTemplate.id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      gameId,
      triggeredAt: gameState.currentTurn,
      expiresAt: gameState.currentTurn + (eventTemplate.duration || 1),
      affectedPlayers: this.determineAffectedPlayers(eventTemplate, gameState)
    };

    // イベント履歴に記録
    this.recordEventHistory(gameId, event);

    return event;
  }

  /**
   * イベント効果計算
   */
  calculateEventEffects(activeEvents) {
    const effects = {
      global: {},
      individual: new Map() // playerId -> effects
    };

    activeEvents.forEach(event => {
      if (event.type === 'global') {
        // グローバル効果をマージ
        Object.assign(effects.global, event.effects);
      } else if (event.type === 'individual') {
        // 個別効果を適用
        event.affectedPlayers.forEach(playerId => {
          if (!effects.individual.has(playerId)) {
            effects.individual.set(playerId, {});
          }
          Object.assign(effects.individual.get(playerId), event.effects);
        });
      }
    });

    return effects;
  }

  /**
   * 毎日のバリアント推奨
   */
  getDailyRecommendedVariant() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const weeklyRotation = [
      'classic',      // 日曜日
      'blitz',        // 月曜日
      'creative',     // 火曜日
      'chaos',        // 水曜日
      'cooperative',  // 木曜日
      'puzzle',       // 金曜日
      'draft'         // 土曜日
    ];

    const recommendedVariant = weeklyRotation[dayOfWeek];
    const variant = this.gameVariants[recommendedVariant];

    return {
      variant,
      reason: this.getVariantRecommendationReason(dayOfWeek),
      dailyBonus: {
        experienceMultiplier: 1.2,
        extraRewards: true
      }
    };
  }

  /**
   * バリアント推奨理由取得
   */
  getVariantRecommendationReason(dayOfWeek) {
    const reasons = [
      '週末はクラシックモードでゆっくりと',           // 日曜日
      '月曜日は素早くブリッツで一週間をスタート',       // 月曜日
      '火曜日は創造性を発揮してクリエイティブモード',     // 火曜日
      '水曜日は変化に富んだカオスモードで刺激を',       // 水曜日
      '木曜日は仲間と協力してチームワークを',          // 木曜日
      '金曜日はパズルモードで頭脳を鍛えて',           // 金曜日
      '土曜日はドラフトで戦略的思考を'              // 土曜日
    ];
    
    return reasons[dayOfWeek];
  }

  /**
   * カスタムバリアント作成
   */
  createCustomVariant(creatorId, variantData) {
    const customVariantId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const customVariant = {
      id: customVariantId,
      name: variantData.name,
      description: variantData.description,
      icon: variantData.icon || '🎮',
      creator: creatorId,
      createdAt: new Date(),
      isCustom: true,
      
      settings: this.validateVariantSettings(variantData.settings),
      modifiers: variantData.modifiers || [],
      
      // カスタムルール
      customRules: variantData.customRules || [],
      winConditions: variantData.winConditions || ['standard'],
      specialMechanics: variantData.specialMechanics || [],
      
      // 公開設定
      visibility: variantData.visibility || 'private', // private, friends, public
      playable: true,
      
      // 統計
      stats: {
        timesPlayed: 0,
        averageRating: 0,
        favorites: 0,
        reports: 0
      }
    };

    return customVariant;
  }

  /**
   * バリアント設定検証
   */
  validateVariantSettings(settings) {
    const defaultSettings = this.gameVariants.classic.settings;
    const validated = { ...defaultSettings };

    // 数値の範囲チェック
    if (settings.startingCards) {
      validated.startingCards = Math.max(5, Math.min(15, settings.startingCards));
    }
    
    if (settings.startingCoins) {
      validated.startingCoins = Math.max(0, Math.min(10, settings.startingCoins));
    }
    
    if (settings.handSize) {
      validated.handSize = Math.max(3, Math.min(10, settings.handSize));
    }
    
    if (settings.maxTurns) {
      validated.maxTurns = Math.max(10, Math.min(200, settings.maxTurns));
    }
    
    if (settings.timeLimit) {
      validated.timeLimit = Math.max(5, Math.min(120, settings.timeLimit));
    }

    return validated;
  }

  /**
   * イベント履歴記録
   */
  recordEventHistory(gameId, event) {
    if (!this.eventHistory.has(gameId)) {
      this.eventHistory.set(gameId, []);
    }
    
    const history = this.eventHistory.get(gameId);
    history.push({
      eventId: event.id,
      eventType: event.name,
      triggeredAt: event.triggeredAt,
      duration: event.duration,
      impact: this.calculateEventImpact(event)
    });

    // 履歴は最大50イベントまで保持
    if (history.length > 50) {
      history.shift();
    }
  }

  /**
   * イベント影響度計算
   */
  calculateEventImpact(event) {
    let impact = 0;
    
    // レアリティによる基本影響度
    const rarityImpact = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5
    };
    
    impact += rarityImpact[event.rarity] || 1;
    
    // 持続時間による影響度
    impact += (event.duration || 1) * 0.5;
    
    // 影響範囲による影響度
    if (event.type === 'global') {
      impact *= 1.5;
    }
    
    return Math.round(impact * 10) / 10;
  }

  /**
   * アクティブな季節イベント取得
   */
  getActiveSeasonalEvents() {
    const now = new Date();
    const currentSeason = this.getCurrentSeason();
    
    return Object.values(this.seasonalEvents).filter(event => {
      return event.season === currentSeason && this.isSeasonalEventActive(event, now);
    });
  }

  /**
   * 現在の季節取得
   */
  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  /**
   * ユーティリティメソッド群
   */
  isEventStillActive(event, currentTurn) {
    return currentTurn < event.expiresAt;
  }

  hasCreativePlayer(gameState) {
    return gameState.players?.some(player => 
      (player.cardsCreated || 0) > 0 || player.playStyle === 'Creator'
    );
  }

  hasPopularCard(gameState) {
    return gameState.cardUsageStats && 
           Object.values(gameState.cardUsageStats).some(card => card.totalUsage >= 5);
  }

  hasBalancedGame(gameState) {
    if (!gameState.players || gameState.players.length < 2) return false;
    
    const scores = gameState.players.map(p => p.victoryPoints || 0);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    return (maxScore - minScore) <= 10; // スコア差が10以下で均衡
  }

  determineAffectedPlayers(event, gameState) {
    if (event.type === 'global') {
      return gameState.players?.map(p => p.id) || [];
    } else {
      // ランダムに1-2人を選択
      const playerIds = gameState.players?.map(p => p.id) || [];
      const affectedCount = Math.min(Math.ceil(Math.random() * 2), playerIds.length);
      return this.shuffleArray(playerIds).slice(0, affectedCount);
    }
  }

  applyVariantModifiers(modifierIds, activeEvents) {
    const appliedModifiers = {};
    
    modifierIds.forEach(modifierId => {
      const modifier = this.modifiers[modifierId];
      if (modifier) {
        Object.assign(appliedModifiers, modifier.effects);
      }
    });

    // 季節イベントの修飾子も適用
    activeEvents.forEach(event => {
      if (event.effects) {
        Object.assign(appliedModifiers, event.effects);
      }
    });

    return appliedModifiers;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  isSeasonalEventActive(event, currentDate) {
    // 簡易実装：実際の日付範囲チェックが必要
    return true;
  }

  /**
   * バリアント統計取得
   */
  getVariantStats() {
    return {
      totalVariants: Object.keys(this.gameVariants).length,
      totalEvents: this.randomEvents.length,
      activeEvents: Array.from(this.activeEvents.values()).flat().length,
      seasonalEvents: Object.keys(this.seasonalEvents).length,
      currentSeason: this.getCurrentSeason(),
      dailyRecommendation: this.getDailyRecommendedVariant().variant.name
    };
  }
}

export default VariantEngine;