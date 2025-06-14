# Phase 3 実装計画 - ゲーム終了条件エンジン

## 🎯 概要

Phase 2（データ永続化）完了により、次はゲームプレイの完成度向上に注力。リアルなカードゲームに必要な「ゲーム終了条件」を実装し、完全な対戦体験を提供。

## 🏗️ 実装対象

### 1. ゲーム終了条件エンジン

#### 1.1 終了条件種別
```javascript
const END_CONDITIONS = {
  EMPTY_PILES: 'empty_piles',    // 3山空き
  MAX_TURNS: 'max_turns',        // 最大ターン数
  TIME_LIMIT: 'time_limit',      // 制限時間
  MANUAL: 'manual'               // 手動終了
}
```

#### 1.2 実装ファイル
- `server/src/engine/endCondition.cjs`
- `client/src/components/EndGameModal.tsx`
- Socket.IO events: `gameEnd`, `finalScores`

#### 1.3 主要機能
```javascript
class EndConditionEngine {
  // 終了条件チェック（各ターン後実行）
  checkEndConditions(roomId): EndConditionResult
  
  // 個別条件チェック
  checkEmptyPiles(supplyState): boolean      // 3山以上空き
  checkMaxTurns(gameState): boolean          // 50ターン制限
  checkTimeLimit(gameState): boolean         // 60分制限
  
  // 終了処理
  triggerGameEnd(roomId, reason): void
  calculateFinalScores(roomId): FinalScores
}
```

### 2. 最終スコア計算システム

#### 2.1 Formula 4.4 完全実装
```javascript
// ゲームスコア = 勝利点 × ベース倍率
const gameScore = victoryPoints * 1.0;

// 創造者スコア = 他者使用×10 + 自己使用×5
const creatorScore = (othersUsage * 10) + (selfUsage * 5);

// 総合スコア
const totalScore = gameScore + creatorScore;
```

#### 2.2 ランキング計算
- 総合スコア順位
- カテゴリ別順位（ゲームスコア、創造者スコア）
- 使用カード統計

### 3. リアルタイム終了処理

#### 3.1 Socket.IO イベントフロー
```
1. ターン終了 → endCondition チェック
2. 終了条件満了 → gameEnd イベント送信
3. 全プレイヤーに終了通知
4. 最終スコア計算 → finalScores イベント
5. 結果画面表示
```

#### 3.2 UI統合
- ゲーム中の終了条件表示
- 残りターン/時間カウンター
- リアルタイム順位表示

## 🔧 技術仕様

### データ構造

#### EndConditionResult
```typescript
interface EndConditionResult {
  isGameEnd: boolean;
  reason: EndConditionType;
  message: string;
  remainingTurns?: number;
  remainingTime?: number;
  emptyPiles?: string[];
}
```

#### FinalScores
```typescript
interface FinalScores {
  rankings: {
    playerId: string;
    playerName: string;
    gameScore: number;
    creatorScore: number;
    totalScore: number;
    rank: number;
    victoryPoints: number;
    cardsCreated: number;
    cardsUsed: number;
  }[];
  gameStats: {
    totalTurns: number;
    gameDuration: number;
    endReason: EndConditionType;
    topCards: CardUsageStats[];
  };
}
```

## 📅 実装スケジュール

### Week 1: エンジン実装
- [x] Phase 2 完了確認
- [ ] EndConditionEngine 実装
- [ ] Socket.IO統合
- [ ] 基本テスト

### Week 2: UI統合
- [ ] EndGameModal 実装
- [ ] リアルタイム更新
- [ ] スコア表示
- [ ] ユーザビリティテスト

### Week 3: 最適化
- [ ] パフォーマンス改善
- [ ] エラーハンドリング
- [ ] 総合テスト

## 🎮 期待される体験

### ゲーム中
- 残りターン数の可視化
- 空きサプライ山の強調表示
- リアルタイム順位変動

### ゲーム終了時
- 明確な終了理由表示
- 詳細スコア内訳
- 次ゲームへの誘導

### 結果画面
- アニメーション付きランキング
- カード使用統計
- 創造者ボーナス詳細

## 📈 成功指標

- [ ] 3種類の終了条件すべて動作
- [ ] Formula 4.4 計算正確性
- [ ] リアルタイム同期性能
- [ ] UI応答性（<100ms）
- [ ] エラー発生率 <1%

## 🔗 関連ファイル

### 新規作成
- `server/src/engine/endCondition.cjs`
- `client/src/components/EndGameModal.tsx`
- `docs/endgame-flow.md`

### 修正対象
- `server/index.cjs` (Socket.IO handlers)
- `client/src/components/GameBoard.tsx`
- `client/src/types/index.ts`