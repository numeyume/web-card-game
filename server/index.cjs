const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const deckEngine = require('./src/engine/deck.cjs');
const endConditionEngine = require('./src/engine/endCondition.cjs');
const cardUsageEngine = require('./src/engine/cardUsage.cjs');
const votingEngine = require('./src/engine/voting.cjs');
const mongoManager = require('./src/db/mongodb.cjs');

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const PRODUCTION_CLIENT_URL = process.env.PRODUCTION_CLIENT_URL || CLIENT_URL;

// Determine allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [PRODUCTION_CLIENT_URL, CLIENT_URL]
  : [CLIENT_URL, 'http://localhost:5173'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoManager.isHealthy() ? 'connected' : 'fallback',
    activeConnections: io.engine.clientsCount || 0
  });
});

// Simple auth middleware
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      // Invalid token, create anonymous user
    }
  }

  // Create anonymous user
  const anonymousId = uuidv4();
  const anonymousUser = {
    id: anonymousId,
    name: `Anonymous_${anonymousId.slice(0, 8)}`,
    isAnonymous: true
  };

  req.user = anonymousUser;
  const anonymousToken = jwt.sign(anonymousUser, JWT_SECRET, { expiresIn: '24h' });
  res.setHeader('X-Anonymous-Token', anonymousToken);
  next();
});

// Mock data
const rooms = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.get('/api/rooms', (req, res) => {
  const roomsList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    playerCount: room.players.length,
    maxPlayers: room.maxPlayers,
    status: room.status,
    createdAt: room.createdAt
  }));

  res.json({
    success: true,
    data: roomsList
  });
});

app.post('/api/rooms', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const { name, maxPlayers = 4 } = req.body;
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newRoom = {
      id: roomId,
      name: name || `${req.user.name}'s Room`,
      players: [],
      maxPlayers: Math.min(Math.max(maxPlayers, 2), 4),
      status: 'waiting',
      createdAt: new Date(),
      supply: {}
    };

    // MongoDB に保存を試行
    if (mongoManager.isHealthy()) {
      await mongoManager.saveRoom(newRoom);
    }

    // メモリにも保存（fallback）
    rooms.set(roomId, newRoom);

    res.status(201).json({
      success: true,
      data: newRoom,
      message: 'Room created successfully'
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create room'
    });
  }
});

// カード管理API
app.get('/api/cards', async (req, res) => {
  try {
    const { type, createdBy, isPublic, limit = 50, offset = 0 } = req.query;
    
    if (mongoManager.isHealthy()) {
      const filters = {};
      if (type) filters.type = type;
      if (createdBy) filters.createdBy = createdBy;
      if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
      
      const cards = await mongoManager.getCards(filters, { 
        limit: parseInt(limit), 
        skip: parseInt(offset) 
      });
      
      res.json({
        success: true,
        data: cards,
        count: cards.length
      });
    } else {
      // MongoDB未接続時はデフォルトカードを返す
      const defaultCards = [
        {
          id: 'copper',
          name: 'Copper',
          cost: 0,
          type: 'Treasure',
          effects: [{ type: 'gain_coin', value: 1, target: 'self' }],
          description: 'Basic treasure. Provides 1 coin.',
          createdBy: 'system'
        },
        {
          id: 'estate',
          name: 'Estate',
          cost: 2,
          type: 'Victory',
          effects: [],
          description: 'Basic victory card. Worth 1 victory point.',
          createdBy: 'system'
        }
      ];
      
      res.json({
        success: true,
        data: defaultCards,
        count: defaultCards.length
      });
    }
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cards'
    });
  }
});

app.post('/api/cards', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const cardData = {
      ...req.body,
      id: req.body.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdBy: req.user.id
    };

    // 基本バリデーション
    if (!cardData.name || !cardData.description) {
      return res.status(400).json({
        success: false,
        error: 'Name and description are required'
      });
    }

    if (cardData.cost < 0 || cardData.cost > 10) {
      return res.status(400).json({
        success: false,
        error: 'Cost must be between 0 and 10'
      });
    }

    let savedCard = cardData;

    // MongoDB に保存を試行
    if (mongoManager.isHealthy()) {
      savedCard = await mongoManager.saveCard(cardData);
      
      // ユーザーの作成カードリストを更新
      await mongoManager.updateUser(req.user.id, {
        $push: { createdCards: cardData.id }
      });
    }

    res.status(201).json({
      success: true,
      data: savedCard,
      message: 'Card created successfully'
    });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create card'
    });
  }
});

app.get('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (mongoManager.isHealthy()) {
      const card = await mongoManager.getCard(id);
      
      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }
      
      res.json({
        success: true,
        data: card
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'Database unavailable'
      });
    }
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch card'
    });
  }
});

// Socket.IO handlers
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.data = {
        userId: decoded.id,
        userName: decoded.name
      };
      return next();
    } catch (error) {
      // Allow anonymous connections
    }
  }

  // Allow anonymous connections
  const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  socket.data = {
    userId: anonymousId,
    userName: `Anonymous_${anonymousId.slice(5, 13)}`
  };
  
  next();
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.data.userName} (${socket.data.userId})`);

  // Ping/Pong for connection health
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Join room handler
  socket.on('joinRoom', (roomId) => {
    try {
      console.log(`${socket.data.userName} attempting to join room ${roomId}`);
      
      // Leave current room if any
      if (socket.data.roomId) {
        socket.leave(socket.data.roomId);
        socket.to(socket.data.roomId).emit('playerLeft', {
          id: socket.data.userId,
          name: socket.data.userName
        });
      }
      
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      
      // Add player to room
      const existingPlayer = room.players.find(p => p.id === socket.data.userId);
      if (!existingPlayer && room.players.length < room.maxPlayers) {
        const player = {
          id: socket.data.userId,
          name: socket.data.userName,
          isConnected: true,
          hand: [],
          deck: [],
          discard: [],
          actions: 1,
          buys: 1,
          coins: 0,
          score: 0
        };
        room.players.push(player);
      }
      
      socket.join(roomId);
      socket.data.roomId = roomId;
      
      // Notify player they joined
      socket.emit('roomJoined', room);
      
      // Notify other players
      socket.to(roomId).emit('playerJoined', {
        id: socket.data.userId,
        name: socket.data.userName,
        isConnected: true
      });
      
      // Send game state
      const gameState = {
        room,
        currentPlayer: room.players[0] || null,
        phase: 'action',
        timeRemaining: 120,
        log: [],
        supply: room.supply
      };
      
      io.to(roomId).emit('gameState', gameState);
      
      console.log(`${socket.data.userName} successfully joined room ${roomId}`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave room handler
  socket.on('leaveRoom', () => {
    if (!socket.data.roomId) return;
    
    const room = rooms.get(socket.data.roomId);
    if (room) {
      // Remove player from room
      const playerIndex = room.players.findIndex(p => p.id === socket.data.userId);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
      }
      
      // If room is empty, delete it
      if (room.players.length === 0) {
        rooms.delete(socket.data.roomId);
      }
    }
    
    socket.to(socket.data.roomId).emit('playerLeft', {
      id: socket.data.userId,
      name: socket.data.userName
    });
    
    socket.leave(socket.data.roomId);
    socket.data.roomId = undefined;
    socket.emit('roomLeft');
  });

  // Create room handler
  socket.on('createRoom', (settings) => {
    try {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newRoom = {
        id: roomId,
        name: `${socket.data.userName}'s Room`,
        players: [],
        maxPlayers: 4,
        status: 'waiting',
        createdAt: new Date(),
        supply: {}
      };
      
      rooms.set(roomId, newRoom);
      
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.emit('roomJoined', newRoom);
      
      console.log(`${socket.data.userName} created room ${roomId}`);
      
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // Game action handlers with Deck Engine integration
  socket.on('playCard', (cardId, targets) => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      const playedCard = deckEngine.playCard(socket.data.roomId, socket.data.userId, cardId);
      if (!playedCard) {
        socket.emit('error', { message: 'Card not found in hand' });
        return;
      }

      // Record card usage
      cardUsageEngine.recordCardPlay(socket.data.roomId, socket.data.userId, cardId, playedCard);

      // Broadcast card play to all players in room
      io.to(socket.data.roomId).emit('cardPlayed', {
        playerId: socket.data.userId,
        playerName: socket.data.userName,
        card: playedCard,
        targets: targets || []
      });

      // Send updated deck state to player
      const deckState = deckEngine.getPlayerDeckState(socket.data.roomId, socket.data.userId);
      socket.emit('deckState', deckState);

      console.log(`✅ ${socket.data.userName} played ${playedCard.name}`);
    } catch (error) {
      console.error('Error playing card:', error);
      socket.emit('error', { message: 'Failed to play card' });
    }
  });

  socket.on('buyCard', (cardId) => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      const boughtCard = deckEngine.buyCard(socket.data.roomId, socket.data.userId, cardId);
      if (!boughtCard) {
        socket.emit('error', { message: 'Card not available or insufficient funds' });
        return;
      }

      // Record card usage
      cardUsageEngine.recordCardBuy(socket.data.roomId, socket.data.userId, cardId, boughtCard);

      // Broadcast card purchase to all players in room
      io.to(socket.data.roomId).emit('cardBought', {
        playerId: socket.data.userId,
        playerName: socket.data.userName,
        card: boughtCard
      });

      // Send updated supply state to all players
      const supplyState = deckEngine.getSupplyState(socket.data.roomId);
      io.to(socket.data.roomId).emit('supplyState', supplyState);

      // Send updated deck state to player
      const deckState = deckEngine.getPlayerDeckState(socket.data.roomId, socket.data.userId);
      socket.emit('deckState', deckState);

      console.log(`✅ ${socket.data.userName} bought ${boughtCard.name}`);
    } catch (error) {
      console.error('Error buying card:', error);
      socket.emit('error', { message: 'Failed to buy card' });
    }
  });

  socket.on('endTurn', () => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      // Cleanup phase - discard hand and field, draw new hand
      const cleanupResult = deckEngine.cleanupPhase(socket.data.roomId, socket.data.userId);
      
      // Advance turn in end condition engine
      const turnInfo = endConditionEngine.advanceTurn(socket.data.roomId);
      
      // Check end conditions after turn
      const endCheck = endConditionEngine.checkEndConditions(socket.data.roomId);
      
      if (endCheck.isGameEnd) {
        // Game ended - trigger final calculations
        const gameEndResult = endConditionEngine.triggerGameEnd(
          socket.data.roomId, 
          endCheck.reason, 
          endCheck
        );
        
        // Generate card usage statistics
        const cardUsageStats = cardUsageEngine.generateFinalStats(socket.data.roomId);
        if (cardUsageStats && cardUsageStats.topCards) {
          // Add card usage data to game end result
          gameEndResult.finalScores.gameStats.topCards = cardUsageStats.topCards;
        }
        
        // Start voting session for cards (5 minutes)
        const votingSession = votingEngine.startVotingSession(socket.data.roomId, gameEndResult, 5 * 60 * 1000);
        
        // Notify all players of game end
        io.to(socket.data.roomId).emit('gameEnded', gameEndResult);
        
        // Notify players that voting is available
        io.to(socket.data.roomId).emit('votingSessionStarted', {
          timeLimit: 5 * 60 * 1000,
          availableCards: cardUsageStats?.topCards || []
        });
        
        // Update room status
        const room = rooms.get(socket.data.roomId);
        if (room) {
          room.status = 'finished';
        }
        
        console.log(`🏁 Game ended in room ${socket.data.roomId}: ${endCheck.reason}`);
        console.log(`🗳️ Voting session started for ${cardUsageStats?.topCards?.length || 0} cards`);
      } else {
        // Game continues - broadcast turn end
        io.to(socket.data.roomId).emit('turnEnded', {
          playerId: socket.data.userId,
          playerName: socket.data.userName,
          newHandSize: cleanupResult.handSize,
          turnInfo: turnInfo,
          endConditionStatus: endCheck.status
        });

        // Send updated deck state to player
        const deckState = deckEngine.getPlayerDeckState(socket.data.roomId, socket.data.userId);
        socket.emit('deckState', deckState);

        console.log(`✅ ${socket.data.userName} ended turn ${turnInfo?.turn}, drew ${cleanupResult.newHand.length} cards`);
      }
    } catch (error) {
      console.error('Error ending turn:', error);
      socket.emit('error', { message: 'Failed to end turn' });
    }
  });

  socket.on('startGame', () => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      const room = rooms.get(socket.data.roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }

      // Initialize deck for all players
      const playerIds = room.players.map(p => p.id);
      const supplyCards = []; // Can add custom cards from CardBuilder here later
      
      const deckState = deckEngine.initializeDeck(socket.data.roomId, supplyCards, playerIds);
      
      // Initialize card usage tracking
      cardUsageEngine.initializeRoom(socket.data.roomId, playerIds, supplyCards);
      
      // Initialize end condition engine
      const gameSettings = {
        maxTurns: 50,
        timeLimit: 60 * 60, // 60 minutes
        emptyPilesThreshold: 3,
        enableTimeLimit: true,
        enableTurnLimit: true,
        enableEmptyPiles: true
      };
      
      endConditionEngine.initializeGame(socket.data.roomId, playerIds, gameSettings);
      
      // Update room status
      room.status = 'playing';

      // Send game start event to all players
      io.to(socket.data.roomId).emit('gameStarted', {
        deckState: deckEngine.getGameStats(socket.data.roomId),
        supply: deckEngine.getSupplyState(socket.data.roomId),
        currentPlayer: room.players[0].id,
        gameSettings: gameSettings
      });

      // Send individual deck states to each player
      room.players.forEach(player => {
        const playerSocket = [...io.sockets.sockets.values()]
          .find(s => s.data.userId === player.id);
        
        if (playerSocket) {
          const playerDeckState = deckEngine.getPlayerDeckState(socket.data.roomId, player.id);
          playerSocket.emit('deckState', playerDeckState);
        }
      });

      console.log(`✅ Game started in room ${socket.data.roomId} with ${playerIds.length} players`);
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Additional deck actions
  socket.on('drawCards', (count = 1) => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      const drawnCards = deckEngine.drawCards(socket.data.roomId, socket.data.userId, count);
      
      // Send updated deck state to player
      const deckState = deckEngine.getPlayerDeckState(socket.data.roomId, socket.data.userId);
      socket.emit('deckState', deckState);
      socket.emit('cardsDrawn', { count: drawnCards.length });

      console.log(`✅ ${socket.data.userName} drew ${drawnCards.length} cards`);
    } catch (error) {
      console.error('Error drawing cards:', error);
      socket.emit('error', { message: 'Failed to draw cards' });
    }
  });

  socket.on('discardCards', (cardIds) => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      const discardedCards = deckEngine.discardCards(socket.data.roomId, socket.data.userId, cardIds);
      
      // Send updated deck state to player
      const deckState = deckEngine.getPlayerDeckState(socket.data.roomId, socket.data.userId);
      socket.emit('deckState', deckState);
      socket.emit('cardsDiscarded', { count: discardedCards.length });

      console.log(`✅ ${socket.data.userName} discarded ${discardedCards.length} cards`);
    } catch (error) {
      console.error('Error discarding cards:', error);
      socket.emit('error', { message: 'Failed to discard cards' });
    }
  });

  socket.on('getGameStats', () => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      const gameStats = deckEngine.getGameStats(socket.data.roomId);
      const endConditionStatus = endConditionEngine.checkEndConditions(socket.data.roomId);
      
      socket.emit('gameStats', {
        ...gameStats,
        endConditions: endConditionStatus
      });
    } catch (error) {
      console.error('Error getting game stats:', error);
      socket.emit('error', { message: 'Failed to get game stats' });
    }
  });

  // End condition related events
  socket.on('checkEndConditions', () => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      const endCheck = endConditionEngine.checkEndConditions(socket.data.roomId);
      socket.emit('endConditionsStatus', endCheck);
    } catch (error) {
      console.error('Error checking end conditions:', error);
      socket.emit('error', { message: 'Failed to check end conditions' });
    }
  });

  socket.on('forceGameEnd', (reason = 'manual') => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      // Manual game end (admin/host only functionality)
      const gameEndResult = endConditionEngine.triggerGameEnd(socket.data.roomId, reason);
      
      // Generate card usage statistics
      const cardUsageStats = cardUsageEngine.generateFinalStats(socket.data.roomId);
      if (cardUsageStats && cardUsageStats.topCards) {
        gameEndResult.finalScores.gameStats.topCards = cardUsageStats.topCards;
      }
      
      // Start voting session
      const votingSession = votingEngine.startVotingSession(socket.data.roomId, gameEndResult, 5 * 60 * 1000);
      
      // Notify all players
      io.to(socket.data.roomId).emit('gameEnded', gameEndResult);
      io.to(socket.data.roomId).emit('votingSessionStarted', {
        timeLimit: 5 * 60 * 1000,
        availableCards: cardUsageStats?.topCards || []
      });
      
      // Update room status
      const room = rooms.get(socket.data.roomId);
      if (room) {
        room.status = 'finished';
      }
      
      console.log(`🏁 Game manually ended in room ${socket.data.roomId} by ${socket.data.userName}`);
    } catch (error) {
      console.error('Error forcing game end:', error);
      socket.emit('error', { message: 'Failed to end game' });
    }
  });

  // Voting system events
  socket.on('voteCard', ({ cardId, voteType }) => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      const result = votingEngine.castVote(socket.data.roomId, socket.data.userId, cardId, voteType);
      
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      // Send vote confirmation to user
      socket.emit('voteRegistered', result.cardVotes);
      
      // Broadcast voting update to all players in room
      const votingStatus = votingEngine.getVotingStatus(socket.data.roomId);
      io.to(socket.data.roomId).emit('votingUpdate', votingStatus);

      console.log(`🗳️ ${socket.data.userName} voted ${voteType} for ${cardId}`);
    } catch (error) {
      console.error('Error casting vote:', error);
      socket.emit('error', { message: 'Failed to cast vote' });
    }
  });

  socket.on('getVotingStatus', () => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      const votingStatus = votingEngine.getVotingStatus(socket.data.roomId);
      const playerVotes = votingEngine.getPlayerVotes(socket.data.roomId, socket.data.userId);
      
      socket.emit('votingStatus', {
        ...votingStatus,
        playerVotes
      });
    } catch (error) {
      console.error('Error getting voting status:', error);
      socket.emit('error', { message: 'Failed to get voting status' });
    }
  });

  socket.on('endVotingSession', () => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      const results = votingEngine.endVotingSession(socket.data.roomId);
      if (results) {
        io.to(socket.data.roomId).emit('votingSessionEnded', results);
        console.log(`🏁 Voting session ended in room ${socket.data.roomId}`);
      }
    } catch (error) {
      console.error('Error ending voting session:', error);
      socket.emit('error', { message: 'Failed to end voting session' });
    }
  });

  socket.on('getCardUsageStats', () => {
    try {
      if (!socket.data.roomId) {
        socket.emit('error', { message: 'Not in a game room' });
        return;
      }

      const stats = cardUsageEngine.getRoomStats(socket.data.roomId);
      socket.emit('cardUsageStats', stats);
    } catch (error) {
      console.error('Error getting card usage stats:', error);
      socket.emit('error', { message: 'Failed to get card usage stats' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.data.userName} (${reason})`);
    
    if (socket.data.roomId) {
      socket.to(socket.data.roomId).emit('playerLeft', {
        id: socket.data.userId,
        name: socket.data.userName
      });
      
      // Clean up game state if room becomes empty
      const room = rooms.get(socket.data.roomId);
      if (room && room.players.length <= 1) {
        deckEngine.resetDeck(socket.data.roomId);
        endConditionEngine.resetGame(socket.data.roomId);
        cardUsageEngine.clearRoom(socket.data.roomId);
        votingEngine.clearRoomVotes(socket.data.roomId);
        console.log(`🧹 Cleaned up game state for empty room ${socket.data.roomId}`);
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server with MongoDB connection
async function startServer() {
  try {
    // MongoDB接続を試行（ローカル開発環境では失敗してもOK）
    const mongoConnected = await mongoManager.connect();
    if (mongoConnected) {
      console.log('✅ MongoDB integration enabled');
    } else {
      console.log('⚠️ MongoDB not available, running in memory mode');
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: development`);
      console.log(`📡 Socket.IO ready for connections`);
      console.log(`🔗 Client URL: http://localhost:5173`);
      if (mongoConnected) {
        console.log(`🍃 MongoDB: Connected`);
      } else {
        console.log(`🍃 MongoDB: Offline (development mode)`);
      }
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // MongoDB接続を閉じる
  await mongoManager.disconnect();
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});