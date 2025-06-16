# 🔌 Web Card Game API Reference

## 📋 概要

Web Card GameのRESTful APIとWebSocket APIの完全なリファレンスガイドです。

### 🌐 サーバー情報
- **ベースURL**: `http://localhost:3001`
- **WebSocket**: `ws://localhost:3001`
- **プロトコル**: HTTP/1.1, WebSocket

---

## 🔐 認証

現在は匿名認証システムを使用しています。

### ヘッダー
```http
X-Player-Id: player_1234567890_abcdefghi
Content-Type: application/json
```

---

## 📡 REST API エンドポイント

### 🏥 システム

#### ヘルスチェック
```http
GET /health
```

**レスポンス例:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-16T13:06:42.586Z",
  "database": {
    "status": "ok",
    "database": "fallback",
    "connection": true,
    "fallbackStorage": {
      "rooms": 0,
      "cards": 1,
      "users": 0,
      "analytics": 0
    }
  },
  "gameRooms": 0,
  "players": 0
}
```

### 🏠 ルーム管理

#### ルーム一覧取得
```http
GET /api/rooms
```

**レスポンス例:**
```json
[
  {
    "id": "room_1234567890_abcdefghi",
    "name": "ルーム 1234567890", 
    "playerCount": 2,
    "maxPlayers": 4,
    "status": "waiting",
    "createdAt": "2025-06-16T12:00:00.000Z"
  }
]
```

#### ルーム作成
```http
POST /api/rooms
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "name": "My Game Room",
  "maxPlayers": 4,
  "gameSettings": {
    "turnTimeLimit": 300,
    "customCards": true
  }
}
```

**レスポンス例:**
```json
{
  "success": true,
  "message": "Room created successfully",
  "room": {
    "id": "room_1234567890_abcdefghi",
    "name": "My Game Room",
    "maxPlayers": 4,
    "playerCount": 0,
    "status": "waiting",
    "createdAt": "2025-06-16T12:00:00.000Z"
  }
}
```

### 🎴 カード管理

#### カード一覧取得
```http
GET /api/cards
```

**レスポンス例:**
```json
{
  "success": true,
  "cards": [
    {
      "id": "card_1234567890_abcdefghi",
      "name": "魔法のカード",
      "cost": 3,
      "type": "Action",
      "effects": [
        {
          "type": "draw",
          "value": 2,
          "target": "self"
        }
      ],
      "description": "カードを2枚引く",
      "victoryPoints": 0,
      "createdAt": "2025-06-16T12:00:00.000Z",
      "createdBy": "player_123"
    }
  ],
  "count": 1
}
```

#### カード作成
```http
POST /api/cards
Content-Type: application/json
X-Player-Id: player_123
```

**リクエストボディ:**
```json
{
  "name": "新しいカード",
  "cost": 4,
  "type": "Action",
  "effects": [
    {
      "type": "draw",
      "value": 3,
      "target": "self"
    },
    {
      "type": "gain_action", 
      "value": 1,
      "target": "self"
    }
  ],
  "description": "カードを3枚引き、アクションを1回得る",
  "victoryPoints": 0
}
```

**レスポンス例:**
```json
{
  "success": true,
  "message": "Card created successfully",
  "card": {
    "id": "card_1234567890_abcdefghi",
    "name": "新しいカード",
    "cost": 4,
    "type": "Action",
    "effects": [...],
    "description": "カードを3枚引き、アクションを1回得る",
    "createdAt": "2025-06-16T12:00:00.000Z",
    "createdBy": "player_123"
  }
}
```

#### カード更新
```http
PUT /api/cards/{cardId}
Content-Type: application/json
```

#### カード削除
```http
DELETE /api/cards/{cardId}
```

### 🎮 ゲームエンジンAPI

#### プレイヤー統計
```http
GET /api/game-engine/player/{playerId}/stats
```

#### アチーブメント
```http
GET /api/game-engine/player/{playerId}/achievements
```

#### ギルド一覧
```http
GET /api/game-engine/guilds?page=1&limit=20&search=guild_name
```

---

## 🔌 WebSocket API

### 📞 接続管理

#### 接続
```javascript
const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  retries: 3
});
```

#### イベントリスナー
```javascript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### 🏠 ルーム管理

#### ルーム参加
```javascript
socket.emit('joinRoom', roomId);

// レスポンスイベント
socket.on('roomJoined', (room) => {
  console.log('Joined room:', room);
});

socket.on('playerJoined', (player) => {
  console.log('Player joined:', player.name);
});
```

#### ルーム退出
```javascript
socket.emit('leaveRoom', roomId);

// レスポンスイベント
socket.on('roomLeft', () => {
  console.log('Left room');
});
```

### 🎮 CPU対戦

#### ゲーム開始
```javascript
socket.emit('startSinglePlayer', {
  difficulty: 'normal' // 'easy', 'normal', 'hard'
});

// レスポンスイベント
socket.on('gameStateUpdate', (gameState) => {
  console.log('Game state:', gameState);
});

socket.on('playerHand', (hand) => {
  console.log('Player hand:', hand);
});
```

#### カードプレイ
```javascript
socket.emit('playCard', {
  cardId: 'card_123'
});

// レスポンスイベント
socket.on('cardPlayed', (data) => {
  console.log(`${data.playerName} played ${data.card.name}`);
});
```

#### カード購入
```javascript
socket.emit('buyCard', {
  cardId: 'silver'
});

// レスポンスイベント
socket.on('cardBought', (data) => {
  console.log(`${data.playerName} bought ${data.card.name}`);
});
```

#### フェーズ移行
```javascript
socket.emit('moveToPhase', {
  phase: 'buy' // 'action', 'buy', 'cleanup'
});
```

#### ターン終了
```javascript
socket.emit('endTurnSinglePlayer', {});

// レスポンスイベント
socket.on('turnEnded', (data) => {
  console.log('Turn ended:', data);
});

socket.on('cpuThinking', () => {
  console.log('CPU is thinking...');
});
```

### 🎯 マルチプレイヤー対戦

#### ゲーム開始
```javascript
socket.emit('startGame', roomId);

socket.on('gameStarted', (data) => {
  console.log('Game started:', data);
});
```

#### カードプレイ（マルチプレイヤー）
```javascript
socket.emit('playCardMultiplayer', {
  roomId: 'room_123',
  cardId: 'card_456',
  targets: []
});
```

#### カード購入（マルチプレイヤー）
```javascript
socket.emit('buyCardMultiplayer', {
  roomId: 'room_123',
  cardId: 'silver'
});
```

#### ターン終了（マルチプレイヤー）
```javascript
socket.emit('endTurnMultiplayer', roomId);
```

### 🔔 ゲームイベント

#### ゲーム終了
```javascript
socket.on('gameEnded', (results) => {
  console.log('Game ended:', results);
});
```

#### デッキ状態更新
```javascript
socket.on('deckState', (deckState) => {
  console.log('Deck state:', deckState);
});
```

#### サプライ状態更新
```javascript
socket.on('supplyState', (supplyState) => {
  console.log('Supply state:', supplyState);
});
```

### ❌ エラーハンドリング

#### 一般エラー
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

#### ゲームエラー
```javascript
socket.on('gameError', (error) => {
  console.error('Game error:', error.message);
});
```

---

## 📊 データモデル

### 🎴 Card Model
```typescript
interface Card {
  id: string;
  name: string;
  cost: number;
  type: 'Action' | 'Treasure' | 'Victory' | 'Curse' | 'Custom';
  effects: CardEffect[];
  description: string;
  victoryPoints?: number;
  createdAt: Date;
  createdBy: string;
}

interface CardEffect {
  type: 'draw' | 'gain_coin' | 'gain_action' | 'gain_buy' | 'attack' | 'custom';
  value: number;
  target: 'self' | 'opponent' | 'all';
}
```

### 🏠 Room Model
```typescript
interface Room {
  id: string;
  name: string;
  maxPlayers: number;
  playerCount: number;
  status: 'waiting' | 'playing' | 'finished';
  gameSettings: GameSettings;
  createdAt: Date;
}
```

### 🎮 Game State Model
```typescript
interface GameState {
  room: Room | null;
  currentPlayer: string | null;
  phase: 'action' | 'buy' | 'cleanup';
  timeRemaining: number;
  log: GameLogEntry[];
  deckState?: DeckState;
  supplyState?: SupplyState;
  endConditions?: EndConditions;
}
```

---

## 🔧 エラーレスポンス

### API エラー形式
```json
{
  "success": false,
  "error": "Error type",
  "details": "Detailed error message"
}
```

### よくあるエラー

#### バリデーションエラー
```json
{
  "success": false,
  "error": "Validation failed",
  "details": "Card name is required"
}
```

#### リソース不存在エラー
```json
{
  "success": false,
  "error": "Resource not found",
  "details": "Card with id 'card_123' not found"
}
```

#### 重複リソースエラー
```json
{
  "success": false,
  "error": "Duplicate resource",
  "details": "Card with this name already exists"
}
```

---

## 🚀 使用例

### 完全なゲームフロー例

```javascript
// 1. WebSocket接続
const socket = io('http://localhost:3001');

// 2. カード作成
const cardResponse = await fetch('/api/cards', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Player-Id': 'player_123'
  },
  body: JSON.stringify({
    name: 'ドローカード',
    cost: 3,
    type: 'Action',
    effects: [{ type: 'draw', value: 2, target: 'self' }],
    description: 'カードを2枚引く'
  })
});

// 3. CPU対戦開始
socket.emit('startSinglePlayer', { difficulty: 'normal' });

// 4. ゲーム状態監視
socket.on('gameStateUpdate', (gameState) => {
  console.log('Current phase:', gameState.phase);
  console.log('Actions remaining:', gameState.actionsRemaining);
});

// 5. カードプレイ
socket.on('playerHand', (hand) => {
  if (hand.length > 0) {
    socket.emit('playCard', { cardId: hand[0].id });
  }
});

// 6. ターン終了
socket.emit('endTurnSinglePlayer', {});
```

---

## 📚 参考情報

### 定数

#### カードタイプ
- `Action`: アクションカード
- `Treasure`: 財宝カード  
- `Victory`: 勝利点カード
- `Curse`: 呪いカード
- `Custom`: カスタムカード

#### 効果タイプ
- `draw`: カードドロー
- `gain_coin`: コイン獲得
- `gain_action`: アクション追加
- `gain_buy`: 購入権追加
- `attack`: 攻撃効果
- `custom`: カスタム効果

#### ゲームフェーズ
- `action`: アクションフェーズ
- `buy`: 購入フェーズ
- `cleanup`: クリーンアップフェーズ

#### ルーム状態
- `waiting`: 待機中
- `playing`: ゲーム中
- `finished`: 終了済み

### レート制限
現在、レート制限は実装されていませんが、今後追加予定です。

### API バージョニング
現在はv1として運用中。将来的には `/api/v2/` 形式でバージョニング予定。

---

## 🆘 サポート

技術的な問題やバグレポートは、プロジェクトのGitHubリポジトリまでお寄せください。