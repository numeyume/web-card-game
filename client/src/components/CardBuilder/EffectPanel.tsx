import React, { useState } from 'react'
import type { CardEffect } from '@/types'
import toast from 'react-hot-toast'

interface EffectPanelProps {
  effects: CardEffect[]
  onAddEffect: (effect: CardEffect) => void
  onRemoveEffect: (index: number) => void
  onUpdateEffect: (index: number, effect: CardEffect) => void
}

const EFFECT_TEMPLATES: Record<string, { label: string, icon: string, effect: Omit<CardEffect, 'value'> }> = {
  draw: {
    label: 'Draw Cards',
    icon: '🃏',
    effect: { type: 'draw', target: 'self' }
  },
  gain_coin: {
    label: 'Gain Coins',
    icon: '🪙',
    effect: { type: 'gain_coin', target: 'self' }
  },
  gain_action: {
    label: 'Gain Actions',
    icon: '⚡',
    effect: { type: 'gain_action', target: 'self' }
  },
  gain_buy: {
    label: 'Gain Buys',
    icon: '🛒',
    effect: { type: 'gain_buy', target: 'self' }
  },
  attack: {
    label: 'Attack Others',
    icon: '⚔️',
    effect: { type: 'attack', target: 'opponent' }
  },
  gain_card: {
    label: 'Gain Card',
    icon: '📥',
    effect: { type: 'gain_card', target: 'self' }
  }
}

function DraggableEffect({ effectType, template, onAdd }: { 
  effectType: string, 
  template: typeof EFFECT_TEMPLATES[string],
  onAdd: () => void
}) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData('application/json', JSON.stringify({ effectType, template }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onAdd}
      className={`p-3 bg-zinc-700 rounded-lg border-2 border-zinc-600 cursor-grab active:cursor-grabbing hover:border-purple-500 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="text-center">
        <div className="text-2xl mb-2">{template.icon}</div>
        <div className="text-sm font-medium">{template.label}</div>
      </div>
    </div>
  )
}

function EffectSlot({ effect, index, onUpdate, onRemove, onMove }: { 
  effect: CardEffect, 
  index: number, 
  onUpdate: (effect: CardEffect) => void,
  onRemove: () => void,
  onMove: (fromIndex: number, toIndex: number) => void
}) {
  const template = EFFECT_TEMPLATES[effect.type]

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (fromIndex !== index) {
      onMove(fromIndex, index)
    }
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="p-4 bg-zinc-700 rounded-lg border-2 border-zinc-600 hover:border-zinc-500 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="text-xl cursor-grab active:cursor-grabbing">
            {template?.icon || '❓'}
          </div>
          <span className="font-medium">{template?.label || effect.type}</span>
        </div>
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Value</label>
            <input
              type="number"
              value={effect.value}
              onChange={(e) => onUpdate({ ...effect, value: parseInt(e.target.value) || 1 })}
              min="1"
              max="10"
              className="w-full px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Target</label>
            <select
              value={effect.target || 'self'}
              onChange={(e) => onUpdate({ ...effect, target: e.target.value as CardEffect['target'] })}
              className="w-full px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="self">Self</option>
              <option value="opponent">Opponent</option>
              <option value="all">All Players</option>
            </select>
          </div>
        </div>

        {effect.type === 'gain_card' && (
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Condition</label>
            <input
              type="text"
              value={effect.condition || ''}
              onChange={(e) => onUpdate({ ...effect, condition: e.target.value })}
              placeholder="e.g., cost ≤ 3"
              className="w-full px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function DropZone({ children, onDrop }: { children: React.ReactNode, onDrop: (effectType: string) => void }) {
  const [isOver, setIsOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(true)
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDragLeave = (e: React.DragEvent) => {
    setIsOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(false)
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      onDrop(data.effectType)
    } catch (err) {
      // Handle plain text drop (for reordering)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-[200px] p-4 border-2 border-dashed rounded-lg transition-colors ${
        isOver 
          ? 'border-purple-500 bg-purple-500/10' 
          : 'border-zinc-600 bg-zinc-800/50'
      }`}
    >
      {children}
    </div>
  )
}

export function EffectPanel({ effects, onAddEffect, onRemoveEffect, onUpdateEffect }: EffectPanelProps) {
  const handleDropEffect = (effectType: string) => {
    if (effects.length >= 3) {
      toast.error('Maximum 3 effects per card')
      return
    }

    const template = EFFECT_TEMPLATES[effectType]
    if (!template) return

    const newEffect: CardEffect = {
      ...template.effect,
      value: 1
    }
    
    onAddEffect(newEffect)
    toast.success(`Added ${template.label}`)
  }

  const handleMoveEffect = (fromIndex: number, toIndex: number) => {
    const newEffects = [...effects]
    const [movedEffect] = newEffects.splice(fromIndex, 1)
    newEffects.splice(toIndex, 0, movedEffect)
    
    // Update all effects with new order
    newEffects.forEach((effect, index) => {
      onUpdateEffect(index, effect)
    })
  }

  const handleAddEffectClick = (effectType: string) => {
    handleDropEffect(effectType)
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Card Effects</h3>
      
      {/* Effect Templates */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-zinc-300 mb-3">Available Effects (Drag or click to add)</h4>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(EFFECT_TEMPLATES).map(([effectType, template]) => (
            <DraggableEffect 
              key={effectType} 
              effectType={effectType} 
              template={template}
              onAdd={() => handleAddEffectClick(effectType)}
            />
          ))}
        </div>
      </div>

      {/* Effect Drop Zone */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-zinc-300">
            Card Effects ({effects.length}/3)
          </h4>
          {effects.length === 0 && (
            <span className="text-xs text-zinc-500">Drag effects here or click above</span>
          )}
        </div>

        <DropZone onDrop={handleDropEffect}>
          {effects.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-zinc-500">
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-sm">Drag effects here to build your card</div>
                <div className="text-xs mt-1">Or click on effects above</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {effects.map((effect, index) => (
                <EffectSlot
                  key={`effect-${index}`}
                  effect={effect}
                  index={index}
                  onUpdate={(updatedEffect) => onUpdateEffect(index, updatedEffect)}
                  onRemove={() => onRemoveEffect(index)}
                  onMove={handleMoveEffect}
                />
              ))}
            </div>
          )}
        </DropZone>
      </div>

      {/* Guidelines */}
      <div className="bg-zinc-800 rounded-lg p-3">
        <h5 className="text-sm font-medium text-zinc-300 mb-2">💡 Design Guidelines</h5>
        <ul className="text-xs text-zinc-400 space-y-1">
          <li>• Maximum 3 effects per card</li>
          <li>• Effect values should be 1-10</li>
          <li>• Consider game balance when setting values</li>
          <li>• Attack effects target opponents by default</li>
          <li>• Drag to reorder effects</li>
        </ul>
      </div>
    </div>
  )
}