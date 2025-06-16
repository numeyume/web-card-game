import { useState } from 'react'
import type { Card } from '@/types'

interface JsonPreviewProps {
  card: Partial<Card>
}

export function JsonPreview({ card }: JsonPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateCardJson = (): string => {
    const cardJson = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: card.name || '無題のカード',
      cost: card.cost ?? 0,
      type: card.type || 'Action',
      effects: card.effects || [],
      description: card.description || '',
      createdAt: new Date().toISOString(),
      version: '1.0'
    }

    return JSON.stringify(cardJson, null, 2)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateCardJson())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = generateCardJson()
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadJson = () => {
    const jsonString = generateCardJson()
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(card.name || 'card').toLowerCase().replace(/\s+/g, '_')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const validateJson = (): { isValid: boolean, errors: string[] } => {
    const errors: string[] = []

    if (!card.name || card.name.trim().length === 0) {
      errors.push('Card name is required')
    }

    if (card.name && card.name.length > 30) {
      errors.push('Card name must be 30 characters or less')
    }

    if (card.cost !== undefined && (card.cost < 0 || card.cost > 10)) {
      errors.push('Cost must be between 0 and 10')
    }

    if (!card.description || card.description.trim().length === 0) {
      errors.push('Description is required')
    }

    if (card.description && card.description.length > 200) {
      errors.push('Description must be 200 characters or less')
    }

    if (card.effects && card.effects.length > 3) {
      errors.push('Maximum 3 effects allowed')
    }

    if (card.effects) {
      card.effects.forEach((effect, index) => {
        if (!effect.type) {
          errors.push(`Effect ${index + 1}: Type is required`)
        }

        if (effect.value === undefined || effect.value < 1 || effect.value > 10) {
          errors.push(`Effect ${index + 1}: Value must be between 1 and 10`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const validation = validateJson()
  const jsonString = generateCardJson()

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">JSONプレビュー</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {isExpanded ? '🔼 縮小' : '🔽 展開'}
          </button>
        </div>
      </div>

      {/* Validation Status */}
      <div className={`mb-4 p-3 rounded-lg border ${
        validation.isValid 
          ? 'bg-green-900/20 border-green-600 text-green-300'
          : 'bg-red-900/20 border-red-600 text-red-300'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">
            {validation.isValid ? '✅' : '❌'}
          </span>
          <span className="font-medium">
            {validation.isValid ? '有効なカード' : 'バリデーションエラー'}
          </span>
        </div>
        
        {!validation.isValid && (
          <ul className="text-sm space-y-1 ml-6">
            {validation.errors.map((error, index) => (
              <li key={index} className="list-disc">
                {error}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* JSON Content */}
      <div className="bg-zinc-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between bg-zinc-700 px-3 py-2 border-b border-zinc-600">
          <span className="text-sm font-medium text-zinc-300">カードJSONスキーマ</span>
          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-zinc-600 hover:bg-zinc-500 text-zinc-300'
              }`}
            >
              {copied ? '✓ コピー済み！' : '📋 コピー'}
            </button>
            <button
              onClick={downloadJson}
              className="text-xs px-2 py-1 bg-zinc-600 hover:bg-zinc-500 text-zinc-300 rounded transition-colors"
            >
              💾 ダウンロード
            </button>
          </div>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-32'}`}>
          <pre className="p-3 text-xs text-zinc-300 overflow-auto font-mono leading-relaxed">
            <code>{jsonString}</code>
          </pre>
        </div>

        {!isExpanded && (
          <div className="bg-gradient-to-t from-zinc-800 to-transparent h-8 relative -mt-8 pointer-events-none" />
        )}
      </div>

      {/* JSON Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="text-zinc-400 text-xs mb-1">サイズ</div>
          <div className="font-medium">
            {new Blob([jsonString]).size} bytes
          </div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="text-zinc-400 text-xs mb-1">プロパティ</div>
          <div className="font-medium">
            {Object.keys(JSON.parse(jsonString)).length} フィールド
          </div>
        </div>
      </div>

      {/* Schema Info */}
      <div className="mt-4 bg-zinc-800 rounded-lg p-3">
        <h4 className="text-sm font-medium text-zinc-300 mb-2">📋 スキーマ情報</h4>
        <div className="text-xs text-zinc-400 space-y-1">
          <div><span className="text-zinc-300 font-medium">id:</span> 一意識別子（自動生成）</div>
          <div><span className="text-zinc-300 font-medium">name:</span> 表示名（必須、最大30文字）</div>
          <div><span className="text-zinc-300 font-medium">cost:</span> マナコスト（0-10）</div>
          <div><span className="text-zinc-300 font-medium">type:</span> カードカテゴリ（アクション/財宝/勝利/カスタム）</div>
          <div><span className="text-zinc-300 font-medium">effects:</span> ゲーム効果の配列（最大3つ）</div>
          <div><span className="text-zinc-300 font-medium">description:</span> フレーバーテキスト（必須、最大200文字）</div>
        </div>
      </div>

      {/* Import Feature */}
      <div className="mt-4">
        <details className="bg-zinc-800 rounded-lg">
          <summary className="p-3 cursor-pointer text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            📥 JSONカードのインポート
          </summary>
          <div className="p-3 border-t border-zinc-700">
            <textarea
              placeholder="インポートするカードJSONをここに貼り付け..."
              className="w-full h-20 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              onPaste={(e) => {
                try {
                  const text = e.clipboardData.getData('text')
                  const parsed = JSON.parse(text)
                  console.log('Imported card:', parsed)
                  // Here you would call a prop to update the card data
                } catch (err) {
                  console.error('Invalid JSON')
                }
              }}
            />
            <p className="text-xs text-zinc-500 mt-2">
              Paste valid card JSON to import. This will replace current card data.
            </p>
          </div>
        </details>
      </div>
    </div>
  )
}