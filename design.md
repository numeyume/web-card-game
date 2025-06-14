# 設計仕様書

## システム全体設計

### アーキテクチャ概要
```
[ブラウザ] <--> [React Client] <--> [Socket.IO] <--> [Node.js Server] <--> [MongoDB]
                     |                                        |
                 Tailwind CSS                            Deck Engine
                 Card Builder                           Score Engine
```

## データ構造設計

### MongoDBコレクション設計

#### cards コレクション
```javascript
{
  _id: ObjectId,
  id: String,           // "custom_1234567890"
  name: String,         // "村"
  cost: Number,         // 3
  type: String,         // "Action" | "Treasure" | "Victory" | "Custom"
  effects: [{
    type: String,       // "draw" | "gain_coin" | "gain_action" | etc.
    value: Number,      // 効果の値
    target: String,     // "self" | "opponent" | "all"
    condition: String   // オプション条件
  }],
  description: String,  // "アクション+2、カード+1"
  createdBy: String,    // プレイヤーID
  createdAt: Date,
  usageCount: Number,   // 使用回数統計
  rating: Number,       // 平均評価 (1-5)
  isPublic: Boolean,    // 公開設定
  tags: [String]        // タグ
}
```

#### rooms コレクション
```javascript
{
  _id: ObjectId,
  id: String,           // "room_1234567890"
  name: String,         // "プレイヤー1の部屋"
  players: [{
    id: String,         // プレイヤーID
    name: String,       // 表示名
    isConnected: Boolean,
    joinedAt: Date,
    isHost: Boolean
  }],
  maxPlayers: Number,   // 2-4
  status: String,       // "waiting" | "playing" | "finished"
  gameState: {
    currentPlayer: String,
    turn: Number,
    phase: String,      // "action" | "buy" | "cleanup"
    timeRemaining: Number,
    supply: [{
      cardId: String,
      count: Number
    }]
  },
  deckStates: {         // プレイヤーごとのデッキ状態
    [playerId]: {
      handSize: Number,
      deckSize: Number,
      discardSize: Number,
      fieldSize: Number
    }
  },
  gameSettings: {
    timeLimit: Number,  // ターン制限時間（秒）
    maxTurns: Number,   // 最大ターン数
    customCards: [String], // 使用カスタムカードID
    endConditions: {
      emptyPiles: Number, // 何山空になったら終了
      maxTurns: Number,
      timeLimit: Number
    }
  },
  createdAt: Date,
  lastActivity: Date,
  finishedAt: Date
}
```

#### usersAnon コレクション
```javascript
{
  _id: ObjectId,
  id: String,           // "anon_1234567890_abc123"
  sessionId: String,    // セッションID
  name: String,         // "Anonymous_12345678"
  createdCards: [String], // 作成したカードID
  gamesPlayed: Number,
  totalScore: Number,   // 累計スコア
  creatorScore: Number, // 創造者ボーナス累計
  preferences: {
    theme: String,      // "dark" | "light"
    language: String,   // "ja" | "en"
    notifications: Boolean
  },
  lastActive: Date,
  createdAt: Date,
  expiresAt: Date      // 24時間後に削除
}
```

#### analytics コレクション
```javascript
{
  _id: ObjectId,
  eventType: String,    // "game_start" | "card_played" | "game_end"
  playerId: String,
  roomId: String,
  cardId: String,       // カード関連イベントの場合
  metadata: {
    turn: Number,
    phase: String,
    timestamp: Date,
    duration: Number,   // アクション実行時間
    success: Boolean
  },
  gameSession: {
    sessionId: String,
    playerCount: Number,
    gameMode: String,
    customCardsUsed: [String]
  },
  timestamp: Date,
  processed: Boolean    // BigQuery送信済みフラグ
}
```

## プロトコル設計

### Socket.IO イベント仕様

#### サーバー → クライアント
```javascript
// ゲーム状態同期
gameState: {
  room: Room,
  currentPlayer: Player,
  phase: "action" | "buy" | "cleanup",
  timeRemaining: number
}

// デッキ状態更新
deckState: {
  handSize: number,
  deckSize: number,
  discardSize: number,
  fieldSize: number,
  hand: Card[],        // 自分の手札のみ
  field: Card[]        // 場のカード
}

// サプライ状態
supplyState: Card[]

// ゲーム統計
gameStats: {
  players: {[playerId]: PlayerStats},
  supply: number,
  trash: number
}

// アクション結果
cardPlayed: {
  playerId: string,
  playerName: string,
  card: Card,
  targets: string[]
}

cardBought: {
  playerId: string,
  playerName: string,
  card: Card
}

turnEnded: {
  playerId: string,
  playerName: string,
  newHandSize: number
}
```

#### クライアント → サーバー
```javascript
// ゲーム開始
startGame()

// カードアクション
playCard(cardId: string, targets?: string[])
buyCard(cardId: string)
endTurn()

// デッキ操作
drawCards(count: number)
discardCards(cardIds: string[])

// 情報取得
getGameStats()
```

### REST API 仕様

#### ルーム管理
```
GET /api/rooms
Response: {
  success: boolean,
  data: Room[]
}

POST /api/rooms
Body: {
  name?: string,
  maxPlayers?: number,
  gameSettings?: GameSettings
}
Response: {
  success: boolean,
  data: Room,
  message: string
}
```

#### カード管理
```
GET /api/cards
Query: {
  type?: string,
  createdBy?: string,
  isPublic?: boolean,
  limit?: number,
  offset?: number
}

POST /api/cards
Body: Card
Response: {
  success: boolean,
  data: Card,
  id: string
}

PUT /api/cards/:id
Body: Partial<Card>

DELETE /api/cards/:id
```

## ゲームエンジン設計

### Deck Engine
```javascript
class DeckEngine {
  // ゲーム初期化
  initializeDeck(roomId, supplyCards, playerIds): DeckState
  
  // カード操作
  shuffleDeck(deck): Card[]
  drawCards(roomId, playerId, count): Card[]
  playCard(roomId, playerId, cardId): Card
  buyCard(roomId, playerId, cardId): Card
  discardCards(roomId, playerId, cardIds): Card[]
  
  // フェーズ処理
  cleanupPhase(roomId, playerId): CleanupResult
  
  // 状態取得
  getPlayerDeckState(roomId, playerId): DeckState
  getSupplyState(roomId): Card[]
  getGameStats(roomId): GameStats
  
  // 計算
  countVictoryPoints(roomId, playerId): number
  
  // 管理
  resetDeck(roomId): void
}
```

### Score Engine (Formula 4.4)
```javascript
// ゲームスコア計算
function calcGameScore(player, gameState) {
  const victoryPoints = countVictoryPoints(player)
  const baseMultiplier = getBaseMultiplier(gameState)
  return victoryPoints * baseMultiplier
}

// 創造者スコア計算
function calcCreatorScore(player, gameState) {
  let creatorScore = 0
  
  // 他プレイヤーの使用分
  gameState.players.forEach(otherPlayer => {
    if (otherPlayer.id !== player.id) {
      const usageCount = countCardUsage(otherPlayer, player.createdCards)
      creatorScore += usageCount * 10
    }
  })
  
  // 自分の使用分
  const selfUsage = countCardUsage(player, player.createdCards)
  creatorScore += selfUsage * 5
  
  return creatorScore
}

// 総合スコア
function calcTotalScore(player, gameState) {
  const gameScore = calcGameScore(player, gameState)
  const creatorScore = calcCreatorScore(player, gameState)
  return gameScore + creatorScore
}
```

### End Condition Engine
```javascript
class EndConditionEngine {
  // 終了条件チェック
  checkEndConditions(roomId): EndConditionResult
  
  // 個別条件
  checkEmptyPiles(supplyState): boolean
  checkMaxTurns(gameState): boolean  
  checkTimeLimit(gameState): boolean
  
  // 最終処理
  triggerGameEnd(roomId, reason): GameEndResult
  calculateFinalScores(roomId): FinalScores
}
```

## セキュリティ設計

### 認証・認可
- JWT ベース匿名認証
- セッション24時間有効期限
- API レート制限（Express Rate Limit）

### データ検証
- Joi スキーマ検証
- カード効果値制限（1-10）
- 悪意のあるペイロード検知

### 通信セキュリティ  
- CORS 設定
- Helmet.js セキュリティヘッダー
- Socket.IO CSRF 保護

## パフォーマンス設計

### データベース最適化
```javascript
// インデックス設計
db.cards.createIndex({ "createdBy": 1, "isPublic": 1 })
db.rooms.createIndex({ "status": 1, "lastActivity": 1 })
db.analytics.createIndex({ "timestamp": 1, "processed": 1 })

// TTL インデックス
db.usersAnon.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.rooms.createIndex({ "lastActivity": 1 }, { expireAfterSeconds: 3600 })
```

### メモリ管理
- Deck Engine: ゲーム終了時自動クリーンアップ
- Socket.IO: 接続プール管理
- カードデータ: オンデマンド読み込み

### 負荷対策
- Redis セッションストア（将来）
- 水平スケーリング対応設計
- BigQuery バッチ処理