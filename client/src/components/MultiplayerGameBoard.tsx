import { useState, useEffect } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { EndGameModal } from './EndGameModal'
import { ResultModal } from './ResultModal'

interface GameBoardProps {
  onExitGame?: () => void
}

export function MultiplayerGameBoard({ onExitGame }: GameBoardProps) {
  const { gameState, emit, connectionStatus } = useWebSocket()
  const [timeRemaining, setTimeRemaining] = useState(0)
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


  const handleCloseEndGameModal = () => {
    // Handle closing end game modal
  }

  const handleNewGame = () => {
    // Handle new game
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
        {room.players.map((player) => (
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

      {/* Rest of the multiplayer game board UI */}
      {/* Supply, Hand, Controls, etc. */}

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