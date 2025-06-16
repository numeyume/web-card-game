import { createContext } from 'react'
import type { Socket } from 'socket.io-client'
import type { ConnectionStatus, GameState } from '@/types'

export interface WebSocketContextType {
  socket: Socket | null
  connectionStatus: ConnectionStatus
  gameState: GameState
  connect: () => void
  disconnect: () => void
  emit: (event: string, data?: any) => void
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null)