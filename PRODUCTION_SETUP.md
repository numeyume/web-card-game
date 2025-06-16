# 🚀 本番環境構築ガイド

**プロジェクト**: Web Card Game  
**作成日**: 2025-06-15  
**対象**: 本番デプロイ準備

---

## 📋 本番環境要件

### システム要件
- **Node.js**: 18.19.1 以上
- **MongoDB**: 6.0 以上
- **メモリ**: 最低 2GB RAM
- **ストレージ**: 最低 10GB
- **ネットワーク**: HTTPS対応必須

### 環境変数設定
```env
# 本番環境設定
NODE_ENV=production
PORT=3001

# データベース
MONGODB_URI=mongodb://your-mongodb-server:27017/web-card-game
MONGODB_FALLBACK=false

# セキュリティ
JWT_SECRET=your-super-secure-secret-key-here
CORS_ORIGIN=https://your-domain.com

# SSL/TLS
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/private.key

# ログ設定
LOG_LEVEL=error
LOG_FILE=/var/log/web-card-game/app.log
```

---

## 🐳 Docker本番デプロイ

### Dockerfile作成
```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 依存関係のコピー・インストール
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションファイルのコピー
COPY . .

# 実行ユーザー作成
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

CMD ["node", "index.js"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  web-card-game:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/web-card-game
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
    restart: unless-stopped

  client:
    build: ./client
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl/certs
    depends_on:
      - web-card-game
    restart: unless-stopped

volumes:
  mongodb_data:
```

---

## ☁️ クラウドデプロイオプション

### 1. Vercel (推奨 - フロントエンド)
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "client/$1"
    }
  ],
  "env": {
    "VITE_API_URL": "https://your-api-domain.com"
  }
}
```

### 2. Railway (推奨 - バックエンド)
```json
// railway.json
{
  "deploy": {
    "startCommand": "node index.js",
    "restartPolicyType": "always"
  }
}
```

### 3. MongoDB Atlas (推奨 - データベース)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/web-card-game?retryWrites=true&w=majority
```

---

## 🔒 セキュリティ設定

### HTTPS設定
```javascript
// server/index.js に追加
import https from 'https';
import fs from 'fs';

if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
  
  https.createServer(options, app).listen(443, () => {
    console.log('HTTPS Server running on port 443');
  });
}
```

### CORS設定
```javascript
// 本番用CORS設定
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-domain.com',
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### レート制限
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // リクエスト数制限
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

---

## 📊 監視・ログ設定

### ログ設定
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: process.env.LOG_FILE || './logs/app.log' 
    }),
    new winston.transports.Console()
  ]
});
```

### ヘルスチェック強化
```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await databaseService.healthCheck(),
    gameRooms: gameRooms.size,
    players: players.size
  };
  
  res.json(health);
});
```

---

## 🚀 デプロイ手順

### 1. 事前準備
```bash
# 本番用ビルド
npm run build

# テスト実行
npm run test

# セキュリティ監査
npm audit

# 依存関係最適化
npm prune --production
```

### 2. サーバーデプロイ
```bash
# Railway デプロイ
railway login
railway link your-project-id
railway up

# または Docker デプロイ
docker-compose up -d --build
```

### 3. フロントエンドデプロイ
```bash
# Vercel デプロイ
vercel --prod

# 環境変数設定
vercel env add VITE_API_URL production
```

### 4. データベースセットアップ
```bash
# MongoDB Atlas 接続確認
mongosh "mongodb+srv://cluster.mongodb.net/" --username your-username

# 初期データ投入（必要に応じて）
```

---

## 📈 パフォーマンス最適化

### 1. フロントエンド最適化
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          socket: ['socket.io-client']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### 2. サーバー最適化
```javascript
// Compression
import compression from 'compression';
app.use(compression());

// Static file caching
app.use(express.static('public', {
  maxAge: '1d',
  etag: false
}));
```

### 3. データベース最適化
```javascript
// MongoDB インデックス設定
await db.collection('rooms').createIndex({ roomId: 1 }, { unique: true });
await db.collection('cards').createIndex({ createdBy: 1 });
await db.collection('cards').createIndex({ usageCount: -1 });
```

---

## 🔧 運用・メンテナンス

### 自動デプロイ設定
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### バックアップ設定
```bash
# MongoDB バックアップスクリプト
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/backup_$DATE"
```

### 監視設定
- **Uptime監視**: UptimeRobot, Pingdom
- **エラー追跡**: Sentry
- **パフォーマンス**: New Relic, DataDog

---

## ✅ 本番チェックリスト

### セキュリティ
- [ ] HTTPS証明書設定完了
- [ ] JWT_SECRET 強力なキーに変更
- [ ] CORS設定適切に構成
- [ ] レート制限設定
- [ ] 環境変数セキュア管理

### パフォーマンス
- [ ] 静的ファイルgzip圧縮
- [ ] データベースインデックス設定
- [ ] CDN設定（必要に応じて）
- [ ] キャッシュ戦略実装

### 監視
- [ ] ヘルスチェックエンドポイント
- [ ] エラーログ収集
- [ ] パフォーマンス監視
- [ ] アップタイム監視

### バックアップ
- [ ] データベース自動バックアップ
- [ ] 設定ファイルバックアップ
- [ ] 復旧手順確認

---

## 🆘 トラブルシューティング

### よくある問題

#### 1. MongoDB接続エラー
```bash
# 接続確認
mongosh "$MONGODB_URI"

# ネットワーク確認
ping your-mongodb-server
```

#### 2. メモリ不足
```bash
# メモリ使用量確認
free -h
node --max-old-space-size=2048 index.js
```

#### 3. SSL証明書エラー
```bash
# 証明書確認
openssl x509 -in cert.pem -text -noout

# Let's Encrypt自動更新
certbot renew --dry-run
```

---

## 📞 サポート連絡先

- **技術サポート**: 開発チーム
- **インフラ**: DevOpsチーム  
- **セキュリティ**: セキュリティチーム

---

**🎉 本番環境構築の準備が完了しました！**

*最終更新: 2025-06-15*