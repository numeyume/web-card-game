import { CPUGameBoard } from '../CPUGameBoard'
import { MultiplayerGameBoard } from '../MultiplayerGameBoard'
import { useWebSocket } from '@/hooks/useWebSocket'

interface GameBoardProps {
  onExitGame?: () => void
}

export function GameBoard({ onExitGame }: GameBoardProps) {
  const { gameState } = useWebSocket()
  
  // Determine if this is a CPU game or multiplayer game
  // CPU games have fewer players and a specific game structure
  const isCPUGame = gameState?.room?.players?.length === 2 && 
                   (gameState?.room?.gameSettings as any)?.gameMode === 'cpu'

  if (isCPUGame) {
    return <CPUGameBoard onExitGame={onExitGame || (() => {})} />
  }

  return <MultiplayerGameBoard onExitGame={onExitGame || (() => {})} />
}

export default GameBoard