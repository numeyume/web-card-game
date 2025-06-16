/**
 * Game Engine API Routes - 新エンジン機能のRESTエンドポイント
 * プレイヤー統計、プログレッション、ソーシャル機能のAPI
 */

import express from 'express';
import { GameEngineManager } from '../services/GameEngineManager.js';

const router = express.Router();
const gameEngineManager = new GameEngineManager();

// ===== プレイヤー統計 API =====

/**
 * プレイヤーの総合統計取得
 */
router.get('/player/:playerId/stats', (req, res) => {
  try {
    const { playerId } = req.params;
    const stats = gameEngineManager.getPlayerStats(playerId);
    
    res.json({
      success: true,
      playerId,
      stats,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * プレイヤーのアチーブメント取得
 */
router.get('/player/:playerId/achievements', (req, res) => {
  try {
    const { playerId } = req.params;
    const achievements = gameEngineManager.achievementEngine.getPlayerStats(playerId);
    const recommendations = gameEngineManager.achievementEngine.getRecommendedAchievements(playerId);
    
    res.json({
      success: true,
      achievements,
      recommendations,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * プレイヤーのプログレッション情報取得
 */
router.get('/player/:playerId/progression', (req, res) => {
  try {
    const { playerId } = req.params;
    const progression = gameEngineManager.progressionEngine.getPlayerProgressionStats(playerId);
    const dailyChallenges = gameEngineManager.getDailyChallenges(playerId);
    
    res.json({
      success: true,
      progression,
      dailyChallenges,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * デイリーチャレンジ進捗更新
 */
router.post('/player/:playerId/daily-challenges/:challengeId/progress', (req, res) => {
  try {
    const { playerId, challengeId } = req.params;
    const { progress } = req.body;
    
    // 進捗更新ロジック（簡易実装）
    const progression = gameEngineManager.progressionEngine.playerProgression.get(playerId);
    if (!progression) {
      return res.status(404).json({
        success: false,
        error: 'Player progression not found'
      });
    }

    const challenge = progression.dailyChallenges.find(c => c.id === challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found'
      });
    }

    challenge.progress = Math.min(challenge.target, challenge.progress + progress);
    if (challenge.progress >= challenge.target && !challenge.completed) {
      challenge.completed = true;
      // 報酬付与
      gameEngineManager.progressionEngine.addRewardsToInventory(progression, challenge.reward);
    }

    res.json({
      success: true,
      challenge,
      completed: challenge.completed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ソーシャル機能 API =====

/**
 * ギルド一覧取得
 */
router.get('/guilds', (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const guilds = Array.from(gameEngineManager.socialEngine.guilds.values());
    
    // 検索フィルター
    let filteredGuilds = guilds;
    if (search) {
      filteredGuilds = guilds.filter(guild => 
        guild.name.toLowerCase().includes(search.toLowerCase()) ||
        guild.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // ページネーション
    const startIndex = (page - 1) * limit;
    const paginatedGuilds = filteredGuilds
      .slice(startIndex, startIndex + parseInt(limit))
      .map(guild => ({
        id: guild.id,
        name: guild.name,
        description: guild.description,
        tag: guild.tag,
        level: guild.level,
        memberCount: guild.members.size,
        memberLimit: guild.memberLimit,
        power: guild.power,
        settings: {
          privacy: guild.settings.privacy,
          minLevel: guild.settings.minLevel
        }
      }));

    res.json({
      success: true,
      guilds: paginatedGuilds,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredGuilds.length,
        totalPages: Math.ceil(filteredGuilds.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ギルド作成
 */
router.post('/guilds', (req, res) => {
  try {
    const { founderId, guildData } = req.body;
    
    if (!founderId || !guildData.name) {
      return res.status(400).json({
        success: false,
        error: 'Founder ID and guild name are required'
      });
    }

    const guild = gameEngineManager.socialEngine.createGuild(founderId, guildData);
    
    res.json({
      success: true,
      guild: {
        id: guild.id,
        name: guild.name,
        description: guild.description,
        tag: guild.tag,
        level: guild.level,
        memberCount: guild.members.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ギルド参加
 */
router.post('/guilds/:guildId/join', (req, res) => {
  try {
    const { guildId } = req.params;
    const { playerId, applicationMessage = '' } = req.body;
    
    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const result = gameEngineManager.socialEngine.joinGuild(playerId, guildId, applicationMessage);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * フレンドリクエスト送信
 */
router.post('/friends/request', (req, res) => {
  try {
    const { senderId, targetId, message = '' } = req.body;
    
    if (!senderId || !targetId) {
      return res.status(400).json({
        success: false,
        error: 'Sender and target IDs are required'
      });
    }

    const result = gameEngineManager.socialEngine.sendFriendRequest(senderId, targetId, message);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * フレンドリクエスト対応
 */
router.post('/friends/respond', (req, res) => {
  try {
    const { responderId, senderId, response } = req.body;
    
    if (!responderId || !senderId || !['accept', 'reject'].includes(response)) {
      return res.status(400).json({
        success: false,
        error: 'Valid responder ID, sender ID, and response (accept/reject) are required'
      });
    }

    const result = gameEngineManager.socialEngine.respondToFriendRequest(responderId, senderId, response);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ゲームバリアント API =====

/**
 * 利用可能なゲームバリアント一覧
 */
router.get('/variants', (req, res) => {
  try {
    const variants = gameEngineManager.getAvailableVariants();
    const dailyRecommendation = gameEngineManager.variantEngine.getDailyRecommendedVariant();
    const activeEvents = gameEngineManager.getActiveEvents();
    
    res.json({
      success: true,
      variants,
      dailyRecommendation,
      activeEvents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * カスタムバリアント作成
 */
router.post('/variants/custom', (req, res) => {
  try {
    const { creatorId, variantData } = req.body;
    
    if (!creatorId || !variantData.name) {
      return res.status(400).json({
        success: false,
        error: 'Creator ID and variant name are required'
      });
    }

    const customVariant = gameEngineManager.variantEngine.createCustomVariant(creatorId, variantData);
    
    res.json({
      success: true,
      variant: customVariant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== リーダーボード API =====

/**
 * リーダーボード取得
 */
router.get('/leaderboards', (req, res) => {
  try {
    const { type = 'global', limit = 100 } = req.query;
    const leaderboards = gameEngineManager.getLeaderboards();
    
    res.json({
      success: true,
      leaderboards,
      requestedType: type,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== プログレッション API =====

/**
 * カードパック開封
 */
router.post('/player/:playerId/packs/open', (req, res) => {
  try {
    const { playerId } = req.params;
    const { packType = 'common' } = req.body;
    
    const result = gameEngineManager.progressionEngine.openCardPack(playerId, packType);
    
    if (result === null) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シーズンパス購入
 */
router.post('/player/:playerId/season-pass/purchase', (req, res) => {
  try {
    const { playerId } = req.params;
    const { passType } = req.body;
    
    if (!['premium', 'elite'].includes(passType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pass type'
      });
    }

    const result = gameEngineManager.progressionEngine.purchaseSeasonPass(playerId, passType);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== システム統計 API =====

/**
 * エンジン統計取得
 */
router.get('/stats', (req, res) => {
  try {
    const stats = gameEngineManager.getEngineStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ゲーム開始API（統合）
 */
router.post('/game/start', async (req, res) => {
  try {
    const { gameId, players, settings = {} } = req.body;
    
    if (!gameId || !players || players.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Game ID and at least 2 players are required'
      });
    }

    const result = await gameEngineManager.initializeGame(gameId, players, settings);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * プレイヤーアクション処理API
 */
router.post('/game/:gameId/action', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, action } = req.body;
    
    if (!playerId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Player ID and action are required'
      });
    }

    const result = await gameEngineManager.processPlayerAction(gameId, playerId, action);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;