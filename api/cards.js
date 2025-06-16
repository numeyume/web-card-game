import { MongoClient } from 'mongodb';

// Vercel環境での永続化用グローバルストレージ
if (typeof global !== 'undefined' && !global.cardStorage) {
  global.cardStorage = new Map();
}

class DatabaseService {
  constructor() {
    this.connectionString = process.env.MONGODB_URI;
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.useFallback = !this.connectionString;
    
    // フォールバック用メモリストレージ
    this.fallbackStorage = {
      cards: new Map()
    };
  }

  async connect() {
    if (!this.connectionString) {
      console.warn('MongoDB接続文字列が設定されていません。フォールバックモードで動作します。');
      this.useFallback = true;
      return true;
    }

    try {
      this.client = new MongoClient(this.connectionString, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000
      });
      
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
      ]);
      
      this.db = this.client.db();
      this.isConnected = true;
      
      console.log('✅ MongoDB接続成功');
      return true;
    } catch (error) {
      console.error('❌ MongoDB接続失敗:', error.message);
      console.log('📦 フォールバックモードで動作します');
      this.useFallback = true;
      if (this.client) {
        try {
          await this.client.close();
        } catch (closeError) {
          // Ignore close errors
        }
      }
      return false;
    }
  }

  async saveCard(cardData) {
    if (this.useFallback) {
      const cardKey = cardData.id || cardData.cardId;
      const cardObject = {
        ...cardData,
        id: cardKey,
        cardId: cardKey,
        _id: cardKey,
        createdAt: cardData.createdAt || new Date()
      };
      
      // Store in both local and global storage for Vercel compatibility
      this.fallbackStorage.cards.set(cardKey, cardObject);
      if (typeof global !== 'undefined' && global.cardStorage) {
        global.cardStorage.set(cardKey, cardObject);
      }
      
      return { success: true, cardId: cardKey };
    }

    try {
      const cardKey = cardData.id || cardData.cardId;
      const result = await this.db.collection('cards').insertOne({
        ...cardData,
        id: cardKey,
        cardId: cardKey,
        createdAt: cardData.createdAt || new Date()
      });
      return { success: true, cardId: cardKey, insertedId: result.insertedId };
    } catch (error) {
      console.error('カード保存エラー:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getCards(filter = {}) {
    if (this.useFallback) {
      // Merge local and global storage for Vercel compatibility
      let cards = Array.from(this.fallbackStorage.cards.values());
      
      if (typeof global !== 'undefined' && global.cardStorage) {
        const globalCards = Array.from(global.cardStorage.values());
        // Merge and deduplicate by card ID
        const cardMap = new Map();
        cards.forEach(card => cardMap.set(card.id, card));
        globalCards.forEach(card => cardMap.set(card.id, card));
        cards = Array.from(cardMap.values());
      }
      
      if (filter.createdBy) {
        cards = cards.filter(card => card.createdBy === filter.createdBy);
      }
      if (filter.type) {
        cards = cards.filter(card => card.type === filter.type);
      }
      
      return cards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    try {
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

  async updateCard(cardId, updateData) {
    if (this.useFallback) {
      const card = this.fallbackStorage.cards.get(cardId) || 
                   (typeof global !== 'undefined' && global.cardStorage ? global.cardStorage.get(cardId) : null);
      if (card) {
        const updatedCard = { ...card, ...updateData, updatedAt: new Date() };
        this.fallbackStorage.cards.set(cardId, updatedCard);
        if (typeof global !== 'undefined' && global.cardStorage) {
          global.cardStorage.set(cardId, updatedCard);
        }
        return { success: true };
      }
      return { success: false, error: 'Card not found' };
    }

    try {
      const result = await this.db.collection('cards').updateOne(
        { cardId: cardId },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      return { success: true, modifiedCount: result.modifiedCount };
    } catch (error) {
      console.error('カード更新エラー:', error.message);
      return { success: false, error: error.message };
    }
  }

  async deleteCard(cardId) {
    if (this.useFallback) {
      const localDeleted = this.fallbackStorage.cards.delete(cardId);
      let globalDeleted = false;
      if (typeof global !== 'undefined' && global.cardStorage) {
        globalDeleted = global.cardStorage.delete(cardId);
      }
      return { success: localDeleted || globalDeleted };
    }

    try {
      const result = await this.db.collection('cards').deleteOne({ cardId: cardId });
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error('カード削除エラー:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// バリデーション関数
function validateCard(cardData) {
  const errors = [];
  
  if (!cardData.name || cardData.name.trim().length === 0) {
    errors.push('カード名は必須です');
  }
  
  if (!cardData.description || cardData.description.trim().length === 0) {
    errors.push('説明文は必須です');
  }
  
  if (!['Action', 'Treasure', 'Victory', 'Curse', 'Custom'].includes(cardData.type)) {
    errors.push('無効なカードタイプです');
  }
  
  if (cardData.effects && Array.isArray(cardData.effects)) {
    cardData.effects.forEach((effect, index) => {
      if (!['draw', 'action', 'buy', 'coin'].includes(effect.type)) {
        errors.push(`効果${index + 1}: 無効な効果タイプです`);
      }
      if (typeof effect.value !== 'number' || effect.value < 0) {
        errors.push(`効果${index + 1}: 効果値は0以上の数値である必要があります`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function generateCardId() {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// グローバルデータベースサービスインスタンス
let databaseService = null;

async function initializeDatabase() {
  if (!databaseService) {
    databaseService = new DatabaseService();
    await databaseService.connect();
  }
  return databaseService;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await initializeDatabase();
    
    if (req.method === 'GET') {
      // カード一覧取得
      const cards = await db.getCards();
      return res.json({
        success: true,
        cards: cards || [],
        count: cards ? cards.length : 0
      });
    }
    
    if (req.method === 'POST') {
      // カード作成
      const { name, cost, type, effects, description, victoryPoints } = req.body;
      
      const cardData = {
        name: name ? name.trim() : '',
        cost: parseInt(cost) || 0,
        type,
        effects: effects || [],
        description: description ? description.trim() : '',
        victoryPoints: parseInt(victoryPoints) || undefined
      };
      
      // バリデーション
      const validation = validateCard(cardData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.errors.join(', ')
        });
      }
      
      // カード作成
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
      
      if (cardData.victoryPoints !== undefined) {
        card.victoryPoints = cardData.victoryPoints;
      }
      
      // 保存
      await db.saveCard(card);
      
      return res.json({
        success: true,
        card: card,
        message: `カード「${card.name}」が正常に作成されました！`
      });
    }
    
    if (req.method === 'PUT') {
      // カード更新 (実装が必要な場合)
      return res.status(501).json({
        success: false,
        error: 'Update not implemented in this endpoint'
      });
    }
    
    if (req.method === 'DELETE') {
      // カード削除 (実装が必要な場合)
      return res.status(501).json({
        success: false,
        error: 'Delete not implemented in this endpoint'
      });
    }
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}