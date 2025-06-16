import React, { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import type { ConnectionStatus, GameState } from '@/types'
import { WebSocketContext, type WebSocketContextType } from '@/contexts/WebSocketContext'

const initialGameState: GameState = {
  room: null,
  currentPlayer: null,
  phase: 'action',
  timeRemaining: 0,
  log: []
}

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [gameState, setGameState] = useState<GameState>(initialGameState)

  const connect = useCallback(() => {
    if (socket?.connected) return

    setConnectionStatus('connecting')
    
    const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      retries: 3,
    })

    newSocket.on('connect', () => {
      setConnectionStatus('connected')
      toast.success('サーバーに接続しました')
      console.log('✅ Connected to server with ID:', newSocket.id)
      console.log('🔗 Server URL:', import.meta.env.VITE_SERVER_URL || 'http://localhost:3001')
    })

    newSocket.on('disconnect', (reason) => {
      setConnectionStatus('disconnected')
      console.log('Disconnected:', reason)
      
      if (reason === 'io server disconnect') {
        toast.error('サーバーが切断されました')
      } else {
        toast.error('接続が失われました')
      }
    })

    newSocket.on('connect_error', (error) => {
      setConnectionStatus('error')
      console.error('Connection error:', error)
      toast.error('サーバーへの接続に失敗しました')
    })

    newSocket.on('reconnect', (attemptNumber) => {
      setConnectionStatus('connected')
      toast.success(`${attemptNumber}回目の試行で再接続しました`)
    })

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error)
      toast.error('再接続に失敗しました')
    })

    // Game state events
    newSocket.on('gameState', (state: GameState) => {
      setGameState(state)
    })

    newSocket.on('roomJoined', (room) => {
      setGameState(prev => ({ ...prev, room }))
      toast.success(`ルーム「${room.name}」に参加しました`)
    })

    newSocket.on('roomLeft', () => {
      setGameState(initialGameState)
      toast.success('ルームから退出しました')
    })

    newSocket.on('playerJoined', (player) => {
      toast.success(`${player.name}さんがゲームに参加しました`)
    })

    newSocket.on('playerLeft', (player) => {
      toast.error(`${player.name}さんがゲームから退出しました`)
    })

    newSocket.on('gameStarted', (data) => {
      toast.success('ゲームが開始されました！')
      console.log('Game started with deck state:', data)
    })

    newSocket.on('gameEnded', (results) => {
      toast.success('ゲームが終了しました！')
      console.log('Game results:', results)
    })

    // Deck Engine events
    newSocket.on('deckState', (deckState) => {
      console.log('Deck state updated:', deckState)
      setGameState(prev => ({ ...prev, deckState }))
    })

    newSocket.on('cardPlayed', (data) => {
      toast.success(`${data.playerName}さんが「${data.card.name}」をプレイしました`)
      console.log('Card played:', data)
    })

    newSocket.on('cardBought', (data) => {
      toast.success(`${data.playerName}さんが「${data.card.name}」を購入しました`)
      console.log('Card bought:', data)
    })

    newSocket.on('turnEnded', (data) => {
      toast.success(`${data.playerName}さんがターンを終了しました`)
      console.log('Turn ended:', data)
    })

    newSocket.on('supplyState', (supplyState) => {
      console.log('Supply state updated:', supplyState)
      setGameState(prev => ({ ...prev, supplyState }))
    })

    newSocket.on('cardsDrawn', (data) => {
      toast.success(`${data.count}枚のカードを引きました`)
    })

    newSocket.on('cardsDiscarded', (data) => {
      toast.success(`${data.count}枚のカードを捨てました`)
    })

    newSocket.on('gameStats', (gameStats) => {
      console.log('Game stats:', gameStats)
      setGameState(prev => ({ ...prev, gameStats }))
    })

    // End game events
    newSocket.on('gameEnded', (gameEndResult) => {
      console.log('Game ended:', gameEndResult)
      toast.success(`🏁 ゲーム終了: ${gameEndResult.endReason}`)
      setGameState(prev => ({ 
        ...prev, 
        isGameEnded: true,
        gameEndResult 
      }))
    })

    newSocket.on('endConditionsStatus', (endConditions) => {
      console.log('End conditions status:', endConditions)
      setGameState(prev => ({ ...prev, endConditions }))
    })

    newSocket.on('turnEnded', (data) => {
      if (data.endConditionStatus) {
        setGameState(prev => ({ ...prev, endConditions: data.endConditionStatus }))
      }
      toast.success(`${data.playerName} ended turn ${data.turnInfo?.turn || ''}`)
      console.log('Turn ended:', data)
    })

    // Voting system events
    newSocket.on('votingSessionStarted', (votingData) => {
      console.log('Voting session started:', votingData)
      toast.success('🗳️ カード投票が開始されました！')
      setGameState(prev => ({ 
        ...prev, 
        votingSession: {
          isActive: true,
          timeLimit: votingData.timeLimit,
          availableCards: votingData.availableCards,
          startTime: Date.now()
        }
      }))
    })

    newSocket.on('votingUpdate', (votingStatus) => {
      console.log('Voting update:', votingStatus)
      setGameState(prev => ({ 
        ...prev, 
        votingSession: {
          ...prev.votingSession,
          ...votingStatus
        }
      }))
    })

    newSocket.on('votingSessionEnded', (results) => {
      console.log('Voting session ended:', results)
      toast.success('🏁 投票が終了しました！')
      setGameState(prev => ({ 
        ...prev, 
        votingSession: {
          ...prev.votingSession,
          timeLimit: prev.votingSession?.timeLimit || 0,
          availableCards: prev.votingSession?.availableCards || [],
          startTime: prev.votingSession?.startTime || 0,
          isActive: false,
          results
        }
      }))
    })

    newSocket.on('voteRegistered', (cardVotes) => {
      console.log('Vote registered:', cardVotes)
      toast.success('投票が記録されました！')
    })

    newSocket.on('cardUsageStats', (stats) => {
      console.log('Card usage stats:', stats)
      setGameState(prev => ({ ...prev, cardUsageStats: stats }))
    })

    // CPU対戦用のイベントハンドラー
    newSocket.on('gameStateUpdate', (gameState) => {
      console.log('🎮 CPU対戦: ゲーム状態更新', gameState)
      setGameState(prev => ({ ...prev, cpuGameState: gameState }))
    })

    newSocket.on('playerHand', (hand) => {
      console.log('🃏 CPU対戦: 手札更新', hand)
      setGameState(prev => ({ ...prev, playerHand: hand }))
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
      toast.error(error.message || 'An error occurred')
    })

    setSocket(newSocket)
  }, [socket])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setConnectionStatus('disconnected')
      setGameState(initialGameState)
    }
  }, [socket])

  const emit = useCallback((event: string, data?: any) => {
    if (socket?.connected) {
      socket.emit(event, data)
    } else {
      toast.error('サーバーに接続されていません')
    }
  }, [socket])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 依存配列を空にして無限ループを防ぐ

  // Heartbeat to maintain connection
  useEffect(() => {
    if (!socket) return

    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping')
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [socket])

  const contextValue: WebSocketContextType = {
    socket,
    connectionStatus,
    gameState,
    connect,
    disconnect,
    emit
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

