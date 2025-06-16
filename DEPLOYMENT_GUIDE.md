# 🚀 Web Card Game デプロイメントガイド

## 📋 概要

このガイドでは、Web Card Gameを本番環境にデプロイする方法を詳しく説明します。Vercel（推奨）とNetlifyの両方の選択肢を提供し、各環境での最適な設定と運用方法を案内します。

---

## 🎯 デプロイメント選択肢

### 🏆 推奨: Vercel（フルスタック対応）
- ✅ **フロントエンド + バックエンド**両方対応
- ✅ **WebSocket対応**
- ✅ **サーバーレス関数**でバックエンド実行
- ✅ **自動スケーリング**
- ✅ **簡単なCI/CD**

### 📱 代替: Netlify（フロントエンドのみ）
- ✅ **フロントエンド専用**
- ⚠️ **バックエンドは別途デプロイ必要**
- ✅ **高速CDN配信**
- ✅ **無料プランが充実**

---

## 🚀 Vercel デプロイメント（推奨）

### 📋 事前準備

#### 1. Vercel アカウント
1. [Vercel](https://vercel.com)でアカウント作成
2. GitHubアカウントと連携

#### 2. 環境変数設定
```bash
# プロジェクトルートに .env.production 作成
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/webcardgame
DATABASE_FALLBACK=false
NODE_ENV=production
CLIENT_URL=https://your-app.vercel.app
```

### 🔧 デプロイ設定

#### 1. vercel.json 確認
既に設定済みですが、内容を確認：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.js"
    },
    {
      "src": "/health",
      "dest": "/server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_FALLBACK": "true"
  }
}
```

#### 2. package.json ビルドスクリプト確認
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "build:vercel": "cd client && npm run build"
  }
}
```

### 🎯 デプロイ手順

#### Method 1: Vercel CLI（推奨）

**1. Vercel CLI インストール**
```bash
npm install -g vercel
```

**2. ログイン**
```bash
vercel login
```

**3. プロジェクト初期化**
```bash
# プロジェクトルートで実行
vercel

# 初回設定
? Set up and deploy "web-card-game"? [Y/n] y
? Which scope? Your personal account
? Link to existing project? [y/N] n
? What's your project's name? web-card-game
? In which directory is your code located? ./
```

**4. 環境変数設定**
```bash
# 本番環境変数設定
vercel env add MONGODB_URI production
vercel env add DATABASE_FALLBACK production
vercel env add NODE_ENV production
```

**5. 本番デプロイ**
```bash
vercel --prod
```

#### Method 2: GitHub 連携

**1. GitHubリポジトリ作成**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/web-card-game.git
git push -u origin main
```

**2. Vercel プロジェクト作成**
1. [Vercel Dashboard](https://vercel.com/dashboard)
2. "New Project"をクリック
3. GitHubリポジトリを選択
4. 環境変数を設定：
   - `MONGODB_URI`: MongoDB接続文字列
   - `DATABASE_FALLBACK`: `false`
   - `NODE_ENV`: `production`

**3. 自動デプロイ設定**
```bash
# 以降は git push するだけで自動デプロイ
git push origin main
```

### 🔧 Vercel 詳細設定

#### カスタムドメイン設定
```bash
# カスタムドメインを追加
vercel domains add yourdomain.com
vercel domains add www.yourdomain.com

# プロジェクトにドメインを紐付け
vercel alias your-app.vercel.app yourdomain.com
```

#### 環境別設定
```bash
# 開発環境
vercel env add MONGODB_URI development

# プレビュー環境
vercel env add MONGODB_URI preview

# 本番環境
vercel env add MONGODB_URI production
```

---

## 📱 Netlify デプロイメント

### ⚠️ 重要な制限
Netlifyはフロントエンドのみのデプロイとなります。バックエンドは別途デプロイが必要です。

### 🔧 フロントエンド デプロイ

#### 1. netlify.toml 確認
```toml
[build]
  base = "client"
  publish = "client/dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--no-optional"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

#### 2. 環境変数設定（フロントエンド）
```bash
# client/.env.production
VITE_SERVER_URL=https://your-backend-url.com
```

#### 3. Netlify CLI デプロイ
```bash
# Netlify CLI インストール
npm install -g netlify-cli

# ログイン
netlify login

# デプロイ
netlify deploy --prod --dir=client/dist
```

#### 4. GitHub 連携デプロイ
1. [Netlify](https://app.netlify.com/)でアカウント作成
2. "New site from Git"を選択
3. GitHubリポジトリを連携
4. ビルド設定：
   - Build command: `npm run build`
   - Publish directory: `client/dist`
   - Base directory: `client`

### 🔗 バックエンド別デプロイ

Netlifyでフロントエンドをデプロイする場合、バックエンドは別サービスに：

#### Heroku でバックエンド
```bash
# Heroku CLI インストール後
heroku create web-card-game-api
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set DATABASE_FALLBACK=false

# Procfile 作成
echo "web: cd server && npm start" > Procfile

git add Procfile
git commit -m "Add Procfile for Heroku"
git push heroku main
```

#### Railway でバックエンド
```bash
# Railway CLI インストール後
railway login
railway init web-card-game-api

# 環境変数設定
railway variables set MONGODB_URI=your_mongodb_uri
railway variables set DATABASE_FALLBACK=false

railway up
```

---

## 🗄 データベース設定

### MongoDB Atlas（推奨）

#### 1. クラスター作成
1. [MongoDB Atlas](https://cloud.mongodb.com/)でアカウント作成
2. 新しいクラスターを作成
3. 地域選択（推奨：東京 ap-northeast-1）

#### 2. データベースユーザー作成
```bash
Username: webcardgame_user
Password: <strong_password>
Roles: Read and write to any database
```

#### 3. ネットワークアクセス設定
```bash
# IP Whitelist
0.0.0.0/0  # 本番では適切なIPに制限

# または Vercel IPs
vercel_ip_range_1
vercel_ip_range_2
```

#### 4. 接続文字列取得
```bash
mongodb+srv://webcardgame_user:<password>@cluster0.mongodb.net/webcardgame?retryWrites=true&w=majority
```

### MongoDB自ホスト

#### Docker Compose
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6
    container_name: webcardgame_mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: webcardgame
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

---

## 🔧 環境変数 完全リスト

### サーバー側環境変数
```bash
# データベース
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
DATABASE_FALLBACK=false

# アプリケーション
NODE_ENV=production
PORT=3001

# クライアント
CLIENT_URL=https://your-app.vercel.app

# セキュリティ（将来実装）
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=https://your-app.vercel.app

# 外部サービス（将来実装）
REDIS_URL=redis://localhost:6379
ANALYTICS_API_KEY=your_analytics_key
```

### クライアント側環境変数
```bash
# サーバー接続
VITE_SERVER_URL=https://your-api.vercel.app

# 分析（将来実装）
VITE_ANALYTICS_ID=your_analytics_id
VITE_ERROR_TRACKING_DSN=your_sentry_dsn
```

---

## 🚦 CI/CD パイプライン

### GitHub Actions 設定

#### 1. ワークフローファイル作成
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

#### 2. GitHub Secrets 設定
```bash
# GitHub リポジトリの Settings > Secrets で設定
VERCEL_TOKEN=your_vercel_token
ORG_ID=your_vercel_org_id  
PROJECT_ID=your_vercel_project_id
```

---

## 🔍 デプロイ後の確認

### ヘルスチェック
```bash
# API ヘルスチェック
curl https://your-app.vercel.app/health

# 期待されるレスポンス
{
  "status": "ok",
  "timestamp": "2025-06-16T...",
  "database": {
    "status": "ok",
    "database": "mongodb",
    "connection": true
  },
  "gameRooms": 0,
  "players": 0
}
```

### 機能テスト
```bash
# カード作成 API テスト
curl -X POST https://your-app.vercel.app/api/cards \
  -H "Content-Type: application/json" \
  -H "X-Player-Id: test_player" \
  -d '{
    "name": "テストカード",
    "cost": 3,
    "type": "Action",
    "effects": [{"type": "draw", "value": 2, "target": "self"}],
    "description": "テスト用カード"
  }'
```

### パフォーマンス確認
```bash
# ページロード速度
curl -w "@curl-format.txt" -o /dev/null -s https://your-app.vercel.app/

# レスポンス時間計測
time curl https://your-app.vercel.app/health
```

---

## 📊 監視・ログ設定

### Vercel Analytics
```javascript
// pages/_app.js または main.tsx に追加
import { Analytics } from '@vercel/analytics/react'

export default function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  )
}
```

### エラー監視（Sentry）
```bash
# Sentry SDK インストール
npm install @sentry/node @sentry/react

# 設定
# server/index.js
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
})

# client/main.tsx  
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV
})
```

### ログ集約
```javascript
// サーバー側構造化ログ
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      service: 'web-card-game',
      ...meta
    }))
  }
}
```

---

## 🔧 トラブルシューティング

### よくある問題

#### 1. Vercel デプロイエラー
```bash
# エラー: Build failed
解決方法:
1. package.json のスクリプト確認
2. 依存関係の問題確認: npm ci
3. TypeScript エラー確認: npm run build:check
```

#### 2. 環境変数が反映されない
```bash
# 確認手順:
1. Vercel Dashboard で環境変数確認
2. vercel env ls で確認
3. 再デプロイ: vercel --prod --force
```

#### 3. MongoDB 接続エラー
```bash
# 確認項目:
1. 接続文字列の形式
2. IP ホワイトリスト設定
3. ユーザー権限確認
4. フォールバックモード有効化: DATABASE_FALLBACK=true
```

#### 4. WebSocket 接続問題
```bash
# Vercel での制限:
- Serverless Functions は永続接続不可
- WebSocket の代替実装が必要
- 代替案: Pusher, Ably, Firebase Realtime
```

### デバッグ手順

#### ローカル環境での本番テスト
```bash
# 本番環境変数でローカル実行
NODE_ENV=production npm run build
NODE_ENV=production npm start

# または
vercel dev --prod
```

#### ログ確認
```bash
# Vercel ログ確認
vercel logs

# リアルタイムログ
vercel logs --follow
```

---

## 📈 パフォーマンス最適化

### 1. ビルド最適化

#### Webpack Bundle Analyzer
```bash
# クライアント側バンドル分析
npm install --save-dev webpack-bundle-analyzer

# package.json に追加
"analyze": "npm run build && npx webpack-bundle-analyzer client/dist/assets"
```

#### Tree Shaking 最適化
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', '@dnd-kit/core'],
          socket: ['socket.io-client']
        }
      }
    }
  }
})
```

### 2. CDN 最適化

#### 静的アセット
```javascript
// 画像最適化
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    assetsInlineLimit: 4096, // 4KB以下はインライン化
  }
})
```

#### フォント最適化
```css
/* フォントプリロード */
<link rel="preload" href="/fonts/custom-font.woff2" as="font" type="font/woff2" crossorigin>
```

---

## 🔐 セキュリティ設定

### HTTPS 強制
```javascript
// サーバー側 HTTPS リダイレクト
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`)
  } else {
    next()
  }
})
```

### セキュリティヘッダー
```javascript
// Helmet.js でセキュリティヘッダー設定
const helmet = require('helmet')

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}))
```

### CORS 設定
```javascript
// 本番環境でのCORS設定
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
```

---

## 📋 チェックリスト

### デプロイ前確認
- [ ] **ビルド成功**: `npm run build` が正常終了
- [ ] **テスト通過**: `npm run test` が全て成功
- [ ] **Lint チェック**: `npm run lint` がエラーなし
- [ ] **環境変数設定**: 本番用環境変数が正しく設定
- [ ] **データベース接続**: MongoDB Atlas の設定完了

### デプロイ後確認
- [ ] **ヘルスチェック**: `/health` エンドポイントが正常応答
- [ ] **フロントエンドアクセス**: メイン画面が正常表示
- [ ] **WebSocket接続**: "接続済み"状態になっている
- [ ] **カード作成**: カード作成機能が正常動作
- [ ] **CPU対戦**: ゲームが正常に開始・進行
- [ ] **エラーハンドリング**: 適切なエラーメッセージ表示

### パフォーマンス確認
- [ ] **ページロード速度**: 3秒以内での初期表示
- [ ] **API レスポンス**: 1秒以内でのデータ取得
- [ ] **バンドルサイズ**: 適切なコード分割
- [ ] **画像最適化**: 適切な形式・サイズでの配信

---

## 🎉 デプロイ完了

おめでとうございます！Web Card Game が本番環境で稼働中です。

### 📚 次のステップ
1. **監視設定**: ログ・メトリクス収集の設定
2. **バックアップ**: データベースバックアップの自動化
3. **スケーリング**: 負荷に応じたスケーリング設定
4. **機能追加**: マルチプレイヤー機能の完成
5. **ユーザーフィードバック**: 実際のユーザーからの改善提案収集

### 🆘 サポート
問題が発生した場合は：
- **ログ確認**: `vercel logs` でエラーログ確認
- **GitHub Issues**: プロジェクトリポジトリでのイシュー報告
- **ドキュメント**: 各種技術ドキュメントを参照

**Good Luck with your deployment! 🚀✨**