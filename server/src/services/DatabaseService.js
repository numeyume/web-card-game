/**
 * Database Service - MongoDB統合とフォールバック
 * 接続失敗時はメモリ内ストレージにフォールバック
 */

import { MongoClient } from 'mongodb';

export class DatabaseService {
  constructor(connectionString = null) {
    this.connectionString = connectionString || process.env.MONGODB_URI;
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.useFallback = process.env.DATABASE_FALLBACK === 'true' || process.env.MONGODB_FALLBACK === 'true' || !this.connectionString;
    
    // フォールバック用メモリストレージ
    this.fallbackStorage = {
      rooms: new Map(),
      cards: new Map(),
      usersAnon: new Map(),
      analytics: new Map()
    };
  }

  /**
   * データベース接続
   */
  async connect() {
    if (!this.connectionString) {
      console.warn('MongoDB接続文字列が設定されていません。フォールバックモードで動作します。');
      this.useFallback = true;
      return true;
    }

    try {
      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      
      console.log('✅ MongoDB接続成功');
      
      // インデックス作成
      await this.createIndexes();
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB接続失敗:', error.message);
      console.log('📦 フォールバックモードで動作します');
      this.useFallback = true;
      return false;
    }
  }

  /**
   * データベース切断
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log('MongoDB接続を切断しました');
    }
  }

  /**
   * インデックス作成
   */
  async createIndexes() {
    if (!this.isConnected) return;

    try {
      // rooms collection
      await this.db.collection('rooms').createIndex({ roomId: 1 }, { unique: true });
      await this.db.collection('rooms').createIndex({ status: 1 });
      await this.db.collection('rooms').createIndex({ createdAt: 1 });

      // cards collection
      await this.db.collection('cards').createIndex({ cardId: 1 }, { unique: true });
      await this.db.collection('cards').createIndex({ createdBy: 1 });
      await this.db.collection('cards').createIndex({ usageCount: -1 });

      // usersAnon collection
      await this.db.collection('usersAnon').createIndex({ userId: 1 }, { unique: true });
      await this.db.collection('usersAnon').createIndex({ lastActive: 1 });

      console.log('📝 データベースインデックス作成完了');
    } catch (error) {
      console.error('インデックス作成エラー:', error.message);
    }
  }

  /**
   * ルーム作成
   */
  async createRoom(roomData) {
    if (this.useFallback) {
      this.fallbackStorage.rooms.set(roomData.roomId, {
        ...roomData,
        _id: roomData.roomId,
        createdAt: new Date()
      });
      return { success: true, roomId: roomData.roomId };
    }

    try {
      const result = await this.db.collection('rooms').insertOne({
        ...roomData,
        createdAt: new Date()
      });
      return { success: true, roomId: roomData.roomId, insertedId: result.insertedId };
    } catch (error) {
      console.error('ルーム作成エラー:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * ルーム取得
   */
  async getRoom(roomId) {
    if (this.useFallback) {
      return this.fallbackStorage.rooms.get(roomId) || null;
    }

    try {
      return await this.db.collection('rooms').findOne({ roomId });
    } catch (error) {
      console.error('ルーム取得エラー:', error.message);
      return null;
    }
  }

  /**
   * ルーム更新
   */
  async updateRoom(roomId, updateData) {
    if (this.useFallback) {
      const room = this.fallbackStorage.rooms.get(roomId);
      if (room) {
        this.fallbackStorage.rooms.set(roomId, { ...room, ...updateData, updatedAt: new Date() });
        return { success: true };
      }
      return { success: false, error: 'Room not found' };
    }

    try {
      const result = await this.db.collection('rooms').updateOne(
        { roomId },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      return { success: result.matchedCount > 0 };
    } catch (error) {
      console.error('ルーム更新エラー:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * アクティブルーム一覧取得
   */
  async getActiveRooms() {
    if (this.useFallback) {
      return Array.from(this.fallbackStorage.rooms.values())
        .filter(room => room.status !== 'finished')
        .sort((a, b) => b.createdAt - a.createdAt);
    }

    try {
      return await this.db.collection('rooms')
        .find({ status: { $ne: 'finished' } })
        .sort({ createdAt: -1 })
        .toArray();
    } catch (error) {
      console.error('アクティブルーム取得エラー:', error.message);
      return [];
    }
  }

  /**
   * カード作成
   */
  async createCard(cardData) {
    if (this.useFallback) {
      this.fallbackStorage.cards.set(cardData.cardId, {
        ...cardData,
        _id: cardData.cardId,
        createdAt: new Date()
      });
      return { success: true, cardId: cardData.cardId };
    }

    try {
      const result = await this.db.collection('cards').insertOne({
        ...cardData,
        createdAt: new Date()
      });
      return { success: true, cardId: cardData.cardId, insertedId: result.insertedId };
    } catch (error) {
      console.error('カード作成エラー:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * カード取得
   */
  async getCard(cardId) {
    if (this.useFallback) {
      return this.fallbackStorage.cards.get(cardId) || null;
    }

    try {
      return await this.db.collection('cards').findOne({ cardId });
    } catch (error) {
      console.error('カード取得エラー:', error.message);
      return null;
    }
  }

  /**
   * カード一覧取得
   */
  async getCards(filter = {}) {
    if (this.useFallback) {
      let cards = Array.from(this.fallbackStorage.cards.values());
      
      if (filter.createdBy) {
        cards = cards.filter(card => card.createdBy === filter.createdBy);
      }
      if (filter.type) {
        cards = cards.filter(card => card.type === filter.type);
      }
      
      return cards.sort((a, b) => b.createdAt - a.createdAt);
    }

    try {
      // Convert 'id' filter to 'cardId' for MongoDB compatibility
      const mongoFilter = { ...filter };
      if (mongoFilter.id) {
        mongoFilter.cardId = mongoFilter.id;
        delete mongoFilter.id;
      }
      
      return await this.db.collection('cards')
        .find(mongoFilter)
        .sort({ createdAt: -1 })
        .toArray();
    } catch (error) {
      console.error('カード一覧取得エラー:', error.message);
      return [];
    }
  }

  /**
   * カード保存（新しいメソッド）
   */
  async saveCard(cardData) {
    if (this.useFallback) {
      this.fallbackStorage.cards.set(cardData.id, {
        ...cardData,
        _id: cardData.id,
        createdAt: new Date()
      });
      return { success: true, cardId: cardData.id };
    }

    try {
      const result = await this.db.collection('cards').insertOne({
        ...cardData,
        cardId: cardData.id, // Add cardId field for consistency
        createdAt: new Date()
      });
      return { success: true, cardId: cardData.id, insertedId: result.insertedId };
    } catch (error) {
      console.error('カード保存エラー:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * カード更新
   */
  async updateCard(cardId, updateData) {
    if (this.useFallback) {
      const card = this.fallbackStorage.cards.get(cardId);
      if (card) {
        this.fallbackStorage.cards.set(cardId, { ...card, ...updateData, updatedAt: new Date() });
        return { success: true };
      }
      return { success: false, error: 'Card not found' };
    }

    try {
      const result = await this.db.collection('cards').updateOne(
        { id: cardId },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      return { success: true, modifiedCount: result.modifiedCount };
    } catch (error) {
      console.error('カード更新エラー:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * カード削除
   */
  async deleteCard(cardId) {
    if (this.useFallback) {
      const deleted = this.fallbackStorage.cards.delete(cardId);
      return { success: deleted };
    }

    try {
      const result = await this.db.collection('cards').deleteOne({ id: cardId });
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error('カード削除エラー:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * カード使用統計更新
   */
  async updateCardUsage(cardId, usageData) {
    if (this.useFallback) {
      const card = this.fallbackStorage.cards.get(cardId);
      if (card) {
        card.usageCount = (card.usageCount || 0) + 1;
        card.lastUsed = new Date();
        this.fallbackStorage.cards.set(cardId, card);
      }
      return { success: true };
    }

    try {
      await this.db.collection('cards').updateOne(
        { cardId },
        { 
          $inc: { usageCount: 1 },
          $set: { lastUsed: new Date() }
        }
      );
      return { success: true };
    } catch (error) {
      console.error('カード使用統計更新エラー:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 匿名ユーザー作成
   */
  async createAnonymousUser(userData) {
    if (this.useFallback) {
      this.fallbackStorage.usersAnon.set(userData.userId, {
        ...userData,
        _id: userData.userId,
        createdAt: new Date()
      });
      return { success: true, userId: userData.userId };
    }

    try {
      const result = await this.db.collection('usersAnon').insertOne({
        ...userData,
        createdAt: new Date()
      });
      return { success: true, userId: userData.userId, insertedId: result.insertedId };
    } catch (error) {
      console.error('匿名ユーザー作成エラー:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 匿名ユーザー取得
   */
  async getAnonymousUser(userId) {
    if (this.useFallback) {
      return this.fallbackStorage.usersAnon.get(userId) || null;
    }

    try {
      return await this.db.collection('usersAnon').findOne({ userId });
    } catch (error) {
      console.error('匿名ユーザー取得エラー:', error.message);
      return null;
    }
  }

  /**
   * 分析データ保存
   */
  async saveAnalytics(gameId, analyticsData) {
    if (this.useFallback) {
      this.fallbackStorage.analytics.set(gameId, {
        ...analyticsData,
        _id: gameId,
        savedAt: new Date()
      });
      return { success: true };
    }

    try {
      await this.db.collection('analytics').insertOne({
        gameId,
        ...analyticsData,
        savedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('分析データ保存エラー:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 分析データ取得
   */
  async getAnalytics(filter = {}) {
    if (this.useFallback) {
      return Array.from(this.fallbackStorage.analytics.values())
        .sort((a, b) => b.savedAt - a.savedAt);
    }

    try {
      return await this.db.collection('analytics')
        .find(filter)
        .sort({ savedAt: -1 })
        .toArray();
    } catch (error) {
      console.error('分析データ取得エラー:', error.message);
      return [];
    }
  }

  /**
   * 統計取得
   */
  async getStatistics() {
    if (this.useFallback) {
      return {
        totalRooms: this.fallbackStorage.rooms.size,
        totalCards: this.fallbackStorage.cards.size,
        totalUsers: this.fallbackStorage.usersAnon.size,
        totalGames: this.fallbackStorage.analytics.size,
        usingFallback: true
      };
    }

    try {
      const stats = await Promise.all([
        this.db.collection('rooms').countDocuments(),
        this.db.collection('cards').countDocuments(),
        this.db.collection('usersAnon').countDocuments(),
        this.db.collection('analytics').countDocuments()
      ]);

      return {
        totalRooms: stats[0],
        totalCards: stats[1],
        totalUsers: stats[2],
        totalGames: stats[3],
        usingFallback: false
      };
    } catch (error) {
      console.error('統計取得エラー:', error.message);
      return {
        totalRooms: 0,
        totalCards: 0,
        totalUsers: 0,
        totalGames: 0,
        error: error.message
      };
    }
  }

  /**
   * ヘルスチェック
   */
  async healthCheck() {
    if (this.useFallback) {
      return {
        status: 'ok',
        database: 'fallback',
        connection: true,
        fallbackStorage: {
          rooms: this.fallbackStorage.rooms.size,
          cards: this.fallbackStorage.cards.size,
          users: this.fallbackStorage.usersAnon.size,
          analytics: this.fallbackStorage.analytics.size
        }
      };
    }

    try {
      await this.db.admin().ping();
      return {
        status: 'ok',
        database: 'mongodb',
        connection: this.isConnected
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'mongodb',
        connection: false,
        error: error.message
      };
    }
  }
}

export default DatabaseService;