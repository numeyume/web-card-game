#!/usr/bin/env node

// Test CPU Battle functionality
import { DominionEngine } from './client/src/utils/DominionEngine.js'

console.log('🎯 Testing CPU Battle Functionality...\n')

// Helper function to simulate delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Test counter
let testsPassed = 0
let testsTotal = 0

function runTest(testName, testFn) {
  testsTotal++
  console.log(`\n🧪 Test ${testsTotal}: ${testName}`)
  console.log('─'.repeat(50))
  
  try {
    const result = testFn()
    if (result !== false) {
      testsPassed++
      console.log(`✅ PASSED: ${testName}`)
      return true
    } else {
      console.log(`❌ FAILED: ${testName}`)
      return false
    }
  } catch (error) {
    console.log(`💥 ERROR in ${testName}:`, error.message)
    return false
  }
}

// Test 1: Engine Creation and Basic Setup
runTest('DominionEngine Creation', () => {
  let stateUpdateCalled = false
  const engine = new DominionEngine((gameState) => {
    stateUpdateCalled = true
    console.log(`   🔄 State update callback called: ${gameState.gameId}`)
  })
  
  console.log('   ✅ DominionEngine created successfully')
  return true
})

// Test 2: Game Initialization with CPU
runTest('Game Initialization with CPU', () => {
  const engine = new DominionEngine()
  const gameState = engine.startGame(['プレイヤー', 'CPU'])
  
  console.log(`   Game ID: ${gameState.gameId}`)
  console.log(`   Players: ${gameState.players.length}`)
  console.log(`   Current phase: ${gameState.phase}`)
  console.log(`   Current turn: ${gameState.turn}`)
  console.log(`   Current player: ${gameState.players[gameState.currentPlayerIndex].name}`)
  console.log(`   Human player: ${gameState.players.find(p => p.isHuman)?.name}`)
  console.log(`   CPU player: ${gameState.players.find(p => !p.isHuman)?.name}`)
  
  // Verify basic initialization
  if (gameState.players.length !== 2) {
    console.log(`   ❌ Expected 2 players, got ${gameState.players.length}`)
    return false
  }
  
  if (!gameState.players.find(p => p.isHuman)) {
    console.log(`   ❌ No human player found`)
    return false
  }
  
  if (!gameState.players.find(p => !p.isHuman)) {
    console.log(`   ❌ No CPU player found`)
    return false
  }
  
  if (gameState.phase !== 'action') {
    console.log(`   ❌ Expected 'action' phase, got '${gameState.phase}'`)
    return false
  }
  
  return true
})

// Test 3: Supply Initialization
runTest('Supply Initialization', () => {
  const engine = new DominionEngine()
  const gameState = engine.startGame(['プレイヤー', 'CPU'])
  
  const expectedSupply = [
    'copper', 'silver', 'gold',
    'estate', 'duchy', 'province',
    'village', 'market', 'smithy', 'laboratory', 'woodcutter'
  ]
  
  console.log(`   Supply cards available: ${Object.keys(gameState.supply).length}`)
  
  for (const cardKey of expectedSupply) {
    if (!gameState.supply[cardKey]) {
      console.log(`   ❌ Missing supply card: ${cardKey}`)
      return false
    }
    
    const pile = gameState.supply[cardKey]
    console.log(`   ${pile.card.name}: ${pile.count} cards, cost ${pile.cost}`)
    
    if (pile.count <= 0) {
      console.log(`   ❌ ${cardKey} has no cards in supply`)
      return false
    }
  }
  
  return true
})

// Test 4: Player Hand Initialization
runTest('Player Hand Initialization', () => {
  const engine = new DominionEngine()
  const gameState = engine.startGame(['プレイヤー', 'CPU'])
  
  for (const player of gameState.players) {
    console.log(`   ${player.name}:`)
    console.log(`     Hand: ${player.hand.length} cards`)
    console.log(`     Deck: ${player.deck.length} cards`)
    console.log(`     Actions: ${player.actions}`)
    console.log(`     Buys: ${player.buys}`)
    console.log(`     Coins: ${player.coins}`)
    
    // Standard Dominion starts with 5 cards in hand
    if (player.hand.length !== 5) {
      console.log(`   ❌ ${player.name} should have 5 cards in hand, has ${player.hand.length}`)
      return false
    }
    
    // Check starting deck size (10 total cards - 5 in hand = 5 in deck)
    if (player.deck.length !== 5) {
      console.log(`   ❌ ${player.name} should have 5 cards in deck, has ${player.deck.length}`)
      return false
    }
    
    // Check starting resources
    if (player.actions !== 1) {
      console.log(`   ❌ ${player.name} should start with 1 action, has ${player.actions}`)
      return false
    }
    
    if (player.buys !== 1) {
      console.log(`   ❌ ${player.name} should start with 1 buy, has ${player.buys}`)
      return false
    }
  }
  
  return true
})

// Test 5: Phase Transitions
runTest('Phase Transitions', () => {
  const engine = new DominionEngine()
  const gameState = engine.startGame(['プレイヤー', 'CPU'])
  
  console.log(`   Starting phase: ${gameState.phase}`)
  
  // Move from action to buy phase
  const success1 = engine.moveToNextPhase()
  console.log(`   Action → Buy: ${success1}, new phase: ${gameState.phase}`)
  
  if (!success1 || gameState.phase !== 'buy') {
    console.log(`   ❌ Failed to move from action to buy phase`)
    return false
  }
  
  // Move from buy to cleanup phase
  const success2 = engine.moveToNextPhase()
  console.log(`   Buy → Cleanup: ${success2}, new phase: ${gameState.phase}`)
  
  if (!success2 || gameState.phase !== 'cleanup') {
    console.log(`   ❌ Failed to move from buy to cleanup phase`)
    return false
  }
  
  return true
})

// Test 6: CPU Turn Handling
runTest('CPU Turn Handling', () => {
  const engine = new DominionEngine()
  const gameState = engine.startGame(['プレイヤー', 'CPU'])
  
  // Skip human player's turn to get to CPU turn
  engine.moveToNextPhase() // action → buy
  engine.moveToNextPhase() // buy → cleanup
  engine.moveToNextPhase() // cleanup → next player's action
  
  console.log(`   Current player: ${gameState.players[gameState.currentPlayerIndex].name}`)
  console.log(`   Is human: ${gameState.players[gameState.currentPlayerIndex].isHuman}`)
  console.log(`   Current phase: ${gameState.phase}`)
  console.log(`   Turn: ${gameState.turn}`)
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  
  // Check if it's CPU's turn
  if (currentPlayer.isHuman) {
    console.log(`   ❌ Expected CPU turn, but current player is human`)
    return false
  }
  
  // Check if CPU turn is properly handled
  const isCPUTurn = !engine.isCurrentPlayerHuman()
  console.log(`   Is CPU turn: ${isCPUTurn}`)
  
  if (!isCPUTurn) {
    console.log(`   ❌ Engine should detect CPU turn`)
    return false
  }
  
  return true
})

// Test 7: Game State Consistency
runTest('Game State Consistency', () => {
  const engine = new DominionEngine()
  const gameState = engine.startGame(['プレイヤー', 'CPU'])
  
  // Verify game state structure
  const requiredFields = ['gameId', 'players', 'currentPlayerIndex', 'turn', 'phase', 'supply', 'trash', 'log', 'isGameEnded']
  
  for (const field of requiredFields) {
    if (!(field in gameState)) {
      console.log(`   ❌ Missing required field: ${field}`)
      return false
    }
  }
  
  console.log(`   ✅ All required fields present`)
  
  // Verify player structure
  for (const player of gameState.players) {
    const requiredPlayerFields = ['id', 'name', 'isHuman', 'deck', 'hand', 'discard', 'actions', 'buys', 'coins', 'playArea', 'totalVictoryPoints', 'turnsPlayed']
    
    for (const field of requiredPlayerFields) {
      if (!(field in player)) {
        console.log(`   ❌ Player missing required field: ${field}`)
        return false
      }
    }
  }
  
  console.log(`   ✅ All player fields present`)
  
  return true
})

// Test 8: Error Handling
runTest('Error Handling', () => {
  const engine = new DominionEngine()
  const gameState = engine.startGame(['プレイヤー', 'CPU'])
  
  // Test invalid card purchase
  try {
    engine.buyCard('invalid_card')
    console.log(`   ❌ Should have thrown error for invalid card`)
    return false
  } catch (error) {
    console.log(`   ✅ Correctly handled invalid card purchase: ${error.message}`)
  }
  
  // Test purchasing without enough coins
  try {
    engine.buyCard('gold') // Gold costs 6, player starts with 0 coins
    console.log(`   ❌ Should have thrown error for insufficient coins`)
    return false
  } catch (error) {
    console.log(`   ✅ Correctly handled insufficient coins: ${error.message}`)
  }
  
  return true
})

// Test 9: Custom Cards Support
runTest('Custom Cards Support', () => {
  const customCards = [
    {
      id: 'test_card',
      name: 'Test Card',
      description: 'A test card',
      type: 'Action',
      cost: 3,
      effects: [
        { type: 'draw', value: 1 },
        { type: 'gain_action', value: 1 }
      ]
    }
  ]
  
  const engine = new DominionEngine()
  const gameState = engine.startGame(['プレイヤー', 'CPU'], customCards)
  
  console.log(`   Custom cards provided: ${customCards.length}`)
  console.log(`   Supply cards available: ${Object.keys(gameState.supply).length}`)
  
  // Check if custom card is in supply
  const hasCustomCard = 'test_card' in gameState.supply
  console.log(`   Custom card in supply: ${hasCustomCard}`)
  
  if (!hasCustomCard) {
    console.log(`   ❌ Custom card not found in supply`)
    return false
  }
  
  return true
})

// Test 10: Game End Conditions
runTest('Game End Conditions Check', () => {
  const engine = new DominionEngine()
  const gameState = engine.startGame(['プレイヤー', 'CPU'])
  
  // Check initial game state
  console.log(`   Game ended: ${gameState.isGameEnded}`)
  console.log(`   Winner: ${gameState.winner?.name || 'None'}`)
  console.log(`   Province count: ${gameState.supply.province.count}`)
  
  if (gameState.isGameEnded) {
    console.log(`   ❌ Game should not be ended at start`)
    return false
  }
  
  if (gameState.winner) {
    console.log(`   ❌ Game should not have winner at start`)
    return false
  }
  
  console.log(`   ✅ Game properly initialized as ongoing`)
  
  return true
})

// Run all tests and report results
console.log('\n' + '='.repeat(70))
console.log('🎯 CPU Battle Test Results')
console.log('='.repeat(70))

console.log(`\n📊 Summary:`)
console.log(`   Tests run: ${testsTotal}`)
console.log(`   Tests passed: ${testsPassed}`)
console.log(`   Tests failed: ${testsTotal - testsPassed}`)
console.log(`   Success rate: ${Math.round((testsPassed / testsTotal) * 100)}%`)

if (testsPassed === testsTotal) {
  console.log(`\n🎉 All tests passed! CPU Battle functionality is working correctly.`)
  process.exit(0)
} else {
  console.log(`\n⚠️  Some tests failed. Please review the issues above.`)
  process.exit(1)
}