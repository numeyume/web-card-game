/**
 * Enhanced Error Handler - 包括的エラーハンドリングとロバストネス
 * ゲーム体験を損なわない優雅なエラー処理
 */

export class GameErrorHandler {
  constructor() {
    this.errorCounts = new Map(); // playerId -> error count
    this.errorHistory = new Map(); // track recent errors
    this.recoveryStrategies = new Map(); // error type -> recovery function
    this.maxErrorsPerPlayer = 10;
    this.errorWindowMs = 5 * 60 * 1000; // 5分間のウィンドウ
    
    this.initializeRecoveryStrategies();
  }

  /**
   * リカバリ戦略の初期化
   */
  initializeRecoveryStrategies() {
    this.recoveryStrategies.set('INVALID_ACTION', this.recoverFromInvalidAction.bind(this));
    this.recoveryStrategies.set('NETWORK_ERROR', this.recoverFromNetworkError.bind(this));
    this.recoveryStrategies.set('STATE_SYNC_ERROR', this.recoverFromStateSyncError.bind(this));
    this.recoveryStrategies.set('CARD_NOT_FOUND', this.recoverFromCardNotFound.bind(this));
    this.recoveryStrategies.set('INSUFFICIENT_RESOURCES', this.recoverFromInsufficientResources.bind(this));
    this.recoveryStrategies.set('TIMEOUT_ERROR', this.recoverFromTimeout.bind(this));
    this.recoveryStrategies.set('VALIDATION_ERROR', this.recoverFromValidationError.bind(this));
  }

  /**
   * メインエラーハンドラー
   */
  async handleError(error, context = {}) {
    try {
      const enrichedError = this.enrichError(error, context);
      const errorType = this.classifyError(enrichedError);
      
      // エラー履歴に記録
      this.recordError(enrichedError, context);

      // 重複エラーのチェック
      if (this.isDuplicateError(enrichedError, context)) {
        return this.handleDuplicateError(enrichedError, context);
      }

      // レート制限チェック
      if (this.isErrorRateLimited(context.playerId)) {
        return this.handleRateLimitedError(enrichedError, context);
      }

      // リカバリ戦略の実行
      const recoveryResult = await this.executeRecovery(errorType, enrichedError, context);

      // ユーザー向けメッセージの生成
      const userMessage = this.generateUserMessage(errorType, enrichedError, recoveryResult);

      return {
        success: recoveryResult.success,
        error: {
          type: errorType,
          message: userMessage.message,
          severity: this.getErrorSeverity(errorType),
          recoverable: recoveryResult.recoverable,
          retryAfter: recoveryResult.retryAfter,
          suggestions: userMessage.suggestions
        },
        recovery: recoveryResult
      };

    } catch (handlerError) {
      console.error('Error in error handler:', handlerError);
      return this.getFallbackErrorResponse();
    }
  }

  /**
   * エラーの分類
   */
  classifyError(error) {
    // ネットワーク関連
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return 'NETWORK_ERROR';
    }

    // バリデーションエラー
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      return 'VALIDATION_ERROR';
    }

    // ゲーム状態エラー
    if (error.message?.includes('not found') || error.message?.includes('not exist')) {
      return 'CARD_NOT_FOUND';
    }

    if (error.message?.includes('insufficient') || error.message?.includes('not enough')) {
      return 'INSUFFICIENT_RESOURCES';
    }

    if (error.message?.includes('invalid action') || error.message?.includes('not allowed')) {
      return 'INVALID_ACTION';
    }

    if (error.message?.includes('sync') || error.message?.includes('state')) {
      return 'STATE_SYNC_ERROR';
    }

    if (error.message?.includes('timeout') || error.message?.includes('expired')) {
      return 'TIMEOUT_ERROR';
    }

    // デフォルト
    return 'UNKNOWN_ERROR';
  }

  /**
   * エラーの重要度評価
   */
  getErrorSeverity(errorType) {
    const criticalErrors = ['STATE_SYNC_ERROR', 'NETWORK_ERROR'];
    const moderateErrors = ['INVALID_ACTION', 'TIMEOUT_ERROR'];
    const minorErrors = ['CARD_NOT_FOUND', 'INSUFFICIENT_RESOURCES', 'VALIDATION_ERROR'];

    if (criticalErrors.includes(errorType)) return 'critical';
    if (moderateErrors.includes(errorType)) return 'moderate';
    if (minorErrors.includes(errorType)) return 'minor';
    return 'unknown';
  }

  /**
   * リカバリ戦略の実行
   */
  async executeRecovery(errorType, error, context) {
    const strategy = this.recoveryStrategies.get(errorType);
    
    if (strategy) {
      try {
        return await strategy(error, context);
      } catch (recoveryError) {
        console.error(`Recovery strategy failed for ${errorType}:`, recoveryError);
        return {
          success: false,
          recoverable: false,
          message: 'Recovery failed'
        };
      }
    }

    return {
      success: false,
      recoverable: false,
      message: 'No recovery strategy available'
    };
  }

  /**
   * 無効なアクションからのリカバリ
   */
  async recoverFromInvalidAction(error, context) {
    const { gameState, playerId, action } = context;

    // ゲーム状態を再同期
    if (gameState) {
      // 現在のプレイヤーターンを確認
      const currentPlayer = gameState.players?.[gameState.currentPlayer];
      if (currentPlayer?.id !== playerId) {
        return {
          success: true,
          recoverable: true,
          message: 'Turn order corrected',
          action: 'SYNC_TURN_ORDER'
        };
      }

      // フェーズの確認と修正
      if (action?.type === 'buyCard' && gameState.phase === 'action') {
        return {
          success: true,
          recoverable: true,
          message: 'Phase advanced to buy',
          action: 'ADVANCE_PHASE'
        };
      }
    }

    return {
      success: false,
      recoverable: true,
      retryAfter: 1000,
      message: 'Action not allowed at this time'
    };
  }

  /**
   * ネットワークエラーからのリカバリ
   */
  async recoverFromNetworkError(error, context) {
    return {
      success: false,
      recoverable: true,
      retryAfter: 3000,
      message: 'Network connection lost',
      action: 'RETRY_CONNECTION'
    };
  }

  /**
   * 状態同期エラーからのリカバリ
   */
  async recoverFromStateSyncError(error, context) {
    const { gameId, playerId } = context;

    return {
      success: true,
      recoverable: true,
      message: 'Game state synchronized',
      action: 'RESYNC_GAME_STATE',
      data: { gameId, playerId }
    };
  }

  /**
   * カード未発見エラーからのリカバリ
   */
  async recoverFromCardNotFound(error, context) {
    const { action } = context;

    // サプライの更新を提案
    return {
      success: true,
      recoverable: true,
      message: 'Card availability updated',
      action: 'REFRESH_SUPPLY',
      suggestion: 'Try selecting a different card'
    };
  }

  /**
   * リソース不足エラーからのリカバリ
   */
  async recoverFromInsufficientResources(error, context) {
    const { gameState, playerId } = context;
    const currentPlayer = gameState?.players?.find(p => p.id === playerId);

    if (!currentPlayer) {
      return { success: false, recoverable: false };
    }

    // 財宝カードの自動プレイを提案
    const treasureCards = currentPlayer.hand?.filter(card => card.type === 'treasure') || [];
    
    if (treasureCards.length > 0) {
      return {
        success: true,
        recoverable: true,
        message: 'Treasure cards available',
        action: 'SUGGEST_TREASURE_PLAY',
        data: { treasureCards: treasureCards.map(c => c.id) }
      };
    }

    return {
      success: false,
      recoverable: true,
      message: 'Insufficient resources for this action'
    };
  }

  /**
   * タイムアウトエラーからのリカバリ
   */
  async recoverFromTimeout(error, context) {
    return {
      success: false,
      recoverable: true,
      retryAfter: 2000,
      message: 'Request timed out',
      action: 'RETRY_ACTION'
    };
  }

  /**
   * バリデーションエラーからのリカバリ
   */
  async recoverFromValidationError(error, context) {
    const validationDetails = this.extractValidationDetails(error);

    return {
      success: false,
      recoverable: true,
      message: 'Input validation failed',
      details: validationDetails,
      action: 'CORRECT_INPUT'
    };
  }

  /**
   * ユーザー向けメッセージ生成
   */
  generateUserMessage(errorType, error, recoveryResult) {
    const messages = {
      INVALID_ACTION: {
        message: 'その操作は現在実行できません。',
        suggestions: ['現在のゲームフェーズを確認してください', '別のアクションを試してみてください']
      },
      NETWORK_ERROR: {
        message: 'ネットワーク接続に問題があります。',
        suggestions: ['しばらく待ってから再試行してください', 'インターネット接続を確認してください']
      },
      STATE_SYNC_ERROR: {
        message: 'ゲーム状態を同期しています...',
        suggestions: ['自動的に修正されます', 'しばらくお待ちください']
      },
      CARD_NOT_FOUND: {
        message: 'そのカードは現在利用できません。',
        suggestions: ['サプライを確認してください', '別のカードを選択してください']
      },
      INSUFFICIENT_RESOURCES: {
        message: 'リソースが不足しています。',
        suggestions: ['財宝カードをプレイしてコインを獲得してください', 'アクション数を確認してください']
      },
      TIMEOUT_ERROR: {
        message: '操作がタイムアウトしました。',
        suggestions: ['再度お試しください', 'ネットワーク状況を確認してください']
      },
      VALIDATION_ERROR: {
        message: '入力内容に問題があります。',
        suggestions: ['入力内容を確認してください', '有効な値を入力してください']
      }
    };

    const defaultMessage = {
      message: '予期しないエラーが発生しました。',
      suggestions: ['ページを再読み込みしてください', 'しばらく待ってから再試行してください']
    };

    return messages[errorType] || defaultMessage;
  }

  /**
   * ユーティリティメソッド群
   */
  
  recordError(error, context) {
    const playerId = context.playerId;
    const timestamp = Date.now();

    if (playerId) {
      if (!this.errorCounts.has(playerId)) {
        this.errorCounts.set(playerId, []);
      }
      
      const playerErrors = this.errorCounts.get(playerId);
      playerErrors.push(timestamp);
      
      const cutoff = timestamp - this.errorWindowMs;
      const recentErrors = playerErrors.filter(t => t > cutoff);
      this.errorCounts.set(playerId, recentErrors);
    }

    if (!this.errorHistory.has('global')) {
      this.errorHistory.set('global', []);
    }
    
    const globalHistory = this.errorHistory.get('global');
    globalHistory.push({
      timestamp,
      type: this.classifyError(error),
      playerId,
      message: error.message,
      context: { ...context, error: undefined }
    });

    if (globalHistory.length > 1000) {
      globalHistory.splice(0, 100);
    }
  }

  isErrorRateLimited(playerId) {
    if (!playerId) return false;
    const playerErrors = this.errorCounts.get(playerId) || [];
    return playerErrors.length >= this.maxErrorsPerPlayer;
  }

  isDuplicateError(error, context) {
    const playerId = context.playerId;
    if (!playerId) return false;

    const recentErrors = this.errorHistory.get('global') || [];
    const cutoff = Date.now() - 30000;

    return recentErrors.some(record => 
      record.timestamp > cutoff &&
      record.playerId === playerId &&
      record.type === this.classifyError(error) &&
      record.message === error.message
    );
  }

  handleDuplicateError(error, context) {
    return {
      success: false,
      error: {
        type: 'DUPLICATE_ERROR',
        message: '同じエラーが繰り返し発生しています。',
        severity: 'minor',
        recoverable: true,
        suggestions: ['少し時間を置いてから再試行してください']
      }
    };
  }

  handleRateLimitedError(error, context) {
    return {
      success: false,
      error: {
        type: 'RATE_LIMITED',
        message: 'エラーが頻発しています。しばらくお待ちください。',
        severity: 'moderate',
        recoverable: true,
        retryAfter: 60000,
        suggestions: ['ネットワーク接続を確認してください', 'ページを再読み込みしてください']
      }
    };
  }

  getFallbackErrorResponse() {
    return {
      success: false,
      error: {
        type: 'SYSTEM_ERROR',
        message: 'システムエラーが発生しました。',
        severity: 'critical',
        recoverable: true,
        suggestions: ['ページを再読み込みしてください', 'サポートにお問い合わせください']
      }
    };
  }

  enrichError(error, context) {
    return {
      ...error,
      timestamp: new Date(),
      context: {
        gameId: context.gameId,
        playerId: context.playerId,
        action: context.action?.type,
        userAgent: context.userAgent,
        url: context.url
      }
    };
  }

  extractValidationDetails(error) {
    if (error.details) return error.details;
    if (error.message?.includes('required')) {
      return { field: 'unknown', message: '必須フィールドが不足しています' };
    }
    if (error.message?.includes('invalid')) {
      return { field: 'unknown', message: '無効な値が入力されました' };
    }
    return { field: 'unknown', message: 'バリデーションに失敗しました' };
  }
}

export default GameErrorHandler;