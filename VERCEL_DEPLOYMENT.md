# Vercel Deployment Guide

このドキュメントはWeb Card GameのVercelデプロイメントに関する包括的なガイドです。

## 🏗️ アーキテクチャ概要

### フロントエンド
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Build Output**: `client/dist/`

### バックエンド
- **Runtime**: Vercel Functions (Node.js 18)
- **Database**: MongoDB (with fallback to global storage)
- **API Endpoints**: RESTful API using serverless functions

## 📁 プロジェクト構造

```
/
├── client/                 # React frontend
│   ├── src/
│   ├── dist/              # Build output
│   └── package.json
├── api/                   # Vercel Functions
│   ├── cards.js          # Cards CRUD API
│   ├── cards/[id].js     # Individual card operations
│   ├── health.js         # Health check endpoint
│   └── package.json
├── server/               # Development server (not deployed)
├── vercel.json          # Vercel configuration
└── package.json         # Root dependencies
```

## 🚀 デプロイメント設定

### vercel.json設定

```json
{
  "version": 2,
  "buildCommand": "cd client && npm run build",
  "outputDirectory": "client/dist",
  "framework": null,
  "installCommand": "npm install && cd client && npm install",
  "functions": {
    "api/cards.js": { "runtime": "@vercel/node" },
    "api/cards/[id].js": { "runtime": "@vercel/node" },
    "api/health.js": { "runtime": "@vercel/node" }
  },
  "rewrites": [
    { "source": "/api/cards", "destination": "/api/cards" },
    { "source": "/api/cards/(.*)", "destination": "/api/cards/$1" },
    { "source": "/health", "destination": "/api/health" },
    { "source": "/(.*)", "destination": "/$1" }
  ]
}
```

### 環境変数

| 変数名 | 説明 | 必須 | デフォルト |
|--------|------|------|------------|
| `MONGODB_URI` | MongoDB接続文字列 | ❌ | フォールバックモード |
| `VITE_SERVER_URL` | API サーバーURL | ❌ | 本番環境では自動設定 |

## 🔧 API エンドポイント

### 本番環境URL
- **Base URL**: `https://web-card-game-kappa.vercel.app`
- **Health Check**: `GET /health`
- **Cards API**: `GET/POST /api/cards`
- **Individual Card**: `PUT/DELETE /api/cards/{id}`

### APIレスポンス形式

```typescript
// 成功レスポンス
{
  "success": true,
  "cards": Card[],
  "count": number,
  "message"?: string
}

// エラーレスポンス
{
  "success": false,
  "error": string
}
```

## 💾 データ永続化

### フォールバックストレージ
MongoDB接続が失敗した場合、グローバルメモリストレージを使用：

```javascript
if (typeof global !== 'undefined' && !global.cardStorage) {
  global.cardStorage = new Map();
}
```

### データ同期
- Vercel Functions間でのデータ共有
- サーバーレス環境での状態管理
- 自動フェールオーバー機能

## 🛠️ ビルドプロセス

### ローカル開発
```bash
# 開発環境起動
npm run dev

# 個別起動
npm run dev:client  # http://localhost:5173
npm run dev:server  # http://localhost:3001
```

### プロダクションビルド
```bash
# クライアントビルド
cd client && npm run build

# 全体ビルド（Vercel環境）
npm run build
```

### ビルド検証
```bash
# TypeScript チェック
cd client && npm run build:check

# リンティング
npm run lint

# テスト実行
npm run test
```

## 📋 デプロイ前チェックリスト

### ✅ 必須項目
- [ ] `client/dist/` ディレクトリが存在
- [ ] `api/` フォルダに全API Functionsが配置
- [ ] `vercel.json` の設定が正しい
- [ ] 環境変数が設定済み（必要に応じて）
- [ ] ビルドエラーがない

### ✅ 機能テスト
- [ ] ローカルでカード作成が動作
- [ ] ローカルでカードコレクション表示
- [ ] API エンドポイントが応答
- [ ] CORS設定が正しい

### ✅ パフォーマンス
- [ ] バンドルサイズが適切（<500KB）
- [ ] API レスポンス時間（<3秒）
- [ ] データベース接続タイムアウト設定

## 🔍 トラブルシューティング

### よくある問題

#### 1. API 404エラー
**症状**: `GET /api/cards 404 (Not Found)`
**原因**: Vercel Functions が正しく設定されていない
**解決**: 
- `api/` フォルダの存在確認
- `vercel.json` の functions 設定確認
- リライトルールの確認

#### 2. CORS エラー
**症状**: Cross-origin リクエストが失敗
**原因**: CORS ヘッダーが設定されていない
**解決**: 各API Functionで以下を設定
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

#### 3. データが保存されない
**症状**: カード作成後にコレクションに表示されない
**原因**: グローバルストレージの設定問題
**解決**: 
- `global.cardStorage` の初期化確認
- データベースフォールバック動作確認

#### 4. ビルドエラー
**症状**: Vercel ビルドが失敗
**原因**: 依存関係やTypeScriptエラー
**解決**:
```bash
# ローカルでビルド確認
cd client && npm run build
npm run lint
```

### デバッグ手順

#### 1. ローカルテスト
```bash
# API テスト
curl -X GET http://localhost:3001/api/cards
curl -X POST http://localhost:3001/api/cards -H "Content-Type: application/json" -d '{"name":"test","type":"Action","description":"test"}'
```

#### 2. 本番環境テスト
```bash
# Health Check
curl https://web-card-game-kappa.vercel.app/health

# Cards API
curl https://web-card-game-kappa.vercel.app/api/cards
```

#### 3. Vercel ログ確認
```bash
# Vercel CLI でログ確認
vercel logs
```

## 📊 監視とメトリクス

### パフォーマンス指標
- **API レスポンス時間**: < 3秒
- **ページロード時間**: < 5秒
- **バンドルサイズ**: < 500KB
- **Function Cold Start**: < 2秒

### 監視ポイント
- API エラー率
- データベース接続成功率
- ユーザーセッション継続率
- カード作成成功率

## 🔒 セキュリティ

### API セキュリティ
- CORS 適切な設定
- 入力値検証
- SQL/NoSQL インジェクション対策
- レート制限（必要に応じて）

### データ保護
- MongoDB接続文字列の暗号化
- ユーザーデータの匿名化
- ログからの機密情報除外

## 📅 メンテナンス

### 定期タスク
- [ ] Vercel Functions のパフォーマンス確認
- [ ] データベース接続状況確認
- [ ] セキュリティアップデート適用
- [ ] バックアップ状況確認

### アップデート手順
1. ローカル環境でテスト
2. ステージング環境デプロイ（必要に応じて）
3. 本番環境デプロイ
4. 動作確認
5. ロールバック準備

## 🆘 緊急時対応

### ロールバック手順
```bash
# Vercel CLI でロールバック
vercel rollback [deployment-url]
```

### 緊急連絡先
- Vercel サポート
- MongoDB Atlas サポート
- 開発チーム連絡先

---

**最終更新**: 2025-06-16
**バージョン**: 1.0.0
**担当者**: Claude Code