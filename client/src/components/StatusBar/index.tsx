import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusBarProps {
  gameState?: any;
  playerId?: string;
  onAction?: (action: any) => void;
}

interface StatusIndicator {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  icon: string;
  duration?: number;
  persistent?: boolean;
}

export function StatusBar({ gameState, playerId, onAction }: StatusBarProps) {
  const [notifications, setNotifications] = useState<StatusIndicator[]>([]);
  const [gamePhase, setGamePhase] = useState('');
  const [timeRemaining] = useState(0);
  
  // シンプル化：コアゲーム機能のみ表示
  const isSimplifiedMode = true;

  // ゲーム状態の監視と通知生成
  useEffect(() => {
    if (!gameState || !playerId) return;

    const newNotifications: StatusIndicator[] = [];
    const currentPlayer = gameState.players?.find((p: any) => p.id === playerId);
    const isMyTurn = gameState.players?.[gameState.currentPlayer]?.id === playerId;

    // ターン開始通知
    if (isMyTurn && gameState.phase === 'action') {
      newNotifications.push({
        id: 'turn_start',
        type: 'info',
        message: 'あなたのターンです',
        icon: '🎯',
        duration: 3000
      });
    }

    // フェーズ変更通知
    if (isMyTurn) {
      switch (gameState.phase) {
        case 'action':
          setGamePhase('アクションフェーズ - カードをプレイしましょう');
          break;
        case 'buy':
          setGamePhase('購入フェーズ - カードを購入しましょう');
          break;
        case 'cleanup':
          setGamePhase('クリーンアップフェーズ');
          break;
        default:
          setGamePhase('待機中...');
      }
    } else {
      const currentPlayerName = gameState.players?.[gameState.currentPlayer]?.name || 'プレイヤー';
      setGamePhase(`${currentPlayerName}のターン`);
    }

    // リソース不足警告
    if (isMyTurn && currentPlayer) {
      if (currentPlayer.actions === 0 && gameState.phase === 'action') {
        newNotifications.push({
          id: 'no_actions',
          type: 'warning',
          message: 'アクション数が0です。購入フェーズに進みましょう',
          icon: '⚡',
          persistent: true
        });
      }

      if (currentPlayer.coins === 0 && gameState.phase === 'buy') {
        newNotifications.push({
          id: 'no_coins',
          type: 'warning',
          message: 'コインが不足しています。財宝カードをプレイしましょう',
          icon: '💰',
          persistent: true
        });
      }
    }

    // ゲーム終了警告
    const emptyPiles = Object.values(gameState.supply || {}).filter((pile: any) => pile.count === 0).length;
    if (emptyPiles >= 2) {
      newNotifications.push({
        id: 'game_ending',
        type: 'warning',
        message: `${emptyPiles}山が枯渇しています。ゲーム終了間近です`,
        icon: '⏰',
        persistent: true
      });
    }

    // 省州枯渇警告
    if (gameState.supply?.province?.count <= 2) {
      newNotifications.push({
        id: 'province_low',
        type: 'error',
        message: '属州の残りが少なくなっています！',
        icon: '🏰',
        persistent: true
      });
    }

    // 新しい通知を追加
    setNotifications(prev => {
      const filtered = prev.filter(n => n.persistent);
      return [...filtered, ...newNotifications];
    });

  }, [gameState, playerId]);

  // 通知の自動削除
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => 
        prev.filter(notification => {
          if (notification.persistent) return true;
          if (!notification.duration) return false;
          return Date.now() - (notification as any).createdAt < notification.duration;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 新しい通知にタイムスタンプを追加
  useEffect(() => {
    setNotifications(prev => 
      prev.map(notification => ({
        ...notification,
        createdAt: (notification as any).createdAt || Date.now()
      } as any))
    );
  }, [notifications.length]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getPlayerResources = () => {
    if (!gameState || !playerId) return null;
    
    const currentPlayer = gameState.players?.find((p: any) => p.id === playerId);
    if (!currentPlayer) return null;

    return {
      coins: currentPlayer.coins || 0,
      actions: currentPlayer.actions || 0,
      buys: currentPlayer.buys || 0,
      handSize: currentPlayer.hand?.length || 0,
      deckSize: currentPlayer.deck?.length || 0,
      victoryPoints: currentPlayer.victoryPoints || 0
    };
  };

  const getCurrentTurnInfo = () => {
    if (!gameState) return null;

    return {
      currentTurn: gameState.currentTurn || 1,
      maxTurns: gameState.maxTurns || 50,
      currentPlayerIndex: gameState.currentPlayer || 0,
      totalPlayers: gameState.players?.length || 0
    };
  };

  const resources = getPlayerResources();
  const turnInfo = getCurrentTurnInfo();
  const isMyTurn = gameState?.players?.[gameState.currentPlayer]?.id === playerId;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-background-secondary/95 backdrop-blur border-b border-border-primary">
      <div className="max-w-8xl mx-auto px-4 py-2">
        {/* メインステータス行 */}
        <div className="flex items-center justify-between">
          {/* ゲーム進行情報 */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-sm font-medium text-text-primary">
                {gamePhase}
              </span>
            </div>

            {turnInfo && (
              <div className="text-sm text-text-muted">
                ターン {turnInfo.currentTurn} / {turnInfo.maxTurns}
              </div>
            )}

            {timeRemaining > 0 && (
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-text-muted">残り時間:</span>
                <span className={`font-mono ${timeRemaining <= 30 ? 'text-red-400' : 'text-text-primary'}`}>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {/* プレイヤーリソース */}
          {resources && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">💰</span>
                <span className="text-sm font-medium text-text-primary">{resources.coins}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-blue-400">⚡</span>
                <span className="text-sm font-medium text-text-primary">{resources.actions}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-green-400">🛒</span>
                <span className="text-sm font-medium text-text-primary">{resources.buys}</span>
              </div>

              <div className="flex items-center space-x-1">
                <span className="text-purple-400">🃏</span>
                <span className="text-sm font-medium text-text-primary">{resources.handSize}</span>
              </div>

              <div className="flex items-center space-x-1">
                <span className="text-orange-400">📚</span>
                <span className="text-sm font-medium text-text-primary">{resources.deckSize}</span>
              </div>

              <div className="flex items-center space-x-1">
                <span className="text-pink-400">👑</span>
                <span className="text-sm font-medium text-text-primary">{resources.victoryPoints}</span>
              </div>
            </div>
          )}
        </div>

        {/* 通知エリア */}
        <AnimatePresence>
          {notifications.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 space-y-1"
            >
              {notifications.slice(0, 3).map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    notification.type === 'error' 
                      ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                      : notification.type === 'warning'
                      ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-200'
                      : notification.type === 'success'
                      ? 'bg-green-500/20 border border-green-500/30 text-green-200'
                      : 'bg-blue-500/20 border border-blue-500/30 text-blue-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg" role="img" aria-label="notification-icon">
                      {notification.icon}
                    </span>
                    <span>{notification.message}</span>
                  </div>
                  
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="ml-2 text-current hover:opacity-70 transition-opacity"
                    aria-label="通知を閉じる"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* クイックアクション */}
        {isMyTurn && (
          <div className="mt-2 flex items-center space-x-2">
            {gameState.phase === 'action' && (
              <button
                onClick={() => onAction?.({ type: 'endActionPhase' })}
                className="btn-ghost px-3 py-1 text-xs"
              >
                購入フェーズへ
              </button>
            )}
            
            {gameState.phase === 'buy' && (
              <button
                onClick={() => onAction?.({ type: 'endTurn' })}
                className="btn-primary px-3 py-1 text-xs"
              >
                ターン終了
              </button>
            )}

            {isSimplifiedMode && (
              <button
                onClick={() => onAction?.({ type: 'createCard' })}
                className="btn-secondary px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                title="Create your own unique cards!"
              >
                🎨 カード作成
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}