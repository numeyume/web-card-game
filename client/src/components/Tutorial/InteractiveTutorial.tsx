import { useState, useEffect } from 'react'
import type { Card } from '@/types'
import { DominionEngine } from '@/utils/DominionEngine'
import { CardTooltip } from '@/components/UI/CardTooltip'

interface TutorialStep {
  id: string
  title: string
  instruction: string
  target?: string
  highlightElement?: string
  allowedActions?: string[]
  completionCheck?: () => boolean
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'ドミニオンチュートリアルへようこそ！',
    instruction: '実際のゲーム画面で基本操作を学びましょう。「次へ」をクリックして開始してください。',
  },
  {
    id: 'game_overview',
    title: 'ゲーム画面の確認',
    instruction: '画面上部にプレイヤー情報、中央に手札、下部にサプライ（購入可能カード）が表示されています。'
  },
  {
    id: 'hand_hover',
    title: 'カード情報の確認',
    instruction: '手札のカードにマウスを載せてみてください。カードの詳細情報と効果が表示されます。',
    target: 'hand',
    allowedActions: ['hover']
  },
  {
    id: 'supply_hover', 
    title: 'サプライの確認',
    instruction: 'サプライ（下部）のカードにもマウスを載せて、購入コストと効果を確認してみましょう。',
    target: 'supply',
    allowedActions: ['hover']
  },
  {
    id: 'action_phase',
    title: 'アクションフェーズ',
    instruction: '現在は「アクションフェーズ」です。青いアクションカード（⚡）をクリックしてプレイしてみましょう。',
    target: 'action_card',
    allowedActions: ['play_action']
  },
  {
    id: 'phase_transition',
    title: 'フェーズ移行',
    instruction: 'アクションを全て使い終わったら「購入へ」ボタンで購入フェーズに移行しましょう。',
    target: 'phase_button',
    allowedActions: ['next_phase']
  },
  {
    id: 'treasure_play',
    title: '財宝カードプレイ',
    instruction: '購入フェーズでは財宝カード（💰）をプレイしてコインを獲得します。「財宝一括」ボタンを試してみましょう。',
    target: 'treasure_button',
    allowedActions: ['play_treasures']
  },
  {
    id: 'buy_card',
    title: 'カード購入',
    instruction: 'コインを使ってサプライからカードを購入しましょう。購入可能なカードは緑色に光っています。',
    target: 'supply',
    allowedActions: ['buy_card']
  },
  {
    id: 'turn_end',
    title: 'ターン終了',
    instruction: '購入が終わったら「ターン終了」でCPUのターンになります。ボタンをクリックしてみましょう。',
    target: 'end_turn_button',
    allowedActions: ['end_turn']
  },
  {
    id: 'completion',
    title: 'チュートリアル完了！',
    instruction: 'お疲れ様でした！基本操作を習得できました。実際のゲームでは、より戦略的にカードを選んで勝利を目指しましょう。'
  }
]

interface InteractiveTutorialProps {
  onComplete: () => void
  onExit: () => void
}

export function InteractiveTutorial({ onComplete, onExit }: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [gameEngine] = useState(() => new DominionEngine((newGameState) => {
    setGameState({ ...newGameState })
  }))
  const [gameState, setGameState] = useState<any>(null)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [highlightElement, setHighlightElement] = useState<string | null>(null)
  
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
    // チュートリアル用ゲーム開始
    const startTutorialGame = async () => {
      try {
        const tutorialGame = await gameEngine.startGame(['あなた', 'チュートリアルCPU'])
        setGameState(tutorialGame)
      } catch (error) {
        console.error('チュートリアルゲーム開始エラー:', error)
        // エラー時は標準ゲームを開始
        try {
          const fallbackGame = await gameEngine.startGame(['あなた', 'チュートリアルCPU'])
          setGameState(fallbackGame)
        } catch (fallbackError) {
          console.error('フォールバックゲーム開始エラー:', fallbackError)
        }
      }
    }
    
    startTutorialGame()
  }, [gameEngine])

  useEffect(() => {
    const step = tutorialSteps[currentStep]
    setHighlightElement(step.highlightElement || step.target || null)
  }, [currentStep])

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

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // アクションハンドラー
  const playActionCard = (card: Card) => {
    const step = tutorialSteps[currentStep]
    if (step.allowedActions?.includes('play_action')) {
      try {
        gameEngine.playActionCard(card.id)
        if (step.id === 'action_phase') {
          setTimeout(nextStep, 1000)
        }
      } catch (error) {
        console.error('Action card play error:', error)
      }
    }
  }

  const moveToNextPhase = () => {
    const step = tutorialSteps[currentStep]
    if (step.allowedActions?.includes('next_phase') || step.allowedActions?.includes('end_turn')) {
      try {
        gameEngine.moveToNextPhase()
        if (step.id === 'phase_transition' || step.id === 'turn_end') {
          setTimeout(nextStep, 1000)
        }
      } catch (error) {
        console.error('Phase transition error:', error)
      }
    }
  }

  const playAllTreasures = () => {
    const step = tutorialSteps[currentStep]
    if (step.allowedActions?.includes('play_treasures')) {
      const treasureCards = gameState.players[gameState.currentPlayerIndex].hand.filter((card: Card) => card.type === 'Treasure')
      treasureCards.forEach((card: Card) => {
        try {
          gameEngine.playTreasureCard(card.id)
        } catch (error) {
          console.error('Treasure play error:', error)
        }
      })
      if (step.id === 'treasure_play') {
        setTimeout(nextStep, 1000)
      }
    }
  }

  const selectCard = (cardId: string) => {
    const step = tutorialSteps[currentStep]
    if (step.allowedActions?.includes('buy_card')) {
      setSelectedCard(cardId)
      setTimeout(() => {
        try {
          gameEngine.buyCard(cardId)
          setSelectedCard(null)
          if (step.id === 'buy_card') {
            setTimeout(nextStep, 1000)
          }
        } catch (error) {
          console.error('Buy card error:', error)
          setSelectedCard(null)
        }
      }, 500)
    }
  }

  if (!gameState) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card text-center">
          <div className="text-2xl mb-4">🔄</div>
          <p>チュートリアル準備中...</p>
        </div>
      </div>
    )
  }

  const humanPlayer = gameState.players.find((p: any) => p.isHuman)
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const isMyTurn = gameEngine.isCurrentPlayerHuman()
  const currentStepData = tutorialSteps[currentStep]

  return (
    <div className="max-w-6xl mx-auto p-4 relative">
      {/* チュートリアル指示パネル */}
      <div className="fixed top-4 right-4 w-80 z-40">
        <div className="card border-2 border-blue-500/50 bg-blue-500/10 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-blue-400">📚 チュートリアル</h3>
            <button 
              onClick={onExit}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕ 終了
            </button>
          </div>
          
          <div className="mb-3">
            <div className="text-sm text-gray-400 mb-1">
              ステップ {currentStep + 1} / {tutorialSteps.length}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <h4 className="font-bold text-lg mb-2">{currentStepData.title}</h4>
          <p className="text-sm text-gray-300 mb-4">{currentStepData.instruction}</p>

          <div className="flex space-x-2">
            <button 
              onClick={prevStep}
              disabled={currentStep === 0}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              ← 前
            </button>
            <button 
              onClick={nextStep}
              className="btn-primary text-sm flex-1"
            >
              {currentStep === tutorialSteps.length - 1 ? '完了' : '次 →'}
            </button>
          </div>
        </div>
      </div>

      {/* ゲーム画面（簡略版） */}
      <div className="mr-84"> {/* 右側チュートリアルパネル分の余白 */}
        {/* 簡略プレイヤー情報 - CPUターン時のみ */}
        {!isMyTurn && (
          <div className={`card mb-4 ${highlightElement === 'player_info' ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}`}>
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
          <div className={`card mb-4 border-2 border-blue-500/30 bg-blue-500/5 ${highlightElement === 'player_info' ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}`}>
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

        {/* 手札 */}
        {isMyTurn && (
          <div className={`card mb-6 ${highlightElement === 'hand' ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">🃏 手札 ({humanPlayer.hand.length}枚)</h3>
              
              <div className="flex space-x-2">
                {gameState.phase === 'buy' && (
                  <button
                    onClick={playAllTreasures}
                    className={`bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1 ${
                      highlightElement === 'treasure_button' ? 'ring-4 ring-yellow-500 ring-opacity-50' : ''
                    }`}
                  >
                    <span>💰</span>
                    <span>財宝一括</span>
                  </button>
                )}
                
                <button
                  onClick={moveToNextPhase}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1 ${
                    highlightElement === 'phase_button' || highlightElement === 'end_turn_button' ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
                  }`}
                >
                  <span>➡️</span>
                  <span>
                    {gameState.phase === 'action' ? '購入へ' : 'ターン終了'}
                  </span>
                </button>
              </div>
            </div>
            
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
                  } ${
                    highlightElement === 'action_card' && card.type === 'Action' && gameState.phase === 'action' 
                      ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
                  }`}
                  onClick={() => {
                    if (card.type === 'Action' && gameState.phase === 'action' && isMyTurn) {
                      playActionCard(card)
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

        {/* サプライ */}
        <div className={`card mb-6 ${highlightElement === 'supply' ? 'ring-4 ring-green-500 ring-opacity-50' : ''}`}>
          <h3 className="font-bold mb-4">🏪 サプライ</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-3">
            {Object.entries(gameState.supply).map(([cardId, pile]: [string, any]) => {
              const canBuy = gameState.phase === 'buy' && isMyTurn && 
                            currentPlayer.coins >= pile.cost && 
                            currentPlayer.buys > 0 && 
                            pile.count > 0
              const isSelected = selectedCard === cardId
              const isEmpty = pile.count === 0

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
                          : 'border-zinc-600 hover:border-zinc-400'
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
                    
                    <div className="text-xs text-zinc-400">
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
      </div>

      {/* ツールチップ */}
      {tooltip.card && (
        <CardTooltip
          card={tooltip.card}
          cost={tooltip.cost}
          show={tooltip.show}
          position={tooltip.position}
          mode="detailed"
        />
      )}
    </div>
  )
}