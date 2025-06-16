// Netlify Serverless Function for API
import express from 'express';
import serverless from 'serverless-http';

// Import game engines and services
import DatabaseService from '../../server/src/services/DatabaseService.js';
import { validateCard, generateCardId } from '../../server/src/types/index.js';

const app = express();
app.use(express.json());

// Initialize database service in fallback mode for serverless
const databaseService = new DatabaseService();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: 'netlify-serverless'
  });
});

// Get all cards
app.get('/cards', async (req, res) => {
  try {
    const cards = await databaseService.getAllCards();
    res.json({
      success: true,
      cards: cards || [],
      count: cards ? cards.length : 0
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cards'
    });
  }
});

// Create new card
app.post('/cards', async (req, res) => {
  try {
    const { name, cost, type, effects, description, victoryPoints } = req.body;
    
    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Card name is required'
      });
    }
    
    if (typeof cost !== 'number' || cost < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid cost is required'
      });
    }
    
    if (!type || !['Action', 'Treasure', 'Victory', 'Curse', 'Custom'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Valid card type is required'
      });
    }
    
    const cardData = {
      id: generateCardId(),
      name: name.trim(),
      cost: parseInt(cost),
      type,
      effects: effects || [],
      description: description || '',
      victoryPoints: type === 'Victory' ? (victoryPoints || 0) : undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'anonymous'
    };
    
    // Validate card structure
    const validation = validateCard(cardData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Invalid card: ${validation.errors.join(', ')}`
      });
    }
    
    const savedCard = await databaseService.createCard(cardData);
    
    res.json({
      success: true,
      card: savedCard,
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

// Update card
app.put('/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cost, type, effects, description, victoryPoints } = req.body;
    
    const updates = {
      name: name?.trim(),
      cost: parseInt(cost),
      type,
      effects: effects || [],
      description: description || '',
      victoryPoints: type === 'Victory' ? (victoryPoints || 0) : undefined,
      updatedAt: new Date().toISOString()
    };
    
    const updatedCard = await databaseService.updateCard(id, updates);
    
    if (!updatedCard) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }
    
    res.json({
      success: true,
      card: updatedCard,
      message: 'Card updated successfully'
    });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update card'
    });
  }
});

// Delete card
app.delete('/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await databaseService.deleteCard(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Card deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete card'
    });
  }
});

// Export the serverless handler
export const handler = serverless(app);