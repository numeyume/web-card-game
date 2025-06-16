import { useState } from 'react'
import { EffectPanel } from './EffectPanel'
import { CardPreview } from './CardPreview'
import { JsonPreview } from './JsonPreview'
import { CardValidator, CardValidationEngine } from './CardValidator'
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

  // カード分類の自動判定
  const autoClassifyCard = (cardData: Partial<Card>): Card['type'] => {
    const effects = cardData.effects || []
    
    // 勝利点を持つカードは勝利点カード
    if (cardData.victoryPoints && cardData.victoryPoints > 0) {
      return 'Victory'
    }
    
    // コイン増加効果のみのカードは財宝カード
    if (effects.length === 1 && effects[0].type === 'gain_coin') {
      return 'Treasure'
    }
    
    // その他はアクションカード
    if (effects.length > 0) {
      return 'Action'
    }
    
    // デフォルトはカスタム
    return 'Custom'
  }

  // 説明文の自動生成
  const generateDescription = (cardData: Partial<Card>): string => {
    const effects = cardData.effects || []
    const parts: string[] = []
    
    // 勝利点カードの場合
    if (cardData.victoryPoints && cardData.victoryPoints > 0) {
      return `${cardData.victoryPoints}勝利点`
    }
    
    // 効果を文字列に変換
    effects.forEach(effect => {
      switch (effect.type) {
        case 'draw':
          parts.push(`+${effect.value}カード`)
          break
        case 'gain_action':
          parts.push(`+${effect.value}アクション`)
          break
        case 'gain_buy':
          parts.push(`+${effect.value}購入`)
          break
        case 'gain_coin':
          parts.push(`+${effect.value}コイン`)
          break
        case 'attack':
          parts.push(`他プレイヤーへの攻撃効果`)
          break
        default:
          parts.push(`特殊効果`)
      }
    })
    
    return parts.length > 0 ? parts.join('、') : 'カスタム効果'
  }

  const updateCard = (updates: Partial<Card>) => {
    const newCardData = { ...cardData, ...updates }
    
    // 自動分類機能
    if (updates.effects || updates.victoryPoints) {
      newCardData.type = autoClassifyCard(newCardData)
      // 説明文も自動生成（手動で変更されていない場合のみ）
      const currentDescription = cardData.description || ''
      const autoDescription = generateDescription(cardData)
      if (!currentDescription || currentDescription === autoDescription) {
        newCardData.description = generateDescription(newCardData)
      }
    }
    
    setCardData(newCardData)
    
    // Real-time validation
    const errors = CardValidationEngine.validate(newCardData)
    setValidationErrors(errors)
  }

  const addEffect = (effect: CardEffect) => {
    const currentEffects = cardData.effects || []
    if (currentEffects.length >= 3) {
      toast.error('カード1枚につき最大3つの効果まで設定可能です')
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
      toast.error('保存前にバリデーションエラーを修正してください')
      return
    }

    if (!cardData.name || !cardData.description) {
      toast.error('カード名と説明文は必須です')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('http://localhost:3001/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData)
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message || `カード「${cardData.name}」が正常に作成されました！`)
        // Reset form
        setCardData({
          name: '',
          cost: 0,
          type: 'Action',
          effects: [],
          description: ''
        })
      } else {
        toast.error(result.error || 'カードの保存に失敗しました')
      }
    } catch (error) {
      console.error('Error saving card:', error)
      toast.error('サーバーへの接続に失敗しました')
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
    <div className="max-w-7xl mx-auto" role="main" aria-labelledby="card-builder-title">
      <div className="text-center mb-8">
        <h1 id="card-builder-title" className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          🎨 カード作成
        </h1>
        <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
          オリジナルカードを作成して、あなたの創造性をゲームに反映させましょう。他のプレイヤーと戦略を共有し、コミュニティを豊かにしてください。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Panel - Card Details */}
        <div className="lg:col-span-1 space-y-4 lg:space-y-6">
          {/* Basic Info */}
          <section className="card" aria-labelledby="basic-info-heading">
            <h3 id="basic-info-heading" className="text-lg font-semibold mb-4">基本情報</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  カード名 *
                </label>
                <input
                  type="text"
                  value={cardData.name || ''}
                  onChange={(e) => updateCard({ name: e.target.value })}
                  placeholder="カード名を入力..."
                  className="input-base"
                  maxLength={30}
                  aria-label="カード名"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    コスト
                  </label>
                  <input
                    type="number"
                    value={cardData.cost || 0}
                    onChange={(e) => updateCard({ cost: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="10"
                    className="input-base"
                    aria-label="コスト"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    タイプ
                  </label>
                  <select
                    value={cardData.type || 'Action'}
                    onChange={(e) => updateCard({ type: e.target.value as Card['type'] })}
                    className="input-base"
                    aria-label="カードタイプ"
                  >
                    <option value="Action">アクション</option>
                    <option value="Treasure">財宝</option>
                    <option value="Victory">勝利点</option>
                    <option value="Curse">呪い</option>
                    <option value="Custom">カスタム</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  説明文 *
                </label>
                <textarea
                  value={cardData.description || ''}
                  onChange={(e) => updateCard({ description: e.target.value })}
                  placeholder="このカードの効果を説明..."
                  rows={3}
                  className="input-base resize-none"
                  maxLength={200}
                  aria-label="カードの説明"
                />
                <div className="text-xs text-zinc-400 mt-1">
                  {(cardData.description || '').length}/200 characters
                </div>
              </div>
            </div>
          </section>

          {/* Validation */}
          <div id="validation-errors" role="alert" aria-live="polite">
            <CardValidator errors={validationErrors} />
          </div>

          {/* Actions */}
          <section className="card" aria-labelledby="actions-heading">
            <h3 id="actions-heading" className="text-lg font-semibold mb-4">操作</h3>
            <div className="space-y-3">
              <button
                onClick={generateRandomCard}
                className="btn-secondary w-full flex items-center justify-center space-x-2 group"
                aria-label="ランダムカードを生成"
                title="ランダムな設定でカードを自動生成します"
              >
                <span className="group-hover:animate-bounce-subtle" aria-hidden="true">🎲</span>
                <span>ランダム生成</span>
              </button>
              
              <button
                onClick={saveCard}
                disabled={isSaving || validationErrors.length > 0 || !cardData.name || !cardData.description}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                aria-label={isSaving ? "カードを保存中" : "カードを保存"}
                aria-describedby={validationErrors.length > 0 ? "validation-errors" : undefined}
              >
                {isSaving ? (
                  <>
                    <div className="loading-spinner" aria-hidden="true"></div>
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">💾</span>
                    <span>カードを保存</span>
                  </>
                )}
              </button>
            </div>
          </section>
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
        <div className="lg:col-span-1 space-y-4 lg:space-y-6">
          <CardPreview card={cardData} />
          <JsonPreview card={cardData} />
        </div>
      </div>
    </div>
  )
}