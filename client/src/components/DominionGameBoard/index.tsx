import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Card } from '@/types'
import { DominionEngine } from '@/utils/DominionEngine'
import { CardTooltip } from '@/components/UI/CardTooltip'

interface DominionGameBoardProps {
  onExitGame: () => void
  selectedCards?: any[]
}

export function DominionGameBoard({ onExitGame, selectedCards }: DominionGameBoardProps) {
  const [gameEngine] = useState(() => new DominionEngine((newGameState) => {
    console.log('🔄 ゲーム状態更新:', {
      turn: newGameState.turn,
      phase: newGameState.phase,
      currentPlayerIndex: newGameState.currentPlayerIndex,
      currentPlayer: newGameState.players[newGameState.currentPlayerIndex]?.name,
      isHuman: newGameState.players[newGameState.currentPlayerIndex]?.isHuman
    })
    setGameState(() => {
      // 強制的に新しい参照を作成して React の再レンダリングを確実にする
      return { ...newGameState }
    })
  }))
  
  const [gameState, setGameState] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCard, setSelectedCard] = useState<string | null>(null) // 選択されたカードID
  
  // ツールチップ状態
  const [tooltip, setTooltip] = useState<{
    show: boolean
    card: Card | null
    cost?: number
    position: { x: number; y: number }
  }>({
    show: false,
    card: null,
    position: { x: 0, y: 0 }
  })

  // ゲーム開始
  const startGame = () => {
    console.log('🎯 ドミニオンゲーム開始')
    setIsLoading(true)
    
    // タイムアウト処理を追加して5秒でローディングを解除
    const timeout = setTimeout(() => {
      console.warn('⚠️ ゲーム開始がタイムアウトしました')
      setIsLoading(false)
      toast.error('ゲームの開始がタイムアウトしました。もう一度お試しください。', {
        icon: '⏰',
        style: { borderLeft: '4px solid #ef4444' }
      })
    }, 5000)
    
    try {
      console.log('🎯 ゲームエンジン初期化開始')
      const newGameState = gameEngine.startGame(['プレイヤー', 'CPU'], selectedCards)
      console.log('🎯 ゲーム状態設定完了:', newGameState)
      
      clearTimeout(timeout) // タイムアウトをクリア
      setGameState(newGameState)
      setIsLoading(false)
      
      toast.success('🎯 ドミニオンゲームが開始されました！', {
        icon: '🎉',
        style: { borderLeft: '4px solid #10b981' },
        duration: 4000
      })
    } catch (error) {
      console.error('❌ ゲーム開始エラー:', error)
      clearTimeout(timeout) // エラー時もタイムアウトをクリア
      setIsLoading(false)
      toast.error(`ゲームの開始に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, {
        icon: '❌',
        style: { borderLeft: '4px solid #ef4444' }
      })
    }
  }

  // アクションカードをプレイ
  const playActionCard = (card: Card) => {
    if (!gameEngine.isCurrentPlayerHuman()) {
      toast.error('あなたのターンではありません')
      return
    }

    if (gameState.phase !== 'action') {
      toast.error('アクションカードはアクションフェーズでのみプレイできます')
      return
    }

    try {
      gameEngine.playActionCard(card.id)
      toast.success(`🎯 ${card.name} をプレイしました！`)
    } catch (error: any) {
      console.error('❌ アクションカードプレイエラー:', error)
      toast.error(error.message || 'アクションカードのプレイに失敗しました')
    }
  }

  // 財宝カードをプレイ
  const playTreasureCard = (card: Card) => {
    console.log('🎯 財宝カードプレイ試行:', card.name, card.id)
    console.log('現在の状態:', {
      isHuman: gameEngine.isCurrentPlayerHuman(),
      phase: gameState.phase,
      coins: gameState.players?.find((p: any) => p.isHuman)?.coins
    })

    if (!gameEngine.isCurrentPlayerHuman()) {
      toast.error('あなたのターンではありません')
      return
    }

    if (gameState.phase !== 'buy') {
      toast.error('財宝カードは購入フェーズでのみプレイできます')
      return
    }

    try {
      const result = gameEngine.playTreasureCard(card.id)
      console.log('🎯 財宝カードプレイ結果:', result)
      const coinEffect = card.effects?.find(e => e.type === 'gain_coin')
      toast.success(`💰 ${card.name} をプレイ！ +${coinEffect?.value || 0}コイン`)
    } catch (error: any) {
      console.error('❌ 財宝カードプレイエラー:', error)
      toast.error(error.message || '財宝カードのプレイに失敗しました')
    }
  }

  // カード選択
  const selectCard = (cardId: string) => {
    if (!gameEngine.isCurrentPlayerHuman()) {
      toast.error('あなたのターンではありません')
      return
    }

    if (gameState.phase !== 'buy') {
      toast.error('カードの選択は購入フェーズでのみ可能です')
      return
    }

    const pile = gameState.supply[cardId]
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    
    // 購入可能性チェック
    if (currentPlayer.coins < pile.cost) {
      toast.error(`コインが不足しています（必要: ${pile.cost}, 所持: ${currentPlayer.coins}）`)
      return
    }
    if (currentPlayer.buys <= 0) {
      toast.error('購入回数が残っていません')
      return
    }
    if (pile.count <= 0) {
      toast.error('在庫がありません')
      return
    }

    setSelectedCard(cardId)
    toast(`🎯 ${pile.card.name} を選択しました。確定ボタンで購入してください。`)
  }

  // 全ての財宝カードを一括プレイ
  const playAllTreasures = () => {
    if (!gameEngine.isCurrentPlayerHuman()) {
      toast.error('あなたのターンではありません')
      return
    }

    if (gameState.phase !== 'buy') {
      toast.error('財宝カードは購入フェーズでのみプレイできます')
      return
    }

    const treasureCards = gameState.players[gameState.currentPlayerIndex].hand.filter((card: Card) => card.type === 'Treasure')
    
    if (treasureCards.length === 0) {
      toast('財宝カードがありません', {
        icon: '💰',
        duration: 1000
      })
      return
    }

    let totalCoins = 0
    treasureCards.forEach((card: Card) => {
      try {
        gameEngine.playTreasureCard(card.id)
        const coinEffect = card.effects?.find(e => e.type === 'gain_coin')
        totalCoins += coinEffect?.value || 0
      } catch (error) {
        console.error('財宝カードプレイエラー:', error)
      }
    })

    toast.success(`💰 財宝一括プレイ +${totalCoins}コイン`, {
      duration: 1500,
      position: 'top-center'
    })
  }

  // カード購入確定
  const confirmPurchase = () => {
    if (!selectedCard) return

    try {
      gameEngine.buyCard(selectedCard)
      const pile = gameState.supply[selectedCard]
      // 簡略化したトースト
      toast.success(`🛒 ${pile.card.name}`, {
        duration: 1000,
        position: 'top-center'
      })
      setSelectedCard(null) // 選択解除
    } catch (error: any) {
      console.error('❌ カード購入エラー:', error)
      toast.error(error.message || 'カードの購入に失敗しました', {
        icon: '❌',
        style: { borderLeft: '4px solid #ef4444' }
      })
      setSelectedCard(null)
    }
  }

  // 選択キャンセル
  const cancelSelection = () => {
    setSelectedCard(null)
    toast('選択をキャンセルしました', {
      icon: '❌',
      style: { borderLeft: '4px solid #6b7280' }
    })
  }

  // フェーズ移行
  const moveToNextPhase = () => {
    console.log('🔄 フェーズ移行試行')
    console.log('現在の状態:', {
      isHuman: gameEngine.isCurrentPlayerHuman(),
      phase: gameState.phase,
      currentPlayer: gameState.players?.[gameState.currentPlayerIndex]?.name
    })

    if (!gameEngine.isCurrentPlayerHuman()) {
      toast.error('あなたのターンではありません')
      return
    }

    try {
      const success = gameEngine.moveToNextPhase()
      console.log('🔄 フェーズ移行結果:', success)
      if (!success) {
        toast.error('フェーズ移行に失敗しました', {
          icon: '❌',
          style: { borderLeft: '4px solid #ef4444' }
        })
        return
      }
      
      // 状態は gameEngine のコールバックで自動更新される
      console.log('🔄 フェーズ移行成功')
    } catch (error: any) {
      console.error('❌ フェーズ移行エラー:', error)
      toast.error(error.message || 'フェーズ移行に失敗しました', {
        icon: '❌',
        style: { borderLeft: '4px solid #ef4444' }
      })
    }
  }

  // ツールチップ表示関数
  const showTooltip = (card: Card, cost: number | undefined, event: React.MouseEvent) => {
    setTooltip({
      show: true,
      card,
      cost,
      position: { x: event.clientX, y: event.clientY }
    })
  }

  const hideTooltip = () => {
    setTooltip({
      show: false,
      card: null,
      position: { x: 0, y: 0 }
    })
  }

  // ゲーム開始前の画面
  if (!gameState) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            🏰 正統ドミニオン対戦
          </h1>
          <p className="text-xl text-zinc-300">
            本格的なドミニオンルールでCPUと対戦しよう
          </p>
        </div>

        <div className="card mb-6 border-2 border-purple-500/30 bg-purple-500/5">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">🏰</span>
            <h2 className="text-xl font-bold text-purple-400">正統ドミニオンについて</h2>
          </div>
          <div className="space-y-2 text-sm text-zinc-300">
            <p>• <strong>正確な3フェーズ制:</strong> アクション → 購入 → クリーンアップ</p>
            <p>• <strong>手動財宝プレイ:</strong> 購入フェーズで財宝カードを手動プレイ</p>
            <p>• <strong>プレイエリア:</strong> プレイしたカードは専用エリアに移動</p>
            <p>• <strong>正確なデッキ管理:</strong> 山札・手札・捨て札・プレイエリアの4領域</p>
            <p>• <strong>戦略的CPU:</strong> 序盤・中盤・終盤で異なる購入戦略</p>
          </div>
        </div>

        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-6">ゲーム開始</h2>
          <div className="space-y-4">
            <button
              onClick={startGame}
              disabled={isLoading}
              className="btn-primary text-lg px-8 py-3"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-spin">⚙️</span>
                  <span>カードを読み込み中...</span>
                </span>
              ) : (
                '🏰 ドミニオン対戦を開始'
              )}
            </button>
            <button
              onClick={onExitGame}
              className="btn-secondary text-lg px-8 py-3 ml-4"
            >
              ロビーに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  const humanPlayer = gameState.players.find((p: any) => p.isHuman)
  const cpuPlayer = gameState.players.find((p: any) => !p.isHuman)
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const isMyTurn = gameEngine.isCurrentPlayerHuman()

  // ゲーム終了画面
  if (gameState.isGameEnded) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center border-2 border-yellow-500/30 bg-yellow-500/5">
          <h1 className="text-3xl font-bold mb-6">🏁 ゲーム終了</h1>
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              🏆 勝者: {gameState.winner?.name}
            </h2>
            <p className="text-lg text-zinc-300 mb-4">{gameState.endReason}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="card border-blue-500/30">
              <h3 className="font-bold text-lg mb-2">👤 {humanPlayer.name}</h3>
              <p className="text-2xl font-bold text-blue-400">{humanPlayer.totalVictoryPoints}点</p>
              <p className="text-sm text-zinc-400">{humanPlayer.turnsPlayed}ターン</p>
            </div>
            <div className="card border-red-500/30">
              <h3 className="font-bold text-lg mb-2">🤖 {cpuPlayer.name}</h3>
              <p className="text-2xl font-bold text-red-400">{cpuPlayer.totalVictoryPoints}点</p>
              <p className="text-sm text-zinc-400">{cpuPlayer.turnsPlayed}ターン</p>
            </div>
          </div>

          <div className="space-x-4">
            <button onClick={startGame} className="btn-primary">
              🔄 もう一度プレイ
            </button>
            <button onClick={onExitGame} className="btn-secondary">
              ロビーに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* シンプルヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">🏰 ドミニオン</h1>
          <div className="text-sm text-zinc-400">ターン {gameState.turn}</div>
          {!isMyTurn && (
            <div className="flex items-center space-x-2 text-blue-400">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              <span className="text-sm">CPUターン</span>
            </div>
          )}
        </div>
        <button onClick={onExitGame} className="btn-secondary text-sm">
          終了
        </button>
      </div>

      {/* CPU visual feedback */}
      {!currentPlayer.isHuman && (
        <div className="card mb-4 border-2 border-orange-500/50 bg-orange-500/10">
          <div className="flex items-center justify-center space-x-3 py-3">
            <span className="text-2xl animate-spin">🤖</span>
            <div className="text-center">
              <div className="font-bold text-orange-300">{currentPlayer.name} のターン</div>
              <div className="text-sm text-orange-400 animate-pulse">
                {gameState.phase === 'action' && '⚡ アクションを考慮中...'}
                {gameState.phase === 'buy' && '💰 購入を検討中...'}
                {gameState.phase === 'cleanup' && '🔄 クリーンアップ中...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 統計と勝利条件 (最上部) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 統計 */}
        <div className="card">
          <h3 className="font-bold mb-3">📊 統計</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-400">👤 {humanPlayer.name}</div>
              <div className="text-xs text-zinc-400">山札: {humanPlayer.deck.length} | 捨て札: {humanPlayer.discard.length} | 勝利点: {humanPlayer.totalVictoryPoints || 3}</div>
            </div>
            <div>
              <div className="font-medium text-red-400">🤖 {cpuPlayer.name}</div>
              <div className="text-xs text-zinc-400">山札: {cpuPlayer.deck.length} | 捨て札: {cpuPlayer.discard.length} | 勝利点: {cpuPlayer.totalVictoryPoints || 3}</div>
            </div>
          </div>
        </div>
        
        {/* 勝利条件 */}
        <div className="card">
          <h3 className="font-bold mb-3">🏆 勝利条件</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>👑 属州</span>
              <span className={`font-bold ${
                gameState.supply.province.count <= 3 ? 'text-red-400' :
                gameState.supply.province.count <= 6 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {gameState.supply.province.count}/12
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>📦 枯渇サプライ</span>
              <span className={`font-bold ${
                Object.values(gameState.supply).filter((pile: any) => pile.count === 0).length >= 2 ? 'text-red-400' :
                Object.values(gameState.supply).filter((pile: any) => pile.count === 0).length >= 1 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {Object.values(gameState.supply).filter((pile: any) => pile.count === 0).length}/3
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 簡略プレイヤー情報 - CPUターン時のみ */}
      {!isMyTurn && (
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold">
                {currentPlayer.isHuman ? '👤' : '🤖'} {currentPlayer.name}
              </span>
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-sm">
                CPUのターン
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* フェーズ表示 */}
              <div className={`px-3 py-2 rounded text-sm font-medium ${
                gameState.phase === 'action' ? 'bg-blue-500/20 text-blue-400' :
                gameState.phase === 'buy' ? 'bg-green-500/20 text-green-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {gameState.phase === 'action' && '🎯 アクション'}
                {gameState.phase === 'buy' && '💰 購入'}
                {gameState.phase === 'cleanup' && '🔄 クリーンアップ'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* プレイヤー状態エリア - 手札の上 */}
      {isMyTurn && (
        <div className="card mb-4 border-2 border-blue-500/30 bg-blue-500/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* プレイヤー情報 */}
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold">
                {currentPlayer.isHuman ? '👤' : '🤖'} {currentPlayer.name}
              </span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                あなたのターン
              </span>
            </div>
            
            {/* フェーズ表示 */}
            <div className="text-center">
              <div className={`px-3 py-2 rounded text-sm font-medium ${
                gameState.phase === 'action' ? 'bg-blue-500/20 text-blue-400' :
                gameState.phase === 'buy' ? 'bg-green-500/20 text-green-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {gameState.phase === 'action' && '🎯 アクション'}
                {gameState.phase === 'buy' && '💰 購入'}
                {gameState.phase === 'cleanup' && '🔄 クリーンアップ'}
              </div>
            </div>
            
            {/* リソース表示 - 目立つサイズ */}
            <div className="flex items-center justify-center md:justify-end space-x-4">
              <div className="text-center p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <div className="text-2xl font-bold text-yellow-400">{humanPlayer.coins}</div>
                <div className="text-xs text-yellow-300">💰 コイン</div>
              </div>
              <div className="text-center p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400">{humanPlayer.actions}</div>
                <div className="text-xs text-blue-300">⚡ アクション</div>
              </div>
              <div className="text-center p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                <div className="text-2xl font-bold text-green-400">{humanPlayer.buys}</div>
                <div className="text-xs text-green-300">🛍 購入</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 手札 - 横並びレイアウト */}
      {isMyTurn && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">🃏 手札 ({humanPlayer.hand.length}枚)</h3>
            
            {/* 主要アクションボタン */}
            <div className="flex space-x-2">
              {gameState.phase === 'buy' && (
                <button
                  onClick={playAllTreasures}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
                >
                  <span>💰</span>
                  <span>財宝一括</span>
                </button>
              )}
              
              <button
                onClick={moveToNextPhase}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
              >
                <span>➡️</span>
                <span>
                  {gameState.phase === 'action' ? '購入へ' : 'ターン終了'}
                </span>
              </button>
            </div>
          </div>
          
          {/* カード購入確認 */}
          {selectedCard && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm">🎯 {gameState.supply[selectedCard].card.name} を選択中</span>
                <div className="flex space-x-2">
                  <button
                    onClick={confirmPurchase}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    ✅ 購入
                  </button>
                  <button
                    onClick={cancelSelection}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    ❌
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 手札カード - 横並びグリッド */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {humanPlayer.hand.map((card: Card, index: number) => (
              <div
                key={`${card.id}-${index}`}
                className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:transform hover:scale-105 ${
                  card.type === 'Action' && gameState.phase === 'action' && isMyTurn
                    ? 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20'
                    : card.type === 'Treasure' && gameState.phase === 'buy' && isMyTurn
                      ? 'border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20'
                      : card.type === 'Victory'
                        ? 'border-purple-500/30 bg-purple-500/5'
                        : 'border-zinc-600'
                }`}
                onClick={() => {
                  if (card.type === 'Action' && gameState.phase === 'action' && isMyTurn) {
                    playActionCard(card)
                  } else if (card.type === 'Treasure' && gameState.phase === 'buy' && isMyTurn) {
                    playTreasureCard(card)
                  }
                }}
                onMouseEnter={(e) => showTooltip(card, undefined, e)}
                onMouseLeave={hideTooltip}
              >
                <div className="text-center">
                  <div className="font-medium text-sm mb-1 leading-tight">{card.name}</div>
                  <div className="text-xl mb-1">
                    {card.type === 'Action' && '⚡'}
                    {card.type === 'Treasure' && '💰'}
                    {card.type === 'Victory' && '👑'}
                  </div>
                  {card.type === 'Treasure' && (
                    <div className="text-xs text-yellow-400">
                      +{card.effects?.find(e => e.type === 'gain_coin')?.value || 0}
                    </div>
                  )}
                  {card.type === 'Victory' && card.victoryPoints && (
                    <div className="text-xs text-purple-400">
                      {card.victoryPoints}VP
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* サプライ - 1カラム全幅表示 */}
      <div className="card mb-6">
        <h3 className="font-bold mb-4">🏪 サプライ</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-3">
          {Object.entries(gameState.supply).map(([cardId, pile]: [string, any]) => {
            const canBuy = gameState.phase === 'buy' && isMyTurn && 
                          currentPlayer.coins >= pile.cost && 
                          currentPlayer.buys > 0 && 
                          pile.count > 0
            const isSelected = selectedCard === cardId
            const isEmpty = pile.count === 0
            const isLowStock = pile.count <= 2 && pile.count > 0

            return (
              <div
                key={cardId}
                className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:transform hover:scale-105 ${
                  isEmpty
                    ? 'border-red-500/50 bg-red-500/10 opacity-50 cursor-not-allowed'
                    : isSelected
                      ? 'border-yellow-500 bg-yellow-500/20 ring-2 ring-yellow-500'
                      : canBuy 
                        ? 'border-green-500 bg-green-500/10 hover:bg-green-500/20' 
                        : gameState.phase === 'buy' && isMyTurn
                          ? 'border-red-500/50 bg-red-500/5'
                          : 'border-zinc-600 hover:border-zinc-400'
                } ${
                  isLowStock && !isEmpty ? 'ring-1 ring-orange-500/50' : ''
                }`}
                onClick={() => {
                  if (gameState.phase === 'buy' && isMyTurn && !isEmpty) {
                    selectCard(cardId)
                  }
                }}
                onMouseEnter={(e) => showTooltip(pile.card, pile.cost, e)}
                onMouseLeave={hideTooltip}
              >
                <div className="text-center">
                  <div className="font-medium text-sm mb-1 leading-tight">{pile.card.name}</div>
                  <div className="text-lg mb-1">
                    {pile.card.type === 'Victory' && <span className="text-yellow-400">👑</span>}
                    {pile.card.type === 'Treasure' && <span className="text-yellow-500">💰</span>}
                    {pile.card.type === 'Action' && <span className="text-blue-400">⚡</span>}
                  </div>
                  
                  <div className={`text-xs font-bold px-1 py-0.5 rounded mb-1 ${
                    canBuy ? 'bg-green-500/30 text-green-200' :
                    gameState.phase === 'buy' && isMyTurn ? 'bg-red-500/30 text-red-200' :
                    'bg-zinc-600/30 text-zinc-300'
                  }`}>
                    {pile.cost}💳
                  </div>
                  
                  <div className={`text-xs ${
                    isEmpty ? 'text-red-400' :
                    isLowStock ? 'text-orange-400' :
                    'text-zinc-400'
                  }`}>
                    {isEmpty ? '売切れ' : `${pile.count}枚`}
                  </div>
                  
                  {pile.card.victoryPoints && (
                    <div className="text-xs text-yellow-400 mt-1">
                      {pile.card.victoryPoints}VP
                    </div>
                  )}
                  
                  {pile.card.effects && pile.card.type === 'Treasure' && (
                    <div className="text-xs text-yellow-400 mt-1">
                      +{pile.card.effects.find((e: any) => e.type === 'gain_coin')?.value || 0}💰
                    </div>
                  )}
                  
                  {pile.card.effects && pile.card.type === 'Action' && (
                    <div className="text-xs text-blue-400 mt-1 space-y-0.5">
                      {pile.card.effects.map((effect: any, index: number) => (
                        <div key={index} className="flex items-center justify-center space-x-1">
                          {effect.type === 'draw' && (
                            <>
                              <span>+{effect.value}</span>
                              <span>🃏</span>
                            </>
                          )}
                          {effect.type === 'gain_action' && (
                            <>
                              <span>+{effect.value}</span>
                              <span>⚡</span>
                            </>
                          )}
                          {effect.type === 'gain_buy' && (
                            <>
                              <span>+{effect.value}</span>
                              <span>🛍</span>
                            </>
                          )}
                          {effect.type === 'gain_coin' && (
                            <>
                              <span>+{effect.value}</span>
                              <span>💰</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ゲームログ（下部） */}
      <div className="mt-6">
        <div className="card">
          <h3 className="font-bold text-lg mb-4">📜 ゲームログ</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {gameState.log && gameState.log.length > 0 ? (
              gameState.log.slice(-10).map((entry: any, index: number) => (
                <div key={index} className="text-sm text-zinc-300">
                  <span className="text-zinc-500">T{entry.turn}:</span> 
                  <span className="font-medium">{entry.player}</span> - {entry.action}
                  {entry.details && <span className="text-zinc-400"> ({entry.details})</span>}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-zinc-400">
                <span className="text-xl">📜</span>
                <p className="text-sm">ゲームログはここに表示されます</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ツールチップ */}
      {tooltip.card && (
        <CardTooltip
          card={tooltip.card}
          cost={tooltip.cost}
          show={tooltip.show}
          position={tooltip.position}
        />
      )}
    </div>
  )
}

export default DominionGameBoard