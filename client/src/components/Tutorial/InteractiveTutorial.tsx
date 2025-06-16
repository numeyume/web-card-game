import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { Card } from '@/types'
import { DominionEngine } from '@/utils/DominionEngine'
import { CardTooltip } from '@/components/UI/CardTooltip'
import { EndGameModal } from '@/components/EndGameModal'

interface InteractiveTutorialProps {
  onComplete: () => void
  onExit: () => void
  selectedCards?: any[]
  isCPUMode?: boolean
}

export function InteractiveTutorial({ onComplete, onExit, selectedCards, isCPUMode = false }: InteractiveTutorialProps) {
  const [gameEngine] = useState(() => new DominionEngine((newGameState) => {
    console.log('🔄 ゲーム状態更新:', {
      turn: newGameState.turn,
      phase: newGameState.phase,
      currentPlayerIndex: newGameState.currentPlayerIndex,
      currentPlayer: newGameState.players[newGameState.currentPlayerIndex]?.name,
      isHuman: newGameState.players[newGameState.currentPlayerIndex]?.isHuman,
      isGameEnded: newGameState.isGameEnded,
      winner: newGameState.winner?.name
    })
    setGameState({ ...newGameState })
  }))
  
  const [gameState, setGameState] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [showEndGameModal, setShowEndGameModal] = useState(false)
  
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

  useEffect(() => {
    if (gameState?.isGameEnded && gameState?.winner) {
      setShowEndGameModal(true)
    }
  }, [gameState])

  // ゲーム開始関数（useCallbackで安定化）
  const startGame = useCallback(() => {
    console.log('🎯 InteractiveTutorial - ゲーム開始試行', { 
      selectedCards, 
      isCPUMode, 
      gameEngineExists: !!gameEngine,
      cardCount: selectedCards?.length || 0
    })
    
    setIsLoading(true)
    
    const timeout = setTimeout(() => {
      console.warn('⚠️ ゲーム開始がタイムアウトしました')
      setIsLoading(false)
      toast.error('ゲームの開始がタイムアウトしました。もう一度お試しください。')
    }, 5000)
    
    try {
      if (!gameEngine) {
        throw new Error('ゲームエンジンが初期化されていません')
      }

      const playerNames = isCPUMode ? ['プレイヤー', 'CPU'] : ['あなた', 'チュートリアルCPU']
      console.log('🎯 DominionEngine.startGame呼び出し中...', { playerNames, selectedCards })
      
      const newGameState = gameEngine.startGame(playerNames, selectedCards)
      
      if (!newGameState) {
        throw new Error('ゲーム状態の初期化に失敗しました')
      }
      
      console.log('🎯 ゲーム状態設定完了:', {
        gameId: newGameState.gameId,
        playerCount: newGameState.players?.length,
        currentPlayer: newGameState.players?.[newGameState.currentPlayerIndex]?.name,
        phase: newGameState.phase,
        turn: newGameState.turn
      })
      
      clearTimeout(timeout)
      setGameState(newGameState)
      setIsLoading(false)
      
      if (isCPUMode) {
        toast.success('🎯 CPU対戦が開始されました！')
      } else {
        toast.success('📚 チュートリアルが開始されました！')
      }
    } catch (error) {
      console.error('❌ ゲーム開始エラー詳細:', {
        error,
        message: error instanceof Error ? error.message : '不明なエラー',
        stack: error instanceof Error ? error.stack : undefined,
        selectedCards,
        isCPUMode,
        gameEngine: !!gameEngine
      })
      clearTimeout(timeout)
      setIsLoading(false)
      toast.error(`ゲームの開始に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }, [selectedCards, isCPUMode, gameEngine])

  // コンポーネント初期化時にゲームを自動開始
  useEffect(() => {
    console.log('🎯 InteractiveTutorial useEffect実行:', { 
      isCPUMode, 
      selectedCards: selectedCards?.length || 0,
      gameState: !!gameState 
    })
    
    // gameStateがまだnullの場合のみゲーム開始
    if (!gameState) {
      const timer = setTimeout(() => {
        console.log('🎯 startGame呼び出し中...')
        startGame()
      }, 100) // 少し遅延させてコンポーネントの初期化を完了させる
      
      return () => clearTimeout(timer)
    }
  }, [startGame, gameState])

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
    if (!gameEngine.isCurrentPlayerHuman()) {
      toast.error('あなたのターンではありません')
      return
    }

    if (gameState.phase !== 'buy') {
      toast.error('財宝カードは購入フェーズでのみプレイできます')
      return
    }

    try {
      gameEngine.playTreasureCard(card.id)
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
      toast('財宝カードがありません')
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

    toast.success(`💰 財宝一括プレイ +${totalCoins}コイン`)
  }

  // カード購入確定
  const confirmPurchase = () => {
    if (!selectedCard) return

    try {
      gameEngine.buyCard(selectedCard)
      const pile = gameState.supply[selectedCard]
      toast.success(`🛒 ${pile.card.name} を購入しました！`)
      setSelectedCard(null)
    } catch (error: any) {
      console.error('❌ カード購入エラー:', error)
      toast.error(error.message || 'カードの購入に失敗しました')
      setSelectedCard(null)
    }
  }

  // 選択キャンセル
  const cancelSelection = () => {
    setSelectedCard(null)
    toast('選択をキャンセルしました')
  }

  // フェーズ移行
  const moveToNextPhase = () => {
    if (!gameEngine.isCurrentPlayerHuman()) {
      toast.error('あなたのターンではありません')
      return
    }

    try {
      const success = gameEngine.moveToNextPhase()
      if (!success) {
        toast.error('フェーズ移行に失敗しました')
        return
      }
    } catch (error: any) {
      console.error('❌ フェーズ移行エラー:', error)
      toast.error(error.message || 'フェーズ移行に失敗しました')
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

  // ゲーム終了時の処理
  const handleGameEnd = () => {
    setShowEndGameModal(false)
    onComplete()
  }

  // ゲーム開始前の画面
  if (!gameState) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            {isCPUMode ? '🎯 CPU対戦' : '📚 チュートリアル'}
          </h1>
          <p className="text-xl text-zinc-300">
            {isCPUMode ? 'CPUプレイヤーと1対1で対戦しましょう' : '実際のゲーム画面で基本操作を学びましょう'}
          </p>
        </div>

        <div className="card mb-6 border-2 border-purple-500/30 bg-purple-500/5">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">{isCPUMode ? '🎯' : '📚'}</span>
            <h2 className="text-xl font-bold text-purple-400">
              {isCPUMode ? 'CPU対戦について' : 'チュートリアルについて'}
            </h2>
          </div>
          <div className="space-y-2 text-sm text-zinc-300">
            {isCPUMode ? (
              <>
                <p>• CPUと1対1でデッキ構築ゲームを楽しめます</p>
                <p>• アクション、購入、クリーンアップの3フェーズ制</p>
                <p>• 勝利点カードを集めて最高得点を目指そう</p>
                <p>• リアルタイムでCPUの思考過程を確認できます</p>
              </>
            ) : (
              <>
                <p>• 実際のゲーム画面でドミニオンの基本操作を学習</p>
                <p>• アクション、購入、クリーンアップの3フェーズ制</p>
                <p>• 手札操作、カード購入、フェーズ移行を体験</p>
                <p>• CPUとの対戦で戦略を身につけよう</p>
              </>
            )}
          </div>
        </div>

        {/* デバッグ情報表示 */}
        <div className="card mb-6 border border-blue-500/30 bg-blue-500/5">
          <h3 className="text-lg font-bold mb-3 text-blue-400">🔍 デバッグ情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="space-y-1">
                <div>モード: <span className="font-mono">{isCPUMode ? 'CPU対戦' : 'チュートリアル'}</span></div>
                <div>選択カード数: <span className="font-mono">{selectedCards?.length || 0}</span></div>
                <div>ゲームエンジン: <span className="font-mono">{gameEngine ? '✅ OK' : '❌ NG'}</span></div>
                <div>ゲーム状態: <span className="font-mono">{gameState ? '✅ 初期化済み' : '❌ 未初期化'}</span></div>
              </div>
            </div>
            <div>
              <div className="space-y-1">
                <div>ローディング: <span className="font-mono">{isLoading ? '🔄 実行中' : '⏸️ 停止中'}</span></div>
                <div>自動開始: <span className="font-mono">✅ 有効</span></div>
                <div>環境: <span className="font-mono">{import.meta.env.MODE}</span></div>
                <div>タイムスタンプ: <span className="font-mono">{new Date().toLocaleTimeString()}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-6">ゲーム開始</h2>
          
          {isLoading && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <span className="animate-spin text-2xl">⚙️</span>
                <span className="text-lg font-medium">ゲーム初期化中...</span>
              </div>
              <div className="text-sm text-zinc-400">
                {isCPUMode ? 'CPU対戦環境を準備しています' : 'チュートリアル環境を準備しています'}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <button
              onClick={startGame}
              disabled={isLoading}
              className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-spin">⚙️</span>
                  <span>準備中...</span>
                </span>
              ) : (
                <>
                  <span>{isCPUMode ? '🤖' : '📚'}</span>
                  <span className="ml-2">
                    {gameState ? '再開始' : (isCPUMode ? 'CPU対戦を開始' : 'チュートリアルを開始')}
                  </span>
                </>
              )}
            </button>
            
            {!isLoading && (
              <div className="space-x-4">
                <button
                  onClick={onExit}
                  className="btn-secondary text-lg px-6 py-2"
                >
                  ロビーに戻る
                </button>
                <button
                  onClick={() => {
                    console.log('🔄 手動リロード実行')
                    window.location.reload()
                  }}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  🔄 リロード
                </button>
              </div>
            )}
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
    const gameEndResult = {
      finalScores: {
        rankings: [
          {
            playerId: humanPlayer.id,
            playerName: humanPlayer.name,
            rank: humanPlayer.totalVictoryPoints > cpuPlayer.totalVictoryPoints ? 1 : 2,
            totalScore: humanPlayer.totalVictoryPoints,
            gameScore: humanPlayer.totalVictoryPoints,
            creatorScore: 0,
            victoryPoints: humanPlayer.totalVictoryPoints
          },
          {
            playerId: cpuPlayer.id,
            playerName: cpuPlayer.name,
            rank: cpuPlayer.totalVictoryPoints > humanPlayer.totalVictoryPoints ? 1 : 2,
            totalScore: cpuPlayer.totalVictoryPoints,
            gameScore: cpuPlayer.totalVictoryPoints,
            creatorScore: 0,
            victoryPoints: cpuPlayer.totalVictoryPoints
          }
        ],
        gameStats: {
          averageScore: (humanPlayer.totalVictoryPoints + cpuPlayer.totalVictoryPoints) / 2
        }
      },
      endReason: gameState.endReason || 'ゲーム終了',
      gameDuration: gameState.turn * 30, // 概算
      totalTurns: gameState.turn
    }

    return (
      <>
        <EndGameModal
          isOpen={showEndGameModal}
          gameEndResult={gameEndResult}
          onClose={handleGameEnd}
          onNewGame={startGame}
          onBackToLobby={onExit}
        />
        
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
              <button onClick={() => setShowEndGameModal(true)} className="btn-primary">
                📊 詳細結果
              </button>
              <button onClick={startGame} className="btn-primary">
                🔄 もう一度プレイ
              </button>
              <button onClick={onExit} className="btn-secondary">
                ロビーに戻る
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* シンプルヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">
            {isCPUMode ? '🎯 CPU対戦' : '📚 チュートリアル'}
          </h1>
          <div className="text-sm text-zinc-400">ターン {gameState.turn}</div>
          {!isMyTurn && (
            <div className="flex items-center space-x-2 text-blue-400">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              <span className="text-sm">CPUターン</span>
            </div>
          )}
        </div>
        <button onClick={onExit} className="btn-secondary text-sm">
          終了
        </button>
      </div>

      {/* CPU visual feedback - grayout effect when CPU turn */}
      {!currentPlayer.isHuman && (
        <div className="card mb-4 border-2 border-orange-500/50 bg-gradient-to-r from-orange-500/15 to-orange-600/10 shadow-lg shadow-orange-500/20">
          <div className="flex items-center justify-center space-x-3 py-4">
            <div className="relative">
              <span className="text-3xl animate-spin">🤖</span>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400/40 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-orange-300 mb-1">{currentPlayer.name} のターン</div>
              <div className="text-sm text-orange-400 animate-pulse font-medium">
                {gameState.phase === 'action' && '⚡ アクションを検討中...'}
                {gameState.phase === 'buy' && '💰 購入を検討中...'}
                {gameState.phase === 'cleanup' && '🔄 クリーンアップ中...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player statistics and victory condition progress */}
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
        
        {/* Victory condition progress visualization */}
        <div className="card">
          <h3 className="font-bold mb-3 flex items-center">
            <span className="text-yellow-400">🏆</span>
            <span className="ml-2">勝利条件進捗</span>
          </h3>
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
        <div className={`card mb-4 ${!isMyTurn ? 'opacity-60 pointer-events-none' : ''}`}>
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
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-all duration-200 flex items-center space-x-1 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25 active:scale-95"
                >
                  <span>💰</span>
                  <span>財宝一括</span>
                </button>
              )}
              
              <button
                onClick={moveToNextPhase}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-all duration-200 flex items-center space-x-1 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
              >
                <span>➡️</span>
                <span>
                  {gameState.phase === 'action' ? '購入へ' : 'ターン終了'}
                </span>
              </button>
            </div>
          </div>
          
          {/* Supply card selection confirmation functionality */}
          {selectedCard && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm">🎯 {gameState.supply[selectedCard].card.name} を選択中</span>
                <div className="flex space-x-2">
                  <button
                    onClick={confirmPurchase}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 active:scale-95"
                  >
                    ✅ 購入
                  </button>
                  <button
                    onClick={cancelSelection}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
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
                className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer ${isCPUTurn ? 'pointer-events-none' : 'hover:transform hover:scale-110 hover:shadow-lg hover:z-10'} ${
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
                  <div className="font-medium text-sm mb-1 leading-tight truncate" title={card.name}>{card.name}</div>
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
                className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer relative group ${isCPUTurn ? 'pointer-events-none' : 'hover:transform hover:scale-110 hover:shadow-lg hover:z-10'} ${
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
                } ${
                  !isMyTurn ? 'opacity-60 pointer-events-none' : ''
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
                  <div className="font-medium text-sm mb-1 leading-tight truncate" title={pile.card.name}>{pile.card.name}</div>
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