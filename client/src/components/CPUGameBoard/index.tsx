import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Card } from '@/types'
import { LocalCPUEngine } from '@/utils/LocalCPUEngine'

interface Player {
  playerId: string
  playerName: string
  handCount: number
  deckCount: number
  discardCount: number
  coins: number
  actions: number
  buys: number
  score: number
  isHuman: boolean
}

interface GameState {
  gameId: string
  players: Record<string, Player>
  currentPlayer: string
  turn: number
  phase: 'action' | 'buy' | 'cleanup'
  supply: Record<string, any>
  log: Array<{ message: string; timestamp: string; turn: number }>
  winner?: Player
  endReason?: string
}

interface GameBoardProps {
  onExitGame: () => void
}

export function CPUGameBoard({ onExitGame }: GameBoardProps) {
  console.log('🚨🚨🚨 CPUGameBoard コンポーネントが実行されています 🚨🚨🚨')
  
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showTutorial, setShowTutorial] = useState(true)
  const [cpuEngine] = useState(() => new LocalCPUEngine((newGameState) => {
    try {
      // リアルタイム状態更新
      console.log('🔄 リアルタイム状態更新:', {
        phase: newGameState.phase, 
        currentPlayer: newGameState.currentPlayer,
        currentPlayerType: typeof newGameState.currentPlayer,
        turn: newGameState.turn,
        humanPlayerId: cpuEngine.getHumanPlayerId(),
        cpuPlayerId: cpuEngine.getCPUPlayerId(),
        isCPUTurn: newGameState.currentPlayer === cpuEngine.getCPUPlayerId(),
        playerKeys: Object.keys(newGameState.players || {}),
        rawGameState: newGameState
      })
      setGameState(newGameState as any)
      setPlayerHand(cpuEngine.getPlayerHand(cpuEngine.getHumanPlayerId()))
    } catch (error) {
      console.error('❌ リアルタイム状態更新エラー:', error)
      toast.error('ゲーム状態の更新でエラーが発生しました')
    }
  }))

  // CPU対戦を開始（ローカル）
  const startSinglePlayerGame = () => {
    console.log('🚀 ローカルCPU対戦を開始します')
    setIsLoading(true)
    
    try {
      const localGameState = cpuEngine.startGame('normal')
      setGameState(localGameState as any)
      setPlayerHand(cpuEngine.getPlayerHand(cpuEngine.getHumanPlayerId()))
      setIsLoading(false)
      setShowTutorial(false)
      toast.success('CPU対戦が開始されました！')
    } catch (error) {
      console.error('❌ CPU対戦開始エラー:', error)
      setIsLoading(false)
      toast.error('CPU対戦の開始に失敗しました')
    }
  }

  // カードをプレイ
  const playCard = (card: Card) => {
    if (!gameState || gameState.currentPlayer !== getHumanPlayerId()) {
      toast.error('あなたのターンではありません')
      return
    }

    if (gameState.phase !== 'action') {
      toast.error('アクションフェーズではありません')
      return
    }

    try {
      const playedCard = cpuEngine.playCard(cpuEngine.getHumanPlayerId(), card.id)
      setGameState(cpuEngine.getGameState() as any)
      setPlayerHand(cpuEngine.getPlayerHand(cpuEngine.getHumanPlayerId()))
      toast.success(`「${playedCard.name}」をプレイしました`)
      setSelectedCard(null)
    } catch (error: any) {
      console.error('❌ カードプレイエラー:', error)
      toast.error(error?.message || 'カードのプレイに失敗しました')
    }
  }

  // カードを購入
  const buyCard = (cardId: string) => {
    if (!gameState || gameState.currentPlayer !== getHumanPlayerId()) {
      toast.error('あなたのターンではありません')
      return
    }

    if (gameState.phase !== 'buy') {
      toast.error('購入フェーズではありません')
      return
    }

    try {
      const boughtCard = cpuEngine.buyCard(cpuEngine.getHumanPlayerId(), cardId)
      setGameState(cpuEngine.getGameState() as any)
      setPlayerHand(cpuEngine.getPlayerHand(cpuEngine.getHumanPlayerId()))
      toast.success(`「${boughtCard.name}」を購入しました`)
    } catch (error: any) {
      console.error('❌ カード購入エラー:', error)
      toast.error(error?.message || 'カードの購入に失敗しました')
    }
  }

  // 財宝カードをプレイ
  const playTreasureCard = (card: Card) => {
    if (!gameState || gameState.currentPlayer !== getHumanPlayerId()) {
      toast.error('あなたのターンではありません')
      return
    }

    if (gameState.phase !== 'buy') {
      toast.error('財宝カードは購入フェーズでのみプレイできます')
      return
    }

    try {
      console.log('💰 財宝カードプレイ試行:', card)
      const playedCard = cpuEngine.playTreasureCard(cpuEngine.getHumanPlayerId(), card.id)
      const newGameState = cpuEngine.getGameState()
      const newHand = cpuEngine.getPlayerHand(cpuEngine.getHumanPlayerId())
      
      console.log('💰 財宝カードプレイ成功:', {
        playedCard: playedCard.name,
        newCoins: newGameState?.players[cpuEngine.getHumanPlayerId()]?.coins,
        handSize: newHand.length
      })
      
      setGameState(newGameState as any)
      setPlayerHand(newHand)
      
      const coinEffect = playedCard.effects?.find(effect => effect.type === 'gain_coin')
      const coinsGained = coinEffect?.value || 0
      toast.success(`💰 ${playedCard.name} をプレイ！ +${coinsGained}コイン獲得`)
    } catch (error: any) {
      console.error('❌ 財宝カードプレイエラー:', error)
      toast.error(error?.message || '財宝カードのプレイに失敗しました')
    }
  }

  // ターン終了
  const endTurn = () => {
    console.log('🔄 endTurn関数が呼ばれました')
    
    if (!gameState || gameState.currentPlayer !== getHumanPlayerId()) {
      console.log('❌ ターン終了不可:', { 
        gameStateExists: !!gameState, 
        currentPlayer: gameState?.currentPlayer,
        humanPlayerId: getHumanPlayerId()
      })
      toast.error('あなたのターンではありません')
      return
    }

    try {
      console.log('🎯 CPUエンジンのendTurn()を呼び出し中...')
      const gameEnded = cpuEngine.endTurn()
      const newGameState = cpuEngine.getGameState()
      console.log('🔄 ターン終了後の状態:', {
        gameEnded,
        currentPlayer: newGameState?.currentPlayer,
        currentPlayerName: newGameState?.players?.[newGameState?.currentPlayer]?.name,
        phase: newGameState?.phase,
        turn: newGameState?.turn,
        humanPlayerId: cpuEngine.getHumanPlayerId(),
        cpuPlayerId: cpuEngine.getCPUPlayerId(),
        isCPUTurn: newGameState?.currentPlayer === cpuEngine.getCPUPlayerId()
      })
      
      setGameState(newGameState as any)
      setPlayerHand(cpuEngine.getPlayerHand(cpuEngine.getHumanPlayerId()))
      
      if (gameEnded) {
        const finalGameState = cpuEngine.getGameState()
        if (finalGameState?.winner) {
          toast.success(`ゲーム終了！勝者: ${finalGameState.winner.name}`)
        }
      } else {
        toast.success('CPUのターンを開始します...')
      }
    } catch (error: any) {
      console.error('❌ ターン終了エラー:', error)
      toast.error(error?.message || 'ターン終了に失敗しました')
    }
  }

  // フェーズ移行
  const moveToNextPhase = () => {
    if (!gameState || gameState.currentPlayer !== getHumanPlayerId()) {
      toast.error('あなたのターンではありません')
      return
    }

    try {
      console.log('🔄 フェーズ移行前:', gameState.phase, 'プレイヤー:', gameState.currentPlayer)
      
      if (gameState.phase === 'action') {
        console.log('🎯→💰 アクションフェーズから購入フェーズに移行')
        cpuEngine.moveToPhase('buy')
        const newGameState = cpuEngine.getGameState()
        console.log('🔄 フェーズ移行後:', newGameState?.phase)
        setGameState(newGameState as any)
        setPlayerHand(cpuEngine.getPlayerHand(cpuEngine.getHumanPlayerId()))
        toast.success('💰 購入フェーズに移行しました！財宝カードをプレイしてコインを獲得しよう')
      } else if (gameState.phase === 'buy') {
        console.log('💰→✅ 購入フェーズからターン終了')
        endTurn()
      }
    } catch (error: any) {
      console.error('❌ フェーズ移行エラー:', error)
      toast.error(error?.message || 'フェーズ移行に失敗しました')
    }
  }

  // 人間プレイヤーのIDを取得
  const getHumanPlayerId = (): string => {
    return cpuEngine.getHumanPlayerId()
  }



  // ゲーム開始前の画面
  if (!gameState) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            🎯 CPU対戦
          </h1>
          <p className="text-xl text-zinc-300">
            CPUプレイヤーと1対1で対戦しましょう
          </p>
        </div>

        {/* ゲーム情報 */}
        <div className="card mb-6 border-2 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-bold text-blue-400">CPU対戦について</h2>
          </div>
          <div className="space-y-2 text-sm text-zinc-300">
            <p>• CPUと1対1でデッキ構築ゲームを楽しめます</p>
            <p>• アクション、購入、クリーンアップの3フェーズ制</p>
            <p>• 勝利点カードを集めて最高得点を目指そう</p>
            <p>• リアルタイムでCPUの思考過程を確認できます</p>
          </div>
        </div>

        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-6">ゲーム開始</h2>
          <div className="space-y-4">
            <button
              onClick={startSinglePlayerGame}
              disabled={isLoading}
              className="btn-primary text-lg px-8 py-3"
            >
              {isLoading ? '開始中...' : '🤖 CPU対戦を開始'}
            </button>
            <button
              onClick={onExitGame}
              className="btn-secondary text-lg px-8 py-3 ml-4"
            >
              ロビーに戻る
            </button>
          </div>
          <p className="text-sm text-zinc-400 mt-4">
            難易度は標準（Normal）に設定されています。<br/>
            CPUと1対1でデッキ構築バトルを楽しもう！
          </p>
        </div>
      </div>
    )
  }

  const humanPlayer = gameState ? gameState.players[cpuEngine.getHumanPlayerId()] as any : null
  const cpuPlayer = gameState ? gameState.players[cpuEngine.getCPUPlayerId()] as any : null
  
  // シンプルで確実なプレイヤー判定
  const isMyTurn = gameState ? gameState.currentPlayer === cpuEngine.getHumanPlayerId() : false
  
  console.log('🎯 ターン判定:', {
    currentPlayer: gameState?.currentPlayer,
    humanPlayerId: cpuEngine.getHumanPlayerId(),
    cpuPlayerId: cpuEngine.getCPUPlayerId(),
    isMyTurn,
    exactMatch: gameState?.currentPlayer === cpuEngine.getHumanPlayerId()
  })

  return (
    <div className="max-w-7xl mx-auto">
      {/* チュートリアルモーダル */}
      {showTutorial && gameState && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-2xl mx-4 border border-zinc-600">
            <h2 className="text-2xl font-bold mb-4 text-center">🎯 CPU対戦チュートリアル</h2>
            
            <div className="space-y-4 text-sm">
              <div className="bg-blue-500/20 p-4 rounded-lg">
                <h3 className="font-bold text-blue-400 mb-2">📋 ドミニオンのターン構成</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li><strong>アクションフェーズ</strong>: アクションカードを1枚プレイ（効果で増加可能）</li>
                  <li><strong>購入フェーズ</strong>: 財宝カードをプレイしてコイン獲得→カード購入</li>
                  <li><strong>クリーンアップ</strong>: 手札・プレイしたカードを捨て札にして5枚ドロー</li>
                </ol>
              </div>

              <div className="bg-green-500/20 p-4 rounded-lg">
                <h3 className="font-bold text-green-400 mb-2">🎮 ドミニオンの操作方法</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>アクションカードプレイ</strong>: アクションフェーズで青いボタンをクリック</li>
                  <li><strong>財宝カードプレイ</strong>: 購入フェーズで黄色いボタンをクリック</li>
                  <li><strong>カード購入</strong>: コイン獲得後、サプライのカードをクリック</li>
                  <li><strong>フェーズ移行・ターン終了</strong>: 各ボタンで段階的に進行</li>
                </ul>
              </div>

              <div className="bg-yellow-500/20 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-400 mb-2">💡 ドミニオン戦略のヒント</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>アクション回数</strong>: 基本1回、カード効果で増やせる</li>
                  <li><strong>財宝の活用</strong>: 購入フェーズで手動プレイしてコイン獲得</li>
                  <li><strong>デッキ構築</strong>: 効率的なカードを購入してデッキを強化</li>
                  <li><strong>勝利条件</strong>: 属州枯渇 or 3種類枯渇でゲーム終了</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowTutorial(false)}
                className="btn-primary px-6 py-3"
              >
                ゲームを開始する！
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ゲーム情報ヘッダー */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold">🎯 CPU対戦</h1>
            <div className="text-sm text-zinc-400">
              ターン {gameState.turn}
            </div>
            {!isMyTurn && (
              <div className="flex items-center space-x-2 text-blue-400 animate-pulse">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                <span className="text-sm font-medium">CPUがターン実行中...</span>
              </div>
            )}
          </div>
          <button
            onClick={onExitGame}
            className="btn-secondary text-sm"
          >
            ゲーム終了
          </button>
        </div>
        
        {/* フェーズインジケーター */}
        {isMyTurn && (
          <div className="flex items-center space-x-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/30">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${gameState.phase === 'action' ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`}></span>
              <span className={`text-sm font-medium ${gameState.phase === 'action' ? 'text-blue-400' : 'text-gray-400'}`}>
                アクションフェーズ
              </span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${gameState.phase === 'buy' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
              <span className={`text-sm font-medium ${gameState.phase === 'buy' ? 'text-green-400' : 'text-gray-400'}`}>
                購入フェーズ
              </span>
            </div>
            
            {/* 現在のフェーズ情報 */}
            <div className="ml-8 flex items-center space-x-4 text-sm">
              {gameState.phase === 'action' && (
                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                  🎯 アクション回数: {humanPlayer?.actions || 0}
                </span>
              )}
              {gameState.phase === 'buy' && (
                <>
                  <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">
                    💰 コイン: {humanPlayer?.coins || 0}
                  </span>
                  <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
                    🛒 購入回数: {humanPlayer?.buys || 0}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左側: プレイヤー情報 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 人間プレイヤー */}
          {humanPlayer && (
            <div className={`card ${isMyTurn ? 'border-2 border-green-500' : ''}`}>
              <h3 className="font-bold text-lg mb-2 flex items-center">
                👤 {humanPlayer.name}
                {isMyTurn && <span className="ml-2 text-green-400 text-sm">（あなたのターン）</span>}
              </h3>
              <div className="space-y-2 text-sm">
                <div>手札: {humanPlayer.hand.length}枚</div>
                <div>山札: {humanPlayer.deck.length}枚</div>
                <div>捨て札: {humanPlayer.discard.length}枚</div>
                <div>コイン: {humanPlayer.coins}</div>
                <div>アクション: {humanPlayer.actions}</div>
                <div>購入: {humanPlayer.buys}</div>
                <div>スコア: {humanPlayer.score}点</div>
              </div>
            </div>
          )}

          {/* CPUプレイヤー */}
          {cpuPlayer && (
            <div className={`card ${!isMyTurn ? 'border-2 border-blue-500' : ''}`}>
              <h3 className="font-bold text-lg mb-2 flex items-center">
                🤖 {cpuPlayer.name}
                {!isMyTurn && <span className="ml-2 text-blue-400 text-sm">（CPUのターン）</span>}
              </h3>
              <div className="space-y-2 text-sm">
                <div>手札: {cpuPlayer.hand.length}枚</div>
                <div>山札: {cpuPlayer.deck.length}枚</div>
                <div>捨て札: {cpuPlayer.discard.length}枚</div>
                <div>コイン: {cpuPlayer.coins}</div>
                <div>アクション: {cpuPlayer.actions}</div>
                <div>購入: {cpuPlayer.buys}</div>
                <div>スコア: {cpuPlayer.score}点</div>
              </div>
            </div>
          )}
        </div>

        {/* 中央: ゲームボード */}
        <div className="lg:col-span-2 space-y-6">
          {/* サプライ */}
          <div className="card">
            <h3 className="font-bold text-lg mb-4">📦 サプライ</h3>
            
            {/* サプライヘルプテキスト */}
            {isMyTurn && gameState && (
              <div className="mb-3 p-2 bg-zinc-700/30 rounded text-xs text-zinc-300">
                {gameState.phase === 'buy' ? (
                  <span>💳 購入フェーズ：カードをクリックして購入（コイン: {humanPlayer?.coins || 0} | 購入: {humanPlayer?.buys || 0}）</span>
                ) : (
                  <span>⏳ 購入は購入フェーズでのみ可能です</span>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(gameState.supply).map(([cardId, card]) => {
                const canBuy = gameState.phase === 'buy' && isMyTurn && 
                              (humanPlayer?.coins || 0) >= card.cost && 
                              (humanPlayer?.buys || 0) > 0 && 
                              card.count > 0;
                
                return (
                  <div
                    key={cardId}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      canBuy 
                        ? 'border-green-500 bg-green-500/10 hover:bg-green-500/20' 
                        : gameState.phase === 'buy' && isMyTurn
                          ? 'border-red-500/50 bg-red-500/5'
                          : 'border-zinc-600 hover:border-zinc-400'
                    }`}
                    onClick={() => {
                      console.log('🛒 カード購入試行:', {
                        cardId,
                        cost: card.cost,
                        coins: humanPlayer?.coins,
                        buys: humanPlayer?.buys,
                        phase: gameState.phase,
                        isMyTurn,
                        canBuy
                      });
                      if (canBuy) {
                        buyCard(cardId)
                      } else if (gameState.phase === 'buy' && isMyTurn) {
                        if ((humanPlayer?.coins || 0) < card.cost) {
                          toast.error(`コインが不足しています（必要: ${card.cost}, 所持: ${humanPlayer?.coins || 0}）`)
                        } else if ((humanPlayer?.buys || 0) <= 0) {
                          toast.error('購入回数が残っていません')
                        } else if (card.count <= 0) {
                          toast.error('在庫がありません')
                        }
                      }
                    }}
                  >
                    <div className="text-sm font-medium">{card.name}</div>
                    <div className="text-xs text-zinc-400">コスト: {card.cost}</div>
                    <div className="text-xs text-zinc-400">残り: {card.count}枚</div>
                    {card.victoryPoints && (
                      <div className="text-xs text-yellow-400">勝利点: {card.victoryPoints}</div>
                    )}
                    {gameState.phase === 'buy' && isMyTurn && (
                      <div className={`text-xs mt-1 ${canBuy ? 'text-green-400' : 'text-red-400'}`}>
                        {canBuy ? '✅ 購入可能' : '❌ 購入不可'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ターンアクション */}
          {isMyTurn && (
            <div className={`card border-2 ${
              gameState.phase === 'action' 
                ? 'border-blue-500/30 bg-blue-500/5' 
                : 'border-green-500/30 bg-green-500/5'
            }`}>
              <h3 className="font-bold text-lg mb-4 flex items-center">
                {gameState.phase === 'action' ? '🎯' : '💰'} 
                <span className="ml-2">
                  {gameState.phase === 'action' ? 'アクションフェーズ' : '購入フェーズ'}
                </span>
              </h3>
              
              {/* フェーズ別ヘルプテキスト */}
              <div className={`mb-4 p-4 rounded-lg border ${
                gameState.phase === 'action' 
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' 
                  : 'bg-green-500/10 border-green-500/20 text-green-300'
              }`}>
                {gameState.phase === 'action' && (
                  <div className="text-sm">
                    <div className="font-medium mb-2">🎯 アクションカードをプレイしよう</div>
                    <div>残りアクション回数: <span className="font-bold text-blue-200">{humanPlayer?.actions || 0}</span></div>
                    <div className="text-xs mt-2 opacity-80">完了したら下のボタンで購入フェーズに移行</div>
                  </div>
                )}
                {gameState.phase === 'buy' && (
                  <div className="text-sm">
                    <div className="font-medium mb-2">💰 財宝カードをプレイしてカードを購入しよう</div>
                    <div className="flex space-x-4">
                      <span>コイン: <span className="font-bold text-yellow-200">{humanPlayer?.coins || 0}</span></span>
                      <span>購入回数: <span className="font-bold text-green-200">{humanPlayer?.buys || 0}</span></span>
                    </div>
                    <div className="text-xs mt-2 opacity-80">カード購入後、下のボタンでターン終了</div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                {gameState.phase === 'action' && (
                  <button
                    onClick={moveToNextPhase}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <span>💰</span>
                    <span>購入フェーズへ</span>
                  </button>
                )}
                {gameState.phase === 'buy' && (
                  <button
                    onClick={endTurn}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <span>🤖</span>
                    <span>あいてのターンへ</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右側: 手札 */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="font-bold text-lg mb-4">🃏 手札</h3>
            
            {/* 手札ヘルプテキスト */}
            {isMyTurn && gameState && (
              <div className={`mb-3 p-3 rounded-lg border ${
                gameState.phase === 'action' 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' 
                  : 'bg-green-500/10 border-green-500/30 text-green-300'
              }`}>
                <div className="text-sm font-medium mb-1">
                  {gameState.phase === 'action' ? '🎯 アクションフェーズ' : '💰 購入フェーズ'}
                </div>
                <div className="text-xs">
                  {gameState.phase === 'action' ? (
                    <>アクションカード（青ボタン）をクリックしてプレイ<br/>残り回数: {humanPlayer?.actions || 0}</>
                  ) : (
                    <>まず財宝カード（黄色ボタン）でコイン獲得<br/>現在: {humanPlayer?.coins || 0}コイン</>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {playerHand.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <div className="text-4xl mb-2">🃏</div>
                  <p>手札を準備中...</p>
                  <p className="text-xs mt-2">ゲーム開始をお待ちください</p>
                </div>
              ) : (
                playerHand.map((card, index) => (
                  <div
                    key={`${card.id}-${index}`}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedCard?.id === card.id 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : card.type === 'Action' && gameState.phase === 'action' && isMyTurn
                          ? 'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer'
                          : card.type === 'Treasure' && gameState.phase === 'buy' && isMyTurn
                            ? 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 cursor-pointer'
                            : card.type === 'Treasure' && gameState.phase !== 'buy'
                              ? 'border-yellow-500/20 bg-yellow-500/5'
                              : 'border-zinc-600 hover:border-zinc-400'
                    }`}
                    onClick={() => {
                      if (card.type === 'Action' && gameState.phase === 'action' && isMyTurn) {
                        setSelectedCard(card)
                      } else if (card.type === 'Treasure' && gameState.phase === 'buy' && isMyTurn) {
                        playTreasureCard(card)
                      }
                    }}
                  >
                    <div className="text-sm font-medium">{card.name}</div>
                    <div className="text-xs text-zinc-400">{card.type}</div>
                    {card.cost !== undefined && (
                      <div className="text-xs text-zinc-400">コスト: {card.cost}</div>
                    )}
                    {card.effects && card.effects.length > 0 && (
                      <div className="text-xs text-green-400">
                        効果: {card.effects.map(e => `${e.type} +${e.value}`).join(', ')}
                      </div>
                    )}
                    {card.type === 'Action' && gameState.phase === 'action' && isMyTurn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          playCard(card)
                        }}
                        className="btn-primary text-xs mt-2 w-full"
                      >
                        プレイ（アクション）
                      </button>
                    )}
                    {card.type === 'Treasure' && gameState.phase === 'buy' && isMyTurn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          playTreasureCard(card)
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs mt-2 w-full px-2 py-1 rounded transition-colors"
                      >
                        💰 プレイ（+{card.effects?.find(e => e.type === 'gain_coin')?.value || 0}コイン）
                      </button>
                    )}
                    {card.type === 'Treasure' && gameState.phase !== 'buy' && (
                      <div className="text-xs text-gray-400 mt-2 p-1 bg-gray-700/30 rounded">
                        購入フェーズでプレイ可能
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ゲームログ */}
      <div className="mt-6 card">
        <h3 className="font-bold text-lg mb-4">📜 ゲームログ</h3>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {gameState.log && gameState.log.length > 0 ? (
            gameState.log.slice(-10).map((entry, index) => (
              <div key={index} className="text-sm text-zinc-300">
                <span className="text-zinc-500">T{entry.turn}:</span> {entry.message}
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
  )
}

export default CPUGameBoard