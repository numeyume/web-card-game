/**
 * Error Handling Middleware
 * 統一されたエラーハンドリングとログ出力
 */

export class ErrorHandler {
  static handleAPIError(err, req, res, next) {
    console.error('API Error:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // エラータイプ別の処理
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.message
      });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        details: err.message
      });
    }

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate resource',
        details: 'Resource already exists'
      });
    }

    // デフォルトエラー
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }

  static handleSocketError(socket, error, eventName = 'unknown') {
    console.error('Socket Error:', {
      socketId: socket.id,
      event: eventName,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    socket.emit('error', {
      type: 'server_error',
      message: 'An error occurred on the server',
      event: eventName,
      timestamp: new Date().toISOString()
    });
  }

  static handleDatabaseError(error, operation = 'unknown') {
    console.error('Database Error:', {
      operation,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    };
  }

  static validateGameInput(data, requiredFields = []) {
    const errors = [];

    // 必須フィールドチェック
    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`${field} is required`);
      }
    });

    // ルームIDフォーマットチェック
    if (data.roomId && !/^[a-zA-Z0-9_-]+$/.test(data.roomId)) {
      errors.push('Invalid room ID format');
    }

    // プレイヤーIDフォーマットチェック
    if (data.playerId && !/^[a-zA-Z0-9_-]+$/.test(data.playerId)) {
      errors.push('Invalid player ID format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static logGameEvent(eventType, data) {
    console.log('Game Event:', {
      type: eventType,
      data: JSON.stringify(data),
      timestamp: new Date().toISOString()
    });
  }
}

export default ErrorHandler;