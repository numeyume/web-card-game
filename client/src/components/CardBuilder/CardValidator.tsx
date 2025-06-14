import React from 'react'
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
            <h3 className="font-semibold">Card is Valid!</h3>
            <p className="text-sm text-green-400">All validation checks passed. Ready to save.</p>
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
          <h3 className="font-semibold mb-2">Validation Errors</h3>
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
export class CardValidator {
  static validate(card: Partial<Card>): string[] {
    const errors: string[] = []

    // Name validation
    if (!card.name || card.name.trim().length === 0) {
      errors.push('Card name is required')
    } else if (card.name.length > 30) {
      errors.push('Card name must be 30 characters or less')
    } else if (card.name.length < 2) {
      errors.push('Card name must be at least 2 characters')
    }

    // Cost validation
    if (card.cost !== undefined) {
      if (card.cost < 0) {
        errors.push('Cost cannot be negative')
      } else if (card.cost > 10) {
        errors.push('Cost cannot exceed 10')
      }
    }

    // Description validation
    if (!card.description || card.description.trim().length === 0) {
      errors.push('Description is required')
    } else if (card.description.length > 200) {
      errors.push('Description must be 200 characters or less')
    } else if (card.description.length < 10) {
      errors.push('Description should be at least 10 characters for clarity')
    }

    // Effects validation
    if (card.effects) {
      if (card.effects.length === 0) {
        errors.push('At least one effect is recommended')
      } else if (card.effects.length > 3) {
        errors.push('Maximum 3 effects allowed per card')
      }

      // Individual effect validation
      card.effects.forEach((effect, index) => {
        const effectNumber = index + 1

        if (!effect.type) {
          errors.push(`Effect ${effectNumber}: Type is required`)
        }

        if (effect.value === undefined || effect.value === null) {
          errors.push(`Effect ${effectNumber}: Value is required`)
        } else if (effect.value < 1) {
          errors.push(`Effect ${effectNumber}: Value must be at least 1`)
        } else if (effect.value > 10) {
          errors.push(`Effect ${effectNumber}: Value cannot exceed 10`)
        }

        // Type-specific validations
        if (effect.type === 'attack' && effect.target === 'self') {
          errors.push(`Effect ${effectNumber}: Attack effects should not target self`)
        }

        if (effect.type === 'gain_card' && !effect.condition) {
          // This is just a warning, not an error
          // errors.push(`Effect ${effectNumber}: Gain card effects should specify conditions`)
        }

        // Balance checking
        if (this.isEffectOverpowered(effect, card.cost || 0)) {
          errors.push(`Effect ${effectNumber}: May be overpowered for cost ${card.cost || 0}`)
        }
      })

      // Overall power level check
      const powerLevel = this.calculatePowerLevel(card)
      const cost = card.cost || 0
      
      if (powerLevel > cost + 3) {
        errors.push(`Card may be overpowered: power level ${powerLevel} vs cost ${cost}`)
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
      recommendations.push('Consider adding more effects for better card complexity')
    }

    if (powerLevel < (card.cost || 0) - 1) {
      recommendations.push('Card might be underpowered for its cost')
    }

    if (!card.effects || card.effects.length === 0) {
      recommendations.push('Add at least one effect to make the card interesting')
    }

    if (card.type === 'Action' && card.effects) {
      const hasActionEffect = card.effects.some(e => 
        ['gain_action', 'draw'].includes(e.type)
      )
      if (!hasActionEffect) {
        recommendations.push('Action cards often benefit from +Actions or +Cards')
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