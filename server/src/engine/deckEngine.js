/**
 * Deck Engine - カードデッキの管理
 * Fisher-Yates シャッフル、ドロー、破棄処理
 */

export class DeckEngine {
  constructor() {
    this.standardCards = [
      { id: 'copper', name: '銅貨', cost: 0, type: 'treasure', value: 1 },
      { id: 'silver', name: '銀貨', cost: 3, type: 'treasure', value: 2 },
      { id: 'gold', name: '金貨', cost: 6, type: 'treasure', value: 3 },
      { id: 'estate', name: '屋敷', cost: 2, type: 'victory', points: 1 },
      { id: 'duchy', name: '公領', cost: 5, type: 'victory', points: 3 },
      { id: 'province', name: '属州', cost: 8, type: 'victory', points: 6 },
      { id: 'curse', name: '呪い', cost: 0, type: 'curse', points: -1 }
    ];
  }

  /**
   * Fisher-Yates シャッフルアルゴリズム
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
   * 初期デッキを作成
   */
  createStartingDeck() {
    const deck = [];
    
    // 銅貨 7枚
    for (let i = 0; i < 7; i++) {
      deck.push({ ...this.standardCards[0], id: `copper_${i}` });
    }
    
    // 屋敷 3枚
    for (let i = 0; i < 3; i++) {
      deck.push({ ...this.standardCards[3], id: `estate_${i}` });
    }
    
    return this.shuffleDeck(deck);
  }

  /**
   * サプライを初期化
   */
  initializeSupply(playerCount) {
    const supply = {};
    
    // 財宝カード
    supply.copper = { card: this.standardCards[0], count: 60 - (playerCount * 7) };
    supply.silver = { card: this.standardCards[1], count: 40 };
    supply.gold = { card: this.standardCards[2], count: 30 };
    
    // 勝利点カード
    const victoryCardCount = playerCount === 2 ? 8 : 12;
    supply.estate = { card: this.standardCards[3], count: victoryCardCount };
    supply.duchy = { card: this.standardCards[4], count: victoryCardCount };
    supply.province = { card: this.standardCards[5], count: victoryCardCount };
    
    // 呪いカード
    supply.curse = { card: this.standardCards[6], count: (playerCount - 1) * 10 };
    
    return supply;
  }

  /**
   * カードをドロー
   */
  drawCards(playerDeck, playerDiscard, count = 1) {
    const drawnCards = [];
    let deck = [...playerDeck];
    let discard = [...playerDiscard];
    
    for (let i = 0; i < count; i++) {
      // デッキが空の場合、破棄山をシャッフルしてデッキに
      if (deck.length === 0) {
        if (discard.length === 0) {
          break; // ドローできるカードがない
        }
        deck = this.shuffleDeck(discard);
        discard = [];
      }
      
      drawnCards.push(deck.pop());
    }
    
    return {
      drawnCards,
      newDeck: deck,
      newDiscard: discard
    };
  }

  /**
   * カードを破棄
   */
  discardCards(playerDiscard, cards) {
    return [...playerDiscard, ...cards];
  }

  /**
   * カードを購入
   */
  buyCard(supply, cardId) {
    if (!supply[cardId] || supply[cardId].count <= 0) {
      return { success: false, error: 'カードが在庫切れです' };
    }
    
    const newSupply = { ...supply };
    newSupply[cardId] = {
      ...supply[cardId],
      count: supply[cardId].count - 1
    };
    
    return {
      success: true,
      card: supply[cardId].card,
      newSupply
    };
  }

  /**
   * 手札を初期化（5枚ドロー）
   */
  drawInitialHand(playerDeck, playerDiscard) {
    return this.drawCards(playerDeck, playerDiscard, 5);
  }

  /**
   * クリーンアップフェーズ
   */
  cleanupPhase(playerHand, playerPlay, playerDiscard, playerDeck) {
    // 手札と場のカードを破棄山に
    const newDiscard = [
      ...playerDiscard,
      ...playerHand,
      ...playerPlay
    ];
    
    // 新しい手札を5枚ドロー
    const drawResult = this.drawCards(playerDeck, newDiscard, 5);
    
    return {
      newHand: drawResult.drawnCards,
      newDeck: drawResult.newDeck,
      newDiscard: drawResult.newDiscard,
      newPlay: []
    };
  }

  /**
   * 終了条件チェック - 3山切れ
   */
  checkEmptyPiles(supply) {
    const emptyPiles = Object.keys(supply).filter(cardId => supply[cardId].count === 0);
    return {
      emptyPileCount: emptyPiles.length,
      emptyPiles: emptyPiles,
      isGameEnd: emptyPiles.length >= 3 || supply.province?.count === 0
    };
  }

  /**
   * 勝利点計算
   */
  calculateVictoryPoints(allCards) {
    let points = 0;
    
    for (const card of allCards) {
      if (card.points) {
        points += card.points;
      }
    }
    
    return points;
  }

  /**
   * デッキ統計取得
   */
  getDeckStats(playerDeck, playerHand, playerDiscard, playerPlay) {
    const allCards = [...playerDeck, ...playerHand, ...playerDiscard, ...playerPlay];
    
    const stats = {
      totalCards: allCards.length,
      treasureCards: allCards.filter(c => c.type === 'treasure').length,
      victoryCards: allCards.filter(c => c.type === 'victory').length,
      actionCards: allCards.filter(c => c.type === 'action').length,
      curseCards: allCards.filter(c => c.type === 'curse').length,
      victoryPoints: this.calculateVictoryPoints(allCards),
      deckSize: playerDeck.length,
      handSize: playerHand.length,
      discardSize: playerDiscard.length,
      playSize: playerPlay.length
    };
    
    return stats;
  }
}

export default DeckEngine;