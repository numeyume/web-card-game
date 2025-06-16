/**
 * Game Engine Manager - 全エンジンの統合管理
 * 新しいゲームデザイン要素と既存システムの橋渡し
 */

// 新エンジン群
import { AchievementEngine } from '../engine/achievementEngine.js';
import { FeedbackEngine } from '../engine/feedbackEngine.js';
import { BalanceEngine } from '../engine/balanceEngine.js';
import { ProgressionEngine } from '../engine/progressionEngine.js';
import { SocialEngine } from '../engine/socialEngine.js';
import { VariantEngine } from '../engine/variantEngine.js';

// 既存エンジン群
import { ScoringEngine } from '../engine/scoringEngine.js';
import { EndConditionEngine } from '../engine/endConditionEngine.js';
import { DeckEngine } from '../engine/deckEngine.js';
import { UsageTrackingEngine } from '../engine/usageTrackingEngine.js';

export class GameEngineManager {
  constructor(config = {}) {
    // フェーズ制御設定（段階的実装）
    this.enabledFeatures = {
      // Phase 1: コアゲーム機能のみ（当初設計）
      core: true,
      scoring: true,
      cardCreation: true,
      usageTracking: true,
      
      // Phase 2: 段階的導入機能
      achievements: config.enableAchievements || false,
      feedback: config.enableFeedback || false,
      
      // Phase 3: オプション機能
      social: config.enableSocial || false,
      variants: config.enableVariants || false,
      
      // 無効化対象
      balance: false, // 創造性の平等を保つため無効
      progression: false // 複雑性を避けるため無効
    };
    
    // 条件付きエンジン初期化
    if (this.enabledFeatures.achievements) {
      this.achievementEngine = new AchievementEngine();
    }
    if (this.enabledFeatures.feedback) {
      this.feedbackEngine = new FeedbackEngine();
    }
    if (this.enabledFeatures.social) {
      this.socialEngine = new SocialEngine();
    }
    if (this.enabledFeatures.variants) {
      this.variantEngine = new VariantEngine();
    }
    
    // コアエンジン（常に有効）
    this.scoringEngine = new ScoringEngine();
    this.endConditionEngine = new EndConditionEngine();
    this.deckEngine = new DeckEngine();
    this.usageTrackingEngine = new UsageTrackingEngine();
    
    // アクティブゲーム管理
    this.activeGames = new Map();
    this.playerSessions = new Map();
    
    console.log('🎮 GameEngineManager initialized with features:', this.enabledFeatures);
  }

  /**
   * ゲーム開始時の統合処理（段階的機能制御）
   */
  async initializeGame(gameId, players, settings = {}) {
    try {
      console.log('🎮 Initializing game with core features only');
      
      // 1. コアゲーム初期化（常に実行）
      const gameState = {
        gameId,
        players: players.map(player => ({
          ...player,
          deck: this.deckEngine.createStartingDeck(),
          hand: [],
          discard: [],
          play: [],
          coins: 0,
          actions: 1,
          buys: 1,
          victoryPoints: 0
        })),
        currentPlayer: 0,
        turn: 1,
        phase: 'action',
        supply: this.deckEngine.initializeSupply(players.length),
        usageStats: new Map()
      };
      
      // 2. オプション機能の条件付き初期化
      if (this.enabledFeatures.variants && this.variantEngine) {
        const variantId = settings.variant || 'classic';
        const variantResult = this.variantEngine.selectGameVariant(gameId, variantId, settings.customSettings);
        
        if (variantResult.error) {
          throw new Error(`Variant selection failed: ${variantResult.error}`);
        }
        gameState.variant = variantResult.variant;
        gameState.activeEvents = variantResult.activeEvents || [];
      }

      // 3. 使用統計はリアルタイムで記録されるため初期化不要

      // 4. 初期手札配布（シンプルな方式）
      gameState.players.forEach(player => {
        const { drawnCards, newDeck, newDiscard } = this.deckEngine.drawCards(player.deck, player.discard, 5);
        player.hand = drawnCards;
        player.deck = newDeck;
        player.discard = newDiscard;
      });

      // 5. アクティブゲームに登録
      this.activeGames.set(gameId, gameState);

      // 6. プレイヤーセッション更新
      players.forEach(player => {
        this.playerSessions.set(player.id, { gameId, joinedAt: new Date() });
      });

      console.log('✅ Game initialized successfully with core features');
      
      return {
        success: true,
        gameState,
        message: 'Core game initialized - focus on creativity and card building!'
      };

    } catch (error) {
      console.error('Game initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * プレイヤーアクション処理（シンプル化）
   */
  async processPlayerAction(gameId, playerId, action) {
    try {
      const gameState = this.activeGames.get(gameId);
      if (!gameState) {
        throw new Error('Game not found');
      }

      // 1. 基本アクション検証
      const validation = this.validatePlayerAction(gameState, playerId, action);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 2. コアアクション実行
      const actionResult = await this.executeAction(gameState, playerId, action);
      
      // 3. 使用統計記録（コア機能）
      if (action.type === 'playCard' || action.type === 'buyCard') {
        this.usageTrackingEngine.recordCardUsage(gameId, playerId, action.cardId, action.type);
      }

      // 4. オプション機能の条件付き実行
      let feedback = null;
      let eventResult = { newEvents: [] };

      if (this.enabledFeatures.feedback && this.feedbackEngine) {
        feedback = this.feedbackEngine.generateActionFeedback(playerId, action, gameState);
      }

      if (this.enabledFeatures.variants && this.variantEngine) {
        eventResult = this.variantEngine.checkRandomEvents(gameId, gameState);
        if (eventResult.newEvents.length > 0) {
          gameState.activeEvents = gameState.activeEvents || [];
          gameState.activeEvents.push(...eventResult.newEvents);
        }
      }

      // 5. ゲーム終了条件チェック（コア機能）
      const endCheck = this.endConditionEngine.checkEndConditions(gameState);
      
      let gameEndResult = null;
      if (endCheck.isGameEnd) {
        gameEndResult = await this.handleGameEnd(gameId, endCheck);
      }

      console.log(`✅ Action processed: ${action.type} by ${playerId}`);

      return {
        success: true,
        actionResult,
        feedback,
        newEvents: eventResult.newEvents,
        gameEndResult,
        gameState: this.sanitizeGameState(gameState)
      };

    } catch (error) {
      console.error('Action processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ゲーム終了処理（シンプル化）
   */
  async handleGameEnd(gameId, endConditionResult) {
    try {
      const gameState = this.activeGames.get(gameId);
      if (!gameState) {
        throw new Error('Game not found');
      }

      console.log('🏁 Game ending - calculating final scores');

      // 1. 最終スコア計算（Formula 4.4）
      const cardUsageStats = this.usageTrackingEngine.getGameUsageStats(gameId);
      const rankings = this.scoringEngine.calculateFinalRankings(gameState.players, cardUsageStats);

      // 2. オプション機能の処理
      if (this.enabledFeatures.achievements && this.achievementEngine) {
        for (const player of rankings) {
          this.achievementEngine.updatePlayerProgress(player.playerId, {
            gameEnded: true,
            finalRank: player.rank,
            finalScore: player.totalScore
          });
        }
      }

      // 3. ゲーム統計作成（コア機能）
      const gameStats = this.scoringEngine.calculateGameStats(gameState.players, cardUsageStats, {
        totalTurns: gameState.currentTurn || gameState.turn,
        gameDuration: Date.now() - new Date(gameState.startedAt || Date.now()).getTime(),
        endReason: endConditionResult.primaryReason?.type || endConditionResult.reason,
        variant: gameState.variant?.id || 'classic'
      });

      // 4. ゲームセッション終了
      this.cleanupGameSession(gameId);

      console.log('✅ Game ended successfully - focused on core scoring');

      return {
        rankings,
        gameStats,
        endReason: endConditionResult.primaryReason || endConditionResult,
        cardUsageStats,
        message: 'Game completed with original design focus!'
      };

    } catch (error) {
      console.error('Game end handling failed:', error);
      return {
        error: error.message
      };
    }
  }

  /**
   * プレイヤープロファイル読み込み
   */
  async loadPlayerProfiles(playerIds) {
    const profiles = [];
    
    for (const playerId of playerIds) {
      // 既存のバランスプロファイルがあるかチェック
      let profile = this.balanceEngine.playerProfiles.get(playerId);
      
      if (!profile) {
        // 新規プレイヤーの場合、ゲーム履歴から作成
        const gameHistory = await this.getPlayerGameHistory(playerId);
        profile = this.balanceEngine.evaluatePlayerSkill(playerId, gameHistory);
      }
      
      profiles.push(profile);
    }
    
    return profiles;
  }

  /**
   * プレイヤー調整適用
   */
  applyPlayerAdjustments(player, adjustments) {
    // 開始時ボーナス
    if (adjustments.extraStartingCoins) {
      player.coins += adjustments.extraStartingCoins;
    }
    
    if (adjustments.bonusActions) {
      player.actions += adjustments.bonusActions;
    }

    // カスタム調整
    if (adjustments.customAdjustments?.lossStreakBonus) {
      const bonus = adjustments.customAdjustments.lossStreakBonus;
      player.coins += bonus.extraCoins || 0;
      
      if (bonus.extraCards) {
        // 追加カードをデッキに
        for (let i = 0; i < bonus.extraCards; i++) {
          player.deck.push({ 
            id: `bonus_copper_${i}`, 
            name: '銅貨', 
            cost: 0, 
            type: 'treasure', 
            value: 1 
          });
        }
        player.deck = this.deckEngine.shuffleDeck(player.deck);
      }
    }
  }

  /**
   * アクション検証
   */
  validatePlayerAction(gameState, playerId, action) {
    // 基本検証
    if (gameState.players[gameState.currentPlayer].id !== playerId) {
      return { valid: false, error: 'Not your turn' };
    }

    // アクション固有の検証
    switch (action.type) {
      case 'playCard':
        const hasCard = gameState.players[gameState.currentPlayer].hand
          .some(card => card.id === action.cardId);
        if (!hasCard) {
          return { valid: false, error: 'Card not in hand' };
        }
        break;
        
      case 'buyCard':
        const supply = gameState.supply[action.cardId];
        if (!supply || supply.count <= 0) {
          return { valid: false, error: 'Card not available' };
        }
        
        const currentPlayer = gameState.players[gameState.currentPlayer];
        if (currentPlayer.coins < supply.card.cost) {
          return { valid: false, error: 'Insufficient coins' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * アクション実行（簡易実装）
   */
  async executeAction(gameState, playerId, action) {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    switch (action.type) {
      case 'playCard':
        // カードを手札から場に移動
        const cardIndex = currentPlayer.hand.findIndex(c => c.id === action.cardId);
        const card = currentPlayer.hand.splice(cardIndex, 1)[0];
        currentPlayer.play.push(card);
        
        // カード効果実行（簡易）
        if (card.type === 'treasure') {
          currentPlayer.coins += card.value || 0;
        }
        
        return { success: true, cardPlayed: card };
        
      case 'buyCard':
        const supply = gameState.supply[action.cardId];
        const buyResult = this.deckEngine.buyCard(gameState.supply, action.cardId);
        
        if (buyResult.success) {
          currentPlayer.coins -= supply.card.cost;
          currentPlayer.discard.push(buyResult.card);
          gameState.supply = buyResult.newSupply;
        }
        
        return buyResult;
        
      case 'endTurn':
        // クリーンアップフェーズ
        const cleanupResult = this.deckEngine.cleanupPhase(
          currentPlayer.hand,
          currentPlayer.play,
          currentPlayer.discard,
          currentPlayer.deck
        );
        
        currentPlayer.hand = cleanupResult.newHand;
        currentPlayer.deck = cleanupResult.newDeck;
        currentPlayer.discard = cleanupResult.newDiscard;
        currentPlayer.play = cleanupResult.newPlay;
        
        // リセット
        currentPlayer.coins = 0;
        currentPlayer.actions = 1;
        currentPlayer.buys = 1;
        
        // 次のプレイヤー
        gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
        if (gameState.currentPlayer === 0) {
          gameState.currentTurn++;
        }
        
        return { success: true, nextPlayer: gameState.currentPlayer };
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * API用メソッド群
   */
  
  // プレイヤー統計取得
  getPlayerStats(playerId) {
    return {
      achievements: this.achievementEngine.getPlayerStats(playerId),
      progression: this.progressionEngine.getPlayerProgressionStats(playerId),
      social: this.socialEngine.playerSocialProfiles.get(playerId),
      balance: this.balanceEngine.playerProfiles.get(playerId)
    };
  }

  // デイリーチャレンジ取得
  getDailyChallenges(playerId) {
    const progression = this.progressionEngine.playerProgression.get(playerId);
    return progression?.dailyChallenges || [];
  }

  // リーダーボード取得
  getLeaderboards() {
    this.socialEngine.updateLeaderboards();
    return this.socialEngine.leaderboards;
  }

  // アクティブイベント取得
  getActiveEvents() {
    return {
      seasonal: this.variantEngine.getActiveSeasonalEvents(),
      daily: this.variantEngine.getDailyRecommendedVariant()
    };
  }

  // ゲームバリアント一覧
  getAvailableVariants() {
    return Object.values(this.variantEngine.gameVariants);
  }

  /**
   * ユーティリティメソッド
   */
  
  sanitizeGameState(gameState) {
    // 機密情報を除外したゲーム状態を返す
    return {
      gameId: gameState.gameId,
      currentTurn: gameState.currentTurn,
      currentPlayer: gameState.currentPlayer,
      phase: gameState.phase,
      supply: gameState.supply,
      activeEvents: gameState.activeEvents,
      variant: gameState.variant
    };
  }

  sanitizeAdjustments(adjustments) {
    // 調整内容の概要のみ返す
    const sanitized = {
      playersAffected: adjustments.playerAdjustments.size,
      adjustmentTypes: []
    };
    
    adjustments.playerAdjustments.forEach(adj => {
      if (adj.extraStartingCoins) sanitized.adjustmentTypes.push('coin_bonus');
      if (adj.bonusActions) sanitized.adjustmentTypes.push('action_bonus');
      if (adj.customAdjustments) sanitized.adjustmentTypes.push('custom_support');
    });
    
    return sanitized;
  }

  cleanupGameSession(gameId) {
    const gameState = this.activeGames.get(gameId);
    if (gameState) {
      // プレイヤーセッション削除
      gameState.players.forEach(player => {
        this.playerSessions.delete(player.id);
      });
      
      // ゲーム状態削除
      this.activeGames.delete(gameId);
    }
  }

  // プレイヤーゲーム履歴取得（ダミー実装）
  async getPlayerGameHistory(playerId) {
    // 実際の実装では永続化ストレージから取得
    return [];
  }

  // ヘルパーメソッド群
  getPlayerCardsCreated(gameId, playerId) {
    return 0; // 実装必要
  }

  getPlayerUniqueCards(gameId, playerId) {
    const stats = this.usageTrackingEngine.getPlayerUsageStats(gameId, playerId);
    return Object.keys(stats.cardUsage || {}).length;
  }

  getPlayerOthersCards(gameId, playerId) {
    return 0; // 実装必要
  }

  wasComeback(player, gameState) {
    return false; // 実装必要
  }

  getPlayerCardTypeUsage(gameId, playerId) {
    return { action: 0, treasure: 0, victory: 0 }; // 実装必要
  }

  /**
   * エンジン統計取得
   */
  getEngineStats() {
    return {
      activeGames: this.activeGames.size,
      activePlayers: this.playerSessions.size,
      achievements: Object.keys(this.achievementEngine.achievements).length,
      variants: Object.keys(this.variantEngine.gameVariants).length,
      guilds: this.socialEngine.guilds.size,
      tournaments: this.socialEngine.tournaments.size,
      balance: this.balanceEngine.getBalanceStats(),
      social: this.socialEngine.getSocialStats(),
      progression: {
        totalPlayers: this.progressionEngine.playerProgression.size,
        activeSeasons: Object.keys(this.progressionEngine.seasonalEvents).length
      }
    };
  }
}

export default GameEngineManager;