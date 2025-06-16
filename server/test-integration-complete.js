/**
 * 包括的統合テスト - 全新エンジンの動作確認
 * ゲーム全体の機能統合とエラーハンドリングをテスト
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// 新エンジンのインポート
import { AchievementEngine } from './src/engine/achievementEngine.js';
import { FeedbackEngine } from './src/engine/feedbackEngine.js';
import { BalanceEngine } from './src/engine/balanceEngine.js';
import { ProgressionEngine } from './src/engine/progressionEngine.js';
import { SocialEngine } from './src/engine/socialEngine.js';
import { VariantEngine } from './src/engine/variantEngine.js';

// 既存エンジンのインポート
import { ScoringEngine } from './src/engine/scoringEngine.js';
import { EndConditionEngine } from './src/engine/endConditionEngine.js';
import { DeckEngine } from './src/engine/deckEngine.js';
import { UsageTrackingEngine } from './src/engine/usageTrackingEngine.js';

class IntegrationTestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
    
    // エンジンインスタンス初期化
    this.achievementEngine = new AchievementEngine();
    this.feedbackEngine = new FeedbackEngine();
    this.balanceEngine = new BalanceEngine();
    this.progressionEngine = new ProgressionEngine();
    this.socialEngine = new SocialEngine();
    this.variantEngine = new VariantEngine();
    
    // 既存エンジン
    this.scoringEngine = new ScoringEngine();
    this.endConditionEngine = new EndConditionEngine();
    this.deckEngine = new DeckEngine();
    this.usageTrackingEngine = new UsageTrackingEngine();
  }

  /**
   * 全テスト実行
   */
  async runAllTests() {
    console.log('🚀 統合テスト開始\n');

    await this.testAchievementEngine();
    await this.testFeedbackEngine();
    await this.testBalanceEngine();
    await this.testProgressionEngine();
    await this.testSocialEngine();
    await this.testVariantEngine();
    await this.testEngineIntegration();
    await this.testGameFlow();
    await this.testErrorHandling();
    await this.testPerformance();

    this.printResults();
    return this.results;
  }

  /**
   * アチーブメントエンジンテスト
   */
  async testAchievementEngine() {
    console.log('🏆 AchievementEngine テスト');
    
    await this.test('アチーブメント初期化', () => {
      const achievements = this.achievementEngine.achievements;
      return Object.keys(achievements).length >= 15;
    });

    await this.test('プレイヤー進捗更新', () => {
      const gameData = {
        gameId: 'test_game_1',
        won: true,
        finalScore: 75,
        rank: 1,
        cardsCreated: 2,
        uniqueCardsUsed: 8,
        gameDuration: 25 * 60 * 1000
      };
      
      const result = this.achievementEngine.updatePlayerProgress('player1', gameData);
      return result.newAchievements.length >= 0 && result.currentLevel >= 1;
    });

    await this.test('アチーブメント達成判定', () => {
      // 複数ゲームで実績解除をテスト
      for (let i = 0; i < 3; i++) {
        this.achievementEngine.updatePlayerProgress('player2', {
          gameId: `test_${i}`,
          won: i % 2 === 0,
          cardsCreated: 1,
          finalScore: 50 + i * 10
        });
      }
      
      const stats = this.achievementEngine.getPlayerStats('player2');
      return stats.totalAchievements >= 1;
    });

    await this.test('推奨アチーブメント取得', () => {
      const recommendations = this.achievementEngine.getRecommendedAchievements('player1');
      return Array.isArray(recommendations) && recommendations.length <= 3;
    });
  }

  /**
   * フィードバックエンジンテスト
   */
  async testFeedbackEngine() {
    console.log('💬 FeedbackEngine テスト');

    await this.test('フィードバックタイプ初期化', () => {
      const types = this.feedbackEngine.feedbackTypes;
      return Object.keys(types).length >= 8;
    });

    await this.test('アクションフィードバック生成', () => {
      const gameState = {
        players: [
          { id: 'player1', victoryPoints: 45 },
          { id: 'player2', victoryPoints: 50 }
        ],
        currentTurn: 15,
        supply: { copper: { count: 46 }, estate: { count: 8 } }
      };

      const action = {
        type: 'buyCard',
        cardType: 'victory',
        cost: 3,
        card: { name: 'Estate' }
      };

      const feedback = this.feedbackEngine.generateActionFeedback('player1', action, gameState);
      return feedback.playerId === 'player1' && Array.isArray(feedback.feedback);
    });

    await this.test('フィードバック統計取得', () => {
      const stats = this.feedbackEngine.getFeedbackStats('player1');
      return typeof stats.totalActions === 'number';
    });
  }

  /**
   * バランスエンジンテスト
   */
  async testBalanceEngine() {
    console.log('⚖️ BalanceEngine テスト');

    await this.test('難易度レベル初期化', () => {
      const levels = this.balanceEngine.difficultyLevels;
      return Object.keys(levels).length === 5;
    });

    await this.test('プレイヤースキル評価', () => {
      const gameHistory = Array.from({ length: 10 }, (_, i) => ({
        gameId: `game_${i}`,
        won: i % 3 === 0,
        finalScore: 30 + Math.random() * 40,
        rank: Math.floor(Math.random() * 4) + 1,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      }));

      const profile = this.balanceEngine.evaluatePlayerSkill('player1', gameHistory);
      return profile.gamesPlayed === 10 && profile.difficultyLevel;
    });

    await this.test('ゲーム調整適用', () => {
      const playerProfiles = [
        { playerId: 'player1', difficultyLevel: 'BEGINNER' },
        { playerId: 'player2', difficultyLevel: 'INTERMEDIATE' }
      ];

      const adjustments = this.balanceEngine.applyGameAdjustments('test_game', playerProfiles);
      return adjustments.playerAdjustments.size === 2;
    });

    await this.test('バランス統計取得', () => {
      const stats = this.balanceEngine.getBalanceStats();
      return typeof stats.totalPlayersTracked === 'number';
    });
  }

  /**
   * プログレッションエンジンテスト
   */
  async testProgressionEngine() {
    console.log('📈 ProgressionEngine テスト');

    await this.test('デイリーチャレンジ初期化', () => {
      const challenges = this.progressionEngine.dailyChallenges;
      return challenges.length >= 5;
    });

    await this.test('プレイヤー進捗初期化', () => {
      const progression = this.progressionEngine.initializePlayerProgression('player1');
      return progression.level === 1 && progression.coins === 1000;
    });

    await this.test('進捗更新とレベルアップ', () => {
      const gameData = {
        gameId: 'test_game',
        won: true,
        finalScore: 80,
        rank: 1,
        cardsCreated: 2,
        uniqueCardsUsed: 10
      };

      const result = this.progressionEngine.updatePlayerProgression('player1', gameData);
      return result.updates.experienceGained > 0;
    });

    await this.test('カードパック開封', () => {
      // プレイヤーにパックを付与
      const progression = this.progressionEngine.playerProgression.get('player1');
      progression.inventory.cardPacks.common = 3;

      const result = this.progressionEngine.openCardPack('player1', 'common');
      return result.success && result.cards.length >= 3;
    });

    await this.test('進捗統計取得', () => {
      const stats = this.progressionEngine.getPlayerProgressionStats('player1');
      return stats.level >= 1 && typeof stats.experienceToNextLevel === 'number';
    });
  }

  /**
   * ソーシャルエンジンテスト
   */
  async testSocialEngine() {
    console.log('🤝 SocialEngine テスト');

    await this.test('ギルド作成', () => {
      const guild = this.socialEngine.createGuild('player1', {
        name: 'Test Guild',
        description: 'A test guild',
        tag: 'TEST'
      });
      return guild.name === 'Test Guild' && guild.members.size === 1;
    });

    await this.test('ギルド参加', () => {
      const guilds = Array.from(this.socialEngine.guilds.values());
      const testGuild = guilds[0];
      
      const result = this.socialEngine.joinGuild('player2', testGuild.id);
      return result.success === true;
    });

    await this.test('フレンドリクエスト', () => {
      const result = this.socialEngine.sendFriendRequest('player1', 'player3', 'Let\'s be friends!');
      return result.success === true;
    });

    await this.test('フレンドリクエスト承認', () => {
      const result = this.socialEngine.respondToFriendRequest('player3', 'player1', 'accept');
      return result.success === true;
    });

    await this.test('チャットメッセージ送信', () => {
      const channelId = 'test_channel';
      this.socialEngine.createChatChannel(channelId, 'Test Channel');
      
      const result = this.socialEngine.sendChatMessage(channelId, 'player1', 'Hello, world!');
      return result.success === true;
    });
  }

  /**
   * バリアントエンジンテスト
   */
  async testVariantEngine() {
    console.log('🎮 VariantEngine テスト');

    await this.test('ゲームバリアント初期化', () => {
      const variants = this.variantEngine.gameVariants;
      return Object.keys(variants).length >= 6;
    });

    await this.test('バリアント選択', () => {
      const result = this.variantEngine.selectGameVariant('test_game', 'blitz');
      return result.variant.id === 'blitz';
    });

    await this.test('ランダムイベント判定', () => {
      const gameState = {
        currentTurn: 15,
        players: [
          { id: 'player1', victoryPoints: 40 },
          { id: 'player2', victoryPoints: 35 }
        ],
        variant: this.variantEngine.gameVariants.chaos
      };

      const result = this.variantEngine.checkRandomEvents('test_game', gameState);
      return Array.isArray(result.activeEvents);
    });

    await this.test('デイリー推奨バリアント', () => {
      const recommendation = this.variantEngine.getDailyRecommendedVariant();
      return recommendation.variant && recommendation.reason;
    });

    await this.test('カスタムバリアント作成', () => {
      const customVariant = this.variantEngine.createCustomVariant('player1', {
        name: 'My Custom Mode',
        description: 'A custom game mode',
        settings: { handSize: 7, actionCount: 2 }
      });
      return customVariant.name === 'My Custom Mode';
    });
  }

  /**
   * エンジン統合テスト
   */
  async testEngineIntegration() {
    console.log('🔗 エンジン統合テスト');

    await this.test('ゲーム開始時統合', () => {
      const gameId = 'integration_test';
      const players = ['player1', 'player2', 'player3'];
      
      // 各エンジンでゲーム開始処理
      const variant = this.variantEngine.selectGameVariant(gameId, 'creative');
      const deck = this.deckEngine.createDeck();
      const playerProfiles = players.map(id => ({
        playerId: id,
        difficultyLevel: 'INTERMEDIATE'
      }));
      
      const adjustments = this.balanceEngine.applyGameAdjustments(gameId, playerProfiles);
      
      return variant.variant && deck.length > 0 && adjustments.playerAdjustments.size > 0;
    });

    await this.test('ゲーム終了時統合', () => {
      const gameData = {
        gameId: 'integration_test',
        players: [
          { id: 'player1', name: 'Player 1', victoryPoints: 65 },
          { id: 'player2', name: 'Player 2', victoryPoints: 45 },
          { id: 'player3', name: 'Player 3', victoryPoints: 55 }
        ],
        cardUsageStats: {
          card1: { totalUsage: 15, createdBy: 'player1', playerUsage: { player1: 5, player2: 5, player3: 5 } },
          card2: { totalUsage: 8, createdBy: 'player2', playerUsage: { player2: 3, player3: 5 } }
        },
        gameStats: {
          totalTurns: 30,
          gameDuration: 25 * 60 * 1000
        }
      };

      // スコア計算
      const rankings = this.scoringEngine.calculateFinalRankings(gameData.players, gameData.cardUsageStats);
      
      // 各プレイヤーの進捗更新
      const progressResults = gameData.players.map(player => {
        const individualGameData = {
          ...gameData,
          won: rankings[0].playerId === player.id,
          finalScore: player.victoryPoints,
          rank: rankings.findIndex(r => r.playerId === player.id) + 1
        };
        
        return this.progressionEngine.updatePlayerProgression(player.id, individualGameData);
      });

      return rankings.length === 3 && progressResults.every(r => r.updates.experienceGained > 0);
    });
  }

  /**
   * ゲームフローテスト
   */
  async testGameFlow() {
    console.log('🎯 ゲームフローテスト');

    await this.test('完全ゲームシミュレーション', async () => {
      const gameId = 'flow_test';
      const players = ['player1', 'player2'];
      
      // 1. ゲーム開始
      const variant = this.variantEngine.selectGameVariant(gameId, 'classic');
      const gameState = {
        gameId,
        players: players.map(id => ({ 
          id, 
          name: `Player ${id}`,
          victoryPoints: 0,
          deck: this.deckEngine.createStarterDeck()
        })),
        currentTurn: 1,
        startedAt: new Date(),
        variant: variant.variant
      };

      // 2. ゲーム進行シミュレーション
      for (let turn = 1; turn <= 20; turn++) {
        gameState.currentTurn = turn;
        
        // プレイヤーアクション
        for (const player of gameState.players) {
          const action = {
            type: 'buyCard',
            cardType: turn % 3 === 0 ? 'victory' : 'action',
            cost: Math.floor(Math.random() * 5) + 1
          };
          
          // フィードバック生成
          const feedback = this.feedbackEngine.generateActionFeedback(player.id, action, gameState);
          
          // 使用統計更新
          this.usageTrackingEngine.recordCardUsage(gameId, player.id, 'test_card', 'play');
        }
        
        // ランダムイベントチェック
        const events = this.variantEngine.checkRandomEvents(gameId, gameState);
        
        // 終了条件チェック
        const endCheck = this.endConditionEngine.checkEndConditions(gameState);
        if (endCheck.isGameEnd) break;
      }

      // 3. ゲーム終了処理
      gameState.players.forEach((player, index) => {
        player.victoryPoints = 30 + Math.random() * 40;
      });

      const cardUsageStats = this.usageTrackingEngine.getGameUsageStats(gameId);
      const rankings = this.scoringEngine.calculateFinalRankings(gameState.players, cardUsageStats);

      return rankings.length === 2 && rankings[0].totalScore > 0;
    });
  }

  /**
   * エラーハンドリングテスト
   */
  async testErrorHandling() {
    console.log('🚨 エラーハンドリングテスト');

    await this.test('無効なプレイヤーIDハンドリング', () => {
      try {
        const result = this.achievementEngine.getPlayerStats(null);
        return result === null;
      } catch (error) {
        return false;
      }
    });

    await this.test('無効なゲームIDハンドリング', () => {
      try {
        const result = this.variantEngine.selectGameVariant('', 'invalid_variant');
        return result.error !== undefined;
      } catch (error) {
        return false;
      }
    });

    await this.test('ギルド満員時の参加エラー', () => {
      // ギルドを満員にする
      const guild = this.socialEngine.createGuild('host', { name: 'Full Guild' });
      guild.memberLimit = 1; // 制限を1に設定（既にホストが参加済み）
      
      const result = this.socialEngine.joinGuild('new_player', guild.id);
      return result.error === 'Guild is full';
    });

    await this.test('不正なカードパック開封', () => {
      const result = this.progressionEngine.openCardPack('nonexistent_player', 'epic');
      return result === null;
    });
  }

  /**
   * パフォーマンステスト
   */
  async testPerformance() {
    console.log('⚡ パフォーマンステスト');

    await this.test('大量プレイヤー処理', () => {
      const start = Date.now();
      
      // 100人のプレイヤーでテスト
      for (let i = 0; i < 100; i++) {
        this.achievementEngine.updatePlayerProgress(`player_${i}`, {
          gameId: `perf_test_${i}`,
          won: i % 4 === 0,
          finalScore: 40 + Math.random() * 30
        });
      }
      
      const duration = Date.now() - start;
      return duration < 1000; // 1秒以内で完了
    });

    await this.test('バランス調整計算速度', () => {
      const start = Date.now();
      
      const playerProfiles = Array.from({ length: 50 }, (_, i) => ({
        playerId: `perf_player_${i}`,
        difficultyLevel: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'][i % 3]
      }));
      
      this.balanceEngine.applyGameAdjustments('perf_test', playerProfiles);
      
      const duration = Date.now() - start;
      return duration < 500; // 500ms以内で完了
    });
  }

  /**
   * 個別テスト実行
   */
  async test(name, testFunction) {
    this.results.total++;
    
    try {
      const result = await testFunction();
      if (result) {
        this.results.passed++;
        console.log(`  ✅ ${name}`);
      } else {
        this.results.failed++;
        console.log(`  ❌ ${name} - Failed`);
        this.results.errors.push(`${name}: Test returned false`);
      }
    } catch (error) {
      this.results.failed++;
      console.log(`  ❌ ${name} - Error: ${error.message}`);
      this.results.errors.push(`${name}: ${error.message}`);
    }
  }

  /**
   * 結果出力
   */
  printResults() {
    console.log('\n📊 テスト結果サマリー');
    console.log('='.repeat(50));
    console.log(`総テスト数: ${this.results.total}`);
    console.log(`成功: ${this.results.passed}`);
    console.log(`失敗: ${this.results.failed}`);
    console.log(`成功率: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ エラー詳細:');
      this.results.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.results.failed === 0) {
      console.log('\n🎉 全テスト成功！ゲームは正常に動作します。');
    } else {
      console.log('\n⚠️  一部テストが失敗しました。修正が必要です。');
    }
  }
}

// テスト実行
const testSuite = new IntegrationTestSuite();
testSuite.runAllTests().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
});