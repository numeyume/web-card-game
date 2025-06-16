# 🎴 Web Card Game - 引き継ぎドキュメント

## 📋 プロジェクト概要

**Web Card Game** は、ドミニオン風のカードゲームで、オリジナルカード作成機能とCPU対戦機能を持つWebアプリケーションです。

### 🎯 主要機能
- **CPU対戦**: ドミニオンルールでCPUと1対1対戦
- **カード作成**: カスタムカードの作成・保存
- **コレクション管理**: 作成したカードの一覧・編集・削除
- **オフライン機能**: サーバーなしでも動作（ローカルストレージ）

## 🏗️ アーキテクチャ

### フロントエンド
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** でスタイリング
- **ローカルストレージ** でオフライン対応

### バックエンド（オプショナル）
- **Node.js** + **Express** + **Socket.IO**
- 現在はフロントエンドのみで完全動作

### デプロイ
- **Vercel** でフロントエンドをホスティング
- **GitHub** でソースコード管理

## 🚀 セットアップ手順

### 1. 環境準備
```bash
# Node.js 18以上が必要
node --version  # v18.19.1以上

# リポジトリクローン
git clone https://github.com/numeyume/web-card-game.git
cd web-card-game

# 依存関係インストール
cd client
npm install
```

### 2. 開発環境起動
```bash
# 開発サーバー起動
npm run dev

# アクセス先
# - ローカル: http://localhost:5173/
# - ネットワーク: http://[YOUR_IP]:5173/
```

### 3. ビルド・デプロイ
```bash
# プロダクションビルド
npm run build

# Vercelデプロイ
npx vercel deploy --prod
```

## 📁 プロジェクト構造

```
web-card-game/
├── client/                          # フロントエンド
│   ├── src/
│   │   ├── components/              # Reactコンポーネント
│   │   │   ├── CardBuilder/         # カード作成機能
│   │   │   ├── CardCollection/      # コレクション管理
│   │   │   ├── CardSelector/        # カード選択
│   │   │   ├── Tutorial/            # CPU対戦・チュートリアル
│   │   │   └── ...
│   │   ├── types/                   # TypeScript型定義
│   │   ├── utils/                   # ユーティリティ
│   │   │   └── DominionEngine.ts    # ゲームエンジン
│   │   └── main.tsx                 # エントリーポイント
│   ├── dist/                        # ビルド出力
│   ├── package.json
│   └── vite.config.ts              # Vite設定
├── server/                          # バックエンド（オプショナル）
├── CLAUDE.md                        # 開発ガイドライン
└── README.md
```

## 🔧 核心機能の実装詳細

### 1. CPU対戦システム
**ファイル**: `src/components/Tutorial/InteractiveTutorial.tsx`

```typescript
// CPU対戦の開始
const startGame = useCallback(() => {
  const cardsToUse = selectedCards || []
  const playerNames = ['プレイヤー', 'CPU']
  const newGameState = gameEngine.startGame(playerNames, cardsToUse)
  setGameState(newGameState)
}, [selectedCards, gameEngine])

// CPU自動ターン処理
if (!this.currentPlayer.isHuman) {
  setTimeout(() => {
    this.executeCPUTurn()
  }, 500)
}
```

**重要ポイント**:
- `DominionEngine.ts` でゲームロジックを管理
- CPUは自動的にターンを実行
- WebSocket不要で動作

### 2. ローカルストレージ対応
**ファイル**: `src/components/CardBuilder/index.tsx`

```typescript
// サーバー保存失敗時のフォールバック
try {
  const response = await fetch('/api/cards', {...})
  // サーバー保存成功
} catch (serverError) {
  // ローカルストレージに保存
  const completeCard = { ...cardData, id: `local_${Date.now()}` }
  const existingCards = JSON.parse(localStorage.getItem('customCards') || '[]')
  localStorage.setItem('customCards', JSON.stringify([...existingCards, completeCard]))
}
```

**重要ポイント**:
- サーバー接続失敗時、自動的にローカルストレージにフォールバック
- 3秒タイムアウトで素早く切り替え
- `customCards` キーでローカル保存

### 3. ゲームエンジン
**ファイル**: `src/utils/DominionEngine.ts`

```typescript
export class DominionEngine {
  startGame(playerNames: string[], selectedCards?: Card[]): DominionGameState
  playActionCard(cardId: string): boolean
  buyCard(cardId: string): boolean
  executeCPUTurn(): void
}
```

**重要ポイント**:
- 完全なドミニオンルール実装
- CPU AI搭載（戦略的購入・アクション選択）
- カスタムカード対応

## 🐛 既知の問題と対処法

### 1. WSL環境でのポートアクセス
**問題**: WindowsからWSL内のサーバーにアクセスできない

**解決策**:
```bash
# WSLのIPアドレスを確認
hostname -I

# ブラウザでアクセス
http://[WSL_IP]:5173/
```

### 2. Node.jsバージョン不一致
**問題**: `package.json` の `engines` でバージョンエラー

**解決策**:
```json
// package.json
"engines": {
  "node": ">=18.0.0"  // 現在のバージョンに合わせる
}
```

### 3. Vercelの認証制限
**問題**: プロダクション環境が認証で保護される

**解決策**:
```json
// vercel.json
{
  "version": 2,
  "public": true,  // パブリックプロジェクトに設定
  "framework": "vite"
}
```

## 🔄 開発ワークフロー

### 1. 新機能開発
```bash
# 1. 機能ブランチ作成
git checkout -b feature/new-feature

# 2. 開発・テスト
npm run dev

# 3. ビルド確認
npm run build

# 4. コミット・プッシュ
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 5. プルリクエスト作成
```

### 2. デプロイフロー
```bash
# 1. main ブランチにマージ後
git checkout main
git pull origin main

# 2. ビルド
npm run build

# 3. デプロイ
npx vercel deploy --prod
```

### 3. 問題解決フロー
```bash
# 1. 開発サーバー完全停止
pkill -f "vite|node"

# 2. 依存関係クリーンアップ
rm -rf node_modules
npm cache clean --force
npm install

# 3. 再起動
npm run dev
```

## 🎯 今後の開発指針

### 優先度: 高
1. **マルチプレイヤー機能**: WebSocket + サーバー復活
2. **カードバランス調整**: CPU AI の改善
3. **UI/UX改善**: アニメーション・レスポンシブ対応

### 優先度: 中
1. **カード効果の拡張**: より複雑な効果システム
2. **セーブデータ同期**: ローカル↔サーバー同期
3. **チュートリアル改善**: より分かりやすいガイド

### 優先度: 低
1. **デザインシステム**: 統一されたコンポーネント
2. **パフォーマンス最適化**: バンドルサイズ削減
3. **国際化対応**: 多言語サポート

## 🛠️ よく使うコマンド

```bash
# 開発
npm run dev                    # 開発サーバー起動
npm run build                  # プロダクションビルド
npm run preview               # ビルド結果プレビュー

# Git
git status                     # 変更状況確認
git add .                      # 全変更をステージ
git commit -m "message"        # コミット
git push origin main           # プッシュ

# デプロイ
npx vercel deploy --prod       # 本番デプロイ

# トラブルシューティング
pkill -f vite                  # 開発サーバー停止
rm -rf node_modules && npm install  # 依存関係リセット
```

## 📚 技術スタック詳細

### フロントエンド
- **React 18.2.0**: UI フレームワーク
- **TypeScript 5.2.2**: 型安全性
- **Vite 5.1.4**: ビルドツール・開発サーバー
- **Tailwind CSS 3.4.1**: スタイリング
- **React Hot Toast 2.4.1**: 通知システム

### 開発ツール
- **ESLint**: コード品質チェック
- **Vitest**: テストフレームワーク
- **PostCSS**: CSS処理
- **Autoprefixer**: ブラウザ対応

### デプロイ・インフラ
- **Vercel**: ホスティング
- **GitHub**: ソースコード管理
- **GitHub Actions**: CI/CD（将来実装予定）

## 🔐 環境変数

```bash
# client/.env
VITE_SERVER_URL=http://localhost:3001  # サーバーURL（開発時）
```

## 📞 サポート・連絡先

### ドキュメント
- **CLAUDE.md**: 詳細な開発ガイドライン
- **README.md**: プロジェクト基本情報
- **package.json**: 依存関係・スクリプト

### 重要ファイル
- **vite.config.ts**: Vite設定（プロキシ・ビルド）
- **tailwind.config.js**: Tailwind設定
- **tsconfig.json**: TypeScript設定

## ✅ 引き継ぎチェックリスト

### 環境セットアップ
- [ ] Node.js 18以上インストール済み
- [ ] リポジトリクローン完了
- [ ] `npm install` 成功
- [ ] `npm run dev` でローカルサーバー起動
- [ ] ブラウザでアクセス可能

### 機能確認
- [ ] CPU対戦が正常に動作
- [ ] カード作成・保存が機能
- [ ] コレクション表示が正常
- [ ] ローカルストレージ保存確認

### デプロイ確認
- [ ] `npm run build` 成功
- [ ] Vercelアカウント設定済み
- [ ] デプロイ成功

---

**🎉 引き継ぎ完了！**

このドキュメントで、次の開発者が迷うことなくプロジェクトを継続できます。
追加質問があれば、CLAUDE.md や各コンポーネントのコメントを参照してください。