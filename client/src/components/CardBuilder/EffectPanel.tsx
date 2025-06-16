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
    label: 'カードを引く',
    icon: '🃏',
    effect: { type: 'draw', target: 'self' }
  },
  gain_coin: {
    label: 'コインを得る',
    icon: '🪙',
    effect: { type: 'gain_coin', target: 'self' }
  },
  gain_action: {
    label: 'アクションを得る',
    icon: '⚡',
    effect: { type: 'gain_action', target: 'self' }
  },
  gain_buy: {
    label: '購入を得る',
    icon: '🛒',
    effect: { type: 'gain_buy', target: 'self' }
  },
  attack: {
    label: '相手の手札を減らす',
    icon: '⚔️',
    effect: { type: 'attack', target: 'opponent' }
  },
  gain_card: {
    label: 'カードを獲得',
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
            <label className="block text-xs text-zinc-400 mb-1">効果値</label>
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
            <label className="block text-xs text-zinc-400 mb-1">対象</label>
            <select
              value={effect.target || 'self'}
              onChange={(e) => onUpdate({ ...effect, target: e.target.value as CardEffect['target'] })}
              className="w-full px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="self">自分</option>
              <option value="opponent">相手</option>
              <option value="all">全プレイヤー</option>
            </select>
          </div>
        </div>

        {effect.type === 'gain_card' && (
          <div>
            <label className="block text-xs text-zinc-400 mb-1">条件</label>
            <input
              type="text"
              value={effect.condition || ''}
              onChange={(e) => onUpdate({ ...effect, condition: e.target.value })}
              placeholder="例: コスト ≤ 3"
              className="w-full px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        )}
        
        {effect.type === 'attack' && (
          <div className="bg-red-900/20 border border-red-600/30 rounded p-2 mt-2">
            <div className="text-xs text-red-300">
              💡 <strong>攻撃効果の説明：</strong><br/>
              この効果は相手プレイヤーに対して害を与えます。<br/>
              • 効果値1 = 相手は手札から1枚捨てる<br/>
              • 効果値2 = 相手は手札から2枚捨てる<br/>
              ドミニオンの魔女や盗賊のような妨害カード効果です。
            </div>
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

  const handleDragLeave = () => {
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
      toast.error('1枚のカードには最大3つまでしか効果を設定できません')
      return
    }

    const template = EFFECT_TEMPLATES[effectType]
    if (!template) return

    const newEffect: CardEffect = {
      ...template.effect,
      value: 1
    }
    
    onAddEffect(newEffect)
    toast.success(`${template.label}を追加しました`)
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
      <h3 className="text-lg font-semibold mb-4">カード効果</h3>
      
      {/* Effect Templates */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-zinc-300 mb-3">利用可能な効果（ドラッグまたはクリックで追加）</h4>
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
            カード効果 ({effects.length}/3)
          </h4>
          {effects.length === 0 && (
            <span className="text-xs text-zinc-500">ここに効果をドラッグするか上をクリック</span>
          )}
        </div>

        <DropZone onDrop={handleDropEffect}>
          {effects.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-zinc-500">
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-sm">ここに効果をドラッグしてカードを作成</div>
                <div className="text-xs mt-1">または上の効果をクリック</div>
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
        <h5 className="text-sm font-medium text-zinc-300 mb-2">💡 デザインガイドライン</h5>
        <ul className="text-xs text-zinc-400 space-y-1">
          <li>• 1枚のカードには最大3つまでの効果</li>
          <li>• 効果値は1〜10に設定してください</li>
          <li>• 値を設定する際はゲームバランスを考慮</li>
          <li>• 攻撃効果は相手の手札からカードを捨てさせる効果</li>
          <li>• ドラッグして効果の順序を変更可能</li>
        </ul>
      </div>
    </div>
  )
}