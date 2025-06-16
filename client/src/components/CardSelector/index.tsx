import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { Card } from '@/types'

interface CardSelectorProps {
  onStartGame: (selectedCards: Card[]) => void
  onCancel: () => void
}

export function CardSelector({ onStartGame, onCancel }: CardSelectorProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const maxSelections = 3

  // カード一覧を取得
  const fetchCards = async () => {
    try {
      setLoading(true)
      
      // サーバーから取得を試行（Viteプロキシ経由）
      console.log('🔄 CardSelector: カード取得開始（プロキシ経由）')
      
      try {
        const response = await fetch('/api/cards', {
          signal: AbortSignal.timeout(3000) // 3秒タイムアウトに短縮
        })
        
        console.log('🔄 CardSelector: API レスポンス受信', { 
          status: response.status, 
          ok: response.ok 
        })
        
        const data = await response.json()
        console.log('🔄 CardSelector: レスポンスデータ', data)

        if (data.success) {
          // すべてのカードを表示（アクションカードの制限を解除）
          const allCards = data.cards || []
          console.log('🔄 CardSelector: カード取得成功', { cardCount: allCards.length })
          setCards(allCards)
          return
        } else {
          throw new Error('サーバーからの取得に失敗')
        }
      } catch (serverError) {
        console.warn('❌ CardSelector: サーバー接続失敗、ローカルストレージから読み込みます:', serverError)
        
        // ローカルストレージからカードを取得（フォールバック）
        const localCards = JSON.parse(localStorage.getItem('customCards') || '[]')
        console.log('🔄 CardSelector: ローカルカード取得', { cardCount: localCards.length })
        setCards(localCards)
        
        if (localCards.length === 0) {
          toast.info('作成されたカードがありません。まずカードを作成してください。')
        }
      }
    } catch (error) {
      console.error('❌ CardSelector: エラー:', error)
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const toggleCardSelection = (card: Card) => {
    const isSelected = selectedCards.find(c => c.id === card.id)
    
    if (isSelected) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id))
    } else if (selectedCards.length < maxSelections) {
      setSelectedCards([...selectedCards, card])
    } else {
      toast.error(`最大${maxSelections}枚まで選択できます`)
    }
  }

  const handleStartGame = () => {
    onStartGame(selectedCards)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card text-center">
          <div className="text-2xl mb-4">🔄</div>
          <p>カードを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          🎴 カード選択
        </h1>
        <p className="text-lg text-zinc-300 mb-4">
          CPU対戦で使用するカードを選択してください（最大{maxSelections}枚）
        </p>
        <div className="flex justify-center space-x-4 mb-6">
          <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg">
            選択中: {selectedCards.length}/{maxSelections}
          </div>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="card text-center">
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-xl font-bold mb-2">カードがありません</h3>
          <p className="text-zinc-400 mb-4">
            カードを作成するか、カードなしでゲームを開始してください
          </p>
          <div className="space-x-4">
            <button onClick={onCancel} className="btn-secondary">
              戻る
            </button>
            <button onClick={() => onStartGame([])} className="btn-primary">
              カードなしでゲーム開始
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* カード一覧 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card) => {
              const isSelected = selectedCards.find(c => c.id === card.id)
              
              return (
                <div
                  key={card.id}
                  onClick={() => toggleCardSelection(card)}
                  className={`card cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isSelected
                      ? 'border-2 border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                      : 'border border-zinc-600 hover:border-blue-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{
                        card.type === 'Action' ? '⚡' :
                        card.type === 'Treasure' ? '💰' :
                        card.type === 'Victory' ? '🏆' :
                        card.type === 'Curse' ? '💀' :
                        '🎴'
                      }</span>
                      {isSelected && (
                        <span className="text-blue-400 text-xl">✓</span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2">{card.name}</h3>
                    
                    <div className="text-sm text-zinc-400 mb-2">
                      コスト: {card.cost}💳
                    </div>
                    
                    {card.effects && card.effects.length > 0 && (
                      <div className="space-y-1 text-sm">
                        {card.effects.map((effect, index) => (
                          <div key={index} className="flex items-center justify-center space-x-1 text-blue-400">
                            {effect.type === 'draw' && (<><span>+{effect.value}</span><span>🃏</span></>)}
                            {effect.type === 'gain_action' && (<><span>+{effect.value}</span><span>⚡</span></>)}
                            {effect.type === 'gain_buy' && (<><span>+{effect.value}</span><span>🛍</span></>)}
                            {effect.type === 'gain_coin' && (<><span>+{effect.value}</span><span>💰</span></>)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs text-zinc-500 mt-2">
                      {card.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 選択されたカード表示 */}
          {selectedCards.length > 0 && (
            <div className="card mb-6 border-blue-500/30 bg-blue-500/5">
              <h3 className="font-bold text-lg mb-4 text-blue-400">選択されたカード</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCards.map((card) => (
                  <div key={card.id} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg text-sm">
                    {card.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="btn-secondary px-6 py-3"
            >
              キャンセル
            </button>
            <button
              onClick={handleStartGame}
              className="btn-primary px-6 py-3"
            >
              {selectedCards.length > 0 
                ? `選択したカードでゲーム開始 (${selectedCards.length}枚)`
                : 'カードなしでゲーム開始'
              }
            </button>
          </div>
        </>
      )}
    </div>
  )
}