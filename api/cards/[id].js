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
      return true;
    } catch (error) {
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

  async updateCard(cardId, updateData) {
    if (this.useFallback) {
      let card = this.fallbackStorage.cards.get(cardId);
      
      // Check global storage if not found in local storage
      if (!card && typeof global !== 'undefined' && global.cardStorage) {
        card = global.cardStorage.get(cardId);
      }
      
      if (card) {
        const updatedCard = { ...card, ...updateData, updatedAt: new Date() };
        
        // Update both storages
        this.fallbackStorage.cards.set(cardId, updatedCard);
        if (typeof global !== 'undefined' && global.cardStorage) {
          global.cardStorage.set(cardId, updatedCard);
        }
        
        return { success: true, card: updatedCard };
      }
      return { success: false, error: 'カードが見つかりません' };
    }

    try {
      const result = await this.db.collection('cards').updateOne(
        { cardId: cardId },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      return { success: true, modifiedCount: result.modifiedCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteCard(cardId) {
    if (this.useFallback) {
      // カードが存在するか確認
      const cardExists = this.fallbackStorage.cards.has(cardId) || 
                        (typeof global !== 'undefined' && global.cardStorage && global.cardStorage.has(cardId));
      
      if (!cardExists) {
        return { success: false, error: 'カードが見つかりません' };
      }
      
      let deleted = false;
      
      // Delete from local storage
      if (this.fallbackStorage.cards.has(cardId)) {
        this.fallbackStorage.cards.delete(cardId);
        deleted = true;
      }
      
      // Delete from global storage
      if (typeof global !== 'undefined' && global.cardStorage && global.cardStorage.has(cardId)) {
        global.cardStorage.delete(cardId);
        deleted = true;
      }
      
      return { success: deleted };
    }

    try {
      const result = await this.db.collection('cards').deleteOne({ cardId: cardId });
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getCards() {
    if (this.useFallback) {
      let cards = Array.from(this.fallbackStorage.cards.values());
      
      if (typeof global !== 'undefined' && global.cardStorage) {
        const globalCards = Array.from(global.cardStorage.values());
        const cardMap = new Map();
        cards.forEach(card => cardMap.set(card.id, card));
        globalCards.forEach(card => cardMap.set(card.id, card));
        cards = Array.from(cardMap.values());
      }
      
      return cards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    try {
      return await this.db.collection('cards')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
    } catch (error) {
      return [];
    }
  }
}

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
      if (!['draw', 'coin', 'action', 'buy', 'gain_coin', 'gain_action', 'gain_buy', 'gain_card', 'attack', 'custom'].includes(effect.type)) {
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
    const { id } = req.query;
    
    if (req.method === 'PUT') {
      // カード更新
      const { name, cost, type, effects, description, victoryPoints } = req.body;
      
      const cardData = {
        name: name ? name.trim() : '',
        cost: parseInt(cost) || 0,
        type,
        effects: effects || [],
        description: description ? description.trim() : '',
        victoryPoints: parseInt(victoryPoints) || undefined
      };
      
      const validation = validateCard(cardData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.errors.join(', ')
        });
      }
      
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
      
      if (cardData.victoryPoints !== undefined) {
        updatedCard.victoryPoints = cardData.victoryPoints;
      }
      
      const updateResult = await db.updateCard(id, updatedCard);
      
      if (!updateResult.success) {
        return res.status(404).json({
          success: false,
          error: updateResult.error || 'カードの更新に失敗しました'
        });
      }
      
      return res.json({
        success: true,
        card: updateResult.card || updatedCard,
        message: `カード「${updatedCard.name}」が正常に更新されました！`
      });
    }
    
    if (req.method === 'DELETE') {
      // カード削除
      const cards = await db.getCards();
      const cardToDelete = cards.find(card => card.id === id);
      
      // デバッグ情報をログ出力
      console.log('Delete request for ID:', id);
      console.log('Available cards:', cards.map(c => ({ id: c.id, name: c.name })));
      console.log('Card found:', !!cardToDelete);
      
      if (!cardToDelete) {
        return res.status(404).json({
          success: false,
          error: 'カードが見つかりません',
          debug: {
            requestedId: id,
            availableIds: cards.map(c => c.id),
            totalCards: cards.length
          }
        });
      }
      
      const deleteResult = await db.deleteCard(id);
      
      if (!deleteResult.success) {
        return res.status(500).json({
          success: false,
          error: 'カードの削除に失敗しました',
          debug: deleteResult
        });
      }
      
      return res.json({
        success: true,
        message: `カード「${cardToDelete.name}」が正常に削除されました！`
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