// ゲーム終了条件エンジン - 3山切れ、ターン制限、タイムアウト検知
const deckEngine = require('./deck.cjs');

/**
 * 終了条件タイプ
 */
const END_CONDITIONS = {
  EMPTY_PILES: 'empty_piles',    // 3山以上空き
  MAX_TURNS: 'max_turns',        // 最大ターン数
  TIME_LIMIT: 'time_limit',      // 制限時間
  MANUAL: 'manual'               // 手動終了
};

/**
 * ゲーム終了条件エンジン
 */
class EndConditionEngine {
  constructor() {
    this.gameStates = new Map(); // roomId -> GameState
    this.endConditionSettings = {
      maxTurns: 50,           // 最大50ターン
      timeLimit: 60 * 60,     // 60分（秒）
      emptyPilesThreshold: 3, // 3山空いたら終了
      enableTimeLimit: true,
      enableTurnLimit: true,
      enableEmptyPiles: true
    };
  }

  /**
   * ゲーム状態を初期化
   * @param {string} roomId - ルームID
   * @param {Array<string>} playerIds - プレイヤーID一覧
   * @param {Object} settings - ゲーム設定
   */
  initializeGame(roomId, playerIds, settings = {}) {
    const gameState = {
      roomId,
      playerIds,
      currentTurn: 0,
      currentPlayer: 0,
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
      endCondition: null,
      settings: {
        ...this.endConditionSettings,
        ...settings
      }
    };

    this.gameStates.set(roomId, gameState);
    console.log(`🎮 Game initialized for room ${roomId} with ${playerIds.length} players`);
    
    return gameState;
  }

  /**
   * ターン進行
   * @param {string} roomId - ルームID
   * @returns {Object} ターン情報
   */
  advanceTurn(roomId) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState || !gameState.isActive) {
      return null;
    }

    // ターン数を増やす
    gameState.currentTurn++;
    
    // 次のプレイヤーに移行
    gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.playerIds.length;
    
    // 最終活動時間更新
    gameState.lastActivity = new Date();

    console.log(`🔄 Turn ${gameState.currentTurn}, Player ${gameState.currentPlayer} (${gameState.playerIds[gameState.currentPlayer]})`);

    return {
      turn: gameState.currentTurn,
      currentPlayer: gameState.currentPlayer,
      playerId: gameState.playerIds[gameState.currentPlayer]
    };
  }

  /**
   * 全ての終了条件をチェック
   * @param {string} roomId - ルームID
   * @returns {Object} 終了条件チェック結果
   */
  checkEndConditions(roomId) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState || !gameState.isActive) {
      return { isGameEnd: false, reason: null };
    }

    // 各終了条件をチェック
    const emptyPilesCheck = this.checkEmptyPiles(roomId);
    const maxTurnsCheck = this.checkMaxTurns(roomId);
    const timeLimitCheck = this.checkTimeLimit(roomId);

    // 優先順位で判定
    if (emptyPilesCheck.isGameEnd) {
      return emptyPilesCheck;
    }
    
    if (maxTurnsCheck.isGameEnd) {
      return maxTurnsCheck;
    }
    
    if (timeLimitCheck.isGameEnd) {
      return timeLimitCheck;
    }

    // ゲーム続行
    return {
      isGameEnd: false,
      reason: null,
      message: 'ゲーム続行中',
      status: {
        remainingTurns: gameState.settings.maxTurns - gameState.currentTurn,
        remainingTime: this.getRemainingTime(roomId),
        emptyPiles: this.getEmptyPiles(roomId)
      }
    };
  }

  /**
   * 3山切れ条件チェック
   * @param {string} roomId - ルームID
   * @returns {Object} チェック結果
   */
  checkEmptyPiles(roomId) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState?.settings.enableEmptyPiles) {
      return { isGameEnd: false, reason: null };
    }

    try {
      const supplyState = deckEngine.getSupplyState(roomId);
      if (!supplyState) {
        return { isGameEnd: false, reason: null };
      }

      // 空きサプライ山をカウント
      const emptyPiles = supplyState.filter(card => {
        // 基本カード（無限供給）は除外
        const isBasicCard = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province'].includes(card.name);
        return !isBasicCard && (!card.available || card.count === 0);
      });

      const emptyCount = emptyPiles.length;
      const threshold = gameState.settings.emptyPilesThreshold;

      if (emptyCount >= threshold) {
        return {
          isGameEnd: true,
          reason: END_CONDITIONS.EMPTY_PILES,
          message: `${threshold}山以上が空になりました`,
          emptyPiles: emptyPiles.map(p => p.name),
          emptyCount: emptyCount
        };
      }

      return {
        isGameEnd: false,
        reason: null,
        emptyPiles: emptyPiles.map(p => p.name),
        emptyCount: emptyCount
      };

    } catch (error) {
      console.error('Empty piles check error:', error);
      return { isGameEnd: false, reason: null };
    }
  }

  /**
   * 最大ターン数チェック
   * @param {string} roomId - ルームID
   * @returns {Object} チェック結果
   */
  checkMaxTurns(roomId) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState?.settings.enableTurnLimit) {
      return { isGameEnd: false, reason: null };
    }

    const maxTurns = gameState.settings.maxTurns;
    const currentTurn = gameState.currentTurn;

    if (currentTurn >= maxTurns) {
      return {
        isGameEnd: true,
        reason: END_CONDITIONS.MAX_TURNS,
        message: `最大ターン数 ${maxTurns} に到達しました`,
        finalTurn: currentTurn
      };
    }

    return {
      isGameEnd: false,
      reason: null,
      remainingTurns: maxTurns - currentTurn
    };
  }

  /**
   * 制限時間チェック
   * @param {string} roomId - ルームID
   * @returns {Object} チェック結果
   */
  checkTimeLimit(roomId) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState?.settings.enableTimeLimit) {
      return { isGameEnd: false, reason: null };
    }

    const timeLimit = gameState.settings.timeLimit * 1000; // ミリ秒変換
    const elapsed = Date.now() - gameState.startTime.getTime();

    if (elapsed >= timeLimit) {
      return {
        isGameEnd: true,
        reason: END_CONDITIONS.TIME_LIMIT,
        message: `制限時間 ${Math.floor(gameState.settings.timeLimit / 60)} 分に到達しました`,
        elapsedTime: Math.floor(elapsed / 1000)
      };
    }

    return {
      isGameEnd: false,
      reason: null,
      remainingTime: Math.floor((timeLimit - elapsed) / 1000)
    };
  }

  /**
   * ゲーム終了処理
   * @param {string} roomId - ルームID
   * @param {string} reason - 終了理由
   * @param {Object} additionalData - 追加データ
   * @returns {Object} 終了処理結果
   */
  triggerGameEnd(roomId, reason = END_CONDITIONS.MANUAL, additionalData = {}) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState) {
      throw new Error(`Game state not found for room: ${roomId}`);
    }

    // ゲーム状態を終了に変更
    gameState.isActive = false;
    gameState.endTime = new Date();
    gameState.endCondition = {
      reason,
      ...additionalData
    };

    // 最終スコア計算
    const finalScores = this.calculateFinalScores(roomId);

    console.log(`🏁 Game ended in room ${roomId}: ${reason}`);
    console.log(`📊 Final rankings:`, finalScores.rankings.map(r => `${r.rank}. ${r.playerName} (${r.totalScore})`));

    return {
      roomId,
      endReason: reason,
      endTime: gameState.endTime,
      gameDuration: Math.floor((gameState.endTime - gameState.startTime) / 1000),
      totalTurns: gameState.currentTurn,
      finalScores,
      ...additionalData
    };
  }

  /**
   * 最終スコア計算（Formula 4.4）
   * @param {string} roomId - ルームID
   * @returns {Object} 最終スコア結果
   */
  calculateFinalScores(roomId) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState) {
      throw new Error(`Game state not found for room: ${roomId}`);
    }

    const rankings = [];

    gameState.playerIds.forEach(playerId => {
      // 勝利点を取得
      const victoryPoints = deckEngine.countVictoryPoints(roomId, playerId) || 0;
      
      // ゲームスコア = 勝利点 × 1.0
      const gameScore = victoryPoints * 1.0;

      // 創造者スコア（簡易版 - 実際の使用統計は別途実装）
      const creatorScore = this.calculateCreatorScore(playerId, roomId);

      // 総合スコア
      const totalScore = gameScore + creatorScore;

      rankings.push({
        playerId,
        playerName: `Player_${playerId.slice(-8)}`, // 簡易表示名
        gameScore,
        creatorScore,
        totalScore,
        victoryPoints,
        rank: 0 // 後で計算
      });
    });

    // ランキング計算（総合スコア順）
    rankings.sort((a, b) => b.totalScore - a.totalScore);
    rankings.forEach((player, index) => {
      player.rank = index + 1;
    });

    // ゲーム統計
    const gameStats = {
      totalTurns: gameState.currentTurn,
      gameDuration: gameState.endTime ? 
        Math.floor((gameState.endTime - gameState.startTime) / 1000) : 0,
      endReason: gameState.endCondition?.reason || 'unknown',
      averageScore: rankings.reduce((sum, p) => sum + p.totalScore, 0) / rankings.length
    };

    return {
      rankings,
      gameStats
    };
  }

  /**
   * 創造者スコア計算（簡易版）
   * @param {string} playerId - プレイヤーID
   * @param {string} roomId - ルームID
   * @returns {number} 創造者スコア
   */
  calculateCreatorScore(playerId, roomId) {
    // TODO: 実際のカード使用統計から計算
    // 現在は仮の値を返す
    return Math.floor(Math.random() * 50); // 0-49のランダム値
  }

  /**
   * 残り時間を取得
   * @param {string} roomId - ルームID
   * @returns {number} 残り時間（秒）
   */
  getRemainingTime(roomId) {
    const gameState = this.gameStates.get(roomId);
    if (!gameState?.settings.enableTimeLimit) {
      return null;
    }

    const timeLimit = gameState.settings.timeLimit * 1000;
    const elapsed = Date.now() - gameState.startTime.getTime();
    return Math.max(0, Math.floor((timeLimit - elapsed) / 1000));
  }

  /**
   * 空きサプライ山一覧を取得
   * @param {string} roomId - ルームID
   * @returns {Array} 空きサプライ山
   */
  getEmptyPiles(roomId) {
    try {
      const supplyState = deckEngine.getSupplyState(roomId);
      if (!supplyState) return [];

      return supplyState
        .filter(card => {
          const isBasicCard = ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province'].includes(card.name);
          return !isBasicCard && (!card.available || card.count === 0);
        })
        .map(card => card.name);
    } catch (error) {
      console.error('Get empty piles error:', error);
      return [];
    }
  }

  /**
   * ゲーム状態を取得
   * @param {string} roomId - ルームID
   * @returns {Object} ゲーム状態
   */
  getGameState(roomId) {
    return this.gameStates.get(roomId);
  }

  /**
   * ゲーム状態をリセット
   * @param {string} roomId - ルームID
   */
  resetGame(roomId) {
    this.gameStates.delete(roomId);
    console.log(`🧹 Game state reset for room ${roomId}`);
  }

  /**
   * 全アクティブゲーム一覧
   * @returns {Array} アクティブゲーム一覧
   */
  getActiveGames() {
    const activeGames = [];
    
    this.gameStates.forEach((gameState, roomId) => {
      if (gameState.isActive) {
        activeGames.push({
          roomId,
          playerCount: gameState.playerIds.length,
          currentTurn: gameState.currentTurn,
          elapsedTime: Math.floor((Date.now() - gameState.startTime) / 1000),
          remainingTime: this.getRemainingTime(roomId),
          emptyPiles: this.getEmptyPiles(roomId)
        });
      }
    });

    return activeGames;
  }
}

// エクスポート
module.exports = new EndConditionEngine();