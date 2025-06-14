// MongoDB 接続とコレクション管理
const { MongoClient, ObjectId } = require('mongodb');

class MongoDBManager {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  /**
   * MongoDB に接続
   * @param {string} connectionString - MongoDB接続文字列
   * @param {string} databaseName - データベース名
   */
  async connect(connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017', databaseName = 'webCardGame') {
    try {
      console.log('📡 Connecting to MongoDB...');
      
      this.client = new MongoClient(connectionString, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db(databaseName);
      this.isConnected = true;

      console.log(`✅ Connected to MongoDB database: ${databaseName}`);
      
      // コレクションとインデックスの初期化
      await this.initializeCollections();
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * コレクションとインデックスを初期化
   */
  async initializeCollections() {
    try {
      console.log('🔧 Initializing collections and indexes...');

      // cards コレクション
      const cardsCollection = this.db.collection('cards');
      await cardsCollection.createIndex({ "id": 1 }, { unique: true });
      await cardsCollection.createIndex({ "createdBy": 1, "isPublic": 1 });
      await cardsCollection.createIndex({ "type": 1 });
      await cardsCollection.createIndex({ "createdAt": -1 });

      // rooms コレクション
      const roomsCollection = this.db.collection('rooms');
      await roomsCollection.createIndex({ "id": 1 }, { unique: true });
      await roomsCollection.createIndex({ "status": 1, "lastActivity": 1 });
      await roomsCollection.createIndex({ "lastActivity": 1 }, { expireAfterSeconds: 3600 }); // 1時間で自動削除

      // usersAnon コレクション
      const usersAnonCollection = this.db.collection('usersAnon');
      await usersAnonCollection.createIndex({ "id": 1 }, { unique: true });
      await usersAnonCollection.createIndex({ "sessionId": 1 });
      await usersAnonCollection.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 }); // TTL

      // analytics コレクション
      const analyticsCollection = this.db.collection('analytics');
      await analyticsCollection.createIndex({ "timestamp": 1, "processed": 1 });
      await analyticsCollection.createIndex({ "eventType": 1, "timestamp": -1 });
      await analyticsCollection.createIndex({ "playerId": 1, "timestamp": -1 });

      console.log('✅ Collections and indexes initialized');
    } catch (error) {
      console.error('❌ Failed to initialize collections:', error.message);
    }
  }

  /**
   * 接続を閉じる
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('📡 Disconnected from MongoDB');
    }
  }

  /**
   * 接続状態をチェック
   */
  isHealthy() {
    return this.isConnected && this.client && this.db;
  }

  // ===================
  // カード操作
  // ===================

  /**
   * カードを保存
   * @param {Object} cardData - カードデータ
   * @returns {Object} 保存されたカード
   */
  async saveCard(cardData) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('cards');
    const now = new Date();

    const card = {
      ...cardData,
      _id: new ObjectId(),
      createdAt: now,
      usageCount: 0,
      rating: 0,
      isPublic: cardData.isPublic || false,
      tags: cardData.tags || []
    };

    const result = await collection.insertOne(card);
    console.log(`💾 Card saved: ${card.name} (${card.id})`);
    
    return { ...card, _id: result.insertedId };
  }

  /**
   * カード一覧を取得
   * @param {Object} filters - フィルター条件
   * @param {Object} options - オプション（limit, skip）
   * @returns {Array} カード一覧
   */
  async getCards(filters = {}, options = {}) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('cards');
    const { limit = 50, skip = 0 } = options;

    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.createdBy) query.createdBy = filters.createdBy;
    if (filters.isPublic !== undefined) query.isPublic = filters.isPublic;

    const cards = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    return cards;
  }

  /**
   * カードを取得（ID指定）
   * @param {string} cardId - カードID
   * @returns {Object|null} カードデータ
   */
  async getCard(cardId) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('cards');
    const card = await collection.findOne({ id: cardId });
    
    return card;
  }

  /**
   * カード使用回数を増やす
   * @param {string} cardId - カードID
   * @returns {boolean} 更新成功可否
   */
  async incrementCardUsage(cardId) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('cards');
    const result = await collection.updateOne(
      { id: cardId },
      { $inc: { usageCount: 1 } }
    );

    return result.modifiedCount > 0;
  }

  // ===================
  // ルーム操作
  // ===================

  /**
   * ルームを保存
   * @param {Object} roomData - ルームデータ
   * @returns {Object} 保存されたルーム
   */
  async saveRoom(roomData) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('rooms');
    const now = new Date();

    const room = {
      ...roomData,
      _id: new ObjectId(),
      createdAt: now,
      lastActivity: now
    };

    const result = await collection.insertOne(room);
    console.log(`🏠 Room saved: ${room.name} (${room.id})`);
    
    return { ...room, _id: result.insertedId };
  }

  /**
   * ルーム状態を更新
   * @param {string} roomId - ルームID
   * @param {Object} updateData - 更新データ
   * @returns {boolean} 更新成功可否
   */
  async updateRoom(roomId, updateData) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('rooms');
    const result = await collection.updateOne(
      { id: roomId },
      { 
        $set: { 
          ...updateData, 
          lastActivity: new Date() 
        } 
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * ルーム一覧を取得
   * @param {string} status - ルーム状態フィルター
   * @returns {Array} ルーム一覧
   */
  async getRooms(status = null) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('rooms');
    const query = status ? { status } : {};

    const rooms = await collection
      .find(query)
      .sort({ lastActivity: -1 })
      .limit(20)
      .toArray();

    return rooms;
  }

  /**
   * ルームを取得（ID指定）
   * @param {string} roomId - ルームID
   * @returns {Object|null} ルームデータ
   */
  async getRoom(roomId) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('rooms');
    const room = await collection.findOne({ id: roomId });
    
    return room;
  }

  /**
   * ルームを削除
   * @param {string} roomId - ルームID
   * @returns {boolean} 削除成功可否
   */
  async deleteRoom(roomId) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('rooms');
    const result = await collection.deleteOne({ id: roomId });

    return result.deletedCount > 0;
  }

  // ===================
  // ユーザー操作
  // ===================

  /**
   * 匿名ユーザーを保存
   * @param {Object} userData - ユーザーデータ
   * @returns {Object} 保存されたユーザー
   */
  async saveUser(userData) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('usersAnon');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24時間後

    const user = {
      ...userData,
      _id: new ObjectId(),
      createdCards: userData.createdCards || [],
      gamesPlayed: userData.gamesPlayed || 0,
      totalScore: userData.totalScore || 0,
      creatorScore: userData.creatorScore || 0,
      preferences: userData.preferences || {
        theme: 'dark',
        language: 'ja',
        notifications: true
      },
      lastActive: now,
      createdAt: now,
      expiresAt: expiresAt
    };

    const result = await collection.insertOne(user);
    console.log(`👤 User saved: ${user.name} (${user.id})`);
    
    return { ...user, _id: result.insertedId };
  }

  /**
   * ユーザー情報を更新
   * @param {string} userId - ユーザーID
   * @param {Object} updateData - 更新データ
   * @returns {boolean} 更新成功可否
   */
  async updateUser(userId, updateData) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('usersAnon');
    const result = await collection.updateOne(
      { id: userId },
      { 
        $set: { 
          ...updateData, 
          lastActive: new Date() 
        } 
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * ユーザーを取得
   * @param {string} userId - ユーザーID
   * @returns {Object|null} ユーザーデータ
   */
  async getUser(userId) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('usersAnon');
    const user = await collection.findOne({ id: userId });
    
    return user;
  }

  // ===================
  // 分析データ操作
  // ===================

  /**
   * 分析イベントを記録
   * @param {Object} eventData - イベントデータ
   * @returns {Object} 保存されたイベント
   */
  async logEvent(eventData) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('analytics');
    const now = new Date();

    const event = {
      ...eventData,
      _id: new ObjectId(),
      timestamp: now,
      processed: false
    };

    const result = await collection.insertOne(event);
    
    return { ...event, _id: result.insertedId };
  }

  /**
   * 未処理の分析イベントを取得
   * @param {number} limit - 取得件数制限
   * @returns {Array} イベント一覧
   */
  async getUnprocessedEvents(limit = 100) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('analytics');
    const events = await collection
      .find({ processed: false })
      .sort({ timestamp: 1 })
      .limit(limit)
      .toArray();

    return events;
  }

  /**
   * イベントを処理済みにマーク
   * @param {Array} eventIds - イベントID一覧
   * @returns {boolean} 更新成功可否
   */
  async markEventsProcessed(eventIds) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('analytics');
    const result = await collection.updateMany(
      { _id: { $in: eventIds } },
      { $set: { processed: true } }
    );

    return result.modifiedCount > 0;
  }

  // ===================
  // 統計・集計
  // ===================

  /**
   * カード使用統計を取得
   * @param {number} days - 集計日数
   * @returns {Array} 統計データ
   */
  async getCardUsageStats(days = 7) {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const collection = this.db.collection('analytics');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await collection.aggregate([
      {
        $match: {
          eventType: 'card_played',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$cardId',
          count: { $sum: 1 },
          uniquePlayers: { $addToSet: '$playerId' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]).toArray();

    return stats;
  }

  /**
   * プレイヤー活動統計を取得
   * @returns {Object} 統計データ
   */
  async getPlayerStats() {
    if (!this.isHealthy()) throw new Error('Database not connected');

    const usersCollection = this.db.collection('usersAnon');
    const analyticsCollection = this.db.collection('analytics');

    const [userCount, activeUsers, gamesCount] = await Promise.all([
      usersCollection.countDocuments(),
      usersCollection.countDocuments({ 
        lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }),
      analyticsCollection.countDocuments({ 
        eventType: 'game_start',
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    return {
      totalUsers: userCount,
      activeUsers: activeUsers,
      gamesThisWeek: gamesCount
    };
  }
}

// シングルトンインスタンス
const mongoManager = new MongoDBManager();

module.exports = mongoManager;