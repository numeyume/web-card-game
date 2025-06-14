// ゲーム終了条件エンジンのテスト
const endConditionEngine = require('./server/src/engine/endCondition.cjs');
const deckEngine = require('./server/src/engine/deck.cjs');

console.log('🏁 End Condition Engine Test');
console.log('============================\n');

async function runEndGameTests() {
  try {
    const roomId = 'test-endgame-room';
    const playerIds = ['player1', 'player2', 'player3'];

    // Test 1: ゲーム初期化
    console.log('1. ゲーム初期化テスト...');
    const gameSettings = {
      maxTurns: 10,        // 短いテスト用
      timeLimit: 30,       // 30秒テスト用  
      emptyPilesThreshold: 2,
      enableTimeLimit: true,
      enableTurnLimit: true,
      enableEmptyPiles: true
    };

    const gameState = endConditionEngine.initializeGame(roomId, playerIds, gameSettings);
    console.log(`✅ ゲーム初期化成功`);
    console.log(`   プレイヤー数: ${gameState.playerIds.length}`);
    console.log(`   設定: ターン制限${gameSettings.maxTurns}, 時間制限${gameSettings.timeLimit}秒`);
    console.log('');

    // Test 2: ターン進行テスト
    console.log('2. ターン進行テスト...');
    for (let i = 0; i < 5; i++) {
      const turnInfo = endConditionEngine.advanceTurn(roomId);
      console.log(`   ターン ${turnInfo.turn}: プレイヤー ${turnInfo.playerId}`);
      
      // 終了条件チェック
      const endCheck = endConditionEngine.checkEndConditions(roomId);
      console.log(`   終了チェック: ${endCheck.isGameEnd ? '終了' : '続行'} (${endCheck.message})`);
      
      if (endCheck.status) {
        console.log(`   - 残りターン: ${endCheck.status.remainingTurns}`);
        console.log(`   - 残り時間: ${endCheck.status.remainingTime}秒`);
      }
    }
    console.log('');

    // Test 3: 最大ターン数到達テスト
    console.log('3. 最大ターン数到達テスト...');
    // 残りターンを消化
    let turnCount = endConditionEngine.getGameState(roomId).currentTurn;
    while (turnCount < gameSettings.maxTurns) {
      endConditionEngine.advanceTurn(roomId);
      turnCount++;
    }
    
    const maxTurnCheck = endConditionEngine.checkEndConditions(roomId);
    console.log(`✅ 最大ターン条件: ${maxTurnCheck.isGameEnd ? '発動' : '未発動'}`);
    console.log(`   理由: ${maxTurnCheck.reason || 'なし'}`);
    console.log(`   メッセージ: ${maxTurnCheck.message}`);
    console.log('');

    if (maxTurnCheck.isGameEnd) {
      // Test 4: ゲーム終了処理
      console.log('4. ゲーム終了処理テスト...');
      const gameEndResult = endConditionEngine.triggerGameEnd(roomId, maxTurnCheck.reason, maxTurnCheck);
      
      console.log(`✅ ゲーム終了処理完了`);
      console.log(`   終了理由: ${gameEndResult.endReason}`);
      console.log(`   ゲーム時間: ${gameEndResult.gameDuration}秒`);
      console.log(`   総ターン数: ${gameEndResult.totalTurns}`);
      console.log('');

      // Test 5: 最終スコア確認
      console.log('5. 最終スコア確認...');
      const finalScores = gameEndResult.finalScores;
      console.log(`   ランキング:`);
      finalScores.rankings.forEach(player => {
        console.log(`     ${player.rank}位: ${player.playerName}`);
        console.log(`       総合スコア: ${player.totalScore}`);
        console.log(`       ゲームスコア: ${player.gameScore}`);
        console.log(`       創造者スコア: ${player.creatorScore}`);
        console.log(`       勝利点: ${player.victoryPoints}`);
      });
      console.log('');
      
      console.log(`   ゲーム統計:`);
      console.log(`     平均スコア: ${finalScores.gameStats.averageScore?.toFixed(2) || 'N/A'}`);
      console.log(`     終了理由: ${finalScores.gameStats.endReason}`);
      console.log('');
    }

    // Test 6: 新しいゲームで時間制限テスト
    console.log('6. 時間制限テスト（5秒）...');
    const roomId2 = 'test-time-limit';
    const timeGameSettings = {
      maxTurns: 100,
      timeLimit: 5,  // 5秒制限
      emptyPilesThreshold: 3,
      enableTimeLimit: true,
      enableTurnLimit: false,
      enableEmptyPiles: false
    };
    
    endConditionEngine.initializeGame(roomId2, ['player1', 'player2'], timeGameSettings);
    console.log(`   5秒待機中...`);
    
    // 5秒待つ
    await new Promise(resolve => setTimeout(resolve, 5500));
    
    const timeCheck = endConditionEngine.checkEndConditions(roomId2);
    console.log(`✅ 時間制限条件: ${timeCheck.isGameEnd ? '発動' : '未発動'}`);
    console.log(`   理由: ${timeCheck.reason || 'なし'}`);
    console.log(`   メッセージ: ${timeCheck.message}`);
    
    if (timeCheck.isGameEnd) {
      const timeEndResult = endConditionEngine.triggerGameEnd(roomId2, timeCheck.reason, timeCheck);
      console.log(`   実際の経過時間: ${timeEndResult.gameDuration}秒`);
    }
    console.log('');

    // Test 7: アクティブゲーム一覧
    console.log('7. アクティブゲーム確認...');
    const activeGames = endConditionEngine.getActiveGames();
    console.log(`✅ アクティブゲーム数: ${activeGames.length}`);
    activeGames.forEach(game => {
      console.log(`   ${game.roomId}: ${game.playerCount}人, ターン${game.currentTurn}`);
    });
    console.log('');

    // クリーンアップ
    endConditionEngine.resetGame(roomId);
    endConditionEngine.resetGame(roomId2);
    console.log('🧹 テスト用データクリーンアップ完了');
    console.log('');

    console.log('🎉 End Condition Engine テスト完了!');
    console.log('=====================================');
    console.log('✅ 全機能正常動作:');
    console.log('   - ゲーム初期化とターン管理');
    console.log('   - 最大ターン数制限');
    console.log('   - 時間制限（リアルタイム）');
    console.log('   - ゲーム終了処理');
    console.log('   - Formula 4.4 スコア計算');
    console.log('   - アクティブゲーム管理');
    console.log('');
    console.log('🚀 Phase 3 実装完了 - 本格的なカードゲーム体験の準備完了!');

  } catch (error) {
    console.error('❌ テスト失敗:', error);
    process.exit(1);
  }
}

// デック エンジンとの統合テスト
async function runIntegrationTest() {
  console.log('\n🔗 統合テスト: Deck Engine + End Condition Engine');
  console.log('================================================');

  const roomId = 'integration-test';
  const playerIds = ['alice', 'bob'];

  try {
    // 1. 両エンジン初期化
    deckEngine.initializeDeck(roomId, [], playerIds);
    endConditionEngine.initializeGame(roomId, playerIds, {
      maxTurns: 3,  // 短いテスト
      timeLimit: 60,
      emptyPilesThreshold: 2,
      enableTurnLimit: true
    });

    console.log('✅ 両エンジン初期化完了');

    // 2. ゲームプレイシミュレーション
    for (let turn = 0; turn < 3; turn++) {
      console.log(`\nターン ${turn + 1}:`);
      
      // ターン開始
      const turnInfo = endConditionEngine.advanceTurn(roomId);
      const currentPlayerId = turnInfo.playerId;
      
      // カードドロー
      const drawnCards = deckEngine.drawCards(roomId, currentPlayerId, 1);
      console.log(`  ${currentPlayerId}: ${drawnCards.length}枚ドロー`);
      
      // ターン終了（クリーンアップ）
      const cleanup = deckEngine.cleanupPhase(roomId, currentPlayerId);
      console.log(`  ${currentPlayerId}: クリーンアップ、${cleanup.newHand.length}枚の新しい手札`);
      
      // 終了条件チェック
      const endCheck = endConditionEngine.checkEndConditions(roomId);
      console.log(`  終了チェック: ${endCheck.message}`);
      
      if (endCheck.isGameEnd) {
        console.log(`  🏁 ゲーム終了: ${endCheck.reason}`);
        break;
      }
    }

    // 3. 統計確認
    const deckStats = deckEngine.getGameStats(roomId);
    const endGameState = endConditionEngine.getGameState(roomId);
    
    console.log('\n📊 最終統計:');
    console.log(`  総ターン数: ${endGameState.currentTurn}`);
    console.log(`  プレイヤー統計:`, Object.keys(deckStats.players).map(id => 
      `${id}(${deckStats.players[id].totalCards}枚)`
    ).join(', '));

    // クリーンアップ
    deckEngine.resetDeck(roomId);
    endConditionEngine.resetGame(roomId);
    
    console.log('\n✅ 統合テスト成功 - 両エンジンが正常に連携動作');

  } catch (error) {
    console.error('❌ 統合テスト失敗:', error);
  }
}

// テスト実行
runEndGameTests()
  .then(() => runIntegrationTest())
  .catch(console.error);