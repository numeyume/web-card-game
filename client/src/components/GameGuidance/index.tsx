import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface GameGuidanceProps {
  gameState?: any;
  playerLevel?: number;
  onTutorialComplete?: () => void;
}

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showCondition?: (gameState: any) => boolean;
  action?: string;
  skippable?: boolean;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Web Card Gameへようこそ！',
    content: 'これはカード作成と戦略が組み合わさったユニークなカードゲームです。基本的な操作方法をご案内します。',
    position: 'center',
    skippable: true
  },
  {
    id: 'hand_cards',
    title: '手札について',
    content: '画面下部が手札です。ここからカードを選んで使用できます。各カードにはコストと効果があります。',
    target: '.hand-area',
    position: 'top',
    showCondition: (gameState) => gameState?.phase === 'action'
  },
  {
    id: 'resources',
    title: 'リソース管理',
    content: 'アクション数とコインを確認しましょう。アクションを使ってカードをプレイし、コインでカードを購入します。',
    target: '.resources-display',
    position: 'bottom'
  },
  {
    id: 'supply',
    title: 'サプライエリア',
    content: 'ここからカードを購入できます。各カードのコストとストック数を確認してから購入しましょう。',
    target: '.supply-area',
    position: 'bottom'
  },
  {
    id: 'turn_phases',
    title: 'ターンの流れ',
    content: '1. アクションフェーズ：カードをプレイ\n2. 購入フェーズ：カードを購入\n3. クリーンアップ：手札をリセット',
    position: 'center'
  },
  {
    id: 'card_creation',
    title: 'カード作成',
    content: 'このゲームの特徴！オリジナルカードを作成して他のプレイヤーに使ってもらいましょう。作成されたカードは得点源になります。',
    target: '.create-card-button',
    position: 'left'
  },
  {
    id: 'victory_condition',
    title: '勝利条件',
    content: 'ゲーム終了時に最も高いスコアを獲得したプレイヤーが勝利！勝利点カードの取得とカード作成の両方が重要です。',
    position: 'center'
  }
];

const contextualHints = {
  low_actions: {
    title: 'アクション不足',
    content: 'アクション数が少なくなっています。アクション数を増やすカードの使用を検討しましょう。',
    icon: '⚡',
    priority: 'medium'
  },
  no_money: {
    title: 'コイン不足',
    content: '購入に十分なコインがありません。財宝カードをプレイしてコインを獲得しましょう。',
    icon: '💰',
    priority: 'high'
  },
  end_game_near: {
    title: 'ゲーム終了間近',
    content: 'ゲーム終了が近づいています。勝利点カードの獲得を優先しましょう。',
    icon: '⏰',
    priority: 'high'
  },
  creative_opportunity: {
    title: 'カード作成のチャンス',
    content: '十分なリソースがあります。新しいカードを作成してみませんか？',
    icon: '🎨',
    priority: 'low'
  },
  first_buy: {
    title: '初回購入',
    content: '最初の購入です。財宝カードやアクションカードがおすすめです。',
    icon: '🛒',
    priority: 'medium'
  }
};

export function GameGuidance({ gameState, playerLevel = 1, onTutorialComplete }: GameGuidanceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [activeHints, setActiveHints] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  

  // 初回プレイヤーへのチュートリアル表示判定
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('tutorial_completed');
    if (!hasSeenTutorial && playerLevel <= 2) {
      setShowTutorial(true);
    }
  }, [playerLevel]);

  // ゲーム状態に基づくコンテキストヒント生成
  useEffect(() => {
    if (!gameState || showTutorial) return;

    const hints: string[] = [];

    // プレイヤーの状況分析
    const currentPlayer = gameState.players?.[gameState.currentPlayer];
    if (!currentPlayer) return;

    // アクション不足チェック
    if (currentPlayer.actions === 0 && gameState.phase === 'action') {
      hints.push('low_actions');
    }

    // コイン不足チェック
    if (currentPlayer.coins < 2 && gameState.phase === 'buy') {
      hints.push('no_money');
    }

    // ゲーム終了間近チェック
    const emptyPiles = Object.values(gameState.supply || {}).filter((pile: any) => pile.count === 0).length;
    if (emptyPiles >= 2 || gameState.currentTurn >= 40) {
      hints.push('end_game_near');
    }

    // カード作成機会チェック
    if (currentPlayer.coins >= 5 && currentPlayer.actions >= 1) {
      hints.push('creative_opportunity');
    }

    // 初回購入チェック
    if (gameState.currentTurn <= 3 && gameState.phase === 'buy') {
      hints.push('first_buy');
    }

    setActiveHints(hints);
  }, [gameState, showTutorial]);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    setShowTutorial(false);
    setTutorialCompleted(true);
    localStorage.setItem('tutorial_completed', 'true');
    onTutorialComplete?.();
  };

  const getCurrentStep = () => tutorialSteps[currentStep];

  const renderTutorialOverlay = () => {
    const step = getCurrentStep();
    if (!step) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background-secondary rounded-2xl shadow-2xl max-w-md mx-4 border border-border-primary"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary">{step.title}</h3>
              <div className="flex items-center space-x-2 text-text-muted text-sm">
                <span>{currentStep + 1} / {tutorialSteps.length}</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                {step.content}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="btn-ghost px-4 py-2 text-sm"
                  >
                    戻る
                  </button>
                )}
                {step.skippable && (
                  <button
                    onClick={skipTutorial}
                    className="btn-ghost px-4 py-2 text-sm text-text-muted"
                  >
                    スキップ
                  </button>
                )}
              </div>

              <button
                onClick={nextStep}
                className="btn-primary px-6 py-2 text-sm"
              >
                {currentStep === tutorialSteps.length - 1 ? '完了' : '次へ'}
              </button>
            </div>

            {/* プログレスバー */}
            <div className="mt-4">
              <div className="w-full bg-surface-primary rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const renderContextualHints = () => {
    if (activeHints.length === 0) return null;

    return (
      <div className="fixed top-20 right-4 z-40 space-y-2 max-w-sm">
        <AnimatePresence>
          {activeHints.slice(0, 2).map((hintId) => {
            const hint = contextualHints[hintId as keyof typeof contextualHints];
            if (!hint) return null;

            return (
              <motion.div
                key={hintId}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className={`card p-4 border-l-4 ${
                  hint.priority === 'high' 
                    ? 'border-l-red-500 bg-red-500/10' 
                    : hint.priority === 'medium'
                    ? 'border-l-yellow-500 bg-yellow-500/10'
                    : 'border-l-blue-500 bg-blue-500/10'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl" role="img" aria-label="hint-icon">
                    {hint.icon}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-text-primary mb-1">
                      {hint.title}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {hint.content}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveHints(hints => hints.filter(h => h !== hintId))}
                    className="text-text-muted hover:text-text-primary text-sm"
                    aria-label="ヒントを閉じる"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  const renderHelpModal = () => {
    if (!showHelp) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={() => setShowHelp(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background-secondary rounded-2xl shadow-2xl max-w-2xl mx-4 border border-border-primary max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">ゲームヘルプ</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-text-muted hover:text-text-primary text-xl"
                aria-label="ヘルプを閉じる"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3 text-text-primary">🎯 ゲームの目標</h3>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 mb-4">
                  <p className="text-purple-200 font-semibold text-center">
                    🎨 創造 × 🎮 戦略 = 究極のカードゲーム体験
                  </p>
                </div>
                <ul className="space-y-2 text-text-secondary">
                  <li>• <span className="text-purple-400 font-semibold">カード作成</span>：オリジナルカードを作って他者と共有</li>
                  <li>• <span className="text-blue-400 font-semibold">戦略プレイ</span>：アクション→購入→クリーンアップの流れで勝利点獲得</li>
                  <li>• <span className="text-yellow-400 font-semibold">創造者スコア</span>：あなたのカードが他者に使われるほど高得点</li>
                  <li>• <span className="text-green-400 font-semibold">総合スコア</span>：ゲームスコア + 創造者スコア = 最終順位</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-text-primary">カードタイプ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-3">
                    <h4 className="font-semibold text-yellow-400 mb-2">財宝カード</h4>
                    <p className="text-sm text-text-secondary">コインを生成します</p>
                  </div>
                  <div className="card p-3">
                    <h4 className="font-semibold text-blue-400 mb-2">アクションカード</h4>
                    <p className="text-sm text-text-secondary">特殊効果を発動します</p>
                  </div>
                  <div className="card p-3">
                    <h4 className="font-semibold text-purple-400 mb-2">勝利点カード</h4>
                    <p className="text-sm text-text-secondary">ゲーム終了時に得点になります</p>
                  </div>
                  <div className="card p-3">
                    <h4 className="font-semibold text-pink-400 mb-2">カスタムカード</h4>
                    <p className="text-sm text-text-secondary">プレイヤーが作成したカードです</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-text-primary">スコア計算</h3>
                <div className="bg-surface-primary rounded-lg p-4">
                  <p className="text-text-secondary mb-2">
                    <strong>総合スコア = ゲームスコア + 創造者スコア</strong>
                  </p>
                  <ul className="space-y-1 text-sm text-text-muted">
                    <li>• ゲームスコア：勝利点カードから獲得</li>
                    <li>• 創造者スコア：作成したカードが他者に使用された回数に基づく</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 text-text-primary">操作方法</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li>• カードをクリックしてプレイ/購入</li>
                  <li>• 「ターン終了」ボタンで次のプレイヤーにターンを渡す</li>
                  <li>• カード作成ボタンで新しいカードを作成</li>
                  <li>• ESCキーでメニューを開く</li>
                </ul>
              </section>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="btn-primary px-6 py-2"
              >
                理解しました
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      {/* チュートリアルオーバーレイ */}
      <AnimatePresence>
        {showTutorial && renderTutorialOverlay()}
      </AnimatePresence>

      {/* コンテキストヒント */}
      {renderContextualHints()}

      {/* ヘルプモーダル */}
      <AnimatePresence>
        {renderHelpModal()}
      </AnimatePresence>

      {/* ヘルプボタン */}
      {!showTutorial && (
        <button
          onClick={() => setShowHelp(true)}
          className="fixed bottom-4 right-4 z-30 w-12 h-12 bg-primary-600 hover:bg-primary-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
          aria-label="ヘルプを開く"
          title="ヘルプ"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}

      {/* チュートリアル再開ボタン */}
      {!showTutorial && !tutorialCompleted && (
        <button
          onClick={() => setShowTutorial(true)}
          className="fixed bottom-20 right-4 z-30 bg-surface-primary hover:bg-surface-secondary px-4 py-2 rounded-lg shadow-lg text-sm text-text-secondary hover:text-text-primary transition-all duration-200"
          aria-label="チュートリアルを再開"
        >
          チュートリアル
        </button>
      )}
    </>
  );
}