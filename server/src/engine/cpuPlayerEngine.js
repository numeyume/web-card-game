/**
 * CPUプレイヤーエンジン - シンプルなAI戦略
 * プレイヤーVS CPU対戦を可能にする
 */

export class CPUPlayerEngine {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty;
    this.playerId = 'cpu_player';
    this.playerName = 'CPU';
    this.strategy = this.getDifficultyStrategy(difficulty);
  }

  /**
   * 難易度に応じた戦略を取得
   */
  getDifficultyStrategy(difficulty) {
    const strategies = {
      easy: {
        cardPriority: 0.3,    // 30%の確率で良いカードを選ぶ
        buyPriority: 0.4,     // 40%の確率で最適な購入をする
        thinkTime: 500        // 0.5秒で決定
      },
      normal: {
        cardPriority: 0.6,    // 60%の確率で良いカードを選ぶ
        buyPriority: 0.7,     // 70%の確率で最適な購入をする
        thinkTime: 1000       // 1秒で決定
      },
      hard: {
        cardPriority: 0.9,    // 90%の確率で良いカードを選ぶ
        buyPriority: 0.9,     // 90%の確率で最適な購入をする
        thinkTime: 1500       // 1.5秒で決定
      }
    };
    return strategies[difficulty] || strategies.normal;
  }

  /**
   * CPUのターンを実行
   */
  async executeTurn(gameState, callback) {
    const { hand, supply, coins, actions, buys } = gameState;
    
    console.log(`💭 CPU thinking... (${this.difficulty} mode)`);
    
    // 思考時間をシミュレート
    await this.sleep(this.strategy.thinkTime);
    
    const decisions = {
      cardsToPlay: [],
      cardsToBuy: [],
      reasoning: ''
    };

    // アクションフェーズ: 手札からアクションカードをプレイ
    if (actions > 0) {
      decisions.cardsToPlay = this.selectCardsToPlay(hand, actions);
    }

    // 購入フェーズ: 利用可能なコインで最適なカードを購入
    if (buys > 0) {
      decisions.cardsToBuy = this.selectCardsToBuy(supply, coins, buys);
    }

    decisions.reasoning = this.generateReasoning(decisions);
    
    console.log(`🤖 CPU決定:`, decisions);
    
    if (callback) {
      callback(decisions);
    }
    
    return decisions;
  }

  /**
   * プレイするカードを選択
   */
  selectCardsToPlay(hand, availableActions) {
    const actionCards = hand.filter(card => card.type === 'Action');
    const cardsToPlay = [];
    
    // 優先度に基づいてカードを選択
    const sortedCards = this.sortCardsByPriority(actionCards);
    
    for (const card of sortedCards) {
      if (cardsToPlay.length >= availableActions) break;
      
      // 戦略に基づいて選択
      if (Math.random() < this.strategy.cardPriority) {
        cardsToPlay.push(card);
      }
    }
    
    return cardsToPlay;
  }

  /**
   * 購入するカードを選択
   */
  selectCardsToBuy(supply, availableCoins, availableBuys) {
    const affordableCards = Object.entries(supply)
      .filter(([cardId, cardData]) => 
        cardData.cost <= availableCoins && cardData.count > 0
      )
      .sort((a, b) => this.getCardValue(b[1]) - this.getCardValue(a[1]));
    
    const cardsToBuy = [];
    let remainingCoins = availableCoins;
    let remainingBuys = availableBuys;
    
    for (const [cardId, cardData] of affordableCards) {
      if (remainingBuys <= 0 || cardData.cost > remainingCoins) break;
      
      // 戦略に基づいて購入決定
      if (Math.random() < this.strategy.buyPriority) {
        cardsToBuy.push({
          cardId,
          card: cardData,
          cost: cardData.cost
        });
        remainingCoins -= cardData.cost;
        remainingBuys--;
      }
    }
    
    return cardsToBuy;
  }

  /**
   * カードの価値を評価
   */
  getCardValue(card) {
    let value = 0;
    
    // コストに基づく基本価値
    value += card.cost * 2;
    
    // エフェクトに基づく価値評価
    if (card.effects) {
      card.effects.forEach(effect => {
        switch (effect.type) {
          case 'draw':
            value += effect.value * 3; // ドローは価値が高い
            break;
          case 'gain_coin':
            value += effect.value * 2;
            break;
          case 'gain_action':
            value += effect.value * 2;
            break;
          case 'gain_buy':
            value += effect.value * 1.5;
            break;
          case 'attack':
            value += effect.value * 4; // 攻撃は高価値
            break;
          default:
            value += effect.value;
        }
      });
    }
    
    // タイプ別の価値調整
    switch (card.type) {
      case 'Victory':
        value += 10; // 勝利点カードは重要
        break;
      case 'Treasure':
        value += 5;
        break;
      case 'Action':
        value += 3;
        break;
    }
    
    return value;
  }

  /**
   * カードを優先度順にソート
   */
  sortCardsByPriority(cards) {
    return cards.sort((a, b) => this.getCardValue(b) - this.getCardValue(a));
  }

  /**
   * 決定理由を生成
   */
  generateReasoning(decisions) {
    const reasons = [];
    
    if (decisions.cardsToPlay.length > 0) {
      reasons.push(`${decisions.cardsToPlay.length}枚のアクションカードをプレイ`);
    }
    
    if (decisions.cardsToBuy.length > 0) {
      const totalCost = decisions.cardsToBuy.reduce((sum, buy) => sum + buy.cost, 0);
      reasons.push(`${totalCost}コインで${decisions.cardsToBuy.length}枚のカードを購入`);
    }
    
    if (reasons.length === 0) {
      reasons.push('パス');
    }
    
    return reasons.join('、');
  }

  /**
   * スリープ関数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * CPUの性格に応じたメッセージ
   */
  getThinkingMessage() {
    const messages = {
      easy: ['考え中...', 'うーん...', 'どれにしよう...'],
      normal: ['戦略を練っています...', '最適手を計算中...', '選択肢を検討中...'],
      hard: ['完璧な手を分析中...', '全パターンを計算中...', '最適解を導出中...']
    };
    
    const difficultyMessages = messages[this.difficulty] || messages.normal;
    return difficultyMessages[Math.floor(Math.random() * difficultyMessages.length)];
  }

  /**
   * CPUプレイヤーのステータス取得
   */
  getStatus() {
    return {
      playerId: this.playerId,
      playerName: this.playerName,
      difficulty: this.difficulty,
      strategy: this.strategy
    };
  }
}

export default CPUPlayerEngine;