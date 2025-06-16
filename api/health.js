export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const globalCardCount = (typeof global !== 'undefined' && global.cardStorage) ? global.cardStorage.size : 0;
    
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: 'ok',
        database: 'fallback',
        connection: true,
        fallbackStorage: {
          rooms: 0,
          cards: 0,
          users: 0,
          analytics: 0
        },
        globalStorage: {
          cards: globalCardCount
        }
      },
      gameRooms: 0,
      players: 0
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}