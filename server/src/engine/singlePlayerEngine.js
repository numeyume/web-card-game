/**
 * 1人プレイヤーエンジン - CPU対戦システム
 * プレイヤー vs CPU の対戦を管理
 */

import DeckEngine from './deckEngine.js';
import ScoringEngine from './scoringEngine.js';
import CPUPlayerEngine from './cpuPlayerEngine.js';

export class SinglePlayerEngine {
  constructor() {
    this.deckEngine = new DeckEngine();
    this.scoringEngine = new ScoringEngine();
    this.cpuEngine = new CPUPlayerEngine('normal');
    this.gameState = null;
    this.currentPlayerId = null;
    this.gamePhase = 'lobby'; // lobby, playing, ended
  }

  /**
   * 新しいゲームを開始
   */
  startGame(humanPlayerId, difficulty = 'normal') {
    console.log(`🎮 1vs1ゲーム開始: ${humanPlayerId} vs CPU(${difficulty})`);
    
    this.cpuEngine = new CPUPlayerEngine(difficulty);
    this.currentPlayerId = humanPlayerId;
    this.gamePhase = 'playing';
    
    // 基本的なゲーム状態を初期化
    this.gameState = {
      gameId: `single_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      players: {
        [humanPlayerId]: {
          playerId: humanPlayerId,
          playerName: 'プレイヤー',
          hand: [],
          deck: [],
          discard: [],
          score: 0,
          coins: 0,
          actions: 1,
          buys: 1,
          isHuman: true
        },
        [this.cpuEngine.playerId]: {
          playerId: this.cpuEngine.playerId,
          playerName: this.cpuEngine.playerName,
          hand: [],
          deck: [],
          discard: [],
          score: 0,
          coins: 0,
          actions: 1,
          buys: 1,
          isHuman: false
        }
      },
      currentPlayer: humanPlayerId,
      turn: 1,
      phase: 'action', // action, buy, cleanup
      supply: this.createBasicSupply(),
      log: [],
      startedAt: new Date()
    };

    // 各プレイヤーの初期デッキを作成
    this.initializePlayerDecks();
    
    return this.gameState;
  }

  /**
   * 基本的なサプライを作成
   */
  createBasicSupply() {
    return {
      // 基本財宝カード
      copper: {
        id: 'copper',
        name: '銅貨',
        cost: 0,
        type: 'Treasure',
        effects: [{ type: 'gain_coin', value: 1 }],
        count: 30
      },
      silver: {
        id: 'silver',
        name: '銀貨',
        cost: 3,
        type: 'Treasure',
        effects: [{ type: 'gain_coin', value: 2 }],
        count: 20
      },
      gold: {
        id: 'gold',
        name: '金貨',
        cost: 6,
        type: 'Treasure',
        effects: [{ type: 'gain_coin', value: 3 }],
        count: 15
      },
      
      // 基本勝利点カード
      estate: {
        id: 'estate',
        name: '屋敷',
        cost: 2,
        type: 'Victory',
        victoryPoints: 1,
        count: 12
      },
      duchy: {
        id: 'duchy',
        name: '公領',
        cost: 5,
        type: 'Victory',
        victoryPoints: 3,
        count: 8
      },
      province: {
        id: 'province',
        name: '属州',
        cost: 8,
        type: 'Victory',
        victoryPoints: 6,
        count: 6
      },

      // 基本アクションカード
      village: {
        id: 'village',
        name: '村',
        cost: 3,
        type: 'Action',
        effects: [
          { type: 'draw', value: 1 },
          { type: 'gain_action', value: 2 }
        ],
        count: 10
      },
      market: {
        id: 'market',
        name: '市場',
        cost: 5,
        type: 'Action',
        effects: [
          { type: 'draw', value: 1 },
          { type: 'gain_action', value: 1 },
          { type: 'gain_buy', value: 1 },
          { type: 'gain_coin', value: 1 }
        ],
        count: 10
      },
      smithy: {
        id: 'smithy',
        name: '鍛冶屋',
        cost: 4,
        type: 'Action',
        effects: [
          { type: 'draw', value: 3 }
        ],
        count: 10
      }
    };
  }

  /**
   * プレイヤーの初期デッキを設定
   */
  initializePlayerDecks() {
    Object.values(this.gameState.players).forEach(player => {
      // 初期デッキ: 銅貨7枚、屋敷3枚
      const initialDeck = [
        ...Array(7).fill().map(() => ({ ...this.gameState.supply.copper, id: `copper_${Math.random()}` })),
        ...Array(3).fill().map(() => ({ ...this.gameState.supply.estate, id: `estate_${Math.random()}` }))
      ];
      
      player.deck = this.shuffleDeck(initialDeck);
      player.hand = [];
      player.discard = [];
      
      // 初期手札を5枚ドロー
      this.drawCards(player.playerId, 5);
    });
  }

  /**
   * デッキをシャッフル
   */
  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * カードをドロー
   */
  drawCards(playerId, count) {
    const player = this.gameState.players[playerId];
    const drawnCards = [];
    
    for (let i = 0; i < count; i++) {
      if (player.deck.length === 0 && player.discard.length > 0) {
        // デッキが空の場合、捨て札をシャッフルしてデッキに
        player.deck = this.shuffleDeck(player.discard);
        player.discard = [];
      }
      
      if (player.deck.length > 0) {
        const card = player.deck.pop();
        player.hand.push(card);
        drawnCards.push(card);
      }
    }
    
    this.addToLog(`${player.playerName}が${drawnCards.length}枚ドロー`);
    return drawnCards;
  }

  /**
   * カードをプレイ
   */
  playCard(playerId, cardId) {
    const player = this.gameState.players[playerId];
    const cardIndex = player.hand.findIndex(card => card.id === cardId);
    
    if (cardIndex === -1) {
      throw new Error('カードが手札にありません');
    }
    
    const card = player.hand.splice(cardIndex, 1)[0];
    
    // カード効果を実行
    this.executeCardEffects(playerId, card);
    
    // カードを使用済みエリアに（今回は捨て札に）
    player.discard.push(card);
    
    this.addToLog(`${player.playerName}が「${card.name}」をプレイ`);
    
    return card;
  }

  /**
   * カード効果を実行
   */
  executeCardEffects(playerId, card) {
    const player = this.gameState.players[playerId];
    
    if (card.effects) {
      card.effects.forEach(effect => {
        switch (effect.type) {
          case 'draw':
            this.drawCards(playerId, effect.value);
            break;
          case 'gain_coin':
            player.coins += effect.value;
            break;
          case 'gain_action':
            player.actions += effect.value;
            break;
          case 'gain_buy':
            player.buys += effect.value;
            break;
          case 'attack':
            // 攻撃効果（相手のターンに影響）
            this.executeAttackEffect(playerId, effect);
            break;
        }
      });
    }
  }

  /**
   * 攻撃効果を実行
   */
  executeAttackEffect(attackerId, effect) {
    const defenderId = Object.keys(this.gameState.players).find(id => id !== attackerId);
    const defender = this.gameState.players[defenderId];
    
    switch (effect.subtype) {
      case 'discard':
        // 相手の手札を捨てさせる
        const cardsToDiscard = Math.min(effect.value, defender.hand.length);
        const discardedCards = defender.hand.splice(0, cardsToDiscard);
        defender.discard.push(...discardedCards);
        this.addToLog(`${defender.playerName}が${cardsToDiscard}枚のカードを捨てた`);
        break;
    }
  }

  /**
   * カードを購入
   */
  buyCard(playerId, cardId) {
    const player = this.gameState.players[playerId];
    const card = this.gameState.supply[cardId];
    
    if (!card || card.count <= 0) {
      throw new Error('カードが利用できません');
    }
    
    if (card.cost > player.coins) {
      throw new Error('コインが不足しています');
    }
    
    if (player.buys <= 0) {
      throw new Error('購入回数が不足しています');
    }
    
    // 購入処理
    player.coins -= card.cost;
    player.buys--;
    card.count--;
    
    // カードを獲得エリアに（今回は捨て札に）
    const acquiredCard = { ...card, id: `${cardId}_${Math.random()}` };
    player.discard.push(acquiredCard);
    
    this.addToLog(`${player.playerName}が「${card.name}」を購入`);
    
    return acquiredCard;
  }

  /**
   * ターン終了
   */
  endTurn(playerId) {
    const player = this.gameState.players[playerId];
    
    // 手札を全て捨て札に
    player.discard.push(...player.hand);
    player.hand = [];
    
    // 新しい手札を5枚ドロー
    this.drawCards(playerId, 5);
    
    // アクション、購入、コインをリセット
    player.actions = 1;
    player.buys = 1;
    player.coins = 0;
    
    // 次のプレイヤーに交代
    this.switchToNextPlayer();
    
    this.addToLog(`${player.playerName}のターン終了`);
  }

  /**
   * 次のプレイヤーに交代
   */
  switchToNextPlayer() {
    const playerIds = Object.keys(this.gameState.players);
    const currentIndex = playerIds.indexOf(this.gameState.currentPlayer);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    
    this.gameState.currentPlayer = playerIds[nextIndex];
    this.gameState.phase = 'action';
    
    if (playerIds[nextIndex] === Object.keys(this.gameState.players)[0]) {
      this.gameState.turn++;
    }
  }

  /**
   * CPUのターンを実行
   */
  async executeCPUTurn() {
    const cpuPlayer = this.gameState.players[this.cpuEngine.playerId];
    
    // 財宝カードからコインを計算
    cpuPlayer.coins = this.calculateCoinsFromHand(cpuPlayer.hand);
    
    const gameStateForCPU = {
      hand: cpuPlayer.hand,
      supply: this.gameState.supply,
      coins: cpuPlayer.coins,
      actions: cpuPlayer.actions,
      buys: cpuPlayer.buys
    };
    
    const decisions = await this.cpuEngine.executeTurn(gameStateForCPU);
    
    // CPUの決定を実行
    for (const card of decisions.cardsToPlay) {
      if (cpuPlayer.actions > 0) {
        this.playCard(this.cpuEngine.playerId, card.id);
        cpuPlayer.actions--;
      }
    }
    
    for (const purchase of decisions.cardsToBuy) {
      if (cpuPlayer.buys > 0 && cpuPlayer.coins >= purchase.cost) {
        this.buyCard(this.cpuEngine.playerId, purchase.cardId);
      }
    }
    
    // CPUターン終了
    this.endTurn(this.cpuEngine.playerId);
    
    return decisions;
  }

  /**
   * 手札から得られるコインを計算
   */
  calculateCoinsFromHand(hand) {
    return hand
      .filter(card => card.type === 'Treasure')
      .reduce((total, card) => {
        const coinEffect = card.effects?.find(effect => effect.type === 'gain_coin');
        return total + (coinEffect ? coinEffect.value : 0);
      }, 0);
  }

  /**
   * ゲーム終了条件をチェック
   */
  checkGameEnd() {
    const supply = this.gameState.supply;
    
    // 属州が尽きたら終了
    if (supply.province.count === 0) {
      this.endGame('属州が尽きました');
      return true;
    }
    
    // 3つのサプライが尽きたら終了
    const emptySupplies = Object.values(supply).filter(card => card.count === 0).length;
    if (emptySupplies >= 3) {
      this.endGame('3つのサプライが尽きました');
      return true;
    }
    
    // 最大ターン数（50ターン）で終了
    if (this.gameState.turn >= 50) {
      this.endGame('最大ターン数に達しました');
      return true;
    }
    
    return false;
  }

  /**
   * ゲーム終了処理
   */
  endGame(reason) {
    this.gamePhase = 'ended';
    
    // 最終スコアを計算
    Object.values(this.gameState.players).forEach(player => {
      player.finalScore = this.calculateFinalScore(player);
    });
    
    const winner = this.getWinner();
    
    this.gameState.endedAt = new Date();
    this.gameState.endReason = reason;
    this.gameState.winner = winner;
    
    this.addToLog(`ゲーム終了: ${reason}`);
    this.addToLog(`勝者: ${winner.playerName} (${winner.finalScore}点)`);
  }

  /**
   * 最終スコアを計算
   */
  calculateFinalScore(player) {
    const allCards = [...player.hand, ...player.deck, ...player.discard];
    let score = 0;
    
    allCards.forEach(card => {
      if (card.victoryPoints) {
        score += card.victoryPoints;
      }
    });
    
    return score;
  }

  /**
   * 勝者を決定
   */
  getWinner() {
    const players = Object.values(this.gameState.players);
    return players.reduce((winner, player) => 
      player.finalScore > winner.finalScore ? player : winner
    );
  }

  /**
   * ログにメッセージを追加
   */
  addToLog(message) {
    this.gameState.log.push({
      message,
      timestamp: new Date(),
      turn: this.gameState.turn
    });
  }

  /**
   * 現在のゲーム状態を取得
   */
  getGameState() {
    return this.gameState;
  }

  /**
   * プレイヤーの手札を取得（プライベート情報）
   */
  getPlayerHand(playerId) {
    return this.gameState.players[playerId]?.hand || [];
  }

  /**
   * 公開情報のみのゲーム状態を取得
   */
  getPublicGameState() {
    if (!this.gameState) return null;
    
    const publicState = {
      ...this.gameState,
      players: {}
    };
    
    // プレイヤー情報から手札を除いた公開情報のみ
    Object.entries(this.gameState.players).forEach(([playerId, player]) => {
      publicState.players[playerId] = {
        ...player,
        handCount: player.hand.length,
        deckCount: player.deck.length,
        discardCount: player.discard.length
      };
      delete publicState.players[playerId].hand;
      delete publicState.players[playerId].deck;
      delete publicState.players[playerId].discard;
    });
    
    return publicState;
  }
}

export default SinglePlayerEngine;