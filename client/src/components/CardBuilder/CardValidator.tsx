import type { Card } from '@/types'

interface CardValidatorProps {
  errors: string[]
}

export function CardValidator({ errors }: CardValidatorProps) {
  if (errors.length === 0) {
    return (
      <div className="card border-2 border-green-600 bg-green-900/20">
        <div className="flex items-center space-x-2 text-green-300">
          <span className="text-xl">✅</span>
          <div>
            <h3 className="font-semibold">カードは有効です！</h3>
            <p className="text-sm text-green-400">すべてのバリデーションが成功しました。保存準備完了です。</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card border-2 border-red-600 bg-red-900/20">
      <div className="flex items-start space-x-2 text-red-300">
        <span className="text-xl mt-0.5">❌</span>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">バリデーションエラー</h3>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-400 flex items-start space-x-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// Validation utility class
export class CardValidationEngine {
  static validate(card: Partial<Card>): string[] {
    const errors: string[] = []

    // Name validation
    if (!card.name || card.name.trim().length === 0) {
      errors.push('カード名は必須です')
    } else if (card.name.length > 30) {
      errors.push('カード名は30文字以内で入力してください')
    } else if (card.name.length < 2) {
      errors.push('カード名は2文字以上で入力してください')
    }

    // Cost validation
    if (card.cost !== undefined) {
      if (card.cost < 0) {
        errors.push('コストはマイナスにできません')
      } else if (card.cost > 10) {
        errors.push('コストは10を超えることはできません')
      }
    }

    // Description validation
    if (!card.description || card.description.trim().length === 0) {
      errors.push('説明文は必須です')
    } else if (card.description.length > 200) {
      errors.push('説明文は200文字以内で入力してください')
    } else if (card.description.length < 10) {
      errors.push('説明文は明確さのために10文字以上で入力することをお勧めします')
    }

    // Effects validation
    if (card.effects) {
      if (card.effects.length === 0) {
        errors.push('少なくとも1つの効果を設定することをお勧めします')
      } else if (card.effects.length > 3) {
        errors.push('1枚のカードには最大3つまでの効果しか設定できません')
      }

      // Individual effect validation
      card.effects.forEach((effect, index) => {
        const effectNumber = index + 1

        if (!effect.type) {
          errors.push(`効果${effectNumber}: タイプの指定が必要です`)
        }

        if (effect.value === undefined || effect.value === null) {
          errors.push(`効果${effectNumber}: 値の指定が必要です`)
        } else if (effect.value < 1) {
          errors.push(`効果${effectNumber}: 値は1以上である必要があります`)
        } else if (effect.value > 10) {
          errors.push(`効果${effectNumber}: 値は10を超えることはできません`)
        }

        // Type-specific validations
        if (effect.type === 'attack' && effect.target === 'self') {
          errors.push(`効果${effectNumber}: 攻撃効果は自分を対象にすべきではありません`)
        }

        if (effect.type === 'gain_card' && !effect.condition) {
          // This is just a warning, not an error
          // errors.push(`Effect ${effectNumber}: Gain card effects should specify conditions`)
        }

        // Balance checking
        if (this.isEffectOverpowered(effect, card.cost || 0)) {
          errors.push(`効果${effectNumber}: コスト${card.cost || 0}に対して強すぎる可能性があります`)
        }
      })

      // Overall power level check
      const powerLevel = this.calculatePowerLevel(card)
      const cost = card.cost || 0
      
      if (powerLevel > cost + 3) {
        errors.push(`カードが強すぎる可能性があります: パワーレベル${powerLevel} vs コスト${cost}`)
      }
    }

    // Type-specific validations
    if (card.type === 'Victory' && card.effects && card.effects.length > 0) {
      const hasNonVictoryEffects = card.effects.some(e => 
        !['gain_card', 'custom'].includes(e.type)
      )
      if (hasNonVictoryEffects) {
        // This is more of a design guideline
        // errors.push('Victory cards traditionally have minimal effects')
      }
    }

    if (card.type === 'Treasure' && card.effects) {
      const hasNonTreasureEffects = card.effects.some(e => 
        !['gain_coin', 'gain_buy', 'custom'].includes(e.type)
      )
      if (hasNonTreasureEffects) {
        // This is more of a design guideline
        // errors.push('Treasure cards traditionally focus on coins and buys')
      }
    }

    return errors
  }

  private static isEffectOverpowered(effect: any, cardCost: number): boolean {
    const value = effect.value || 0
    
    // Define power thresholds based on effect type and card cost
    const powerThresholds: Record<string, number> = {
      'draw': cardCost * 1.5 + 2,
      'gain_coin': cardCost * 1.2 + 2,
      'gain_action': cardCost * 2 + 1,
      'gain_buy': cardCost * 1.8 + 1,
      'attack': cardCost * 2.5 + 1,
      'gain_card': cardCost * 2.2 + 1
    }

    const threshold = powerThresholds[effect.type] || cardCost + 2
    
    // Apply multiplier for target type
    let adjustedValue = value
    if (effect.target === 'opponent') {
      adjustedValue *= 1.2
    } else if (effect.target === 'all') {
      adjustedValue *= 1.5
    }

    return adjustedValue > threshold
  }

  private static calculatePowerLevel(card: Partial<Card>): number {
    if (!card.effects || card.effects.length === 0) return 0

    let power = 0
    
    card.effects.forEach(effect => {
      const value = effect.value || 1
      
      switch (effect.type) {
        case 'draw':
          power += value * 1.5
          break
        case 'gain_coin':
          power += value * 1.2
          break
        case 'gain_action':
          power += value * 2
          break
        case 'gain_buy':
          power += value * 1.8
          break
        case 'attack':
          power += value * 2.5
          break
        case 'gain_card':
          power += value * 2.2
          break
        default:
          power += value
      }

      // Target modifiers
      if (effect.target === 'opponent') {
        power += 0.5
      } else if (effect.target === 'all') {
        power += 1
      }
    })

    // Multiple effects bonus
    if (card.effects.length >= 2) power += 0.5
    if (card.effects.length >= 3) power += 1

    return Math.round(power * 10) / 10
  }

  static getValidationSummary(card: Partial<Card>): {
    isValid: boolean
    errorCount: number
    powerLevel: number
    recommendations: string[]
  } {
    const errors = this.validate(card)
    const powerLevel = this.calculatePowerLevel(card)
    const recommendations: string[] = []

    // Generate recommendations
    if (card.effects && card.effects.length === 1) {
      recommendations.push('カードの複雑さを高めるために、さらに効果を追加することを検討してください')
    }

    if (powerLevel < (card.cost || 0) - 1) {
      recommendations.push('コストに対してカードの性能が低い可能性があります')
    }

    if (!card.effects || card.effects.length === 0) {
      recommendations.push('カードを面白くするために、少なくとも1つの効果を追加してください')
    }

    if (card.type === 'Action' && card.effects) {
      const hasActionEffect = card.effects.some(e => 
        ['gain_action', 'draw'].includes(e.type)
      )
      if (!hasActionEffect) {
        recommendations.push('アクションカードは+アクションや+カードがあると効果的です')
      }
    }

    return {
      isValid: errors.length === 0,
      errorCount: errors.length,
      powerLevel,
      recommendations
    }
  }
}