import { useState, useEffect } from 'react'
import type { GameEndResult } from '@/types'

interface EndGameModalProps {
  isOpen: boolean
  gameEndResult: GameEndResult | null
  onClose: () => void
  onNewGame?: () => void
  onBackToLobby?: () => void
  onShowResults?: () => void
}

export function EndGameModal({ 
  isOpen, 
  gameEndResult, 
  onClose, 
  onNewGame, 
  onBackToLobby,
  onShowResults 
}: EndGameModalProps) {
  const [currentTab, setCurrentTab] = useState<'rankings' | 'stats' | 'cards'>('rankings')
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    if (isOpen && gameEndResult) {
      // アニメーション演出
      const timer = setTimeout(() => {
        setAnimationPhase(prev => prev + 1)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, gameEndResult])

  if (!isOpen || !gameEndResult) {
    return null
  }

  const { finalScores, endReason, gameDuration, totalTurns } = gameEndResult

  const getEndReasonText = (reason: string) => {
    switch (reason) {
      case 'empty_piles':
        return '🏆 3山以上が空になりました'
      case 'max_turns':
        return '⏰ 最大ターン数に到達しました'
      case 'time_limit':
        return '⏱️ 制限時間に到達しました'
      case 'manual':
        return '🔚 手動でゲームが終了されました'
      default:
        return '🎮 ゲーム終了'
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈' 
      case 3: return '🥉'
      default: return `${rank}位`
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400 bg-yellow-900/20 border-yellow-500'
      case 2: return 'text-gray-300 bg-gray-900/20 border-gray-500'
      case 3: return 'text-orange-400 bg-orange-900/20 border-orange-500'
      default: return 'text-zinc-300 bg-zinc-800 border-zinc-600'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 text-center">
          <h1 className="text-3xl font-bold mb-2">🎉 ゲーム終了!</h1>
          <p className="text-lg text-purple-200">{getEndReasonText(endReason)}</p>
          <div className="flex justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-zinc-400">🕐 プレイ時間:</span>
              <span className="font-medium">{formatDuration(gameDuration)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-zinc-400">🔄 総ターン数:</span>
              <span className="font-medium">{totalTurns}</span>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-zinc-700">
          <div className="flex">
            <button
              onClick={() => setCurrentTab('rankings')}
              className={`px-6 py-3 font-medium transition-colors ${
                currentTab === 'rankings'
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-900/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🏆 ランキング
            </button>
            <button
              onClick={() => setCurrentTab('stats')}
              className={`px-6 py-3 font-medium transition-colors ${
                currentTab === 'stats'
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-900/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              📊 統計
            </button>
            <button
              onClick={() => setCurrentTab('cards')}
              className={`px-6 py-3 font-medium transition-colors ${
                currentTab === 'cards'
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-900/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🎴 カード統計
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {currentTab === 'rankings' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-center">🏆 最終ランキング</h2>
              {finalScores.rankings.map((player, index) => (
                <div
                  key={player.playerId}
                  className={`p-4 rounded-lg border-2 transition-all duration-500 ${getRankColor(player.rank)} ${
                    animationPhase > index ? 'transform translate-x-0 opacity-100' : 'transform translate-x-8 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">
                        {getRankIcon(player.rank)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{player.playerName}</h3>
                        <p className="text-sm opacity-75">Player ID: {player.playerId.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{player.totalScore.toLocaleString()}</div>
                      <div className="text-sm opacity-75">Total Score</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-blue-400">{player.gameScore.toLocaleString()}</div>
                      <div className="text-zinc-400">ゲームスコア</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-400">{player.creatorScore.toLocaleString()}</div>
                      <div className="text-zinc-400">創造者スコア</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-purple-400">{player.victoryPoints}</div>
                      <div className="text-zinc-400">勝利点</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4 text-center">📊 ゲーム統計</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{finalScores.gameStats.averageScore?.toFixed(1) || 'N/A'}</div>
                  <div className="text-sm text-zinc-400">平均スコア</div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{finalScores.rankings.length}</div>
                  <div className="text-sm text-zinc-400">参加プレイヤー</div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{totalTurns}</div>
                  <div className="text-sm text-zinc-400">総ターン数</div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">{formatDuration(gameDuration)}</div>
                  <div className="text-sm text-zinc-400">プレイ時間</div>
                </div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">🎯 Formula 4.4 スコア内訳</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">ゲームスコア計算式:</span>
                    <span>勝利点 × 1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">創造者スコア計算式:</span>
                    <span>他者使用×10 + 自己使用×5</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-600 pt-2">
                    <span className="text-zinc-400 font-medium">総合スコア:</span>
                    <span className="font-medium">ゲームスコア + 創造者スコア</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'cards' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-center">🎴 カード統計</h2>
              
              <div className="bg-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">人気カードランキング</h3>
                <div className="space-y-2">
                  {/* プレースホルダー - 実際のカード統計データが必要 */}
                  <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🥇</span>
                      <span>村 (Village)</span>
                    </div>
                    <span className="text-green-400">使用回数: 15</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🥈</span>
                      <span>市場 (Market)</span>
                    </div>
                    <span className="text-green-400">使用回数: 12</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🥉</span>
                      <span>鍛冶屋 (Smithy)</span>
                    </div>
                    <span className="text-green-400">使用回数: 8</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">創造者ボーナス詳細</h3>
                <div className="text-sm text-zinc-400">
                  <p>• あなたが作成したカードが他のプレイヤーに使用されると +10点</p>
                  <p>• あなたが自分で作成したカードを使用すると +5点</p>
                  <p>• より多くのプレイヤーに愛用されるカードを作成することで高得点を狙えます</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="border-t border-zinc-700 p-4 flex justify-center space-x-4">
          <button
            onClick={onBackToLobby}
            className="px-6 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg font-medium transition-colors"
          >
            🏠 ロビーに戻る
          </button>
          {onShowResults && (
            <button
              onClick={onShowResults}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
            >
              🗳️ 詳細結果・投票
            </button>
          )}
          {onNewGame && (
            <button
              onClick={onNewGame}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
            >
              🎮 新しいゲーム
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            ✕ 閉じる
          </button>
        </div>
      </div>
    </div>
  )
}