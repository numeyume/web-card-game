import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionFeedbackProps {
  gameState?: any;
  playerId?: string;
  lastAction?: any;
}

interface FeedbackMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'achievement';
  title: string;
  message: string;
  icon: string;
  effects?: string[];
  duration: number;
  position: 'center' | 'top-right' | 'bottom-center';
  priority: number;
}

const feedbackEffects = {
  sparkle: 'animate-pulse',
  golden_glow: 'shadow-glow',
  rainbow_burst: 'animate-bounce-subtle',
  creative_sparkle: 'animate-fade-in',
  efficiency_glow: 'border border-blue-400/50',
  gentle_pulse: 'animate-pulse',
  opportunity_highlight: 'border border-yellow-400/50',
  warning_pulse: 'animate-bounce',
  fade_highlight: 'opacity-75',
  motivation_glow: 'shadow-glow-lg',
  learning_sparkle: 'animate-bounce-subtle'
};

export function ActionFeedback({ gameState, playerId, lastAction }: ActionFeedbackProps) {
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([]);
  const [achievements] = useState<any[]>([]);
  const [combos] = useState<any[]>([]);

  const generateActionFeedback = useCallback((action: any, gameState: any, playerId: string): FeedbackMessage[] => {
    const feedback: FeedbackMessage[] = [];
    const currentPlayer = gameState.players?.find((p: any) => p.id === playerId);
    
    if (!currentPlayer) return feedback;

    switch (action.type) {
      case 'playCard':
        feedback.push(...generatePlayCardFeedback(action, currentPlayer));
        break;
      case 'buyCard':
        feedback.push(...generateBuyCardFeedback(action, currentPlayer, gameState));
        break;
      case 'createCard':
        feedback.push(...generateCreateCardFeedback(action, currentPlayer));
        break;
      case 'endTurn':
        feedback.push(...generateEndTurnFeedback(currentPlayer));
        break;
      case 'combo':
        feedback.push(...generateComboFeedback(action));
        break;
    }

    return feedback;
  }, []);

  // アクションに基づくフィードバック生成
  useEffect(() => {
    if (!lastAction || !gameState || !playerId) return;

    const newFeedback = generateActionFeedback(lastAction, gameState, playerId);
    if (newFeedback.length > 0) {
      setFeedbackMessages(prev => [...prev, ...newFeedback]);
    }
  }, [lastAction, gameState, playerId, generateActionFeedback]);

  // フィードバックメッセージの自動削除
  useEffect(() => {
    if (feedbackMessages.length === 0) return;

    const timer = setTimeout(() => {
      setFeedbackMessages(prev => prev.slice(1));
    }, feedbackMessages[0]?.duration || 3000);

    return () => clearTimeout(timer);
  }, [feedbackMessages]);

  const generatePlayCardFeedback = (action: any, player: any): FeedbackMessage[] => {
    const feedback: FeedbackMessage[] = [];
    const card = action.card;

    // 基本的なプレイ成功フィードバック
    feedback.push({
      id: `play_${Date.now()}`,
      type: 'success',
      title: 'カードプレイ',
      message: `${card.name}をプレイしました`,
      icon: '🎴',
      duration: 2000,
      position: 'top-right',
      priority: 1
    });

    // 効率的なプレイの判定
    if (card.type === 'action' && player.actions === 1) {
      feedback.push({
        id: `efficient_${Date.now()}`,
        type: 'info',
        title: '効率的なプレイ！',
        message: '最後のアクションを有効活用しました',
        icon: '⚡',
        effects: ['efficiency_glow'],
        duration: 3000,
        position: 'center',
        priority: 3
      });
    }

    // 財宝カードの連続プレイ
    const treasureCardsPlayed = player.play?.filter((c: any) => c.type === 'treasure').length || 0;
    if (card.type === 'treasure' && treasureCardsPlayed >= 3) {
      feedback.push({
        id: `treasure_combo_${Date.now()}`,
        type: 'success',
        title: '財宝コンボ！',
        message: '財宝カードを効果的に組み合わせています',
        icon: '💰',
        effects: ['golden_glow'],
        duration: 4000,
        position: 'center',
        priority: 4
      });
    }

    return feedback;
  };

  const generateBuyCardFeedback = (action: any, _player: any, gameState: any): FeedbackMessage[] => {
    const feedback: FeedbackMessage[] = [];
    const card = action.card;

    // 基本的な購入成功フィードバック
    feedback.push({
      id: `buy_${Date.now()}`,
      type: 'success',
      title: 'カード購入',
      message: `${card.name}を購入しました`,
      icon: '🛒',
      duration: 2000,
      position: 'top-right',
      priority: 1
    });

    // 高コストカードの購入
    if (card.cost >= 6) {
      feedback.push({
        id: `expensive_buy_${Date.now()}`,
        type: 'success',
        title: '高価な投資！',
        message: `${card.cost}コストのカードを購入`,
        icon: '💎',
        effects: ['sparkle'],
        duration: 3500,
        position: 'center',
        priority: 3
      });
    }

    // タイミングの良い勝利点カード購入
    const emptyPiles = Object.values(gameState.supply || {}).filter((pile: any) => pile.count === 0).length;
    if (card.type === 'victory' && emptyPiles >= 2) {
      feedback.push({
        id: `timely_victory_${Date.now()}`,
        type: 'success',
        title: '絶妙なタイミング！',
        message: 'ゲーム終了間近での勝利点獲得',
        icon: '🎯',
        effects: ['opportunity_highlight'],
        duration: 4000,
        position: 'center',
        priority: 5
      });
    }

    // 初回購入
    if (gameState.currentTurn <= 3) {
      feedback.push({
        id: `first_buy_${Date.now()}`,
        type: 'info',
        title: '初回購入',
        message: 'ゲーム序盤の重要な選択です',
        icon: '🌟',
        effects: ['gentle_pulse'],
        duration: 3000,
        position: 'bottom-center',
        priority: 2
      });
    }

    return feedback;
  };

  const generateCreateCardFeedback = (action: any, player: any): FeedbackMessage[] => {
    const feedback: FeedbackMessage[] = [];

    // カード作成の特別な強調（当初の設計思想）
    feedback.push({
      id: `create_${Date.now()}`,
      type: 'achievement',
      title: '🎨 新たな創造！',
      message: `"${action.cardName}" - あなたの創造力がゲームを豊かにします`,
      icon: '✨',
      effects: ['creative_sparkle', 'rainbow_burst', 'golden_glow'],
      duration: 7000,
      position: 'center',
      priority: 10 // 最高優先度
    });

    // 初回作成の特別メッセージ
    const cardsCreated = player.stats?.cardsCreated || 0;
    if (cardsCreated === 1) {
      feedback.push({
        id: `first_creation_${Date.now()}`,
        type: 'achievement',
        title: '🌟 創造者の誕生！',
        message: 'あなたも今日からCard Creator！コミュニティがあなたの創造を待っています',
        icon: '👑',
        effects: ['golden_glow', 'motivation_glow'],
        duration: 8000,
        position: 'center',
        priority: 11
      });
    }

    return feedback;
  };

  const generateEndTurnFeedback = (player: any): FeedbackMessage[] => {
    const feedback: FeedbackMessage[] = [];

    // 効率的なターン終了
    const coinsUsed = (player.totalCoins || 0) - (player.coins || 0);
    const actionsUsed = (player.totalActions || 1) - (player.actions || 0);

    if (coinsUsed >= 5 && actionsUsed >= 1) {
      feedback.push({
        id: `efficient_turn_${Date.now()}`,
        type: 'success',
        title: '効率的なターン！',
        message: 'リソースを最大限活用しました',
        icon: '✨',
        effects: ['efficiency_glow'],
        duration: 3000,
        position: 'bottom-center',
        priority: 3
      });
    }

    return feedback;
  };

  const generateComboFeedback = (action: any): FeedbackMessage[] => {
    const feedback: FeedbackMessage[] = [];

    feedback.push({
      id: `combo_${Date.now()}`,
      type: 'success',
      title: 'コンボ成功！',
      message: action.comboDescription || 'カードを効果的に組み合わせました',
      icon: '🔥',
      effects: ['rainbow_burst', 'sparkle'],
      duration: 4000,
      position: 'center',
      priority: 5
    });

    return feedback;
  };

  const renderFeedbackMessage = (message: FeedbackMessage) => {
    const getPositionClasses = () => {
      switch (message.position) {
        case 'center':
          return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
        case 'top-right':
          return 'fixed top-20 right-4';
        case 'bottom-center':
          return 'fixed bottom-4 left-1/2 transform -translate-x-1/2';
        default:
          return 'fixed top-20 right-4';
      }
    };

    const getTypeClasses = () => {
      switch (message.type) {
        case 'success':
          return 'bg-green-500/90 border-green-400';
        case 'achievement':
          return 'bg-purple-500/90 border-purple-400';
        case 'warning':
          return 'bg-yellow-500/90 border-yellow-400';
        default:
          return 'bg-blue-500/90 border-blue-400';
      }
    };

    const effectClasses = message.effects?.map(effect => feedbackEffects[effect as keyof typeof feedbackEffects]).join(' ') || '';

    return (
      <motion.div
        key={message.id}
        initial={{ 
          scale: 0.5, 
          opacity: 0,
          y: message.position === 'bottom-center' ? 50 : -50
        }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          y: 0
        }}
        exit={{ 
          scale: 0.8, 
          opacity: 0,
          y: message.position === 'bottom-center' ? 20 : -20
        }}
        className={`${getPositionClasses()} z-50 max-w-sm`}
      >
        <div className={`
          ${getTypeClasses()} 
          ${effectClasses}
          rounded-xl shadow-2xl border backdrop-blur-sm p-4
        `}>
          <div className="flex items-start space-x-3">
            <span className="text-2xl flex-shrink-0" role="img" aria-label="feedback-icon">
              {message.icon}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm mb-1">
                {message.title}
              </h4>
              <p className="text-white/90 text-xs leading-relaxed">
                {message.message}
              </p>
            </div>
          </div>
          
          {/* プライオリティインジケーター */}
          {message.priority >= 5 && (
            <div className="mt-2 flex justify-center">
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(message.priority, 7) }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-1.5 h-1.5 bg-white/60 rounded-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderAchievementBurst = () => {
    if (achievements.length === 0) return null;

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 max-w-lg mx-4 border border-purple-400">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-6xl mb-4"
            >
              🏆
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              アチーブメント達成！
            </h2>
            <p className="text-white/90 text-lg">
              {achievements[0]?.name}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  // メッセージを優先度順でソート
  const sortedMessages = [...feedbackMessages].sort((a, b) => b.priority - a.priority);

  return (
    <>
      <AnimatePresence mode="sync">
        {sortedMessages.slice(0, 3).map(renderFeedbackMessage)}
      </AnimatePresence>

      <AnimatePresence>
        {renderAchievementBurst()}
      </AnimatePresence>

      {/* コンボカウンター */}
      {combos.length > 0 && (
        <div className="fixed top-32 right-4 z-40">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-orange-500/90 rounded-full px-4 py-2 border border-orange-400"
          >
            <div className="flex items-center space-x-2">
              <span className="text-white font-bold">🔥</span>
              <span className="text-white font-bold">{combos.length}x コンボ</span>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}