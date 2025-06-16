// Test silver coin purchase functionality
import { DominionEngine } from './src/utils/DominionEngine.js'

console.log('🧪 Testing Silver Coin Purchase Functionality...\n')

try {
  // 1. Create game engine
  const engine = new DominionEngine()
  console.log('✅ DominionEngine created')

  // 2. Start game
  const gameState = engine.startGame(['TestPlayer', 'CPU'])
  console.log('✅ Game started')
  console.log(`   Current phase: ${gameState.phase}`)
  console.log(`   Current player: ${engine.currentPlayer.name}`)

  // 3. Get human player
  const humanPlayer = engine.humanPlayer
  console.log(`\n👤 Human Player State:`)
  console.log(`   Hand: ${humanPlayer.hand.length} cards`)
  console.log(`   Coins: ${humanPlayer.coins}`)
  console.log(`   Actions: ${humanPlayer.actions}`)
  console.log(`   Buys: ${humanPlayer.buys}`)

  // 4. Skip to buy phase
  if (gameState.phase === 'action') {
    console.log('\n🔄 Moving to buy phase...')
    engine.moveToNextPhase()
    console.log(`   Phase is now: ${gameState.phase}`)
  }

  // 5. Play all treasure cards in hand to get coins
  console.log('\n💰 Playing treasure cards...')
  const treasureCards = humanPlayer.hand.filter(card => card.type === 'Treasure')
  console.log(`   Found ${treasureCards.length} treasure cards`)
  
  treasureCards.forEach(treasure => {
    try {
      engine.playTreasureCard(treasure.id)
      console.log(`   ✅ Played ${treasure.name} (+${treasure.effects?.find(e => e.type === 'gain_coin')?.value || 0} coins)`)
    } catch (error) {
      console.log(`   ❌ Failed to play ${treasure.name}: ${error.message}`)
    }
  })

  console.log(`   Total coins after playing treasures: ${humanPlayer.coins}`)

  // 6. Check silver supply
  const silverSupply = gameState.supply.silver
  console.log(`\n🥈 Silver Supply State:`)
  console.log(`   Name: ${silverSupply.card.name}`)
  console.log(`   Cost: ${silverSupply.cost}`)
  console.log(`   Count: ${silverSupply.count}`)
  console.log(`   Description: ${silverSupply.card.description}`)

  // 7. Test silver purchase conditions
  console.log(`\n🔍 Purchase Conditions Check:`)
  console.log(`   Phase is 'buy': ${gameState.phase === 'buy'}`)
  console.log(`   Is human turn: ${engine.isCurrentPlayerHuman()}`)
  console.log(`   Has enough coins: ${humanPlayer.coins >= silverSupply.cost} (${humanPlayer.coins} >= ${silverSupply.cost})`)
  console.log(`   Has buys left: ${humanPlayer.buys > 0} (${humanPlayer.buys} > 0)`)
  console.log(`   Silver in stock: ${silverSupply.count > 0} (${silverSupply.count} > 0)`)

  const canBuy = gameState.phase === 'buy' && 
                 engine.isCurrentPlayerHuman() && 
                 humanPlayer.coins >= silverSupply.cost && 
                 humanPlayer.buys > 0 && 
                 silverSupply.count > 0

  console.log(`   Overall can buy: ${canBuy}`)

  // 8. Attempt to purchase silver
  if (canBuy) {
    console.log('\n🛒 Attempting to purchase silver...')
    const prevCoins = humanPlayer.coins
    const prevBuys = humanPlayer.buys
    const prevCount = silverSupply.count
    const prevDiscardSize = humanPlayer.discard.length

    try {
      const result = engine.buyCard('silver')
      console.log(`   ✅ Purchase successful: ${result}`)
      
      // Verify state changes
      console.log(`\n📊 State Changes:`)
      console.log(`   Coins: ${prevCoins} → ${humanPlayer.coins} (${prevCoins - humanPlayer.coins} spent)`)
      console.log(`   Buys: ${prevBuys} → ${humanPlayer.buys} (${prevBuys - humanPlayer.buys} used)`)
      console.log(`   Silver count: ${prevCount} → ${silverSupply.count} (${prevCount - silverSupply.count} taken)`)
      console.log(`   Discard pile: ${prevDiscardSize} → ${humanPlayer.discard.length} (+${humanPlayer.discard.length - prevDiscardSize} cards)`)
      
      // Check if silver was added to discard
      const newCard = humanPlayer.discard[humanPlayer.discard.length - 1]
      console.log(`   New card in discard: ${newCard.name} (${newCard.id})`)
      
      console.log('\n🎉 Silver coin purchase test PASSED!')
      
    } catch (error) {
      console.log(`   ❌ Purchase failed: ${error.message}`)
      console.log('\n💥 Silver coin purchase test FAILED!')
    }
  } else {
    console.log('\n⚠️  Cannot purchase silver - conditions not met')
    
    // Suggest how to get enough coins
    if (humanPlayer.coins < silverSupply.cost) {
      const needed = silverSupply.cost - humanPlayer.coins
      console.log(`   Need ${needed} more coins to purchase silver`)
      console.log(`   Try playing more treasure cards or use action cards that give coins`)
    }
  }

} catch (error) {
  console.error('\n💥 Test failed with error:', error)
}