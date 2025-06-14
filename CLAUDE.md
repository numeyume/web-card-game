# Development Instructions for Claude

## Commands to Remember

### Development
```bash
# Start development servers
npm run dev

# Start client only
npm run dev:client

# Start server only  
npm run dev:server

# Build for production
npm run build

# Run tests
npm run test

# Run linting
npm run lint
```

### Setup (First Time)
```bash
# Install dependencies
npm install

# Setup environment files
cp .env.example .env
cp client/.env.example client/.env

# Start development
npm run dev
```

## Project Structure

```
/client      # React + Vite + TypeScript frontend
  /src
    /components # React components (GameBoard, Lobby, WebSocketProvider)
    /types     # TypeScript type definitions
    /hooks     # Custom React hooks
    /utils     # Utility functions

/server      # Node.js + Express + Socket.IO backend  
  /src
    /routes    # REST API routes (/rooms, /cards)
    /socket    # Socket.IO event handlers
    /services  # Business logic (MatchmakerService)
    /engine    # Game engines (scoring, deck, end conditions)
    /middleware # Auth, error handling
    /types     # TypeScript type definitions

/infrastructure # Terraform / k8s manifests (future)
```

## Current Implementation Status

### ✅ COMPLETE MVP - Phase 4 実装完了 (Full Feature Set)
- Full monorepo setup with workspaces
- React client with Tailwind CSS and responsive design
- Node.js server with Express + Socket.IO + CommonJS compatibility
- Real-time multiplayer game functionality with Socket.IO v4
- Room creation/joining system with matchmaker
- Complete game board UI with hand, field, timer, end condition status
- Scoring system with Formula 4.4 (GameScore + CreatorScore)
- Anonymous authentication system with JWT fallback
- **CardBuilder component** with drag & drop effects and auto-description
- **MongoDB integration** with development fallback mode
- **End Condition Engine** with 3 termination types (time/turn/empty piles)
- **Deck Engine** with Fisher-Yates shuffle, draw, discard mechanics
- **EndGameModal** with animated rankings and comprehensive scoring
- **Real-time end game detection** with WebSocket notifications
- **Complete test suite** for all engines (test-endgame.js)
- **🗳️ Card Usage Tracking Engine** with real-time play/buy recording
- **📊 Player Analytics** with play style analysis (Aggressive/Balanced/Creator/etc.)
- **🎯 Voting System** with like/dislike, toggle votes, and controversy detection
- **📈 ResultModal** with detailed card rankings, usage statistics, and voting UI
- **🌍 Global Statistics** for cross-game card popularity and player insights
- **⚡ Real-time voting sessions** with automatic timeout and result calculation

### 🔮 Future Enhancements (Optional P3+)
- BigQuery analytics for production usage tracking
- Production deployment configs with Docker/k8s
- Advanced card balancing AI recommendations
- Performance optimizations and load testing
- Spectator mode and tournament features

## Architecture Notes

### Game Flow
1. **Lobby** → Create/join rooms via REST API + WebSocket
2. **Game Start** → Matchmaker initializes game state  
3. **Game Loop** → Socket events (playCard, buyCard, endTurn)
4. **Game End** → Score calculation with creator bonuses
5. **Results** → Match results with rankings

### Real-time Communication
- **REST API** for room management, card CRUD
- **WebSocket** for real-time game state synchronization
- **Authentication** via JWT with anonymous fallback

### Scoring Formula (4.4)
- **GameScore** = Victory Points × Base Multiplier
- **CreatorScore** = (Others' card usage × 10) + (Own usage × 5)  
- **TotalScore** = GameScore + CreatorScore

### Advanced Features
- **Card Usage Tracking**: Every card play/buy is recorded with player analytics
- **Voting System**: Post-game voting on cards with like/dislike and controversy detection
- **Player Analysis**: Automatic play style classification (Aggressive/Balanced/Creator/Explorer/Builder)
- **Real-time Statistics**: Live game stats and end condition monitoring
- **Community Features**: Global card popularity and cross-game insights

## Testing

Run tests with coverage:
```bash
npm run test
```

For load testing (when implemented):
```bash
# k6 load test for 100 concurrent players
k6 run --vus 100 --duration 30s loadtest.js
```