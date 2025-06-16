import { useEffect } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
// import toast from 'react-hot-toast'

// interface Room {
//   id: string
//   name: string
//   playerCount: number
//   maxPlayers: number
//   status: 'waiting' | 'playing' | 'finished'
//   createdAt: string
// }

interface LobbyProps {
  onJoinGame: () => void
  onStartDominion: () => void
  onStartDominionDirect: () => void
  onOpenCardBuilder: () => void
  onOpenCollection: () => void
  onOpenTutorial: () => void
}

export function Lobby({ onJoinGame: _onJoinGame, onStartDominion, onStartDominionDirect, onOpenCardBuilder, onOpenCollection, onOpenTutorial }: LobbyProps) {
  const { connectionStatus } = useWebSocket()
  // const [_rooms] = useState<Room[]>([])
  // const [loading] = useState(false)
  // const [showCreateRoom] = useState(false)
  // const [_roomName] = useState('')
  // const [_maxPlayers] = useState(4)

  // Fetch rooms from API (disabled for production)
  /*
  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/rooms')
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setRooms(data)
      } else {
        toast.error('ルーム情報の取得に失敗しました')
        setRooms([])
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('サーバーに接続できませんでした')
    } finally {
      setLoading(false)
    }
  }
  */

  // Auto-refresh rooms every 5 seconds (disabled to prevent errors)
  useEffect(() => {
    // fetchRooms() // Disabled until rooms API is fully implemented
    // const interval = setInterval(fetchRooms, 5000)
    // return () => clearInterval(interval)
  }, [])

  /*
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error('ルーム名は必須です')
      return
    }

    try {
      const response = await fetch('http://localhost:3003/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName,
          maxPlayers,
          gameSettings: {
            maxTurns: 50,
            timeLimit: 120,
            customCards: [],
            endConditions: [
              { type: 'province_exhausted' },
              { type: 'three_pile_exhausted' }
            ]
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const room = data.data
        toast.success(`ルーム「${room.name}」を作成しました！`)
        
        // Join the room via WebSocket
        emit('joinRoom', room.id)
        
        // Switch to game view
        onJoinGame()
        
        setShowCreateRoom(false)
        setRoomName('')
      } else {
        toast.error(data.error || 'ルームの作成に失敗しました')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('ルームの作成に失敗しました')
    }
  }

  const handleJoinRoom = (roomId: string) => {
    if (connectionStatus !== 'connected') {
      toast.error('サーバーに接続されていません')
      return
    }

    emit('joinRoom', roomId)
    onJoinGame()
    toast.success('ルームに参加中...')
  }
  */

  /*
  const _handleQuickMatch = () => {
    // Find a waiting room with space
    const availableRoom = rooms.find(room => 
      room.status === 'waiting' && room.playerCount < room.maxPlayers
    )

    if (availableRoom) {
      handleJoinRoom(availableRoom.id)
    } else {
      // Create a new room for quick match
      setRoomName('クイックマッチルーム')
      setMaxPlayers(4)
      handleCreateRoom()
    }
  }
  */

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          🎴 ウェブカードゲーム
        </h1>
        <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
          オリジナルカードを作成して、2-4人でリアルタイム対戦。
          あなたの戦略とクリエイティビティで勝利を目指しましょう！
        </p>
      </div>

      {/* Connection Status */}
      <div className="flex justify-center mb-6">
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
          connectionStatus === 'connected' 
            ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
            : 'bg-red-600/20 text-red-400 border border-red-600/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          <span className="text-sm font-medium">
            {connectionStatus === 'connected' ? '接続済み' : '未接続'}
          </span>
        </div>
      </div>

      {/* Game Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-blue-500/5">
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-green-400">遊び方</h3>
            <p className="text-sm text-zinc-400 mb-4">ドミニオンのルールと操作方法を学習</p>
            <button 
              onClick={onOpenTutorial}
              className="button-secondary w-full"
            >
              📚 チュートリアル
            </button>
          </div>
        </div>

        <div className="card border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-blue-400">CPU対戦</h3>
            <p className="text-sm text-zinc-400 mb-4">ドミニオンルールでCPUと1対1対戦</p>
            <div className="space-y-2">
              <button 
                onClick={onStartDominion}
                className="button-primary w-full"
              >
                🎴 カード選択して対戦
              </button>
              <button 
                onClick={onStartDominionDirect}
                className="button-secondary w-full"
              >
                🤖 すぐに対戦
              </button>
            </div>
          </div>
        </div>

        <div className="card border-2 border-purple-500/30">
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-purple-400">マルチプレイヤー対戦</h3>
            <p className="text-sm text-zinc-400 mb-4">オンラインで2-4人対戦（工事中）</p>
            <button 
              disabled
              className="px-3 py-1 bg-zinc-600 text-zinc-400 rounded text-sm cursor-not-allowed w-full"
            >
              🚧 準備中
            </button>
          </div>
        </div>

        <div className="card border-2 border-green-500/30">
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-green-400">カード作成</h3>
            <p className="text-sm text-zinc-400 mb-4">オリジナルカードを作成</p>
            <button 
              onClick={onOpenCardBuilder}
              className="button-secondary w-full"
            >
              ✨ 作成
            </button>
          </div>
        </div>

        <div className="card border-2 border-purple-500/30">
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-purple-400">コレクション</h3>
            <p className="text-sm text-zinc-400 mb-4">作成したカードを管理</p>
            <button 
              onClick={onOpenCollection}
              className="button-secondary w-full"
            >
              📖 コレクション
            </button>
          </div>
        </div>
      </div>


      {/* マルチプレイヤー機能（工事中表示） */}
      <div className="card border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="text-3xl">🚧</span>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">マルチプレイヤー機能</h2>
          <p className="text-lg text-zinc-300 mb-4">
            現在、オンラインマルチプレイヤー機能を開発中です
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-200">
              🔨 実装予定機能:
            </p>
            <ul className="text-sm text-zinc-300 mt-2 space-y-1">
              <li>• リアルタイム2-4人対戦</li>
              <li>• プライベートルーム作成</li>
              <li>• 観戦モード</li>
              <li>• カスタムカード共有</li>
            </ul>
          </div>
          <p className="text-sm text-zinc-400">
            現在はCPU対戦をお楽しみください！
          </p>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-8 text-center text-zinc-400 text-sm">
        <div className="flex justify-center space-x-6">
          <span>🎮 CPU対戦モード稼働中</span>
          <span>🎨 カード作成機能利用可能</span>
          <span>📚 コレクション管理機能搭載</span>
          <span>📖 チュートリアル完備</span>
        </div>
      </div>
    </div>
  )
}