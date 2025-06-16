# 🎮 Web Card Game 開発ガイド

**プロジェクトパス**: `C:\Users\tamaz\web-card-game`  
**更新日**: 2025-06-15

---

## 🎯 プロジェクト概要

**リアルタイムマルチプレイヤーカードゲーム**
- React + Node.js + Socket.IO による本格的なWebベースカードゲーム
- 2-4人同時プレイ対応
- カスタムカード作成機能
- Formula 4.4 スコアリングシステム
- リアルタイム投票・分析システム

## 📁 プロジェクト構造

```
C:\Users\tamaz\web-card-game\
├── 📄 DEVELOPMENT_GUIDE.md    # 📖 このファイル（メイン開発ガイド）
├── 📄 README.md               # 📖 プロジェクト概要・機能説明
├── 📄 CLAUDE.md               # 📖 Claude開発者向け情報
├── 📄 DEPLOYMENT.md           # 📖 本番デプロイガイド
├── 📄 package.json            # ⚙️ モノレポ設定
├── 📄 test-server-integration.js # 🧪 統合テストスイート
│
├── 📂 client/                 # 🖥️ React フロントエンド
│   ├── 📄 package.json        # ⚙️ クライアント依存関係
│   ├── 📄 vite.config.ts      # ⚙️ Vite設定
│   ├── 📄 index.html          # 🌐 メインHTML
│   └── 📂 src/
│       ├── 📄 App.tsx         # 🎯 メインアプリ
│       ├── 📂 components/     # 🧩 Reactコンポーネント
│       │   ├── 📂 CardBuilder/    # カード作成ツール
│       │   ├── 📄 GameBoard.tsx   # ゲームメイン画面
│       │   ├── 📄 Lobby.tsx       # ロビー・ルーム管理
│       │   ├── 📄 EndGameModal.tsx # ゲーム終了画面
│       │   └── 📄 ResultModal.tsx # 結果表示
│       └── 📂 types/          # 🏷️ TypeScript型定義
│
├── 📂 server/                 # 🖥️ Node.js バックエンド
│   ├── 📄 package.json        # ⚙️ サーバー依存関係
│   ├── 📄 index.js            # 🎯 メインサーバーファイル
│   ├── 📄 .env                # ⚙️ 環境変数
│   └── 📂 src/
│       ├── 📂 engine/         # 🎮 ゲームエンジン群
│       │   ├── 📄 deckEngine.js        # デッキ・カード管理
│       │   ├── 📄 scoringEngine.js     # Formula 4.4 スコア計算
│       │   ├── 📄 endConditionEngine.js # ゲーム終了条件
│       │   └── 📄 usageTrackingEngine.js # 使用統計・投票
│       └── 📂 services/       # 🔧 サービス層
│           └── 📄 DatabaseService.js # MongoDB統合（フォールバック付）
│
└── 📂 infrastructure/         # 🏗️ インフラ設定（将来用）
```

---

## 🚀 クイックスタート

### Windows環境
```cmd
cd C:\Users\tamaz\web-card-game

# 依存関係インストール
npm install

# 開発環境起動（推奨）
npm run dev
```

### 個別起動
```cmd
# サーバーのみ
npm run dev:server

# クライアントのみ  
npm run dev:client
```

### アクセス
- **クライアント**: http://localhost:5173
- **サーバーAPI**: http://localhost:3001
- **ヘルスチェック**: http://localhost:3001/health

---

## 🧪 テスト・検証

```cmd
# 統合テスト実行
node test-server-integration.js

# 期待される結果
✅ 成功: 7
❌ エラー: 0
🎉 全テスト成功！
```

---

## ⚙️ 技術仕様

### フロントエンド
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **Framer Motion**
- **Socket.IO Client** (リアルタイム通信)

### バックエンド
- **Node.js** + **Express** + **Socket.IO v4**
- **MongoDB** (フォールバック: メモリストレージ)
- **JWT認証** (匿名認証対応)

### ゲームエンジン
1. **DeckEngine**: Fisher-Yates シャッフル、ドロー、破棄
2. **ScoringEngine**: Formula 4.4 (GameScore + CreatorScore)
3. **EndConditionEngine**: 3山切れ、ターン制限、時間制限
4. **UsageTrackingEngine**: カード使用統計、投票システム

---

## 🔧 設定ファイル

### 環境変数 (server/.env)
```env
PORT=3001
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/web-card-game
JWT_SECRET=web-card-game-secret-key-change-in-production
NODE_ENV=development
```

### 主要スクリプト
```json
{
  "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
  "dev:server": "cd server && npm run dev",
  "dev:client": "cd client && npm run dev",
  "test": "node test-server-integration.js"
}
```

---

## 🎮 ゲーム機能

### ✅ 実装済み機能
- **リアルタイムマルチプレイヤー** (2-4人)
- **カスタムカード作成** (ドラッグ&ドロップ)
- **Advanced Scoring** (Formula 4.4)
- **終了条件エンジン** (3種類)
- **投票システム** (いいね/よくない)
- **プレイヤー分析** (5つのプレイスタイル)
- **MongoDB統合** (フォールバック機能)

### 📋 今後の実装
- クライアント・サーバー連携テスト
- 本番環境デプロイ準備
- パフォーマンス最適化

---

## 🐛 トラブルシューティング

### よくある問題

#### ポート競合
```cmd
netstat -ano | findstr :3001
taskkill /F /PID <PID>
```

#### MongoDB接続エラー
```
💾 Database: Fallback Mode
```
→ 正常です。フォールバックモードで動作します。

#### Node.js バージョン
```cmd
node --version  # v18.19.1 以上推奨
```

### ログ確認
- **サーバー**: コンソール出力
- **クライアント**: ブラウザ開発者ツール

---

## 📞 開発サポート

### 重要コマンド
```cmd
# 開発環境起動
npm run dev

# 統合テスト
node test-server-integration.js

# 依存関係再インストール
rm -rf node_modules && npm install
```

### 設定ファイル確認
```cmd
type server\.env
type package.json
```

---

## 🎯 次のステップ

1. **クライアント・サーバー連携テスト**
2. **ゲームプレイフロー確認**
3. **本番環境構築準備**

**🎉 これで Web Card Game の開発環境は完全にセットアップされています！**

---

*最終更新: 2025-06-15 | Windows環境対応完了*