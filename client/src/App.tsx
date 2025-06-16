import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { WebSocketProvider } from './components/WebSocketProvider'
import { Lobby } from './components/Lobby'
import { GameBoard } from './components/GameBoard'
import { CardBuilder } from './components/CardBuilder'
import { InteractiveTutorial } from './components/Tutorial/InteractiveTutorial'
import { CardCollection } from './components/CardCollection'
import { TutorialScreen } from './components/Tutorial/TutorialScreen'
import { CardSelector } from './components/CardSelector'

// Icons as components for better performance and consistency
const Icons = {
  Cards: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Robot: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  Collection: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  Book: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function App() {
  const [currentView, setCurrentView] = useState<'lobby' | 'game' | 'builder' | 'collection' | 'dominion' | 'tutorial' | 'interactive-tutorial' | 'card-selector'>('lobby')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCards, setSelectedCards] = useState<any[]>([])

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Navigation configuration
  const navItems = [
    { 
      id: 'lobby', 
      label: 'ロビー', 
      icon: Icons.Home,
      description: 'ゲームルームを探す' 
    },
    { 
      id: 'tutorial', 
      label: '遊び方', 
      icon: Icons.Book,
      description: 'ドミニオンの遊び方とルール' 
    },
    { 
      id: 'builder', 
      label: 'カード作成', 
      icon: Icons.Cards,
      description: 'オリジナルカードを作成' 
    },
    { 
      id: 'collection', 
      label: 'コレクション', 
      icon: Icons.Collection,
      description: '作成したカードを管理' 
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce-subtle mb-4">
            <Icons.Sparkles />
          </div>
          <h2 className="text-xl font-semibold text-gradient mb-2">
            Web Card Game
          </h2>
          <div className="loading-dots text-text-muted">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    )
  }


  // CPU対戦モードの場合はWebSocketProviderを迂回
  if (currentView === 'dominion') {
    console.log('🎯 App.tsx: CPU対戦モード開始 - CPUGameBoardをレンダリング中')
    return (
      <div className="min-h-screen bg-background-primary text-text-primary">
        <InteractiveTutorial 
          onComplete={() => {
            console.log('🏁 CPU対戦完了')
            setSelectedCards([]) // カスタムカードをリセット
            setCurrentView('lobby')
          }}
          onExit={() => {
            console.log('🚪 CPU対戦終了 - ロビーに戻る')
            setSelectedCards([]) // カスタムカードをリセット
            setCurrentView('lobby')
          }} 
          selectedCards={selectedCards}
          isCPUMode={true}
        />
        
        {/* Toast Notifications */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgb(39 39 42)',
              color: 'rgb(250 250 250)',
              border: '1px solid rgb(82 82 91)',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
              },
            },
          }}
          containerStyle={{
            top: 20,
            left: 20,
            bottom: 20,
            right: 20,
          }}
        />
      </div>
    )
  }

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-background-primary text-text-primary">
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="skip-to-content">
          メインコンテンツにスキップ
        </a>
        
        {/* Header - only show when not in game */}
        {!['game', 'dominion', 'interactive-tutorial', 'card-selector'].includes(currentView) && (
          <header className="sticky top-0 z-50 glass-effect bg-background-secondary/80 border-b border-border-primary">
            <div className="max-w-8xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Logo/Brand */}
                <button 
                  onClick={() => setCurrentView('lobby')}
                  className="group flex items-center space-x-3 text-2xl font-bold transition-all duration-200 hover:scale-105"
                  aria-label="ホームに戻る"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 group-hover:shadow-glow transition-all duration-200">
                    <Icons.Sparkles />
                  </div>
                  <span className="text-gradient">
                    Web Card Game
                  </span>
                </button>

                {/* Navigation */}
                <nav className="flex items-center space-x-1 sm:space-x-2" role="navigation" aria-label="メインナビゲーション">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentView === item.id
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id as 'lobby' | 'tutorial' | 'builder' | 'collection')}
                        className={`nav-link ${isActive ? 'active' : ''} flex items-center space-x-1 sm:space-x-2 group`}
                        aria-current={isActive ? 'page' : undefined}
                        title={item.description}
                      >
                        <Icon />
                        <span className="hidden sm:inline text-xs sm:text-sm">{item.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main 
          id="main-content"
          className={`transition-all duration-300 ${
            ['game', 'dominion'].includes(currentView)
              ? 'min-h-screen' 
              : 'max-w-8xl mx-auto px-6 py-8'
          }`}
          role="main"
          aria-label="メインコンテンツ"
        >
          <div className="animate-fade-in">
            {currentView === 'lobby' && (
              <div className="animate-slide-up">
                <Lobby 
                  onJoinGame={() => setCurrentView('game')}
                  onStartDominion={() => setCurrentView('card-selector')}
                  onStartDominionDirect={() => setCurrentView('dominion')}
                  onOpenCardBuilder={() => setCurrentView('builder')}
                  onOpenCollection={() => setCurrentView('collection')}
                  onOpenTutorial={() => setCurrentView('tutorial')}
                />
              </div>
            )}

            {currentView === 'builder' && (
              <div className="animate-slide-up">
                <CardBuilder />
              </div>
            )}

            {currentView === 'game' && (
              <GameBoard onExitGame={() => setCurrentView('lobby')} />
            )}

            {currentView === 'collection' && (
              <div className="animate-slide-up">
                <CardCollection onOpenCardBuilder={() => setCurrentView('builder')} />
              </div>
            )}

            {currentView === 'tutorial' && (
              <div className="animate-slide-up">
                <TutorialScreen 
                  onClose={() => setCurrentView('lobby')}
                  onStartTutorial={() => setCurrentView('interactive-tutorial')}
                />
              </div>
            )}

            {currentView === 'interactive-tutorial' && (
              <div className="animate-slide-up">
                <InteractiveTutorial 
                  onComplete={() => setCurrentView('dominion')}
                  onExit={() => {
                    setSelectedCards([]) // カスタムカードをリセット
                    setCurrentView('lobby')
                  }}
                />
              </div>
            )}

            {currentView === 'card-selector' && (
              <div className="animate-slide-up">
                <CardSelector 
                  onStartGame={(cards) => {
                    setSelectedCards(cards)
                    setCurrentView('dominion')
                  }}
                  onCancel={() => {
                    setSelectedCards([]) // カスタムカードをリセット
                    setCurrentView('lobby')
                  }}
                />
              </div>
            )}
          </div>
        </main>

        {/* Footer - only show when not in game */}
        {!['game', 'dominion', 'interactive-tutorial', 'card-selector'].includes(currentView) && (
          <footer className="mt-16 border-t border-border-primary bg-background-secondary/50">
            <div className="max-w-8xl mx-auto px-6 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="text-text-muted text-sm">
                  © 2025 Web Card Game. リアルタイムマルチプレイヤーカードゲーム
                </div>
                <div className="flex items-center space-x-4 text-text-muted text-sm">
                  <span>Phase 4 完了</span>
                  <div className="w-2 h-2 rounded-full bg-game-success animate-pulse-slow"></div>
                  <span>全機能実装済み</span>
                </div>
              </div>
            </div>
          </footer>
        )}

        {/* Toast Notifications */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgb(39 39 42)',
              color: 'rgb(250 250 250)',
              border: '1px solid rgb(82 82 91)',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
              },
            },
          }}
          containerStyle={{
            top: 20,
            left: 20,
            bottom: 20,
            right: 20,
          }}
        />
      </div>
    </WebSocketProvider>
  )
}

export default App