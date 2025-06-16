import { useState } from 'react'

interface TutorialStep {
  id: string
  title: string
  content: string
  visual?: string
  interactive?: boolean
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'overview',
    title: 'ドミニオンとは',
    content: `
      ドミニオンは**デッキ構築ゲーム**です。
      
      🎯 **目的**: 最も多くの勝利点を獲得して勝利する
      
      📦 **基本概念**: 
      • ゲーム中にカードを購入してデッキを強化
      • より強力なカードでより多くの勝利点を獲得
      • 全プレイヤーが同じサプライから購入するため戦略が重要
    `,
    visual: '🏰'
  },
  {
    id: 'cards',
    title: 'カードの種類',
    content: `
      ドミニオンには3種類のカードがあります：
      
      ⚡ **アクションカード** (青)
      • アクションフェーズでプレイ
      • カードドロー、追加アクション、コイン獲得など
      • 例：村(+1カード +2アクション)、鍛冶屋(+3カード)
      
      💰 **財宝カード** (黄)
      • 購入フェーズでプレイしてコイン獲得
      • 銅貨(1コイン)、銀貨(2コイン)、金貨(3コイン)
      
      👑 **勝利点カード** (紫)
      • ゲーム終了時の得点源
      • 屋敷(1点)、公領(3点)、属州(6点)
    `,
    visual: '🃏'
  },
  {
    id: 'areas',
    title: 'ゲームエリア',
    content: `
      ドミニオンでは4つのエリアでカードを管理します：
      
      🎲 **山札 (デッキ)**
      • 自分の所有カード
      • 上からカードをドロー
      • 無くなったら捨て札をシャッフルして補充
      
      ✋ **手札**
      • 現在プレイ可能なカード
      • 通常5枚保持
      
      🎯 **プレイエリア**
      • このターンでプレイしたカード
      • ターン終了時に捨て札へ
      
      🗑️ **捨て札**
      • 使用済みまたは獲得したカード
      • 山札が尽きた時にシャッフルして山札に戻る
    `,
    visual: '📚'
  },
  {
    id: 'phases',
    title: 'ターンの3フェーズ',
    content: `
      各ターンは3つのフェーズに分かれています：
      
      🎯 **1. アクションフェーズ**
      • アクションカードをプレイ（通常1回）
      • カード効果でアクション回数は増加可能
      • プレイしたくない場合はスキップ可能
      
      💰 **2. 購入フェーズ**  
      • 財宝カードをプレイしてコイン獲得
      • コインを使ってサプライからカード購入（通常1回）
      • 購入したカードは捨て札に追加
      
      🔄 **3. クリーンアップフェーズ**
      • 手札とプレイエリアのカードを全て捨て札に
      • 新しく5枚ドロー
      • アクション・購入回数をリセット
      • 自動で次プレイヤーのターンに
    `,
    visual: '🔄'
  },
  {
    id: 'supply',
    title: 'サプライシステム',
    content: `
      **サプライ**は全プレイヤー共通の購入可能カード置き場です：
      
      🏪 **基本構成**
      • 財宝カード: 銅貨、銀貨、金貨
      • 勝利点カード: 屋敷、公領、属州  
      • 王国カード: 10種類のアクションカード
      
      💳 **購入ルール**
      • コスト以上のコインが必要
      • 在庫が無いカードは購入不可
      • 購入したカードは自分の捨て札に追加
      
      📦 **在庫管理**
      • 各カードの残り枚数が表示
      • 人気カードは早めに無くなることも
      • 戦略的な購入タイミングが重要
    `,
    visual: '🏪'
  },
  {
    id: 'victory',
    title: '勝利条件',
    content: `
      ゲームは以下の条件で終了します：
      
      👑 **属州カードが無くなった時**
      • 最も価値の高い勝利点カード
      • 通常はこの条件で終了
      
      📦 **3種類のサプライが無くなった時**
      • どの3種類でも可
      • 早期終了を狙う戦略も存在
      
      🏆 **勝者決定**
      • 全カード（手札・山札・捨て札・プレイエリア）の勝利点合計
      • 最多勝利点プレイヤーが勝利
      • 同点の場合はターン数の少ないプレイヤーが勝利
      
      💡 **戦略のヒント**
      • 序盤：デッキ強化（アクション・財宝カード）
      • 中盤：バランス良く購入
      • 終盤：勝利点カード重視
    `,
    visual: '🏆'
  },
  {
    id: 'cards_detail',
    title: '基本カード詳細',
    content: `
      **財宝カード**
      💰 銅貨 (0コイン) → +1コイン
      💰 銀貨 (3コイン) → +2コイン  
      💰 金貨 (6コイン) → +3コイン
      
      **勝利点カード**
      👑 屋敷 (2コイン) → 1勝利点
      👑 公領 (5コイン) → 3勝利点
      👑 属州 (8コイン) → 6勝利点
      
      **基本アクションカード**
      ⚡ 村 (3💳) → +1🃏 +2⚡ | アクション連鎖の基本
      ⚡ 鍛冶屋 (4💳) → +3🃏 | 強力なドロー効果
      ⚡ 研究所 (5💳) → +2🃏 +1⚡ | バランス良いドロー
      ⚡ 市場 (5💳) → +1🃏 +1⚡ +1🛍 +1💰 | 万能カード
      ⚡ 木こり (3💳) → +1🛍 +2💰 | 複数購入戦略
      
      💡 カード効果はゲーム中にホバーで確認できます
    `,
    visual: '📋'
  }
]

interface TutorialScreenProps {
  onClose: () => void
  onStartTutorial: () => void
}

export function TutorialScreen({ onClose, onStartTutorial }: TutorialScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showQuickReference, setShowQuickReference] = useState(false)

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
      // 画面上部にスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      // 画面上部にスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return <br key={index} />
      
      // **テキスト**形式の強調を処理
      if (trimmed.includes('**')) {
        const parts = trimmed.split('**')
        return (
          <p key={index} className="text-zinc-300 mb-2">
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? 
                <span key={partIndex} className="font-bold text-blue-400">{part}</span> : 
                part
            )}
          </p>
        )
      }
      
      if (trimmed.startsWith('•')) {
        return <li key={index} className="ml-4 text-zinc-300">{trimmed.slice(1).trim()}</li>
      }
      
      if (trimmed.match(/^[⚡💰👑🎯💳📦🏆💡🎲✋🗑️🔄🏪]/)) {
        const content = trimmed.slice(1).trim()
        // **テキスト**形式の強調を処理
        if (content.includes('**')) {
          const parts = content.split('**')
          return (
            <div key={index} className="flex items-start space-x-2 my-2">
              <span className="text-xl">{trimmed.charAt(0)}</span>
              <span className="text-zinc-300">
                {parts.map((part, partIndex) => 
                  partIndex % 2 === 1 ? 
                    <span key={partIndex} className="font-bold text-blue-400">{part}</span> : 
                    part
                )}
              </span>
            </div>
          )
        }
        return <div key={index} className="flex items-start space-x-2 my-2">
          <span className="text-xl">{trimmed.charAt(0)}</span>
          <span className="text-zinc-300">{content}</span>
        </div>
      }
      
      return <p key={index} className="text-zinc-300 mb-2">{trimmed}</p>
    })
  }

  if (showQuickReference) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            📚 クイックリファレンス
          </h1>
          <button 
            onClick={() => setShowQuickReference(false)}
            className="btn-secondary"
          >
            戻る
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* フェーズリファレンス */}
          <div className="card border-blue-500/30 bg-blue-500/5">
            <h3 className="font-bold text-lg mb-4 text-blue-400">🔄 フェーズガイド</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded bg-blue-500/10">
                <div className="font-bold text-blue-300">🎯 アクションフェーズ</div>
                <div className="text-zinc-400">• アクションカードをプレイ</div>
                <div className="text-zinc-400">• アクション回数: 通常1回</div>
                <div className="text-zinc-400">• スキップして購入フェーズへ移行可</div>
              </div>
              <div className="p-3 rounded bg-green-500/10">
                <div className="font-bold text-green-300">💰 購入フェーズ</div>
                <div className="text-zinc-400">• 財宝カードをプレイ</div>
                <div className="text-zinc-400">• カードを購入</div>
                <div className="text-zinc-400">• 購入回数: 通常1回</div>
              </div>
              <div className="p-3 rounded bg-purple-500/10">
                <div className="font-bold text-purple-300">🔄 クリーンアップ</div>
                <div className="text-zinc-400">• 全カードを捨て札に</div>
                <div className="text-zinc-400">• 5枚ドロー</div>
                <div className="text-zinc-400">• 次プレイヤーへ</div>
              </div>
            </div>
          </div>

          {/* カードリファレンス */}
          <div className="card border-yellow-500/30 bg-yellow-500/5">
            <h3 className="font-bold text-lg mb-4 text-yellow-400">🃏 基本カード</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-bold text-yellow-300 mb-2">💰 財宝カード</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>銅貨 (0💳)</span><span className="text-yellow-400">+1💰</span></div>
                  <div className="flex justify-between"><span>銀貨 (3💳)</span><span className="text-yellow-400">+2💰</span></div>
                  <div className="flex justify-between"><span>金貨 (6💳)</span><span className="text-yellow-400">+3💰</span></div>
                </div>
              </div>
              <div>
                <div className="font-bold text-purple-300 mb-2">👑 勝利点カード</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>屋敷 (2💳)</span><span className="text-purple-400">1VP</span></div>
                  <div className="flex justify-between"><span>公領 (5💳)</span><span className="text-purple-400">3VP</span></div>
                  <div className="flex justify-between"><span>属州 (8💳)</span><span className="text-purple-400">6VP</span></div>
                </div>
              </div>
              <div>
                <div className="font-bold text-blue-300 mb-2">⚡ 主要アクション</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span>村 (3💳):</span>
                    <span className="text-blue-400">+1🃏 +2⚡</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>鍛冶屋 (4💳):</span>
                    <span className="text-blue-400">+3🃏</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>研究所 (5💳):</span>
                    <span className="text-blue-400">+2🃏 +1⚡</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>市場 (5💳):</span>
                    <span className="text-blue-400">+1🃏 +1⚡ +1🛍 +1💰</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>木こり (3💳):</span>
                    <span className="text-blue-400">+1🛍 +2💰</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 戦略ヒント */}
          <div className="card border-green-500/30 bg-green-500/5">
            <h3 className="font-bold text-lg mb-4 text-green-400">💡 戦略ヒント</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-bold text-green-300">🌱 序盤 (ターン1-3)</div>
                <div className="text-zinc-400">• 銀貨や安いアクションカードを購入</div>
                <div className="text-zinc-400">• デッキの基盤を強化</div>
              </div>
              <div>
                <div className="font-bold text-orange-300">⚡ 中盤 (ターン4-8)</div>
                <div className="text-zinc-400">• 強力なアクションカードを追加</div>
                <div className="text-zinc-400">• 金貨を購入してコイン力向上</div>
              </div>
              <div>
                <div className="font-bold text-purple-300">🏆 終盤 (ターン9-)</div>
                <div className="text-zinc-400">• 勝利点カード中心の購入</div>
                <div className="text-zinc-400">• 属州・公領を優先獲得</div>
              </div>
            </div>
          </div>

          {/* 勝利条件 */}
          <div className="card border-red-500/30 bg-red-500/5">
            <h3 className="font-bold text-lg mb-4 text-red-400">🏁 勝利条件</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded bg-red-500/10">
                <div className="font-bold text-red-300">ゲーム終了条件</div>
                <div className="text-zinc-400">• 属州カードが尽きる</div>
                <div className="text-zinc-400">• 3種類のサプライが尽きる</div>
              </div>
              <div className="p-3 rounded bg-yellow-500/10">
                <div className="font-bold text-yellow-300">勝者決定</div>
                <div className="text-zinc-400">• 全カードの勝利点合計</div>
                <div className="text-zinc-400">• 同点時は少ないターン数が勝利</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={onStartTutorial}
            className="btn-primary mr-4"
          >
            🎮 インタラクティブチュートリアル開始
          </button>
          <button 
            onClick={onClose}
            className="btn-secondary"
          >
            ゲームを開始
          </button>
        </div>
      </div>
    )
  }

  const currentStepData = tutorialSteps[currentStep]

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          📚 ドミニオンの遊び方
        </h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowQuickReference(true)}
            className="btn-secondary text-sm"
          >
            📋 クイックリファレンス
          </button>
          <button 
            onClick={onClose}
            className="btn-secondary"
          >
            ✕
          </button>
        </div>
      </div>

      {/* プログレスバー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">進捗</span>
          <span className="text-sm text-zinc-400">{currentStep + 1} / {tutorialSteps.length}</span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="card border-2 border-blue-500/30 bg-blue-500/5 mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="text-6xl">{currentStepData.visual}</div>
          <h2 className="text-2xl font-bold text-blue-400">{currentStepData.title}</h2>
        </div>
        
        <div className="prose prose-invert max-w-none">
          {formatContent(currentStepData.content)}
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between">
        <button 
          onClick={prevStep}
          disabled={currentStep === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← 前へ
        </button>

        <div className="flex space-x-2">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentStep(index)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStep 
                  ? 'bg-blue-500' 
                  : index < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-zinc-600'
              }`}
            />
          ))}
        </div>

        {currentStep === tutorialSteps.length - 1 ? (
          <div className="space-x-2">
            <button 
              onClick={onStartTutorial}
              className="btn-primary"
            >
              🎮 実践チュートリアル
            </button>
            <button 
              onClick={onClose}
              className="btn-secondary"
            >
              ゲーム開始
            </button>
          </div>
        ) : (
          <button 
            onClick={nextStep}
            className="btn-primary"
          >
            次へ →
          </button>
        )}
      </div>

      {/* フッター */}
      <div className="mt-8 text-center">
        <div className="flex items-center justify-center space-x-4 text-sm text-zinc-400">
          <button 
            onClick={() => {
              setCurrentStep(0)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="hover:text-blue-400 transition-colors"
          >
            最初から
          </button>
          <span>|</span>
          <button 
            onClick={onClose}
            className="hover:text-blue-400 transition-colors"
          >
            スキップしてゲーム開始
          </button>
        </div>
      </div>
    </div>
  )
}