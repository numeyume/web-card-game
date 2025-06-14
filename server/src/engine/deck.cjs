// Deck Engine - Handles shuffling, drawing, and discard mechanics
// Server-side implementation for realistic card game mechanics

/**
 * Card type definition for engine use
 * @typedef {Object} Card
 * @property {string} id - Unique card identifier
 * @property {string} name - Card display name
 * @property {number} cost - Mana cost
 * @property {string} type - Card type (Action/Treasure/Victory/Custom)
 * @property {Array} effects - Array of card effects
 * @property {string} description - Card description
 * @property {string} createdBy - Player who created this card
 */

/**
 * Deck state for a game room
 * @typedef {Object} DeckState
 * @property {Array<Card>} supply - Available cards to buy
 * @property {Array<Card>} trash - Trashed cards
 * @property {Object} playerDecks - Each player's deck state
 */

class DeckEngine {
  constructor() {
    this.gameDecks = new Map() // roomId -> DeckState
  }

  /**
   * Initialize deck state for a new game room
   * @param {string} roomId - Room identifier
   * @param {Array<Card>} supplyCards - Cards available in supply
   * @param {Array<string>} playerIds - List of player IDs
   * @returns {DeckState} Initial deck state
   */
  initializeDeck(roomId, supplyCards = [], playerIds = []) {
    const startingDeck = this.createStartingDeck()
    
    const deckState = {
      supply: [...supplyCards],
      trash: [],
      playerDecks: {}
    }

    // Initialize each player's deck
    playerIds.forEach(playerId => {
      deckState.playerDecks[playerId] = {
        deck: this.shuffleDeck([...startingDeck]),
        hand: [],
        discard: [],
        field: [], // Cards in play
        deckCount: startingDeck.length,
        handSize: 5
      }
    })

    this.gameDecks.set(roomId, deckState)
    
    // Deal initial hands
    playerIds.forEach(playerId => {
      this.drawCards(roomId, playerId, 5)
    })

    return deckState
  }

  /**
   * Create standard starting deck (7 Copper + 3 Estate equivalent)
   * @returns {Array<Card>} Starting deck
   */
  createStartingDeck() {
    const startingCards = []
    
    // 7 Basic Treasure cards (like Copper)
    for (let i = 0; i < 7; i++) {
      startingCards.push({
        id: `copper_${i}`,
        name: 'Copper',
        cost: 0,
        type: 'Treasure',
        effects: [{ type: 'gain_coin', value: 1, target: 'self' }],
        description: 'Basic treasure. Provides 1 coin.',
        createdBy: 'system'
      })
    }

    // 3 Basic Victory cards (like Estate)
    for (let i = 0; i < 3; i++) {
      startingCards.push({
        id: `estate_${i}`,
        name: 'Estate',
        cost: 2,
        type: 'Victory',
        effects: [],
        description: 'Basic victory card. Worth 1 victory point.',
        createdBy: 'system',
        victoryPoints: 1
      })
    }

    return startingCards
  }

  /**
   * Shuffle deck using Fisher-Yates algorithm
   * @param {Array<Card>} deck - Deck to shuffle
   * @returns {Array<Card>} Shuffled deck
   */
  shuffleDeck(deck) {
    const shuffled = [...deck]
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    return shuffled
  }

  /**
   * Draw cards from player's deck
   * @param {string} roomId - Room identifier
   * @param {string} playerId - Player identifier
   * @param {number} count - Number of cards to draw
   * @returns {Array<Card>} Cards drawn
   */
  drawCards(roomId, playerId, count = 1) {
    const deckState = this.gameDecks.get(roomId)
    if (!deckState || !deckState.playerDecks[playerId]) {
      throw new Error(`Player deck not found: ${playerId}`)
    }

    const playerDeck = deckState.playerDecks[playerId]
    const drawnCards = []

    for (let i = 0; i < count; i++) {
      // If deck is empty, shuffle discard pile into deck
      if (playerDeck.deck.length === 0) {
        if (playerDeck.discard.length === 0) {
          break // No more cards available
        }
        
        playerDeck.deck = this.shuffleDeck([...playerDeck.discard])
        playerDeck.discard = []
        console.log(`🔄 Player ${playerId} reshuffled deck (${playerDeck.deck.length} cards)`)
      }

      // Draw card
      const card = playerDeck.deck.pop()
      if (card) {
        playerDeck.hand.push(card)
        drawnCards.push(card)
      }
    }

    // Update deck count
    playerDeck.deckCount = playerDeck.deck.length + playerDeck.discard.length

    console.log(`🃏 Player ${playerId} drew ${drawnCards.length} cards (hand: ${playerDeck.hand.length})`)
    return drawnCards
  }

  /**
   * Discard cards from hand
   * @param {string} roomId - Room identifier
   * @param {string} playerId - Player identifier
   * @param {Array<string>} cardIds - IDs of cards to discard
   * @returns {Array<Card>} Discarded cards
   */
  discardCards(roomId, playerId, cardIds = []) {
    const deckState = this.gameDecks.get(roomId)
    if (!deckState || !deckState.playerDecks[playerId]) {
      throw new Error(`Player deck not found: ${playerId}`)
    }

    const playerDeck = deckState.playerDecks[playerId]
    const discardedCards = []

    // If no specific cards, discard entire hand
    if (cardIds.length === 0) {
      discardedCards.push(...playerDeck.hand)
      playerDeck.discard.push(...playerDeck.hand)
      playerDeck.hand = []
    } else {
      // Discard specific cards
      cardIds.forEach(cardId => {
        const cardIndex = playerDeck.hand.findIndex(c => c.id === cardId)
        if (cardIndex >= 0) {
          const [card] = playerDeck.hand.splice(cardIndex, 1)
          playerDeck.discard.push(card)
          discardedCards.push(card)
        }
      })
    }

    console.log(`🗑️ Player ${playerId} discarded ${discardedCards.length} cards`)
    return discardedCards
  }

  /**
   * Play card from hand to field
   * @param {string} roomId - Room identifier
   * @param {string} playerId - Player identifier
   * @param {string} cardId - ID of card to play
   * @returns {Card|null} Played card
   */
  playCard(roomId, playerId, cardId) {
    const deckState = this.gameDecks.get(roomId)
    if (!deckState || !deckState.playerDecks[playerId]) {
      throw new Error(`Player deck not found: ${playerId}`)
    }

    const playerDeck = deckState.playerDecks[playerId]
    const cardIndex = playerDeck.hand.findIndex(c => c.id === cardId)
    
    if (cardIndex === -1) {
      return null // Card not in hand
    }

    const [card] = playerDeck.hand.splice(cardIndex, 1)
    playerDeck.field.push(card)

    console.log(`▶️ Player ${playerId} played ${card.name}`)
    return card
  }

  /**
   * Buy card from supply
   * @param {string} roomId - Room identifier
   * @param {string} playerId - Player identifier
   * @param {string} cardId - ID of card to buy
   * @returns {Card|null} Bought card
   */
  buyCard(roomId, playerId, cardId) {
    const deckState = this.gameDecks.get(roomId)
    if (!deckState || !deckState.playerDecks[playerId]) {
      throw new Error(`Player deck not found: ${playerId}`)
    }

    const cardIndex = deckState.supply.findIndex(c => c.id === cardId)
    if (cardIndex === -1) {
      return null // Card not available
    }

    const card = deckState.supply[cardIndex]
    const playerDeck = deckState.playerDecks[playerId]
    
    // Add to discard pile (gained cards go to discard)
    playerDeck.discard.push(card)
    
    // Remove from supply (but keep infinite supply for basic cards)
    if (!['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province'].includes(card.name)) {
      deckState.supply.splice(cardIndex, 1)
    }

    console.log(`🛒 Player ${playerId} bought ${card.name}`)
    return card
  }

  /**
   * Cleanup phase - discard field cards and draw new hand
   * @param {string} roomId - Room identifier
   * @param {string} playerId - Player identifier
   * @returns {Object} Cleanup results
   */
  cleanupPhase(roomId, playerId) {
    const deckState = this.gameDecks.get(roomId)
    if (!deckState || !deckState.playerDecks[playerId]) {
      throw new Error(`Player deck not found: ${playerId}`)
    }

    const playerDeck = deckState.playerDecks[playerId]
    
    // Discard all cards in field and hand
    const discardedFromField = [...playerDeck.field]
    const discardedFromHand = [...playerDeck.hand]
    
    playerDeck.discard.push(...discardedFromField, ...discardedFromHand)
    playerDeck.field = []
    playerDeck.hand = []

    // Draw new hand of 5 cards
    const newHand = this.drawCards(roomId, playerId, 5)

    console.log(`🧹 Player ${playerId} cleanup: discarded ${discardedFromField.length + discardedFromHand.length}, drew ${newHand.length}`)
    
    return {
      discardedFromField,
      discardedFromHand,
      newHand,
      handSize: playerDeck.hand.length
    }
  }

  /**
   * Get current deck state for a player
   * @param {string} roomId - Room identifier
   * @param {string} playerId - Player identifier
   * @returns {Object} Player deck state
   */
  getPlayerDeckState(roomId, playerId) {
    const deckState = this.gameDecks.get(roomId)
    if (!deckState || !deckState.playerDecks[playerId]) {
      return null
    }

    const playerDeck = deckState.playerDecks[playerId]
    
    return {
      handSize: playerDeck.hand.length,
      deckSize: playerDeck.deck.length,
      discardSize: playerDeck.discard.length,
      fieldSize: playerDeck.field.length,
      totalCards: playerDeck.deck.length + playerDeck.discard.length + playerDeck.hand.length + playerDeck.field.length,
      hand: playerDeck.hand, // Full hand for current player
      field: playerDeck.field
    }
  }

  /**
   * Get supply state
   * @param {string} roomId - Room identifier
   * @returns {Array<Card>} Available supply cards
   */
  getSupplyState(roomId) {
    const deckState = this.gameDecks.get(roomId)
    if (!deckState) {
      return []
    }

    return deckState.supply.map(card => ({
      ...card,
      available: true
    }))
  }

  /**
   * Trash cards permanently
   * @param {string} roomId - Room identifier
   * @param {string} playerId - Player identifier
   * @param {Array<string>} cardIds - Cards to trash
   * @returns {Array<Card>} Trashed cards
   */
  trashCards(roomId, playerId, cardIds) {
    const deckState = this.gameDecks.get(roomId)
    if (!deckState || !deckState.playerDecks[playerId]) {
      throw new Error(`Player deck not found: ${playerId}`)
    }

    const playerDeck = deckState.playerDecks[playerId]
    const trashedCards = []

    cardIds.forEach(cardId => {
      // Check hand first
      let cardIndex = playerDeck.hand.findIndex(c => c.id === cardId)
      if (cardIndex >= 0) {
        const [card] = playerDeck.hand.splice(cardIndex, 1)
        deckState.trash.push(card)
        trashedCards.push(card)
        return
      }

      // Check field
      cardIndex = playerDeck.field.findIndex(c => c.id === cardId)
      if (cardIndex >= 0) {
        const [card] = playerDeck.field.splice(cardIndex, 1)
        deckState.trash.push(card)
        trashedCards.push(card)
        return
      }

      // Check discard
      cardIndex = playerDeck.discard.findIndex(c => c.id === cardId)
      if (cardIndex >= 0) {
        const [card] = playerDeck.discard.splice(cardIndex, 1)
        deckState.trash.push(card)
        trashedCards.push(card)
      }
    })

    console.log(`🗑️ Player ${playerId} trashed ${trashedCards.length} cards permanently`)
    return trashedCards
  }

  /**
   * Count victory points for a player
   * @param {string} roomId - Room identifier
   * @param {string} playerId - Player identifier
   * @returns {number} Total victory points
   */
  countVictoryPoints(roomId, playerId) {
    const deckState = this.gameDecks.get(roomId)
    if (!deckState || !deckState.playerDecks[playerId]) {
      return 0
    }

    const playerDeck = deckState.playerDecks[playerId]
    let totalPoints = 0

    // Count from all zones
    const allCards = [
      ...playerDeck.deck,
      ...playerDeck.hand,
      ...playerDeck.discard,
      ...playerDeck.field
    ]

    allCards.forEach(card => {
      if (card.type === 'Victory') {
        totalPoints += card.victoryPoints || 0
      }
      
      // Some cards have conditional victory points
      if (card.effects) {
        card.effects.forEach(effect => {
          if (effect.type === 'victory_points') {
            totalPoints += effect.value || 0
          }
        })
      }
    })

    return totalPoints
  }

  /**
   * Reset deck state for room
   * @param {string} roomId - Room identifier
   */
  resetDeck(roomId) {
    this.gameDecks.delete(roomId)
    console.log(`🔄 Reset deck state for room ${roomId}`)
  }

  /**
   * Get game statistics
   * @param {string} roomId - Room identifier
   * @returns {Object} Game statistics
   */
  getGameStats(roomId) {
    const deckState = this.gameDecks.get(roomId)
    if (!deckState) {
      return null
    }

    const playerStats = {}
    Object.keys(deckState.playerDecks).forEach(playerId => {
      const playerDeck = deckState.playerDecks[playerId]
      playerStats[playerId] = {
        totalCards: playerDeck.deck.length + playerDeck.discard.length + playerDeck.hand.length + playerDeck.field.length,
        victoryPoints: this.countVictoryPoints(roomId, playerId),
        handSize: playerDeck.hand.length,
        deckSize: playerDeck.deck.length,
        discardSize: playerDeck.discard.length
      }
    })

    return {
      players: playerStats,
      supply: deckState.supply.length,
      trash: deckState.trash.length
    }
  }
}

// Export singleton instance
const deckEngine = new DeckEngine()
module.exports = deckEngine