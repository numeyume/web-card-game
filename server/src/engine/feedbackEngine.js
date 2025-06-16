/**
 * Feedback Engine - リアルタイムアクションフィードバックシステム
 * プレイヤーの行動に対する即座の反応とゲーム内ガイダンスを提供
 */

export class FeedbackEngine {
  constructor() {
    this.feedbackTypes = this.initializeFeedbackTypes();
    this.recentActions = new Map(); // playerId -> recent actions
    this.gameContext = new Map(); // gameId -> context data
  }

  /**
   * フィードバックタイプ定義
   */
  initializeFeedbackTypes() {
    return {
      // 成功系フィードバック
      EXCELLENT_MOVE: {
        type: 'success',
        category: 'strategic',
        messages: [
          '素晴らしい戦略的判断です！',
          'エクセレントな選択！',
          '完璧なタイミング！'
        ],
        effects: ['sparkle', 'golden_glow'],
        sound: 'success_chime',
        priority: 5
      },

      CREATIVE_COMBO: {
        type: 'success',
        category: 'creative',
        messages: [
          'クリエイティブなコンボ！',
          '独創的な戦術です！',
          '思いがけない組み合わせ！'
        ],
        effects: ['rainbow_burst', 'creative_sparkle'],
        sound: 'creative_chime',
        priority: 4
      },

      EFFICIENT_PLAY: {
        type: 'success',
        category: 'efficiency',
        messages: [
          '効率的なプレイ！',
          'リソースを最大活用！',
          'スマートな選択です！'
        ],
        effects: ['efficiency_glow'],
        sound: 'efficiency_beep',
        priority: 3
      },

      // 情報系フィードバック
      STRATEGIC_HINT: {
        type: 'info',
        category: 'guidance',
        messages: [
          'このタイミングで○○を考慮してみては？',
          '次のターンの準備を整えましょう',
          'エンドゲームを意識した動きも大切です'
        ],
        effects: ['gentle_pulse'],
        sound: 'info_tone',
        priority: 2
      },

      OPPORTUNITY_ALERT: {
        type: 'info',
        category: 'opportunity',
        messages: [
          '有利な取引の機会です！',
          'このカードは今がチャンス！',
          '他のプレイヤーより先手を！'
        ],
        effects: ['opportunity_highlight'],
        sound: 'opportunity_bell',
        priority: 3
      },

      // 警告系フィードバック
      RISKY_MOVE: {
        type: 'warning',
        category: 'risk',
        messages: [
          'リスクの高い選択です',
          '慎重に検討してください',
          '他の選択肢も考慮してみては？'
        ],
        effects: ['warning_pulse'],
        sound: 'warning_tone',
        priority: 4
      },

      MISSED_OPPORTUNITY: {
        type: 'warning',
        category: 'missed',
        messages: [
          'より良い選択肢がありました',
          'チャンスを逃しました',
          '次回はこの戦術を試してみては？'
        ],
        effects: ['fade_highlight'],
        sound: 'subtle_chime',
        priority: 2
      },

      // エンゲージメント系フィードバック
      COMEBACK_POTENTIAL: {
        type: 'motivation',
        category: 'comeback',
        messages: [
          'まだ逆転のチャンスはあります！',
          '諦めずに戦略を立て直しましょう',
          '最後まで何が起こるかわかりません'
        ],
        effects: ['motivation_glow'],
        sound: 'encouraging_tone',
        priority: 3
      },

      LEARNING_MOMENT: {
        type: 'educational',
        category: 'learning',
        messages: [
          'このプレイから学べることがあります',
          '新しい戦術を発見しました！',
          'この経験は次のゲームに活かせます'
        ],
        effects: ['learning_sparkle'],
        sound: 'discovery_chime',
        priority: 2
      }
    };
  }

  /**
   * プレイヤーアクションに対するフィードバック生成
   */
  generateActionFeedback(playerId, action, gameState) {
    const feedback = [];
    
    // アクション履歴を更新
    this.updateActionHistory(playerId, action);
    
    // 各種フィードバックをチェック
    feedback.push(...this.checkStrategicFeedback(playerId, action, gameState));
    feedback.push(...this.checkEfficiencyFeedback(playerId, action, gameState));
    feedback.push(...this.checkCreativityFeedback(playerId, action, gameState));
    feedback.push(...this.checkOpportunityFeedback(playerId, action, gameState));
    feedback.push(...this.checkRiskFeedback(playerId, action, gameState));
    feedback.push(...this.checkLearningFeedback(playerId, action, gameState));

    // 優先度順にソートして重複を除去
    const uniqueFeedback = this.deduplicateAndPrioritize(feedback);

    return {
      playerId,
      timestamp: new Date(),
      action: action.type,
      feedback: uniqueFeedback.slice(0, 2), // 最大2つまで同時表示
      contextualHints: this.generateContextualHints(playerId, gameState)
    };
  }

  /**
   * アクション履歴更新
   */
  updateActionHistory(playerId, action) {
    if (!this.recentActions.has(playerId)) {
      this.recentActions.set(playerId, []);
    }

    const history = this.recentActions.get(playerId);
    history.push({
      ...action,
      timestamp: new Date()
    });

    // 最新10アクションのみ保持
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * 戦略的フィードバックチェック
   */
  checkStrategicFeedback(playerId, action, gameState) {
    const feedback = [];
    const playerState = gameState.players.find(p => p.id === playerId);

    if (action.type === 'buyCard') {
      // 勝利点カードの適切なタイミング
      if (action.cardType === 'victory' && this.isLateGame(gameState)) {
        feedback.push(this.createFeedback('EXCELLENT_MOVE', '勝利点獲得の絶好のタイミング！'));
      }

      // エンジン構築の戦略
      if (action.cardType === 'action' && this.isEngineBuilding(playerState)) {
        feedback.push(this.createFeedback('EXCELLENT_MOVE', 'エンジンが完成に近づいています！'));
      }

      // 多様性戦略
      if (this.isDiversityStrategy(playerId, action)) {
        feedback.push(this.createFeedback('STRATEGIC_HINT', '多様性戦略で選択肢を広げています'));
      }
    }

    if (action.type === 'playCard') {
      // コンボプレイ
      if (this.isComboPlay(playerId, action)) {
        feedback.push(this.createFeedback('CREATIVE_COMBO', 'カードコンボが決まりました！'));
      }

      // タイミングの良いプレイ
      if (this.isWellTimedPlay(action, gameState)) {
        feedback.push(this.createFeedback('EXCELLENT_MOVE', 'タイミング抜群です！'));
      }
    }

    return feedback;
  }

  /**
   * 効率性フィードバックチェック
   */
  checkEfficiencyFeedback(playerId, action, gameState) {
    const feedback = [];

    // アクション効率
    if (action.type === 'playCard' && this.isEfficientActionUse(action)) {
      feedback.push(this.createFeedback('EFFICIENT_PLAY', 'アクションを最大限活用！'));
    }

    // 購入効率
    if (action.type === 'buyCard' && this.isEfficientPurchase(action)) {
      feedback.push(this.createFeedback('EFFICIENT_PLAY', 'コストパフォーマンス抜群！'));
    }

    // ターン効率
    if (this.isEfficientTurn(playerId)) {
      feedback.push(this.createFeedback('EFFICIENT_PLAY', '効率的なターン運営です！'));
    }

    return feedback;
  }

  /**
   * 創造性フィードバックチェック
   */
  checkCreativityFeedback(playerId, action, gameState) {
    const feedback = [];

    // 独創的なカード使用
    if (action.type === 'playCard' && this.isCreativeCardUse(playerId, action)) {
      feedback.push(this.createFeedback('CREATIVE_COMBO', '独創的なカード使用法！'));
    }

    // 予想外の戦略
    if (this.isUnexpectedStrategy(playerId, action)) {
      feedback.push(this.createFeedback('CREATIVE_COMBO', '予想外の戦略展開！'));
    }

    // 新規カード作成
    if (action.type === 'createCard') {
      feedback.push(this.createFeedback('CREATIVE_COMBO', '新しいカードを創造しました！'));
    }

    return feedback;
  }

  /**
   * 機会認識フィードバックチェック
   */
  checkOpportunityFeedback(playerId, action, gameState) {
    const feedback = [];

    // 希少カードの購入機会
    if (action.type === 'buyCard' && this.isRareCardOpportunity(action, gameState)) {
      feedback.push(this.createFeedback('OPPORTUNITY_ALERT', 'レアカードのチャンス！'));
    }

    // 他プレイヤーを出し抜く機会
    if (this.isCompetitiveAdvantage(playerId, action, gameState)) {
      feedback.push(this.createFeedback('OPPORTUNITY_ALERT', '競合を一歩リード！'));
    }

    return feedback;
  }

  /**
   * リスク評価フィードバックチェック
   */
  checkRiskFeedback(playerId, action, gameState) {
    const feedback = [];

    // 高リスク購入
    if (action.type === 'buyCard' && this.isHighRiskPurchase(action, gameState)) {
      feedback.push(this.createFeedback('RISKY_MOVE', 'リスクの高い投資です'));
    }

    // 機会損失
    if (this.isMissedOpportunity(playerId, action, gameState)) {
      feedback.push(this.createFeedback('MISSED_OPPORTUNITY', 'より良い選択肢がありました'));
    }

    return feedback;
  }

  /**
   * 学習機会フィードバックチェック
   */
  checkLearningFeedback(playerId, action, gameState) {
    const feedback = [];

    // 新しい戦術の発見
    if (this.isNewTacticDiscovered(playerId, action)) {
      feedback.push(this.createFeedback('LEARNING_MOMENT', '新しい戦術を習得しました！'));
    }

    // 逆転の可能性
    if (this.hasCombackPotential(playerId, gameState)) {
      feedback.push(this.createFeedback('COMEBACK_POTENTIAL', 'まだ逆転のチャンスがあります！'));
    }

    return feedback;
  }

  /**
   * フィードバック作成
   */
  createFeedback(type, customMessage = null) {
    const feedbackType = this.feedbackTypes[type];
    const message = customMessage || this.getRandomMessage(feedbackType.messages);

    return {
      type: feedbackType.type,
      category: feedbackType.category,
      message,
      effects: feedbackType.effects,
      sound: feedbackType.sound,
      priority: feedbackType.priority,
      timestamp: new Date()
    };
  }

  /**
   * ランダムメッセージ取得
   */
  getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * 重複除去と優先度設定
   */
  deduplicateAndPrioritize(feedback) {
    const seen = new Set();
    const unique = feedback.filter(f => {
      const key = `${f.type}-${f.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => b.priority - a.priority);
  }

  /**
   * コンテキストヒント生成
   */
  generateContextualHints(playerId, gameState) {
    const hints = [];
    const playerState = gameState.players.find(p => p.id === playerId);

    // ゲーム進行に基づくヒント
    if (this.isEarlyGame(gameState)) {
      hints.push('序盤はエンジン構築に集中しましょう');
    } else if (this.isLateGame(gameState)) {
      hints.push('終盤戦、勝利点の獲得を優先しましょう');
    }

    // プレイヤー状況に基づくヒント
    if (this.isLeading(playerId, gameState)) {
      hints.push('リードを維持しつつ、安定戦略で');
    } else if (this.isBehind(playerId, gameState)) {
      hints.push('積極的な戦略で逆転を狙いましょう');
    }

    // 利用可能なカードに基づくヒント
    const availableCards = this.getAvailableCards(playerState);
    if (availableCards.length > 0) {
      hints.push(`${availableCards[0]}の使用を検討してみては？`);
    }

    return hints.slice(0, 1); // 1つまで
  }

  // ゲーム状況判定メソッド群
  isLateGame(gameState) {
    return gameState.currentTurn > 30 || this.getEmptyPileCount(gameState) >= 2;
  }

  isEarlyGame(gameState) {
    return gameState.currentTurn < 10;
  }

  isEngineBuilding(playerState) {
    const actionCards = (playerState.deck || []).filter(card => card.type === 'action');
    return actionCards.length >= 3;
  }

  isDiversityStrategy(playerId, action) {
    const history = this.recentActions.get(playerId) || [];
    const recentCardTypes = new Set(history.map(h => h.cardType));
    return recentCardTypes.size >= 3;
  }

  isComboPlay(playerId, action) {
    const history = this.recentActions.get(playerId) || [];
    const recentActions = history.slice(-3);
    return recentActions.some(h => this.cardsHaveSynergy(h.card, action.card));
  }

  isWellTimedPlay(action, gameState) {
    // タイミングベースの判定ロジック
    return Math.random() > 0.7; // 簡易実装
  }

  isEfficientActionUse(action) {
    return action.effectsGenerated >= 2;
  }

  isEfficientPurchase(action) {
    return action.valuePerCoin >= 1.5;
  }

  isEfficientTurn(playerId) {
    const history = this.recentActions.get(playerId) || [];
    const turnActions = history.filter(h => Date.now() - h.timestamp.getTime() < 60000);
    return turnActions.length >= 3;
  }

  isCreativeCardUse(playerId, action) {
    return action.unusualCombination || Math.random() > 0.8;
  }

  isUnexpectedStrategy(playerId, action) {
    // プレイヤーの過去の行動パターンと比較
    return Math.random() > 0.75;
  }

  isRareCardOpportunity(action, gameState) {
    return action.cardRarity === 'rare' || action.limitedSupply;
  }

  isCompetitiveAdvantage(playerId, action, gameState) {
    // 他プレイヤーとの比較
    return Math.random() > 0.6;
  }

  isHighRiskPurchase(action, gameState) {
    return action.cost > 6 && action.uncertainty;
  }

  isMissedOpportunity(playerId, action, gameState) {
    // より良い選択肢があったかの判定
    return Math.random() > 0.8;
  }

  isNewTacticDiscovered(playerId, action) {
    return action.novelty || Math.random() > 0.9;
  }

  hasCombackPotential(playerId, gameState) {
    const playerState = gameState.players.find(p => p.id === playerId);
    const rank = this.getCurrentRank(playerId, gameState);
    return rank > 2 && gameState.currentTurn < 40;
  }

  isLeading(playerId, gameState) {
    return this.getCurrentRank(playerId, gameState) === 1;
  }

  isBehind(playerId, gameState) {
    return this.getCurrentRank(playerId, gameState) > 2;
  }

  getCurrentRank(playerId, gameState) {
    const scores = gameState.players.map(p => ({
      id: p.id,
      score: p.victoryPoints || 0
    })).sort((a, b) => b.score - a.score);

    return scores.findIndex(s => s.id === playerId) + 1;
  }

  getEmptyPileCount(gameState) {
    return Object.values(gameState.supply || {}).filter(pile => pile.count === 0).length;
  }

  getAvailableCards(playerState) {
    return (playerState.hand || []).map(card => card.name);
  }

  cardsHaveSynergy(card1, card2) {
    // カード間のシナジー判定
    return Math.random() > 0.7; // 簡易実装
  }

  /**
   * フィードバック統計取得
   */
  getFeedbackStats(playerId) {
    const history = this.recentActions.get(playerId) || [];
    
    return {
      totalActions: history.length,
      actionTypes: this.countActionTypes(history),
      averageEfficiency: this.calculateAverageEfficiency(history),
      creativityScore: this.calculateCreativityScore(playerId),
      strategicScore: this.calculateStrategicScore(playerId)
    };
  }

  countActionTypes(history) {
    const counts = {};
    history.forEach(action => {
      counts[action.type] = (counts[action.type] || 0) + 1;
    });
    return counts;
  }

  calculateAverageEfficiency(history) {
    const efficiencyScores = history.map(action => action.efficiency || 0);
    return efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length || 0;
  }

  calculateCreativityScore(playerId) {
    // 創造性スコアの計算
    return Math.random() * 100; // 簡易実装
  }

  calculateStrategicScore(playerId) {
    // 戦略性スコアの計算
    return Math.random() * 100; // 簡易実装
  }
}

export default FeedbackEngine;