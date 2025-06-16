# 🎮 Web Card Game MVP

**Complete Multiplayer Card Game Platform with Advanced Analytics & Community Features**

![Phase 4 Complete](https://img.shields.io/badge/Phase%204-Complete-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-v4-orange)
![MongoDB](https://img.shields.io/badge/MongoDB-Integrated-green)

---

## 🚀 Quick Start

**Windows環境 (C:\Users\tamaz\web-card-game)**

```cmd
cd C:\Users\tamaz\web-card-game

# Install dependencies
npm install

# Start development environment
npm run dev
```

**アクセス:**
- **ゲーム**: http://localhost:5173
- **API**: http://localhost:3001

### テスト実行
```cmd
# 統合テスト（推奨）
node test-server-integration.js
```

### 📖 詳細ガイド
**DEVELOPMENT_GUIDE.md** を参照してください。

---

## 🎯 Features Implemented

### ✅ Core Game Engine
- **Real-time Multiplayer** - Socket.IO v4 powered instant synchronization
- **Dynamic Card Creation** - Drag & drop card builder with auto-description
- **Advanced Scoring** - Formula 4.4 system (GameScore + CreatorScore)
- **End Condition Engine** - 3 termination types (time/turn/supply exhaustion)

### ✅ Community Features
- **🗳️ Voting System** - Post-game card voting with like/dislike
- **📊 Player Analytics** - Play style analysis (Aggressive/Balanced/Creator/etc.)
- **📈 Usage Tracking** - Real-time card play/buy recording
- **🌍 Global Statistics** - Cross-game insights and card popularity

### ✅ Advanced UI
- **Responsive Design** - Tailwind CSS with dark theme
- **Animated Modals** - EndGameModal & ResultModal with Framer Motion
- **Real-time Updates** - Live voting, statistics, and game state sync
- **Progressive Web App** - Optimized for desktop and mobile

---

## 🧪 Testing & Validation

**統合テストスイート:**

```cmd
node test-server-integration.js
```

**期待される結果:**
```
✅ 成功: 7
❌ エラー: 0  
🎉 全テスト成功！
```

---

## 🏗️ Architecture

```
/client              # React + Vite + TypeScript frontend
  /src/components    # UI components (GameBoard, CardBuilder, Modals)
  /src/types        # TypeScript definitions
  
/server             # Node.js + Express + Socket.IO backend
  /src/engine       # Game engines (deck, endCondition, voting, cardUsage)
  /src/db           # MongoDB integration with fallback
  index.cjs         # Main server with Socket.IO handlers

/*.bat files        # Windows validation scripts
/*.js test files    # Comprehensive test suite
```

---

## 🎮 Game Flow

1. **🏠 Lobby** - Create/join rooms, view player list
2. **🏗️ Card Builder** - Create custom cards with effects
3. **🎯 Game Play** - Turn-based multiplayer with real-time sync
4. **🏁 Game End** - Automatic termination with multiple conditions
5. **📊 Results** - Detailed analytics with animated rankings
6. **🗳️ Voting** - Community rating of cards used in game
7. **📈 Analytics** - Player insights and card popularity

---

## 📊 Analytics Features

### Player Analytics
- **Play Style Classification**:
  - `Aggressive` - High play ratio, decisive actions
  - `Balanced` - Even play/buy distribution  
  - `Creator` - Focuses on card creation
  - `Explorer` - High card diversity
  - `Builder` - Economy-focused gameplay

### Card Analytics
- **Usage Tracking** - Every play/buy recorded
- **Popularity Metrics** - Cross-player usage statistics
- **Controversy Detection** - Cards with mixed voting
- **Efficiency Analysis** - Usage-to-player ratios

### Community Voting
- **Real-time Voting** - Like/dislike with toggle support
- **Voting Results** - Top rated, most popular, controversial cards
- **Insight Generation** - Automatic game balance recommendations

---

## 🤝 Development

### Key Technologies
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, Socket.IO v4, MongoDB
- **Real-time**: WebSocket, Server-Sent Events
- **Authentication**: JWT with anonymous fallback

### API Documentation
#### Socket.IO Events
- `joinRoom(roomId)` - Join a game room
- `playCard(cardId, targets)` - Play a card
- `voteCard({cardId, voteType})` - Cast a vote
- `getCardUsageStats()` - Retrieve usage statistics

#### REST API
- `GET /api/cards` - Retrieve card collection
- `POST /api/cards` - Create new custom card
- `GET /api/rooms` - List active rooms

---

## 🏆 Production Ready

This MVP successfully implements:

- ✅ **Complete multiplayer game** with real-time synchronization
- ✅ **Advanced community features** with voting and analytics
- ✅ **Production-ready architecture** with comprehensive testing
- ✅ **Modern web technologies** with excellent performance
- ✅ **Comprehensive validation** with automated test scripts

**Ready for production deployment and competitive gameplay! 🎉**

---

## 📞 Quick Support

1. **統合テスト**: `node test-server-integration.js`
2. **開発ガイド**: `DEVELOPMENT_GUIDE.md`
3. **設定確認**: `type server\.env`

**🎮 Built with ❤️ using modern web technologies - Happy Gaming!**

リアルタイムマルチプレイヤーカードゲームのMVP実装。React + Node.js + Socket.IO + MongoDBを使用した本格的なWebベースのカードゲームプラットフォーム。

## 概要

2-4人同時プレイ対応のリアルタイム・マルチプレイヤーカードゲーム。カスタムカード作成、Formula 4.4によるメタスコアリング、匿名認証を特徴とする。

## Project Structure

```
/client      # React + Vite + TypeScript frontend
/server      # Node.js + Express + Socket.IO backend
/infrastructure # Terraform / k8s manifests
```

## Development

### Prerequisites
- Node.js 20+
- npm or yarn
- MongoDB

### Setup
```bash
npm install
npm run dev
```

This will start both the client (React) and server (Node.js) in development mode.

### Scripts
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both client and server for production
- `npm run test` - Run tests for both client and server
- `npm run lint` - Run linting for both client and server

## 主要機能

### ✅ 完成済み (Phase 1)
- **リアルタイムマルチプレイヤー**: Socket.IOによる2-4人同時プレイ
- **カードビルダー**: ドラッグ&ドロップでカスタムカード作成、バリデーション、JSON出力
- **デッキエンジン**: フィッシャー・イェーツシャッフル、自動再シャッフル、クリーンアップフェーズ
- **スコアリングシステム**: Formula 4.4による創造者ボーナス付き計算
- **匿名認証**: JWT + 匿名ユーザー対応
- **レスポンシブUI**: Tailwind CSSによるモダンデザイン

### 🚧 進行中 (Phase 2)
- **MongoDB統合**: 永続データストレージ
- **ゲーム終了条件**: 3山切れ、タイムアウト検知

### 📋 予定 (Phase 3)
- **結果画面**: ランキング、投票UI
- **分析システム**: BigQuery連携
- **本番デプロイ**: Kubernetes対応

## Architecture

### Client (React + Vite + TypeScript)
- Modern React with hooks and context
- Tailwind CSS for styling
- Socket.IO client for real-time communication
- Vite for fast development and building

### Server (Node.js + Express + Socket.IO)
- RESTful API with Express
- Real-time game state synchronization with Socket.IO
- MongoDB for data persistence
- JWT authentication (optional) + anonymous sessions

### Database (MongoDB)
- `cards` - Standard + user-created cards
- `rooms` - Room state and player data
- `usersAnon` - Anonymous user sessions
- `analytics` - Game analytics and statistics