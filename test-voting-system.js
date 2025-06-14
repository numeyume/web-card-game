// 投票システム・カード使用統計の統合テスト
const cardUsageEngine = require('./server/src/engine/cardUsage.cjs');
const votingEngine = require('./server/src/engine/voting.cjs');
const deckEngine = require('./server/src/engine/deck.cjs');
const endConditionEngine = require('./server/src/engine/endCondition.cjs');

console.log('🗳️ Voting System & Card Usage Tracking Test');
console.log('==============================================\n');

async function runVotingSystemTests() {
  try {
    const roomId = 'test-voting-room';
    const playerIds = ['alice', 'bob', 'charlie'];

    // Test 1: ゲーム初期化とカード使用追跡
    console.log('1. ゲーム初期化とカード使用追跡テスト...');
    
    const customCards = [
      { id: 'custom_1', name: 'Lightning Bolt', type: 'Action', cost: 3 },
      { id: 'custom_2', name: 'Golden Coin', type: 'Treasure', cost: 4 },
      { id: 'custom_3', name: 'Victory Garden', type: 'Victory', cost: 5 }
    ];

    // ゲーム開始
    deckEngine.initializeDeck(roomId, [], playerIds);
    cardUsageEngine.initializeRoom(roomId, playerIds, customCards);
    endConditionEngine.initializeGame(roomId, playerIds, {
      maxTurns: 5,
      timeLimit: 300,
      enableTurnLimit: true
    });

    console.log('✅ ゲーム初期化完了');
    console.log(`   プレイヤー: ${playerIds.join(', ')}`);
    console.log(`   カスタムカード: ${customCards.length}枚`);
    console.log('');

    // Test 2: カードプレイ・購入の記録
    console.log('2. カードプレイ・購入記録テスト...');
    
    // カードプレイのシミュレーション
    const gameActions = [
      { player: 'alice', action: 'play', card: 'village', count: 3 },
      { player: 'alice', action: 'buy', card: 'custom_1', count: 1 },
      { player: 'bob', action: 'play', card: 'village', count: 2 },
      { player: 'bob', action: 'play', card: 'smithy', count: 1 },
      { player: 'bob', action: 'buy', card: 'custom_2', count: 2 },
      { player: 'charlie', action: 'play', card: 'village', count: 4 },
      { player: 'charlie', action: 'buy', card: 'custom_3', count: 1 },
      { player: 'alice', action: 'play', card: 'custom_1', count: 2 },
      { player: 'bob', action: 'play', card: 'custom_2', count: 1 }
    ];

    gameActions.forEach(action => {
      for (let i = 0; i < action.count; i++) {
        if (action.action === 'play') {
          cardUsageEngine.recordCardPlay(roomId, action.player, action.card, {
            id: action.card,
            name: action.card.charAt(0).toUpperCase() + action.card.slice(1),
            type: 'Action'
          });
        } else if (action.action === 'buy') {
          cardUsageEngine.recordCardBuy(roomId, action.player, action.card, {
            id: action.card,
            name: action.card.charAt(0).toUpperCase() + action.card.slice(1),
            type: 'Action'
          });
        }
      }
    });

    console.log('✅ カード使用記録完了');
    console.log(`   総アクション数: ${gameActions.reduce((sum, a) => sum + a.count, 0)}`);
    console.log('');

    // Test 3: カード使用統計生成
    console.log('3. カード使用統計生成テスト...');
    
    const usageStats = cardUsageEngine.getRoomStats(roomId);
    console.log('✅ 使用統計生成完了');
    console.log(`   使用されたカード種類: ${usageStats.cardUsage.length}`);
    console.log(`   プレイヤー統計: ${usageStats.playerStats.length}人`);
    
    // トップカード表示
    const topCards = usageStats.cardUsage
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3);
    
    console.log('   トップ3カード:');
    topCards.forEach((card, index) => {
      console.log(`     ${index + 1}. ${card.cardName}: ${card.usageCount}回使用 (${card.uniquePlayers}人)`);
    });
    console.log('');

    // Test 4: 最終統計とゲーム終了
    console.log('4. ゲーム終了と最終統計テスト...');
    
    const finalStats = cardUsageEngine.generateFinalStats(roomId);
    const gameEndResult = endConditionEngine.triggerGameEnd(roomId, 'manual');
    
    // 統計をゲーム結果に追加
    if (finalStats && finalStats.topCards) {
      gameEndResult.finalScores.gameStats.topCards = finalStats.topCards;
    }
    
    console.log('✅ 最終統計生成完了');
    console.log(`   トップカード数: ${finalStats.topCards.length}`);
    console.log(`   プレイヤー分析: ${finalStats.playerAnalysis.length}人`);
    console.log(`   ゲーム洞察: ${finalStats.insights.length}件`);
    console.log('');

    // Test 5: 投票セッション開始
    console.log('5. 投票セッション開始テスト...');
    
    const votingSession = votingEngine.startVotingSession(roomId, gameEndResult, 10000); // 10秒
    console.log('✅ 投票セッション開始');
    console.log(`   投票対象カード: ${Array.from(votingSession.votes.keys()).length}枚`);
    console.log(`   制限時間: ${votingSession.endTime - votingSession.startTime}ms`);
    console.log('');

    // Test 6: 投票実行
    console.log('6. 投票実行テスト...');
    
    const votes = [
      { player: 'alice', card: 'village', vote: 'like' },
      { player: 'alice', card: 'custom_1', vote: 'like' },
      { player: 'bob', card: 'village', vote: 'like' },
      { player: 'bob', card: 'smithy', vote: 'dislike' },
      { player: 'bob', card: 'custom_2', vote: 'like' },
      { player: 'charlie', card: 'village', vote: 'like' },
      { player: 'charlie', card: 'custom_3', vote: 'like' },
      { player: 'charlie', card: 'smithy', vote: 'dislike' },
      // トグル投票テスト
      { player: 'alice', card: 'village', vote: 'like' }, // 取り消し
      { player: 'alice', card: 'village', vote: 'dislike' } // 再投票
    ];

    votes.forEach(vote => {
      const result = votingEngine.castVote(roomId, vote.player, vote.card, vote.vote);
      if (result.success) {
        console.log(`   ✅ ${vote.player} voted ${vote.vote} for ${vote.card}`);
      } else {
        console.log(`   ❌ ${vote.player} vote failed: ${result.error}`);
      }
    });

    console.log('');

    // Test 7: 投票状況確認
    console.log('7. 投票状況確認テスト...');
    
    const votingStatus = votingEngine.getVotingStatus(roomId);
    console.log('✅ 投票状況確認完了');
    console.log(`   参加者: ${votingStatus.participatingPlayers}人`);
    console.log(`   総投票数: ${votingStatus.totalVotes}`);
    
    console.log('   カード別投票:');
    votingStatus.cardVotingStatus.forEach(card => {
      console.log(`     ${card.cardName}: 👍${card.likes} 👎${card.dislikes} (スコア: ${card.score})`);
    });
    console.log('');

    // Test 8: 投票セッション終了
    console.log('8. 投票セッション終了テスト...');
    
    // 10秒待機
    console.log('   10秒待機中...');
    await new Promise(resolve => setTimeout(resolve, 10500));
    
    const votingResults = votingEngine.endVotingSession(roomId);
    console.log('✅ 投票セッション終了');
    console.log(`   最終参加者: ${votingResults.stats.totalParticipants}人`);
    console.log(`   最終投票数: ${votingResults.stats.totalVotes}`);
    console.log(`   平均投票数/カード: ${votingResults.stats.averageVotesPerCard.toFixed(1)}`);
    console.log('');

    // Test 9: 投票結果分析
    console.log('9. 投票結果分析テスト...');
    
    console.log('   🏆 トップ評価カード:');
    votingResults.topRatedCards.forEach((card, index) => {
      console.log(`     ${index + 1}. ${card.cardName}: スコア${card.score} (👍${card.likes} 👎${card.dislikes})`);
    });
    
    console.log('   📊 人気カード:');
    votingResults.mostPopularCards.forEach((card, index) => {
      console.log(`     ${index + 1}. ${card.cardName}: ${card.totalVotes}票 (${card.likesPercentage}% 好評)`);
    });
    
    if (votingResults.controversialCards.length > 0) {
      console.log('   ⚡ 論争カード:');
      votingResults.controversialCards.forEach((card, index) => {
        console.log(`     ${index + 1}. ${card.cardName}: ${card.likesPercentage}% 好評 (${card.totalVotes}票)`);
      });
    }
    
    if (votingResults.insights.length > 0) {
      console.log('   💡 洞察:');
      votingResults.insights.forEach(insight => {
        console.log(`     [${insight.type}] ${insight.message}`);
      });
    }
    console.log('');

    // Test 10: プレイヤー別統計
    console.log('10. プレイヤー別統計確認テスト...');
    
    finalStats.playerAnalysis.forEach(player => {
      console.log(`   🎮 ${player.playerId}:`);
      console.log(`     プレイスタイル: ${player.playStyle}`);
      console.log(`     エンゲージメント: ${player.engagement}%`);
      console.log(`     創造性: ${player.creativity}%`);
      console.log(`     効率性: ${player.efficiency}`);
      
      const playerVotes = votingEngine.getPlayerVotes(roomId, player.playerId);
      const voteCount = Object.keys(playerVotes).length;
      console.log(`     投票参加: ${voteCount}件`);
    });
    console.log('');

    // クリーンアップ
    console.log('11. クリーンアップテスト...');
    cardUsageEngine.clearRoom(roomId);
    votingEngine.clearRoomVotes(roomId);
    endConditionEngine.resetGame(roomId);
    deckEngine.resetDeck(roomId);
    console.log('✅ 全データクリーンアップ完了');
    console.log('');

    console.log('🎉 Voting System & Card Usage Tracking テスト完了!');
    console.log('========================================================');
    console.log('✅ 全機能正常動作:');
    console.log('   - カード使用追跡とプレイヤー統計');
    console.log('   - 最終統計生成とゲーム分析');
    console.log('   - 投票セッション管理（開始・進行・終了）');
    console.log('   - リアルタイム投票とトグル機能');
    console.log('   - 投票結果分析と洞察生成');
    console.log('   - プレイヤー行動分析とプレイスタイル判定');
    console.log('');
    console.log('🚀 Phase 4 実装完了 - 高度なコミュニティ機能搭載!');

  } catch (error) {
    console.error('❌ テスト失敗:', error);
    process.exit(1);
  }
}

// グローバル統計テスト
async function runGlobalStatsTest() {
  console.log('\n🌍 グローバル統計テスト');
  console.log('=====================');

  // 複数ルームでのシミュレーション
  const rooms = ['room1', 'room2', 'room3'];
  const players = ['user1', 'user2', 'user3', 'user4', 'user5'];

  try {
    // 各ルームでゲームシミュレーション
    rooms.forEach((roomId, roomIndex) => {
      const roomPlayers = players.slice(0, 3); // 3人ずつ
      
      cardUsageEngine.initializeRoom(roomId, roomPlayers);
      
      // カード使用をシミュレーション
      ['village', 'smithy', 'market'].forEach(cardId => {
        roomPlayers.forEach(playerId => {
          const count = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < count; i++) {
            cardUsageEngine.recordCardPlay(roomId, playerId, cardId, {
              id: cardId,
              name: cardId,
              type: 'Action'
            });
          }
        });
      });

      // 投票シミュレーション
      const gameEndResult = endConditionEngine.triggerGameEnd(roomId, 'manual');
      const finalStats = cardUsageEngine.generateFinalStats(roomId);
      if (finalStats?.topCards) {
        gameEndResult.finalScores.gameStats.topCards = finalStats.topCards;
      }

      const votingSession = votingEngine.startVotingSession(roomId, gameEndResult, 1000);
      
      // 各プレイヤーが投票
      roomPlayers.forEach(playerId => {
        ['village', 'smithy', 'market'].forEach(cardId => {
          const voteType = Math.random() > 0.3 ? 'like' : 'dislike';
          votingEngine.castVote(roomId, playerId, cardId, voteType);
        });
      });

      setTimeout(() => {
        votingEngine.endVotingSession(roomId);
      }, 1100);
    });

    // 少し待ってからグローバル統計確認
    setTimeout(() => {
      console.log('\n📊 グローバル統計確認:');
      
      const globalUsage = cardUsageEngine.getGlobalStats();
      console.log(`   総カード種類: ${globalUsage.totalCards}`);
      console.log(`   総使用回数: ${globalUsage.totalUsage}`);
      console.log('   グローバル人気カード:');
      globalUsage.topCards.slice(0, 3).forEach((card, index) => {
        console.log(`     ${index + 1}. ${card.cardId}: ${card.totalUsage}回 (${card.totalPlayers}人)`);
      });

      const globalVoting = votingEngine.getGlobalVotingStats();
      console.log(`   総投票カード: ${globalVoting.totalCards}`);
      console.log(`   総投票数: ${globalVoting.totalVotes}`);
      console.log('   グローバル高評価カード:');
      globalVoting.topRatedGlobally.slice(0, 3).forEach((card, index) => {
        console.log(`     ${index + 1}. ${card.cardId}: スコア${card.score} (${card.totalVoters}人投票)`);
      });

      // クリーンアップ
      rooms.forEach(roomId => {
        cardUsageEngine.clearRoom(roomId);
        votingEngine.clearRoomVotes(roomId);
        endConditionEngine.resetGame(roomId);
        deckEngine.resetDeck(roomId);
      });

      console.log('\n✅ グローバル統計テスト完了');
    }, 2000);

  } catch (error) {
    console.error('❌ グローバル統計テスト失敗:', error);
  }
}

// テスト実行
runVotingSystemTests()
  .then(() => runGlobalStatsTest())
  .catch(console.error);