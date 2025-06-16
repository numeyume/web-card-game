import { Card } from '@/types'

interface CardTooltipProps {
  card: Card
  cost?: number
  show: boolean
  position: { x: number; y: number }
  mode?: 'detailed' | 'compact' // チュートリアル用=detailed、対戦用=compact
}

export function CardTooltip({ card, cost, show, position, mode = 'compact' }: CardTooltipProps) {
  if (!show) return null

  const getCardTypeInfo = () => {
    switch (card.type) {
      case 'Action':
        return {
          icon: '⚡',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          description: 'アクションフェーズでプレイ。手札選択肢を増やし、強力なコンボを実現'
        }
      case 'Treasure':
        return {
          icon: '💰',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          description: '購入フェーズでプレイしてコイン獲得'
        }
      case 'Victory':
        return {
          icon: '👑',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/30',
          description: 'ゲーム終了時に勝利点を提供'
        }
      default:
        return {
          icon: '🃏',
          color: 'text-zinc-400',
          bgColor: 'bg-zinc-500/10',
          borderColor: 'border-zinc-500/30',
          description: ''
        }
    }
  }

  const typeInfo = getCardTypeInfo()

  const formatEffects = () => {
    if (!card.effects) return null
    
    return card.effects.map((effect, index) => {
      switch (effect.type) {
        case 'draw':
          return <div key={index} className="flex items-center space-x-2">
            <span className="text-green-400">🃏</span>
            <span>+{effect.value} カードドロー</span>
            <span className="text-xs text-green-300">（手札が増える）</span>
          </div>
        case 'gain_action':
          return <div key={index} className="flex items-center space-x-2">
            <span className="text-blue-400">⚡</span>
            <span>+{effect.value} アクション</span>
            <span className="text-xs text-blue-300">（追加でアクションカードをプレイ可能）</span>
          </div>
        case 'gain_buy':
          return <div key={index} className="flex items-center space-x-2">
            <span className="text-green-400">🛍</span>
            <span>+{effect.value} 購入</span>
            <span className="text-xs text-green-300">（追加でカードを購入可能）</span>
          </div>
        case 'gain_coin':
          return <div key={index} className="flex items-center space-x-2">
            <span className="text-yellow-400">💰</span>
            <span>+{effect.value} コイン</span>
            <span className="text-xs text-yellow-300">（このターンのみ）</span>
          </div>
        default:
          return null
      }
    }).filter(Boolean)
  }

  const getCardStrategicValue = () => {
    switch (card.id) {
      case 'copper':
        return '基本的な財宝。序盤の主要コイン源。'
      case 'silver':
        return '中級財宝。銅貨の2倍の価値。序盤の重要な購入目標。'
      case 'gold':
        return '高級財宝。強力なコイン源。中盤以降の主力。'
      case 'estate':
        return '基本勝利点。序盤は購入を控え、終盤に大量購入。'
      case 'duchy':
        return '中級勝利点。終盤戦で重要。属州が狙えない時の選択肢。'
      case 'province':
        return '最高勝利点。ゲームの勝敗を決する最重要カード。'
      case 'village':
        return 'アクション増加の基本カード。他のアクションカードとの組み合わせで真価を発揮。'
      case 'smithy':
        return '強力なドロー効果。手札選択肢を大幅に増加。'
      case 'market':
        return 'バランスの良い万能カード。あらゆる効果を少しずつ提供。'
      case 'laboratory':
        return 'ドローとアクション増加。他のアクションとの連鎖を作りやすい。'
      case 'woodcutter':
        return '購入回数とコイン増加。複数カード購入戦略の基礎。'
      default:
        return null
    }
  }

  const strategicValue = getCardStrategicValue()

  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{
        left: Math.min(position.x + 10, window.innerWidth - 320),
        top: Math.min(position.y + 10, window.innerHeight - 200),
      }}
    >
      <div className={`
        w-80 p-4 rounded-lg border-2 shadow-2xl
        bg-zinc-900/95 backdrop-blur-sm
        ${typeInfo.borderColor}
        transform transition-all duration-200
        animate-in fade-in slide-in-from-left-2
      `}>
        {/* カードヘッダー */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{typeInfo.icon}</span>
            <h3 className={`font-bold text-lg ${typeInfo.color}`}>{card.name}</h3>
          </div>
          {typeof cost !== 'undefined' && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-zinc-700 rounded">
              <span className="text-yellow-400">💳</span>
              <span className="font-bold text-yellow-300">{cost}</span>
            </div>
          )}
        </div>

        {/* カードタイプ */}
        <div className={`text-sm ${typeInfo.color} mb-3 p-2 rounded ${typeInfo.bgColor}`}>
          {card.type === 'Action' && 'アクションカード'}
          {card.type === 'Treasure' && '財宝カード'}
          {card.type === 'Victory' && '勝利点カード'}
          {mode === 'detailed' && (' - ' + typeInfo.description)}
        </div>

        {/* 効果 */}
        {card.effects && card.effects.length > 0 && (
          <div className="mb-3">
            <h4 className="font-bold text-sm text-zinc-300 mb-2">効果:</h4>
            <div className="space-y-1 text-sm">
              {formatEffects()}
            </div>
          </div>
        )}

        {/* 勝利点 */}
        {card.victoryPoints && (
          <div className="mb-3">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-purple-400">👑</span>
              <span className="font-bold text-purple-400">{card.victoryPoints} 勝利点</span>
            </div>
          </div>
        )}

        {/* 説明文 */}
        {card.description && (
          <div className="mb-3">
            <div className="text-sm text-green-400 bg-green-500/10 p-2 rounded">
              {card.description}
            </div>
          </div>
        )}

        {/* 戦略的価値 - detailed モードのみ表示 */}
        {mode === 'detailed' && strategicValue && (
          <div className="border-t border-zinc-700 pt-3">
            <h4 className="font-bold text-sm text-yellow-400 mb-2">💡 戦略ヒント:</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{strategicValue}</p>
          </div>
        )}
      </div>
    </div>
  )
}