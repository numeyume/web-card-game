/**
 * Shared Type Definitions and Constants
 * 共通の型定義と定数
 */

export const CARD_TYPES = ['Action', 'Treasure', 'Victory', 'Curse', 'Custom'];

export const EFFECT_TYPES = ['draw', 'gain_coin', 'gain_action', 'gain_buy', 'gain_card', 'attack', 'custom'];

export const EFFECT_TARGETS = ['self', 'opponent', 'all'];

export const GAME_PHASES = ['action', 'buy', 'cleanup'];

export const ROOM_STATUS = ['waiting', 'playing', 'finished'];

/**
 * カードバリデーション
 */
export function validateCard(cardData) {
  const errors = [];

  if (!cardData.name || typeof cardData.name !== 'string' || cardData.name.trim().length === 0) {
    errors.push('カード名は必須です');
  }

  if (!cardData.description || typeof cardData.description !== 'string' || cardData.description.trim().length === 0) {
    errors.push('説明文は必須です');
  }

  if (typeof cardData.cost !== 'number' || cardData.cost < 0 || cardData.cost > 10) {
    errors.push('コストは0から10の間で設定してください');
  }

  if (!CARD_TYPES.includes(cardData.type)) {
    errors.push('無効なカードタイプです');
  }

  if (cardData.effects && Array.isArray(cardData.effects)) {
    cardData.effects.forEach((effect, index) => {
      if (!EFFECT_TYPES.includes(effect.type)) {
        errors.push(`効果${index + 1}: 無効な効果タイプです`);
      }
      if (typeof effect.value !== 'number' || effect.value < 0) {
        errors.push(`効果${index + 1}: 効果の値は0以上の数値である必要があります`);
      }
      if (effect.target && !EFFECT_TARGETS.includes(effect.target)) {
        errors.push(`効果${index + 1}: 無効なターゲットタイプです`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * ルームバリデーション
 */
export function validateRoom(roomData) {
  const errors = [];

  if (!roomData.name || typeof roomData.name !== 'string' || roomData.name.trim().length === 0) {
    errors.push('ルーム名は必須です');
  }

  if (typeof roomData.maxPlayers !== 'number' || roomData.maxPlayers < 2 || roomData.maxPlayers > 8) {
    errors.push('最大プレイヤー数は2から8の間で設定してください');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * ゲーム状態バリデーション
 */
export function validateGamePhase(phase) {
  return GAME_PHASES.includes(phase);
}

export function validateRoomStatus(status) {
  return ROOM_STATUS.includes(status);
}

/**
 * IDジェネレーター
 */
export function generateCardId() {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateRoomId() {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generatePlayerId() {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default {
  CARD_TYPES,
  EFFECT_TYPES,
  EFFECT_TARGETS,
  GAME_PHASES,
  ROOM_STATUS,
  validateCard,
  validateRoom,
  validateGamePhase,
  validateRoomStatus,
  generateCardId,
  generateRoomId,
  generatePlayerId
};