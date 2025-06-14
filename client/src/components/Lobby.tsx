import React, { useState, useEffect } from 'react'
import { useWebSocket } from './WebSocketProvider'
import toast from 'react-hot-toast'

interface Room {
  id: string
  name: string
  playerCount: number
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  createdAt: string
}

interface LobbyProps {
  onJoinGame: () => void
}

export function Lobby({ onJoinGame }: LobbyProps) {
  const { emit, connectionStatus } = useWebSocket()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)

  // Fetch rooms from API
  const fetchRooms = async () => {
    try {
      setLoading(true)
      // Temporarily disable API call for debugging
      // const response = await fetch('/api/rooms')
      // const data = await response.json()
      
      // if (data.success) {
      //   setRooms(data.data || [])
      // } else {
      //   toast.error(data.error || 'Failed to fetch rooms')
      // }
      
      // Set dummy data for now
      setRooms([])
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh rooms every 5 seconds
  useEffect(() => {
    fetchRooms()
    const interval = setInterval(fetchRooms, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error('Room name is required')
      return
    }

    try {
      const response = await fetch('/api/rooms', {
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
        toast.success(`Room "${room.name}" created!`)
        
        // Join the room via WebSocket
        emit('joinRoom', room.id)
        
        // Switch to game view
        onJoinGame()
        
        setShowCreateRoom(false)
        setRoomName('')
      } else {
        toast.error(data.error || 'Failed to create room')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Failed to create room')
    }
  }

  const handleJoinRoom = (roomId: string) => {
    if (connectionStatus !== 'connected') {
      toast.error('Not connected to server')
      return
    }

    emit('joinRoom', roomId)
    onJoinGame()
    toast.success('Joining room...')
  }

  const handleQuickMatch = () => {
    // Find a waiting room with space
    const availableRoom = rooms.find(room => 
      room.status === 'waiting' && room.playerCount < room.maxPlayers
    )

    if (availableRoom) {
      handleJoinRoom(availableRoom.id)
    } else {
      // Create a new room for quick match
      setRoomName('Quick Match Room')
      setMaxPlayers(4)
      handleCreateRoom()
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Web Card Game
        </h1>
        <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
          Create custom cards and battle with 2-4 players in real-time multiplayer matches.
          Build your deck, master the meta, and climb the leaderboards!
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
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <div className="space-y-4">
            <button 
              onClick={handleQuickMatch}
              disabled={connectionStatus !== 'connected'}
              className="button-primary w-full py-3 text-lg"
            >
              🎮 Quick Match
            </button>
            <p className="text-sm text-zinc-400">
              Jump into a game immediately. We'll find or create a room for you.
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Custom Room</h2>
          <div className="space-y-4">
            <button 
              onClick={() => setShowCreateRoom(!showCreateRoom)}
              disabled={connectionStatus !== 'connected'}
              className="button-secondary w-full py-3 text-lg"
            >
              ⚙️ Create Room
            </button>
            <p className="text-sm text-zinc-400">
              Set up a private room with custom settings and invite friends.
            </p>
          </div>
        </div>
      </div>

      {/* Create Room Form */}
      {showCreateRoom && (
        <div className="card mb-8 border-2 border-blue-500/30">
          <h3 className="text-xl font-semibold mb-4">Create New Room</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name..."
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={30}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Max Players
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2}>2 Players</option>
                <option value={3}>3 Players</option>
                <option value={4}>4 Players</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <button 
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || connectionStatus !== 'connected'}
              className="button-primary"
            >
              Create Room
            </button>
            <button 
              onClick={() => setShowCreateRoom(false)}
              className="button-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rooms List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Available Rooms</h2>
          <button 
            onClick={fetchRooms}
            disabled={loading}
            className="button-secondary text-sm"
          >
            {loading ? '⟳' : '🔄'} Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-zinc-400">
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <p className="mb-4">No rooms available</p>
            <p className="text-sm">Create a room to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div 
                key={room.id}
                className="flex items-center justify-between p-4 bg-zinc-700 rounded-lg border border-zinc-600 hover:border-zinc-500 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold">{room.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      room.status === 'waiting' 
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : room.status === 'playing'
                        ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                        : 'bg-red-600/20 text-red-400 border border-red-600/30'
                    }`}>
                      {room.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-zinc-400">
                    <span>Players: {room.playerCount}/{room.maxPlayers}</span>
                    <span>Created: {new Date(room.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {room.status === 'waiting' && room.playerCount < room.maxPlayers ? (
                    <button 
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={connectionStatus !== 'connected'}
                      className="button-primary text-sm"
                    >
                      Join Room
                    </button>
                  ) : room.status === 'playing' ? (
                    <button 
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={connectionStatus !== 'connected'}
                      className="button-secondary text-sm"
                    >
                      Spectate
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="px-3 py-1 bg-zinc-600 text-zinc-400 rounded text-sm cursor-not-allowed"
                    >
                      {room.playerCount >= room.maxPlayers ? 'Full' : 'Finished'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-8 text-center text-zinc-400 text-sm">
        <div className="flex justify-center space-x-6">
          <span>🎮 {rooms.filter(r => r.status === 'playing').length} Games in Progress</span>
          <span>⏳ {rooms.filter(r => r.status === 'waiting').length} Rooms Waiting</span>
          <span>👥 {rooms.reduce((sum, r) => sum + r.playerCount, 0)} Players Online</span>
        </div>
      </div>
    </div>
  )
}