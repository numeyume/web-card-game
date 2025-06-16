import type { Card } from '@/types'

interface CardPreviewProps {
  card: Partial<Card>
}

export function CardPreview({ card }: CardPreviewProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Action': return 'from-blue-500 to-blue-700'
      case 'Treasure': return 'from-yellow-500 to-yellow-700'
      case 'Victory': return 'from-green-500 to-green-700'
      case 'Curse': return 'from-red-500 to-red-700'
      case 'Custom': return 'from-purple-500 to-purple-700'
      default: return 'from-gray-500 to-gray-700'
    }
  }

  const getEffectIcon = (effectType: string) => {
    switch (effectType) {
      case 'draw': return '🃏'
      case 'gain_coin': return '🪙'
      case 'gain_action': return '⚡'
      case 'gain_buy': return '🛒'
      case 'attack': return '⚔️'
      case 'gain_card': return '📥'
      default: return '❓'
    }
  }

  const getEffectDescription = (effect: any) => {
    const target = effect.target === 'self' ? '' : effect.target === 'opponent' ? '相手に' : '全プレイヤーに'
    
    switch (effect.type) {
      case 'draw': return `カードを${effect.value}枚引く`
      case 'gain_coin': return `+${effect.value}コイン`
      case 'gain_action': return `+${effect.value}アクション`
      case 'gain_buy': return `+${effect.value}購入`
      case 'attack': return `${target}${effect.value}ダメージ`
      case 'gain_card': return `カードを獲得${effect.condition ? ` (${effect.condition})` : ''}`
      default: return `${effect.type}: ${effect.value}`
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">カードプレビュー</h3>
      
      <div className="relative">
        {/* Card */}
        <div className="aspect-[2.5/3.5] w-full max-w-[240px] mx-auto">
          <div className={`relative h-full w-full bg-gradient-to-br ${getTypeColor(card.type || 'Action')} rounded-xl shadow-2xl border-2 border-zinc-600 overflow-hidden`}>
            
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-black/30 backdrop-blur-sm p-3">
              <div className="flex items-center justify-between">
                <div className="text-white font-bold text-sm truncate pr-2">
                  {card.name || '無題のカード'}
                </div>
                <div className="flex-shrink-0 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-black font-bold text-sm">
                  {card.cost ?? 0}
                </div>
              </div>
              <div className="text-white/80 text-xs font-medium mt-1">
                {card.type || 'Action'}
              </div>
            </div>

            {/* Art Area */}
            <div className="absolute top-16 left-3 right-3 bottom-20 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
              <div className="text-white/50 text-4xl">
                {card.type === 'Action' && '⚡'}
                {card.type === 'Treasure' && '🪙'}
                {card.type === 'Victory' && '👑'}
                {card.type === 'Curse' && '💀'}
                {card.type === 'Custom' && '✨'}
              </div>
            </div>

            {/* Effects */}
            <div className="absolute bottom-12 left-3 right-3">
              <div className="bg-black/40 backdrop-blur-sm rounded-lg p-2 max-h-16 overflow-y-auto">
                {card.effects && card.effects.length > 0 ? (
                  <div className="space-y-1">
                    {card.effects.map((effect, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs text-white">
                        <span className="text-sm">{getEffectIcon(effect.type)}</span>
                        <span className="font-medium">{getEffectDescription(effect)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/50 text-xs text-center">
                    効果が設定されていません
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm p-2">
              <div className="text-white/80 text-xs text-center truncate">
                {card.description || '説明が設定されていません'}
              </div>
            </div>

            {/* Rarity Indicator */}
            <div className="absolute top-2 right-2">
              <div className={`w-3 h-3 rounded-full ${
                card.effects && card.effects.length >= 3 ? 'bg-yellow-400' :
                card.effects && card.effects.length >= 2 ? 'bg-blue-400' :
                'bg-gray-400'
              }`} />
            </div>
          </div>
        </div>

        {/* Card Stats */}
        <div className="mt-4 bg-zinc-800 rounded-lg p-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-zinc-400">コスト</div>
              <div className="text-lg font-bold text-white">{card.cost ?? 0}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">効果</div>
              <div className="text-lg font-bold text-white">{card.effects?.length || 0}/3</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">タイプ</div>
              <div className="text-sm font-medium text-white truncate">{card.type || 'Action'}</div>
            </div>
          </div>
        </div>

        {/* Power Level Indicator */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>パワーレベル</span>
            <span>{getPowerLevel(card)}/10</span>
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                getPowerLevel(card) >= 8 ? 'bg-red-500' :
                getPowerLevel(card) >= 6 ? 'bg-yellow-500' :
                getPowerLevel(card) >= 4 ? 'bg-blue-500' :
                'bg-green-500'
              }`}
              style={{ width: `${(getPowerLevel(card) / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function getPowerLevel(card: Partial<Card>): number {
  if (!card.effects || card.effects.length === 0) return 0

  let power = 0
  
  // Base power from effects
  card.effects.forEach(effect => {
    const value = effect.value || 1
    
    switch (effect.type) {
      case 'draw':
        power += value * 1.5 // Drawing cards is powerful
        break
      case 'gain_coin':
        power += value * 1.2
        break
      case 'gain_action':
        power += value * 2 // Actions are very valuable
        break
      case 'gain_buy':
        power += value * 1.8
        break
      case 'attack':
        power += value * 2.5 // Attacks are powerful
        break
      case 'gain_card':
        power += value * 2.2
        break
      default:
        power += value
    }

    // Bonus for targeting opponents
    if (effect.target === 'opponent') {
      power += 0.5
    } else if (effect.target === 'all') {
      power += 1
    }
  })

  // Penalty for high cost
  const cost = card.cost || 0
  if (cost > 6) {
    power -= (cost - 6) * 0.5
  }

  // Bonus for multiple effects
  if (card.effects.length >= 2) {
    power += 0.5
  }
  if (card.effects.length >= 3) {
    power += 1
  }

  return Math.max(0, Math.min(10, Math.round(power)))
}