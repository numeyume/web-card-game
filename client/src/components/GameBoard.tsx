import React, { useState, useEffect } from 'react'
import { useWebSocket } from './WebSocketProvider'
import { EndGameModal } from './EndGameModal'
import { ResultModal } from './ResultModal'
import type { Card, Player, GameState } from '@/types'

interface GameBoardProps {
  onExitGame?: () => void
}

export function GameBoard({ onExitGame }: GameBoardProps) {
  const { gameState, emit, connectionStatus } = useWebSocket()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showSupply, setShowSupply] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)

  // Timer countdown effect
  useEffect(() => {
    if (gameState.timeRemaining > 0) {
      setTimeRemaining(gameState.timeRemaining)
      
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [gameState.timeRemaining])

  const handlePlayCard = (cardId: string) => {
    if (gameState.phase !== 'action') {
      return
    }
    emit('playCard', cardId)
    setSelectedCard(null)
  }

  const handleBuyCard = (cardId: string) => {
    if (gameState.phase !== 'buy') {
      return
    }
    emit('buyCard', cardId)
  }

  const handleEndTurn = () => {
    emit('endTurn')
  }

  const handleStartGame = () => {
    emit('startGame')
  }

  const handleDrawCards = (count = 1) => {
    emit('drawCards', count)
  }

  const handleDiscardCards = (cardIds: string[]) => {
    emit('discardCards', cardIds)
  }

  const handleGetGameStats = () => {
    emit('getGameStats')
  }

  const handleCheckEndConditions = () => {
    emit('checkEndConditions')
  }

  const handleForceGameEnd = () => {
    if (confirm('ゲームを手動で終了しますか？')) {
      emit('forceGameEnd', 'manual')
    }
  }

  const handleCloseEndGameModal = () => {
    setGameState(prev => ({ ...prev, isGameEnded: false, gameEndResult: undefined }))
  }

  const handleNewGame = () => {
    setGameState(prev => ({ ...prev, isGameEnded: false, gameEndResult: undefined }))
    // 新しいゲーム開始ロジックここに追加
  }

  const handleVoteCard = (cardId: string, vote: 'like' | 'dislike') => {
    emit('voteCard', { cardId, voteType: vote })
  }

  const handleShowResultModal = () => {
    setShowResultModal(true)
    emit('getCardUsageStats')
  }

  const handleCloseResultModal = () => {
    setShowResultModal(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'action': return 'bg-blue-600'
      case 'buy': return 'bg-green-600'
      case 'cleanup': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  if (!gameState.room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4">No Game Room</h2>
          <p className="text-zinc-300 mb-4">You need to join a room to play.</p>
          <button 
            onClick={onExitGame}
            className="button-primary"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  const currentPlayer = gameState.currentPlayer
  const isMyTurn = currentPlayer?.id === gameState.currentPlayer?.id
  const room = gameState.room

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      {/* Header */}
      <div className="bg-zinc-800 rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">{room.name}</h1>
          <div className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getPhaseColor(gameState.phase)}`}>
            {gameState.phase.toUpperCase()} PHASE
          </div>
          {connectionStatus !== 'connected' && (
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
              {connectionStatus.toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Timer */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-400">Time:</span>
            <div className={`px-3 py-1 rounded-lg font-mono text-lg ${
              timeRemaining < 30 ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-200'
            }`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
          
          {/* Turn indicator */}
          <div className="text-sm text-zinc-400">
            Turn: <span className="text-white font-medium">{room.turn}</span>
          </div>
          
          <button 
            onClick={onExitGame}
            className="button-secondary text-sm"
          >
            Exit Game
          </button>
        </div>
      </div>

      {/* Players Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {room.players.map((player, index) => (
          <div 
            key={player.id}
            className={`card ${isMyTurn && player.id === currentPlayer?.id ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{player.name}</h3>
              <div className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-zinc-400">Actions:</span>
                <span className="ml-1 font-medium">{player.actions}</span>
              </div>
              <div>
                <span className="text-zinc-400">Buys:</span>
                <span className="ml-1 font-medium">{player.buys}</span>
              </div>
              <div>
                <span className="text-zinc-400">Coins:</span>
                <span className="ml-1 font-medium">{player.coins}</span>
              </div>
              <div>
                <span className="text-zinc-400">Score:</span>
                <span className="ml-1 font-medium">{player.score}</span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-zinc-400">
              <span>Hand: {player.hand?.length || 0}</span>
              <span className="ml-2">Deck: {player.deck?.length || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Supply Area */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Supply</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Object.entries(room.supply).map(([cardId, count]) => (
            <div 
              key={cardId}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                gameState.phase === 'buy' && isMyTurn
                  ? 'border-green-500 hover:bg-green-500/10' 
                  : 'border-zinc-600 hover:border-zinc-500'
              }`}
              onClick={() => gameState.phase === 'buy' && isMyTurn && handleBuyCard(cardId)}
            >
              <div className="text-sm font-medium">{cardId}</div>
              <div className="text-xs text-zinc-400">Cost: ?</div>
              <div className="text-lg font-bold text-center mt-1">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Hand */}
      {currentPlayer && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Your Hand</h3>
            <div className="flex space-x-2">
              {gameState.phase === 'action' && isMyTurn && (
                <span className="text-sm text-green-400">Play action cards</span>
              )}
              {gameState.phase === 'buy' && isMyTurn && (
                <span className="text-sm text-blue-400">Buy cards from supply</span>
              )}
              {isMyTurn && (
                <button 
                  onClick={handleEndTurn}
                  className="button-primary text-sm"
                >
                  End Turn
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3 max-h-48 overflow-y-auto">
            {currentPlayer.hand?.map((card, index) => (
              <div 
                key={`${card.id}-${index}`}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCard === card.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : card.type === 'Action' && gameState.phase === 'action' && isMyTurn
                    ? 'border-green-500 hover:bg-green-500/10'
                    : 'border-zinc-600 hover:border-zinc-500'
                }`}
                onClick={() => {
                  if (card.type === 'Action' && gameState.phase === 'action' && isMyTurn) {
                    handlePlayCard(card.id)
                  } else {
                    setSelectedCard(selectedCard === card.id ? null : card.id)
                  }
                }}
              >
                <div className="text-sm font-medium truncate">{card.name}</div>
                <div className="text-xs text-zinc-400">{card.type}</div>
                <div className="text-xs text-zinc-400">Cost: {card.cost}</div>
              </div>
            )) || (
              <div className="col-span-full text-center text-zinc-400 py-8">
                No cards in hand
              </div>
            )}
          </div>
          
          {selectedCard && (
            <div className="mt-4 p-3 bg-zinc-700 rounded-lg">
              <h4 className="font-medium mb-2">Selected Card</h4>
              <p className="text-sm text-zinc-300">
                {currentPlayer.hand?.find(c => c.id === selectedCard)?.description || 'No description available'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Deck State & Game Controls */}
      {gameState.deckState && (
        <div className="fixed bottom-4 left-4 w-80 bg-black/80 rounded-lg p-3 text-xs">
          <h4 className="font-medium mb-2">📚 Deck State</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>Hand: {gameState.deckState.handSize}</div>
            <div>Deck: {gameState.deckState.deckSize}</div>
            <div>Discard: {gameState.deckState.discardSize}</div>
            <div>Field: {gameState.deckState.fieldSize}</div>
          </div>
          <div className="mt-2 text-zinc-400">
            Total: {gameState.deckState.totalCards} cards
          </div>
          
          <div className="mt-3 space-y-2">
            <button 
              onClick={() => handleDrawCards(1)}
              className="w-full text-xs py-1 px-2 bg-blue-600 hover:bg-blue-500 rounded"
            >
              Draw Card
            </button>
            <button 
              onClick={handleGetGameStats}
              className="w-full text-xs py-1 px-2 bg-purple-600 hover:bg-purple-500 rounded"
            >
              Get Stats
            </button>
          </div>
        </div>
      )}

      {/* End Condition Status Panel */}
      {gameState.endConditions && (
        <div className="fixed top-20 right-4 w-80 bg-black/90 rounded-lg p-3 text-xs border border-zinc-600">
          <h4 className="font-medium mb-2 flex items-center">
            <span className="mr-2">⏱️</span>
            ゲーム進行状況
          </h4>
          
          {gameState.endConditions.status && (
            <div className="space-y-2">
              {gameState.endConditions.status.remainingTurns !== undefined && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">残りターン:</span>
                  <span className={`font-medium ${
                    gameState.endConditions.status.remainingTurns <= 5 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {gameState.endConditions.status.remainingTurns}
                  </span>
                </div>
              )}
              
              {gameState.endConditions.status.remainingTime !== undefined && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">残り時間:</span>
                  <span className={`font-medium ${
                    gameState.endConditions.status.remainingTime <= 300 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {formatTime(gameState.endConditions.status.remainingTime)}
                  </span>
                </div>
              )}
              
              {gameState.endConditions.status.emptyPiles && gameState.endConditions.status.emptyPiles.length > 0 && (
                <div>
                  <div className="text-zinc-400 mb-1">空きサプライ山:</div>
                  <div className="text-orange-400 text-xs">
                    {gameState.endConditions.status.emptyPiles.join(', ')} 
                    <span className="ml-1">({gameState.endConditions.status.emptyPiles.length}/3)</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-3 space-y-1">
            <button 
              onClick={handleCheckEndConditions}
              className="w-full text-xs py-1 px-2 bg-orange-600 hover:bg-orange-500 rounded"
            >
              終了条件チェック
            </button>
            <button 
              onClick={handleForceGameEnd}
              className="w-full text-xs py-1 px-2 bg-red-600 hover:bg-red-500 rounded"
            >
              ゲーム強制終了
            </button>
          </div>
        </div>
      )}

      {/* Supply & Game Control Panel */}
      {gameState.supplyState && showSupply && (
        <div className="fixed top-20 right-4 w-96 max-h-96 overflow-y-auto bg-black/90 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">🏪 Supply Cards</h4>
            <button 
              onClick={() => setShowSupply(false)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {gameState.supplyState.map((card, index) => (
              <div 
                key={`${card.id}-${index}`}
                className="p-2 bg-zinc-800 rounded border border-zinc-600 hover:border-zinc-500 cursor-pointer"
                onClick={() => handleBuyCard(card.id)}
              >
                <div className="font-medium text-sm">{card.name}</div>
                <div className="text-xs text-zinc-400">Cost: {card.cost}</div>
                <div className="text-xs text-zinc-400">{card.type}</div>
                {card.effects && card.effects.length > 0 && (
                  <div className="text-xs text-green-400">
                    {card.effects.length} effects
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed top-20 left-4 space-y-2">
        {room.status === 'waiting' && (
          <button 
            onClick={handleStartGame}
            className="p-3 bg-green-600 hover:bg-green-500 rounded-full shadow-lg"
            title="Start Game"
          >
            ▶️
          </button>
        )}
        <button 
          onClick={() => setShowSupply(!showSupply)}
          className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg"
          title="Toggle Supply"
        >
          🏪
        </button>
      </div>

      {/* Game Log */}
      <div className="fixed bottom-4 right-4 w-80 max-h-60 overflow-y-auto bg-black/80 rounded-lg p-3 text-xs">
        <h4 className="font-medium mb-2">Game Log</h4>
        <div className="space-y-1">
          {gameState.log.slice(-10).map((entry, index) => (
            <div key={`${entry.id}-${index}`} className="text-zinc-300">
              <span className="text-zinc-400">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
              <span className="ml-1 font-medium">{entry.playerName}:</span>
              <span className="ml-1">{entry.action}</span>
            </div>
          ))}
          {gameState.log.length === 0 && (
            <div className="text-zinc-500">Game log will appear here...</div>
          )}
        </div>
      </div>

      {/* Voting Session Banner */}
      {gameState.votingSession?.isActive && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg border border-purple-500">
            <div className="flex items-center space-x-4">
              <span className="text-lg">🗳️</span>
              <div>
                <div className="font-medium">カード投票進行中</div>
                <div className="text-sm opacity-90">
                  {gameState.votingSession.participatingPlayers || 0}人が参加 | 
                  残り時間: {Math.floor((gameState.votingSession.timeRemaining || 0) / 60)}分
                </div>
              </div>
              <button
                onClick={handleShowResultModal}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
              >
                投票する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Game Modal */}
      <EndGameModal
        isOpen={gameState.isGameEnded || false}
        gameEndResult={gameState.gameEndResult || null}
        onClose={handleCloseEndGameModal}
        onNewGame={handleNewGame}
        onBackToLobby={onExitGame}
        onShowResults={handleShowResultModal}
      />

      {/* Result Modal with Voting */}
      <ResultModal
        isOpen={showResultModal}
        gameEndResult={gameState.gameEndResult || null}
        onClose={handleCloseResultModal}
        onVoteCard={handleVoteCard}
        onNewGame={handleNewGame}
        onBackToLobby={onExitGame}
      />
    </div>
  )
}