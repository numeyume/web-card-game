import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { WebSocketProvider } from './components/WebSocketProvider'
import { Lobby } from './components/Lobby'
import { GameBoard } from './components/GameBoard'
import { CardBuilder } from './components/CardBuilder'

function App() {
  const [currentView, setCurrentView] = useState<'lobby' | 'game' | 'builder'>('lobby')

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-zinc-900 text-white">
        {currentView !== 'game' && (
          <header className="bg-zinc-800 border-b border-zinc-700 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <button 
                onClick={() => setCurrentView('lobby')}
                className="text-2xl font-bold hover:text-blue-400 transition-colors"
              >
                Web Card Game
              </button>
              <nav className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('lobby')}
                  className={`px-4 py-2 rounded-lg ${
                    currentView === 'lobby' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  Lobby
                </button>
                <button
                  onClick={() => setCurrentView('builder')}
                  className={`px-4 py-2 rounded-lg ${
                    currentView === 'builder' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  Card Builder
                </button>
              </nav>
            </div>
          </header>
        )}

        <main className={currentView === 'game' ? '' : 'max-w-7xl mx-auto px-6 py-8'}>
          {currentView === 'lobby' && (
            <Lobby onJoinGame={() => setCurrentView('game')} />
          )}

          {currentView === 'builder' && (
            <CardBuilder />
          )}

          {currentView === 'game' && (
            <GameBoard onExitGame={() => setCurrentView('lobby')} />
          )}
        </main>

        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#27272a',
              color: '#fff',
              border: '1px solid #3f3f46'
            }
          }}
        />
      </div>
    </WebSocketProvider>
  )
}

export default App