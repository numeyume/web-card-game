/**
 * End Condition Engine - ゲーム終了条件判定
 * 3種類の終了条件（3山切れ、最大ターン、制限時間）を管理
 */

export class EndConditionEngine {
  constructor() {
    this.endConditions = {
      EMPTY_PILES: 'empty_piles',
      MAX_TURNS: 'max_turns', 
      TIME_LIMIT: 'time_limit',
      MANUAL: 'manual'
    };
    
    this.defaultLimits = {
      maxTurns: 50,
      timeLimitMinutes: 60,
      emptyPilesThreshold: 3
    };
  }

  /**
   * 全終了条件をチェック
   */
  checkEndConditions(gameState) {
    const results = [];
    
    // 3山切れチェック
    const emptyPilesResult = this.checkEmptyPiles(gameState.supply);
    if (emptyPilesResult.isTriggered) {
      results.push(emptyPilesResult);
    }
    
    // 最大ターン数チェック
    const maxTurnsResult = this.checkMaxTurns(gameState);
    if (maxTurnsResult.isTriggered) {
      results.push(maxTurnsResult);
    }
    
    // 制限時間チェック
    const timeLimitResult = this.checkTimeLimit(gameState);
    if (timeLimitResult.isTriggered) {
      results.push(timeLimitResult);
    }
    
    // 終了条件が満たされた場合
    if (results.length > 0) {
      return {
        isGameEnd: true,
        triggeredConditions: results,
        primaryReason: results[0], // 最初に満たされた条件を主な理由とする
        endTime: new Date()
      };
    }
    
    return {
      isGameEnd: false,
      status: this.getGameStatus(gameState),
      remainingTime: this.getRemainingTime(gameState),
      remainingTurns: this.getRemainingTurns(gameState),
      emptyPiles: this.getEmptyPiles(gameState.supply)
    };
  }

  /**
   * 3山切れ条件チェック
   */
  checkEmptyPiles(supply) {
    const emptyPiles = Object.keys(supply).filter(cardId => supply[cardId].count === 0);
    const provinceEmpty = supply.province?.count === 0;
    
    const isTriggered = emptyPiles.length >= this.defaultLimits.emptyPilesThreshold || provinceEmpty;
    
    return {
      type: this.endConditions.EMPTY_PILES,
      isTriggered,
      emptyPileCount: emptyPiles.length,
      emptyPiles: emptyPiles,
      provinceEmpty,
      message: provinceEmpty 
        ? '属州が枯渇しました'
        : `${emptyPiles.length}山が枯渇しました（3山枯渇でゲーム終了）`,
      priority: provinceEmpty ? 1 : 2
    };
  }

  /**
   * 最大ターン数条件チェック
   */
  checkMaxTurns(gameState) {
    const currentTurn = gameState.currentTurn || 0;
    const maxTurns = gameState.maxTurns || this.defaultLimits.maxTurns;
    const isTriggered = currentTurn >= maxTurns;
    
    return {
      type: this.endConditions.MAX_TURNS,
      isTriggered,
      currentTurn,
      maxTurns,
      remainingTurns: Math.max(0, maxTurns - currentTurn),
      message: `最大ターン数(${maxTurns})に達しました`,
      priority: 3
    };
  }

  /**
   * 制限時間条件チェック
   */
  checkTimeLimit(gameState) {
    const now = new Date();
    const startTime = new Date(gameState.startedAt);
    const timeLimitMs = (gameState.timeLimitMinutes || this.defaultLimits.timeLimitMinutes) * 60 * 1000;
    const elapsedTime = now - startTime;
    const isTriggered = elapsedTime >= timeLimitMs;
    
    return {
      type: this.endConditions.TIME_LIMIT,
      isTriggered,
      elapsedTime,
      timeLimitMs,
      remainingTime: Math.max(0, timeLimitMs - elapsedTime),
      message: `制限時間(${Math.round(timeLimitMs / 60000)}分)に達しました`,
      priority: 4
    };
  }

  /**
   * ゲーム終了処理
   */
  triggerGameEnd(roomId, gameState, endConditionResult) {
    const endData = {
      roomId,
      endTime: new Date(),
      endReason: endConditionResult.primaryReason.type,
      endMessage: endConditionResult.primaryReason.message,
      gameStats: {
        totalTurns: gameState.currentTurn || 0,
        gameDuration: new Date() - new Date(gameState.startedAt),
        playersCount: gameState.players?.length || 0
      },
      triggeredConditions: endConditionResult.triggeredConditions
    };
    
    return endData;
  }

  /**
   * 最終スコア計算準備
   */
  prepareFinalScoring(gameState, players) {
    return {
      players: players.map(player => ({
        id: player.id,
        name: player.name,
        victoryPoints: this.calculateVictoryPoints(player),
        totalCards: this.getTotalCards(player),
        deckComposition: this.analyzeDeckComposition(player)
      })),
      gameData: {
        totalTurns: gameState.currentTurn || 0,
        gameDuration: new Date() - new Date(gameState.startedAt),
        endReason: gameState.endReason || 'unknown',
        supply: gameState.supply
      }
    };
  }

  /**
   * 勝利点計算
   */
  calculateVictoryPoints(player) {
    const allCards = [
      ...(player.deck || []),
      ...(player.hand || []),
      ...(player.discard || []),
      ...(player.play || [])
    ];
    
    return allCards.reduce((points, card) => {
      return points + (card.points || 0);
    }, 0);
  }

  /**
   * 総カード数取得
   */
  getTotalCards(player) {
    return (player.deck?.length || 0) +
           (player.hand?.length || 0) +
           (player.discard?.length || 0) +
           (player.play?.length || 0);
  }

  /**
   * デッキ構成分析
   */
  analyzeDeckComposition(player) {
    const allCards = [
      ...(player.deck || []),
      ...(player.hand || []),
      ...(player.discard || []),
      ...(player.play || [])
    ];
    
    const composition = { treasure: 0, victory: 0, action: 0, curse: 0, custom: 0 };
    
    allCards.forEach(card => {
      if (card.type) {
        composition[card.type] = (composition[card.type] || 0) + 1;
      }
    });
    
    return composition;
  }

  /**
   * ゲーム状態取得
   */
  getGameStatus(gameState) {
    const emptyPiles = this.getEmptyPiles(gameState.supply);
    const remainingTurns = this.getRemainingTurns(gameState);
    const remainingTime = this.getRemainingTime(gameState);
    
    return {
      currentTurn: gameState.currentTurn || 0,
      currentPlayer: gameState.currentPlayer || 0,
      phase: gameState.phase || 'action',
      emptyPileCount: emptyPiles.length,
      warningThreshold: {
        piles: emptyPiles.length >= 2,
        turns: remainingTurns <= 5,
        time: remainingTime <= 5 * 60 * 1000 // 5分
      }
    };
  }

  /**
   * 空山取得
   */
  getEmptyPiles(supply) {
    return Object.keys(supply).filter(cardId => supply[cardId].count === 0);
  }

  /**
   * 残りターン数取得
   */
  getRemainingTurns(gameState) {
    const maxTurns = gameState.maxTurns || this.defaultLimits.maxTurns;
    const currentTurn = gameState.currentTurn || 0;
    return Math.max(0, maxTurns - currentTurn);
  }

  /**
   * 残り時間取得
   */
  getRemainingTime(gameState) {
    const now = new Date();
    const startTime = new Date(gameState.startedAt);
    const timeLimitMs = (gameState.timeLimitMinutes || this.defaultLimits.timeLimitMinutes) * 60 * 1000;
    const elapsedTime = now - startTime;
    return Math.max(0, timeLimitMs - elapsedTime);
  }

  /**
   * 警告チェック
   */
  checkWarnings(gameState) {
    const warnings = [];
    const status = this.getGameStatus(gameState);
    
    if (status.warningThreshold.piles) {
      warnings.push({
        type: 'piles',
        message: `${status.emptyPileCount}山が枯渇しています（3山で終了）`,
        severity: 'high'
      });
    }
    
    if (status.warningThreshold.turns) {
      warnings.push({
        type: 'turns',
        message: `残り${this.getRemainingTurns(gameState)}ターンです`,
        severity: 'medium'
      });
    }
    
    if (status.warningThreshold.time) {
      const remainingMinutes = Math.ceil(this.getRemainingTime(gameState) / 60000);
      warnings.push({
        type: 'time',
        message: `残り${remainingMinutes}分です`,
        severity: 'medium'
      });
    }
    
    return warnings;
  }
}

export default EndConditionEngine;