import React, { useState } from 'react'
import { EffectPanel } from './EffectPanel'
import { CardPreview } from './CardPreview'
import { JsonPreview } from './JsonPreview'
import { CardValidator } from './CardValidator'
import type { Card, CardEffect } from '@/types'
import toast from 'react-hot-toast'

export function CardBuilder() {
  const [cardData, setCardData] = useState<Partial<Card>>({
    name: '',
    cost: 0,
    type: 'Action',
    effects: [],
    description: ''
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const updateCard = (updates: Partial<Card>) => {
    const newCardData = { ...cardData, ...updates }
    setCardData(newCardData)
    
    // Real-time validation
    const errors = CardValidator.validate(newCardData)
    setValidationErrors(errors)
  }

  const addEffect = (effect: CardEffect) => {
    const currentEffects = cardData.effects || []
    if (currentEffects.length >= 3) {
      toast.error('Maximum 3 effects per card')
      return
    }
    
    updateCard({
      effects: [...currentEffects, effect]
    })
  }

  const removeEffect = (index: number) => {
    const currentEffects = cardData.effects || []
    updateCard({
      effects: currentEffects.filter((_, i) => i !== index)
    })
  }

  const updateEffect = (index: number, effect: CardEffect) => {
    const currentEffects = [...(cardData.effects || [])]
    currentEffects[index] = effect
    updateCard({ effects: currentEffects })
  }

  const saveCard = async () => {
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before saving')
      return
    }

    if (!cardData.name || !cardData.description) {
      toast.error('Name and description are required')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData)
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Card "${cardData.name}" created successfully!`)
        // Reset form
        setCardData({
          name: '',
          cost: 0,
          type: 'Action',
          effects: [],
          description: ''
        })
      } else {
        toast.error(result.error || 'Failed to save card')
      }
    } catch (error) {
      console.error('Error saving card:', error)
      toast.error('Failed to connect to server')
    } finally {
      setIsSaving(false)
    }
  }

  const generateRandomCard = () => {
    const cardTypes: Card['type'][] = ['Action', 'Treasure', 'Victory', 'Custom']
    const effectTypes: CardEffect['type'][] = ['draw', 'gain_coin', 'gain_action', 'gain_buy', 'attack']
    
    const randomType = cardTypes[Math.floor(Math.random() * cardTypes.length)]
    const numEffects = Math.floor(Math.random() * 3) + 1
    
    const effects: CardEffect[] = []
    for (let i = 0; i < numEffects; i++) {
      const effectType = effectTypes[Math.floor(Math.random() * effectTypes.length)]
      effects.push({
        type: effectType,
        value: Math.floor(Math.random() * 3) + 1,
        target: 'self'
      })
    }

    updateCard({
      name: `Random ${randomType} ${Date.now()}`,
      cost: Math.floor(Math.random() * 8),
      type: randomType,
      effects,
      description: `A randomly generated ${randomType.toLowerCase()} card with ${numEffects} effect${numEffects > 1 ? 's' : ''}.`
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Card Builder
        </h1>
        <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
          Create custom cards with drag & drop effects. Design unique strategies and share them with the community.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Card Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Card Name *
                </label>
                <input
                  type="text"
                  value={cardData.name || ''}
                  onChange={(e) => updateCard({ name: e.target.value })}
                  placeholder="Enter card name..."
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={30}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Cost
                  </label>
                  <input
                    type="number"
                    value={cardData.cost || 0}
                    onChange={(e) => updateCard({ cost: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Type
                  </label>
                  <select
                    value={cardData.type || 'Action'}
                    onChange={(e) => updateCard({ type: e.target.value as Card['type'] })}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Action">Action</option>
                    <option value="Treasure">Treasure</option>
                    <option value="Victory">Victory</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={cardData.description || ''}
                  onChange={(e) => updateCard({ description: e.target.value })}
                  placeholder="Describe what this card does..."
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  maxLength={200}
                />
                <div className="text-xs text-zinc-400 mt-1">
                  {(cardData.description || '').length}/200 characters
                </div>
              </div>
            </div>
          </div>

          {/* Validation */}
          <CardValidator errors={validationErrors} />

          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={generateRandomCard}
                className="button-secondary w-full"
              >
                🎲 Generate Random Card
              </button>
              
              <button
                onClick={saveCard}
                disabled={isSaving || validationErrors.length > 0 || !cardData.name || !cardData.description}
                className="button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '💾 Saving...' : '💾 Save Card'}
              </button>
            </div>
          </div>
        </div>

        {/* Center Panel - Effects */}
        <div className="lg:col-span-1">
          <EffectPanel
            effects={cardData.effects || []}
            onAddEffect={addEffect}
            onRemoveEffect={removeEffect}
            onUpdateEffect={updateEffect}
          />
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-1 space-y-6">
          <CardPreview card={cardData} />
          <JsonPreview card={cardData} />
        </div>
      </div>
    </div>
  )
}