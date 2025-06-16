import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Import game engines and services
import DeckEngine from './src/engine/deckEngine.js';
import ScoringEngine from './src/engine/scoringEngine.js';
import EndConditionEngine from './src/engine/endConditionEngine.js';
import UsageTrackingEngine from './src/engine/usageTrackingEngine.js';
import { SinglePlayerEngine } from './src/engine/singlePlayerEngine.js';
import DatabaseService from './src/services/DatabaseService.js';
import ErrorHandler from './src/middleware/errorHandler.js';
import { validateCard, generateCardId, generateRoomId } from './src/types/index.js';

// Load environment variables
dotenv.config();

// Initialize services and engines
const deckEngine = new DeckEngine();
const scoringEngine = new ScoringEngine();
const endConditionEngine = new EndConditionEngine();
const usageTrackingEngine = new UsageTrackingEngine();
const databaseService = new DatabaseService();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "https://web-card-game-kappa.vercel.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173",
    "https://web-card-game-kappa.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(express.json());

// Basic health check
app.get('/health', async (req, res) => {
  const dbHealth = await databaseService.healthCheck();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: dbHealth,
    gameRooms: gameRooms.size,
    players: players.size
  });
});

// Game state storage (in-memory for now)
const gameRooms = new Map();
const players = new Map();
const singlePlayerGames = new Map(); // CPU対戦ゲーム用

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Join room
  socket.on('joinRoom', (roomId) => {
    try {
      const validation = ErrorHandler.validateGameInput({ roomId }, ['roomId']);
      if (!validation.isValid) {
        socket.emit('error', { message: validation.errors.join(', ') });
        return;
      }

      socket.join(roomId);
    
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, {
        id: roomId,
        players: [],
        gameState: 'waiting',
        createdAt: new Date()
      });
    }

    const room = gameRooms.get(roomId);
    room.players.push({
      id: socket.id,
      name: `Player ${room.players.length + 1}`,
      joinedAt: new Date()
    });

    players.set(socket.id, { roomId, playerId: socket.id });

    // Notify all players in room
    io.to(roomId).emit('playerJoined', {
      playerId: socket.id,
      players: room.players,
      room: room
    });

      ErrorHandler.logGameEvent('player_joined', { playerId: socket.id, roomId });
    } catch (error) {
      ErrorHandler.handleSocketError(socket, error, 'joinRoom');
    }
  });

  // Leave room
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    
    if (gameRooms.has(roomId)) {
      const room = gameRooms.get(roomId);
      room.players = room.players.filter(p => p.id !== socket.id);
      
      if (room.players.length === 0) {
        gameRooms.delete(roomId);
      } else {
        io.to(roomId).emit('playerLeft', {
          playerId: socket.id,
          players: room.players
        });
      }
    }

    players.delete(socket.id);
    console.log(`Player ${socket.id} left room ${roomId}`);
  });

  // Start game
  socket.on('startGame', (roomId) => {
    if (gameRooms.has(roomId)) {
      const room = gameRooms.get(roomId);
      room.gameState = 'playing';
      room.startedAt = new Date();
      
      // Initialize basic game state
      room.game = {
        currentTurn: 0,
        currentPlayer: 0,
        supply: {},
        players: room.players.map(p => ({
          ...p,
          hand: [],
          deck: [],
          discard: [],
          score: 0
        }))
      };

      io.to(roomId).emit('gameStarted', {
        room: room,
        gameState: room.game
      });

      console.log(`Game started in room ${roomId}`);
    }
  });

  // Play card (Multiplayer)
  socket.on('playCardMultiplayer', (data) => {
    const { roomId, cardId, targets } = data;
    
    if (gameRooms.has(roomId)) {
      const room = gameRooms.get(roomId);
      
      // Basic card play logic (to be enhanced)
      io.to(roomId).emit('cardPlayed', {
        playerId: socket.id,
        cardId: cardId,
        targets: targets,
        timestamp: new Date()
      });

      console.log(`Player ${socket.id} played card ${cardId} in room ${roomId}`);
    }
  });

  // Buy card (Multiplayer)
  socket.on('buyCardMultiplayer', (data) => {
    const { roomId, cardId } = data;
    
    if (gameRooms.has(roomId)) {
      io.to(roomId).emit('cardBought', {
        playerId: socket.id,
        cardId: cardId,
        timestamp: new Date()
      });

      console.log(`Player ${socket.id} bought card ${cardId} in room ${roomId}`);
    }
  });

  // End turn (Multiplayer)
  socket.on('endTurnMultiplayer', (roomId) => {
    if (gameRooms.has(roomId)) {
      const room = gameRooms.get(roomId);
      if (room.game) {
        room.game.currentTurn++;
        room.game.currentPlayer = (room.game.currentPlayer + 1) % room.players.length;
        
        io.to(roomId).emit('turnEnded', {
          currentTurn: room.game.currentTurn,
          currentPlayer: room.game.currentPlayer,
          nextPlayerId: room.players[room.game.currentPlayer].id
        });

        console.log(`Turn ended in room ${roomId}, now turn ${room.game.currentTurn}`);
      }
    }
  });

  // CPU対戦開始
  socket.on('startSinglePlayer', async (data) => {
    try {
      const { difficulty = 'normal' } = data;
      console.log(`🎯 Starting single player game for ${socket.id} with difficulty: ${difficulty}`);
      
      const singlePlayerEngine = new SinglePlayerEngine();
      const gameState = singlePlayerEngine.startGame(socket.id, difficulty);
      
      // ゲームを保存
      singlePlayerGames.set(socket.id, singlePlayerEngine);
      
      // プレイヤーをゲームルームに参加
      socket.join(gameState.gameId);
      
      // 初期ゲーム状態を送信
      socket.emit('gameStateUpdate', singlePlayerEngine.getPublicGameState());
      socket.emit('playerHand', singlePlayerEngine.getPlayerHand(socket.id));
      
      console.log(`✅ Single player game started: ${gameState.gameId}`);
      
    } catch (error) {
      console.error('Error starting single player game:', error);
      socket.emit('gameError', { message: 'ゲーム開始に失敗しました' });
    }
  });

  // カードをプレイ
  socket.on('playCard', async (data) => {
    try {
      const { cardId } = data;
      const game = singlePlayerGames.get(socket.id);
      
      if (!game) {
        socket.emit('gameError', { message: 'ゲームが見つかりません' });
        return;
      }
      
      const playedCard = game.playCard(socket.id, cardId);
      
      // 更新されたゲーム状態を送信
      socket.emit('gameStateUpdate', game.getPublicGameState());
      socket.emit('playerHand', game.getPlayerHand(socket.id));
      socket.emit('cardPlayed', {
        playerName: 'プレイヤー',
        cardName: playedCard.name
      });
      
      console.log(`🃏 Card played: ${playedCard.name} by ${socket.id}`);
      
    } catch (error) {
      console.error('Error playing card:', error);
      socket.emit('gameError', { message: error.message });
    }
  });

  // カードを購入
  socket.on('buyCard', async (data) => {
    try {
      const { cardId } = data;
      const game = singlePlayerGames.get(socket.id);
      
      if (!game) {
        socket.emit('gameError', { message: 'ゲームが見つかりません' });
        return;
      }
      
      const boughtCard = game.buyCard(socket.id, cardId);
      
      // 更新されたゲーム状態を送信
      socket.emit('gameStateUpdate', game.getPublicGameState());
      socket.emit('playerHand', game.getPlayerHand(socket.id));
      socket.emit('cardBought', {
        playerName: 'プレイヤー',
        cardName: boughtCard.name
      });
      
      console.log(`💰 Card bought: ${boughtCard.name} by ${socket.id}`);
      
    } catch (error) {
      console.error('Error buying card:', error);
      socket.emit('gameError', { message: error.message });
    }
  });

  // フェーズ移行
  socket.on('moveToPhase', (data) => {
    try {
      const { phase } = data;
      const game = singlePlayerGames.get(socket.id);
      
      if (!game) {
        socket.emit('gameError', { message: 'ゲームが見つかりません' });
        return;
      }
      
      // フェーズを変更
      game.gameState.phase = phase;
      
      // 購入フェーズに移行する場合、財宝カードを自動プレイ
      if (phase === 'buy') {
        const player = game.gameState.players[socket.id];
        player.coins = game.calculateCoinsFromHand(player.hand);
      }
      
      socket.emit('gameStateUpdate', game.getPublicGameState());
      
    } catch (error) {
      console.error('Error moving to phase:', error);
      socket.emit('gameError', { message: error.message });
    }
  });

  // ターン終了 (CPU対戦)
  socket.on('endTurnSinglePlayer', async (data) => {
    try {
      const game = singlePlayerGames.get(socket.id);
      
      if (!game) {
        socket.emit('gameError', { message: 'ゲームが見つかりません' });
        return;
      }
      
      // プレイヤーのターン終了
      game.endTurn(socket.id);
      
      // ゲーム終了チェック
      if (game.checkGameEnd()) {
        socket.emit('gameEnded', {
          winner: game.gameState.winner,
          endReason: game.gameState.endReason
        });
        singlePlayerGames.delete(socket.id);
        return;
      }
      
      // CPUのターンを実行
      socket.emit('cpuThinking', '🤖 CPUが思考中...');
      
      setTimeout(async () => {
        try {
          const cpuDecisions = await game.executeCPUTurn();
          
          // ゲーム終了チェック（CPUターン後）
          if (game.checkGameEnd()) {
            socket.emit('gameEnded', {
              winner: game.gameState.winner,
              endReason: game.gameState.endReason
            });
            singlePlayerGames.delete(socket.id);
            return;
          }
          
          // 更新されたゲーム状態を送信
          socket.emit('gameStateUpdate', game.getPublicGameState());
          socket.emit('playerHand', game.getPlayerHand(socket.id));
          
        } catch (cpuError) {
          console.error('Error during CPU turn:', cpuError);
          socket.emit('gameError', { message: 'CPUターンでエラーが発生しました' });
        }
      }, 1500); // CPUの思考時間
      
    } catch (error) {
      console.error('Error ending turn:', error);
      socket.emit('gameError', { message: error.message });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // CPU対戦ゲームのクリーンアップ
    if (singlePlayerGames.has(socket.id)) {
      singlePlayerGames.delete(socket.id);
      console.log(`🎯 Cleaned up single player game for ${socket.id}`);
    }
    
    if (players.has(socket.id)) {
      const playerData = players.get(socket.id);
      const roomId = playerData.roomId;
      
      if (gameRooms.has(roomId)) {
        const room = gameRooms.get(roomId);
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.players.length === 0) {
          gameRooms.delete(roomId);
        } else {
          io.to(roomId).emit('playerLeft', {
            playerId: socket.id,
            players: room.players
          });
        }
      }
      
      players.delete(socket.id);
    }
  });
});

// REST API endpoints
app.get('/api/rooms', (req, res) => {
  try {
    const rooms = Array.from(gameRooms.values()).map(room => ({
      id: room.id,
      name: room.name || `ルーム ${room.id.split('_')[1]}`,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers || 4,
      status: room.gameState,
      createdAt: room.createdAt
    }));
    
    res.json(rooms);
  } catch (error) {
    ErrorHandler.handleAPIError(error, req, res);
  }
});

app.post('/api/rooms', (req, res) => {
  try {
    const { name, maxPlayers, gameSettings } = req.body;
    const roomId = generateRoomId();
    
    const room = {
      id: roomId,
      name: name || `ルーム ${Date.now()}`,
      maxPlayers: maxPlayers || 4,
      players: [],
      gameState: 'waiting',
      gameSettings: gameSettings || {},
      createdAt: new Date()
    };
    
    gameRooms.set(roomId, room);
    
    res.json({ success: true, data: room, roomId: roomId });
  } catch (error) {
    ErrorHandler.handleAPIError(error, req, res);
  }
});

// Card API endpoints
app.post('/api/cards', async (req, res) => {
  try {
    const { name, cost, type, effects, description, victoryPoints } = req.body;
    
    // Create card object for validation
    const cardData = {
      name: name ? name.trim() : '',
      cost: parseInt(cost) || 0,
      type,
      effects: effects || [],
      description: description ? description.trim() : '',
      victoryPoints: parseInt(victoryPoints) || undefined
    };
    
    // Validation using shared types
    const validation = validateCard(cardData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      });
    }
    
    // Create card object
    const card = {
      id: generateCardId(),
      name: cardData.name,
      cost: cardData.cost,
      type: cardData.type,
      effects: cardData.effects,
      description: cardData.description,
      createdAt: new Date(),
      createdBy: req.headers['x-player-id'] || 'anonymous',
      version: '1.0'
    };
    
    // Add victoryPoints only if it exists
    if (cardData.victoryPoints !== undefined) {
      card.victoryPoints = cardData.victoryPoints;
    }
    
    // Store card (using database service)
    await databaseService.saveCard(card);
    
    console.log(`✅ New card created: "${card.name}" by ${card.createdBy}`);
    
    res.json({
      success: true,
      card: card,
      message: `カード「${card.name}」が正常に作成されました！`
    });
    
  } catch (error) {
    console.error('Card creation error:', error);
    res.status(500).json({
      success: false,
      error: 'カードの保存中にエラーが発生しました'
    });
  }
});

app.get('/api/cards', async (req, res) => {
  try {
    const cards = await databaseService.getCards();
    res.json({
      success: true,
      cards: cards || [],
      count: cards ? cards.length : 0
    });
  } catch (error) {
    console.error('Card retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'カードの取得中にエラーが発生しました',
      cards: []
    });
  }
});

// カード更新API
app.put('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cost, type, effects, description, victoryPoints } = req.body;
    
    // Create card object for validation
    const cardData = {
      name: name ? name.trim() : '',
      cost: parseInt(cost) || 0,
      type,
      effects: effects || [],
      description: description ? description.trim() : '',
      victoryPoints: parseInt(victoryPoints) || undefined
    };
    
    // Validation using shared types
    const validation = validateCard(cardData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      });
    }
    
    // Update card object
    const updatedCard = {
      id,
      name: cardData.name,
      cost: cardData.cost,
      type: cardData.type,
      effects: cardData.effects,
      description: cardData.description,
      updatedAt: new Date(),
      version: '1.1'
    };
    
    // Add victoryPoints only if it exists
    if (cardData.victoryPoints !== undefined) {
      updatedCard.victoryPoints = cardData.victoryPoints;
    }
    
    // Update card (using database service)
    await databaseService.updateCard(id, updatedCard);
    
    console.log(`✅ Card updated: "${updatedCard.name}" (${id})`);
    
    res.json({
      success: true,
      card: updatedCard,
      message: `カード「${updatedCard.name}」が正常に更新されました！`
    });
    
  } catch (error) {
    console.error('Card update error:', error);
    res.status(500).json({
      success: false,
      error: 'カードの更新中にエラーが発生しました'
    });
  }
});

// カード削除API
app.delete('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get card info before deletion for logging
    const cards = await databaseService.getCards();
    const cardToDelete = cards.find(card => card.id === id);
    
    if (!cardToDelete) {
      return res.status(404).json({
        success: false,
        error: 'カードが見つかりません'
      });
    }
    
    // Delete card (using database service)
    await databaseService.deleteCard(id);
    
    console.log(`🗑️ Card deleted: "${cardToDelete.name}" (${id})`);
    
    res.json({
      success: true,
      message: `カード「${cardToDelete.name}」が正常に削除されました！`
    });
    
  } catch (error) {
    console.error('Card deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'カードの削除中にエラーが発生しました'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    database: databaseService.getStatus(),
    gameRooms: gameRooms.size,
    players: players.size
  });
});

// Error handling middleware
app.use(ErrorHandler.handleAPIError);

// Initialize and start server
async function startServer() {
  // Initialize database connection
  await databaseService.connect();
  
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.IO enabled`);
    console.log(`🎮 Game rooms: ${gameRooms.size}`);
    console.log(`👥 Connected players: ${players.size}`);
    console.log(`💾 Database: ${databaseService.useFallback ? 'Fallback Mode' : 'MongoDB Connected'}`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await databaseService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
startServer().catch(console.error);

export default app;