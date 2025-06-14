import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GameEndResult, CardUsageStats, PlayerRanking } from '@/types'

interface ResultModalProps {
  isOpen: boolean
  gameEndResult: GameEndResult | null
  onClose: () => void
  onVoteCard?: (cardId: string, vote: 'like' | 'dislike') => void
  onNewGame?: () => void
  onBackToLobby?: () => void
}

interface VoteData {
  [cardId: string]: {
    likes: number
    dislikes: number
    userVote?: 'like' | 'dislike'
  }
}

export function ResultModal({ 
  isOpen, 
  gameEndResult, 
  onClose, 
  onVoteCard,
  onNewGame,
  onBackToLobby 
}: ResultModalProps) {
  const [activeTab, setActiveTab] = useState<'rankings' | 'cards' | 'stats'>('rankings')
  const [voteData, setVoteData] = useState<VoteData>({})

  const handleVote = (cardId: string, vote: 'like' | 'dislike') => {
    setVoteData(prev => {
      const current = prev[cardId] || { likes: 0, dislikes: 0 }
      const wasLiked = current.userVote === 'like'
      const wasDisliked = current.userVote === 'dislike'
      
      let newLikes = current.likes
      let newDislikes = current.dislikes
      let newUserVote: 'like' | 'dislike' | undefined = vote

      // Remove previous vote if exists
      if (wasLiked) newLikes--
      if (wasDisliked) newDislikes--

      // Add new vote if different from previous
      if (vote === 'like' && !wasLiked) {
        newLikes++
      } else if (vote === 'dislike' && !wasDisliked) {
        newDislikes++
      } else {
        newUserVote = undefined // Toggle off if same vote
      }

      return {
        ...prev,
        [cardId]: {
          likes: newLikes,
          dislikes: newDislikes,
          userVote: newUserVote
        }
      }
    })

    onVoteCard?.(cardId, vote)
  }

  const topCards = useMemo(() => {
    if (!gameEndResult?.finalScores?.gameStats?.topCards) return []
    
    return gameEndResult.finalScores.gameStats.topCards
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
  }, [gameEndResult])

  const cardRankings = useMemo(() => {
    return topCards.map((card, index) => {
      const votes = voteData[card.cardId] || { likes: 0, dislikes: 0 }
      const score = votes.likes - votes.dislikes
      return {
        ...card,
        rank: index + 1,
        voteScore: score,
        totalVotes: votes.likes + votes.dislikes,
        ...votes
      }
    }).sort((a, b) => b.voteScore - a.voteScore)
  }, [topCards, voteData])

  if (!isOpen || !gameEndResult) return null

  const { finalScores, endReason, gameDuration, totalTurns } = gameEndResult

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">🏆 ゲーム結果</h2>
                <div className="flex items-center gap-6 text-sm opacity-90">
                  <span>⏱️ {Math.floor(gameDuration / 60)}分{gameDuration % 60}秒</span>
                  <span>🔄 {totalTurns}ターン</span>
                  <span>🏁 {endReason === 'max_turns' ? 'ターン制限' : 
                              endReason === 'time_limit' ? '時間制限' : 
                              endReason === 'empty_piles' ? 'サプライ枯渇' : endReason}</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-zinc-700">
            <nav className="flex">
              {[
                { id: 'rankings', label: '🏆 ランキング', icon: '🏆' },
                { id: 'cards', label: '🃏 カード評価', icon: '🃏' },
                { id: 'stats', label: '📊 詳細統計', icon: '📊' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'rankings' && (
                <motion.div
                  key="rankings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-xl font-semibold mb-6 text-center">最終順位</h3>
                  <div className="space-y-3">
                    {finalScores.rankings.map((player, index) => (
                      <motion.div
                        key={player.playerId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative p-4 rounded-xl border-2 ${
                          player.rank === 1
                            ? 'border-yellow-500 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20'
                            : player.rank === 2
                            ? 'border-gray-400 bg-gradient-to-r from-gray-400/20 to-gray-500/20'
                            : player.rank === 3
                            ? 'border-orange-500 bg-gradient-to-r from-orange-500/20 to-orange-600/20'
                            : 'border-zinc-600 bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                              player.rank === 1 ? 'bg-yellow-500 text-black' :
                              player.rank === 2 ? 'bg-gray-400 text-black' :
                              player.rank === 3 ? 'bg-orange-500 text-white' :
                              'bg-zinc-700 text-white'
                            }`}>
                              {player.rank === 1 ? '🥇' : 
                               player.rank === 2 ? '🥈' : 
                               player.rank === 3 ? '🥉' : 
                               player.rank}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{player.playerName}</h4>
                              <div className="flex items-center space-x-4 text-sm text-zinc-400">
                                <span>🎯 VP: {player.victoryPoints}</span>
                                <span>🃏 カード作成: {player.cardsCreated || 0}</span>
                                <span>🎮 カード使用: {player.cardsUsed || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                              {player.totalScore}
                            </div>
                            <div className="text-xs text-zinc-400">
                              <div>ゲーム: {player.gameScore}</div>
                              <div>創造: {player.creatorScore}</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-8 p-4 bg-zinc-800 rounded-lg">
                    <h4 className="font-medium mb-2">ゲーム概要</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-400">平均スコア:</span>
                        <span className="ml-2 font-medium">{finalScores.gameStats.averageScore?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">最高スコア:</span>
                        <span className="ml-2 font-medium">{Math.max(...finalScores.rankings.map(p => p.totalScore))}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">使用カード種類:</span>
                        <span className="ml-2 font-medium">{topCards.length || 0}種類</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'cards' && (
                <motion.div
                  key="cards"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold">🃏 カード人気投票</h3>
                    <p className="text-sm text-zinc-400 mt-2">
                      ゲームで使用されたカードに投票して、コミュニティの評価を作りましょう
                    </p>
                  </div>

                  {topCards.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                      <div className="text-4xl mb-4">🃏</div>
                      <p>カード使用データがありません</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cardRankings.map((card, index) => (
                        <motion.div
                          key={card.cardId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-sm text-zinc-400">#{card.rank}</span>
                                <h4 className="font-medium text-lg">{card.cardName}</h4>
                                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                                  {card.usageCount}回使用
                                </span>
                                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                                  {card.uniquePlayers}人が使用
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-zinc-400">評価:</span>
                                  <span className={`text-sm font-medium ${
                                    card.voteScore > 0 ? 'text-green-400' : 
                                    card.voteScore < 0 ? 'text-red-400' : 'text-zinc-400'
                                  }`}>
                                    {card.voteScore > 0 ? '+' : ''}{card.voteScore}
                                  </span>
                                  <span className="text-xs text-zinc-500">
                                    ({card.totalVotes}票)
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-1 text-sm">
                                  <span className="text-green-400">👍 {card.likes}</span>
                                  <span className="text-red-400">👎 {card.dislikes}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleVote(card.cardId, 'like')}
                                className={`p-2 rounded-lg transition-colors ${
                                  card.userVote === 'like'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-zinc-700 hover:bg-green-600/20 text-zinc-300'
                                }`}
                              >
                                👍
                              </button>
                              <button
                                onClick={() => handleVote(card.cardId, 'dislike')}
                                className={`p-2 rounded-lg transition-colors ${
                                  card.userVote === 'dislike'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-zinc-700 hover:bg-red-600/20 text-zinc-300'
                                }`}
                              >
                                👎
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-semibold text-center">📊 詳細統計</h3>
                  
                  {/* Game Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <h4 className="font-medium mb-2 text-blue-400">⏱️ ゲーム情報</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">総プレイ時間:</span>
                          <span>{Math.floor(gameDuration / 60)}分{gameDuration % 60}秒</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">総ターン数:</span>
                          <span>{totalTurns}ターン</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">平均ターン時間:</span>
                          <span>{(gameDuration / totalTurns).toFixed(1)}秒</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">終了理由:</span>
                          <span className="text-orange-400">{
                            endReason === 'max_turns' ? 'ターン制限' : 
                            endReason === 'time_limit' ? '時間制限' : 
                            endReason === 'empty_piles' ? 'サプライ枯渇' : endReason
                          }</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <h4 className="font-medium mb-2 text-green-400">🎯 スコア統計</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">平均スコア:</span>
                          <span>{finalScores.gameStats.averageScore?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">最高スコア:</span>
                          <span className="text-yellow-400">{Math.max(...finalScores.rankings.map(p => p.totalScore))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">最低スコア:</span>
                          <span>{Math.min(...finalScores.rankings.map(p => p.totalScore))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">スコア差:</span>
                          <span>{Math.max(...finalScores.rankings.map(p => p.totalScore)) - Math.min(...finalScores.rankings.map(p => p.totalScore))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <h4 className="font-medium mb-2 text-purple-400">🃏 カード統計</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">使用カード種類:</span>
                          <span>{topCards.length}種類</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">総使用回数:</span>
                          <span>{topCards.reduce((sum, card) => sum + card.usageCount, 0)}回</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">人気カード:</span>
                          <span className="text-yellow-400">{topCards[0]?.cardName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">平均使用回数:</span>
                          <span>{topCards.length ? (topCards.reduce((sum, card) => sum + card.usageCount, 0) / topCards.length).toFixed(1) : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Player Performance Breakdown */}
                  <div className="p-4 bg-zinc-800 rounded-lg">
                    <h4 className="font-medium mb-4 text-orange-400">👥 プレイヤー別詳細</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-700">
                            <th className="text-left py-2">プレイヤー</th>
                            <th className="text-right py-2">総合スコア</th>
                            <th className="text-right py-2">ゲームスコア</th>
                            <th className="text-right py-2">創造者スコア</th>
                            <th className="text-right py-2">勝利点</th>
                            <th className="text-right py-2">カード作成</th>
                            <th className="text-right py-2">カード使用</th>
                          </tr>
                        </thead>
                        <tbody>
                          {finalScores.rankings.map((player) => (
                            <tr key={player.playerId} className="border-b border-zinc-800">
                              <td className="py-2 font-medium">{player.playerName}</td>
                              <td className="text-right py-2 font-bold">{player.totalScore}</td>
                              <td className="text-right py-2">{player.gameScore}</td>
                              <td className="text-right py-2">{player.creatorScore}</td>
                              <td className="text-right py-2">{player.victoryPoints}</td>
                              <td className="text-right py-2">{player.cardsCreated || 0}</td>
                              <td className="text-right py-2">{player.cardsUsed || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-zinc-700 p-6 bg-zinc-800/50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-zinc-400">
                🎮 Web Card Game MVP - Formula 4.4 Scoring
              </div>
              <div className="flex space-x-3">
                {onBackToLobby && (
                  <button
                    onClick={onBackToLobby}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    🏠 ロビーに戻る
                  </button>
                )}
                {onNewGame && (
                  <button
                    onClick={onNewGame}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                  >
                    🔄 新しいゲーム
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  ✕ 閉じる
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}