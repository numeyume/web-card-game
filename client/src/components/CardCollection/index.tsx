import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { Card } from '@/types'

interface CardCollectionProps {}

export function CardCollection({}: CardCollectionProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'createdAt'>('createdAt')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  // const [editingCard] = useState<Card | null>(null)
  // const [showDeleteConfirm] = useState<string | null>(null)

  // カード一覧を取得
  const fetchCards = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/cards')
      const data = await response.json()

      if (data.success) {
        setCards(data.cards || [])
      } else {
        toast.error('カードの取得に失敗しました')
        setCards([])
      }
    } catch (error) {
      console.error('Error fetching cards:', error)
      toast.error('サーバーに接続できませんでした')
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch cards when component is actually rendered and server is confirmed working
    const timer = setTimeout(() => {
      fetchCards()
    }, 1000) // Delay to ensure server is ready
    return () => clearTimeout(timer)
  }, [])

  // カード削除
  /*
  const deleteCard = async (_cardId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/cards/${cardId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchCards() // リストを再取得
      } else {
        toast.error(data.error || 'カードの削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting card:', error)
      toast.error('サーバーに接続できませんでした')
    } finally {
      setShowDeleteConfirm(null)
    }
  }
  */

  // カード更新
  /*
  const updateCard = async (_cardId: string, _updatedCard: Partial<Card>) => {
    try {
      const response = await fetch(`http://localhost:3001/api/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedCard)
      })
      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchCards() // リストを再取得
        setEditingCard(null)
      } else {
        toast.error(data.error || 'カードの更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating card:', error)
      toast.error('サーバーに接続できませんでした')
    }
  }
  */

  // カードフィルタリング
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || card.type === selectedType
    return matchesSearch && matchesType
  })

  // カードソート
  const sortedCards = [...filteredCards].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'cost':
        return (a.cost || 0) - (b.cost || 0)
      case 'createdAt':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      default:
        return 0
    }
  })

  // カードタイプの統計
  const typeStats = cards.reduce((acc, card) => {
    acc[card.type] = (acc[card.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const getCardTypeColor = (type: string) => {
    switch (type) {
      case 'Action':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'Treasure':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Victory':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Curse':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'Custom':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30'
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-bounce-subtle mb-4">
            <span className="text-4xl">🃏</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">カードコレクションを読み込み中...</h2>
          <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          📚 カードコレクション
        </h1>
        <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
          作成したすべてのカードを確認・管理できます。お気に入りのカードを見つけて戦略を練りましょう。
        </p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-400">{cards.length}</div>
          <div className="text-sm text-zinc-400">総カード数</div>
        </div>
        {Object.entries(typeStats).map(([type, count]) => (
          <div key={type} className="card text-center">
            <div className="text-2xl font-bold text-purple-400">{count}</div>
            <div className="text-sm text-zinc-400">{type}カード</div>
          </div>
        ))}
      </div>

      {/* 検索・フィルター */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              検索
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="カード名や説明で検索..."
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              タイプフィルター
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">すべて</option>
              <option value="Action">アクション</option>
              <option value="Treasure">財宝</option>
              <option value="Victory">勝利点</option>
              <option value="Curse">呪い</option>
              <option value="Custom">カスタム</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              並び順
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'cost' | 'createdAt')}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="createdAt">作成日時（新しい順）</option>
              <option value="name">名前（あいうえお順）</option>
              <option value="cost">コスト（安い順）</option>
            </select>
          </div>
        </div>
      </div>

      {/* カード一覧 */}
      {sortedCards.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🃏</div>
          <h3 className="text-xl font-semibold mb-2">
            {cards.length === 0 ? 'カードがありません' : '条件に一致するカードがありません'}
          </h3>
          <p className="text-zinc-400 mb-4">
            {cards.length === 0 
              ? 'カードビルダーでオリジナルカードを作成してみましょう！'
              : '検索条件を変更してみてください。'
            }
          </p>
          {cards.length === 0 && (
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              🎨 カードビルダーへ
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCards.map((card) => (
            <div
              key={card.id}
              className="card hover:border-purple-500/50 transition-colors cursor-pointer"
              onClick={() => setSelectedCard(card)}
            >
              {/* カードヘッダー */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg truncate">{card.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCardTypeColor(card.type)}`}>
                    {card.type}
                  </span>
                  {card.cost !== undefined && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-zinc-600 text-zinc-300">
                      {card.cost} 💰
                    </span>
                  )}
                </div>
              </div>

              {/* カード説明 */}
              <p className="text-sm text-zinc-300 mb-3 line-clamp-2">
                {card.description}
              </p>

              {/* 効果一覧 */}
              {card.effects && card.effects.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-zinc-400 mb-1">効果:</div>
                  <div className="space-y-1">
                    {card.effects.slice(0, 2).map((effect, index) => (
                      <div key={index} className="text-xs bg-zinc-700 px-2 py-1 rounded">
                        {effect.type} +{effect.value} ({effect.target})
                      </div>
                    ))}
                    {card.effects.length > 2 && (
                      <div className="text-xs text-zinc-500">
                        +{card.effects.length - 2} 個の効果...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* カード情報 */}
              <div className="text-xs text-zinc-500 border-t border-zinc-700 pt-2">
                <div>作成日: {formatDate(card.createdAt || '')}</div>
                <div>作成者: {card.createdBy || 'anonymous'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* カード詳細モーダル */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg border border-zinc-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{selectedCard.name}</h2>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* カード情報 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-zinc-400 mb-1">タイプ</div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCardTypeColor(selectedCard.type)}`}>
                    {selectedCard.type}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-zinc-400 mb-1">コスト</div>
                  <span className="text-xl font-bold">{selectedCard.cost || 0} 💰</span>
                </div>
              </div>

              {/* 説明 */}
              <div className="mb-6">
                <div className="text-sm text-zinc-400 mb-2">説明</div>
                <p className="text-zinc-200">{selectedCard.description}</p>
              </div>

              {/* 効果詳細 */}
              {selectedCard.effects && selectedCard.effects.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm text-zinc-400 mb-2">効果詳細</div>
                  <div className="space-y-2">
                    {selectedCard.effects.map((effect, index) => (
                      <div key={index} className="bg-zinc-700 p-3 rounded-lg">
                        <div className="font-medium text-blue-400">
                          {effect.type} +{effect.value}
                        </div>
                        <div className="text-sm text-zinc-400">
                          対象: {effect.target} | 条件: {effect.condition || 'なし'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* メタデータ */}
              <div className="border-t border-zinc-700 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400">
                  <div>
                    <div className="mb-1">カードID</div>
                    <div className="font-mono text-xs break-all">{selectedCard.id}</div>
                  </div>
                  <div>
                    <div className="mb-1">バージョン</div>
                    <div>{selectedCard.version || '1.0'}</div>
                  </div>
                  <div>
                    <div className="mb-1">作成日時</div>
                    <div>{formatDate(selectedCard.createdAt || '')}</div>
                  </div>
                  <div>
                    <div className="mb-1">作成者</div>
                    <div>{selectedCard.createdBy || 'anonymous'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 更新ボタン */}
      <div className="mt-8 text-center">
        <button
          onClick={fetchCards}
          className="btn-secondary"
        >
          🔄 更新
        </button>
      </div>
    </div>
  )
}

export default CardCollection