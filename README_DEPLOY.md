# 🎴 Web Card Game

ドミニオン風カードゲーム with オリジナルカード作成機能

## 🚀 クイックスタート

### ローカル開発環境

```bash
# 依存関係インストール
npm install
cd client && npm install
cd ../server && npm install

# 開発サーバー起動
npm run dev
```

**アクセス URL**: http://localhost:5173

### プロダクション (ローカル)

```bash
# デプロイメント実行
./deploy.sh

# 起動
cd dist && ./start.sh
```

**アクセス URL**: http://localhost:3001

## 📦 デプロイメント

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/web-card-game)

1. GitHubにリポジトリをプッシュ
2. Vercelで新しいプロジェクトとしてインポート
3. 環境変数設定:
   ```
   DATABASE_FALLBACK=true
   NODE_ENV=production
   ```

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/web-card-game)

1. GitHubにリポジトリをプッシュ
2. Netlifyで新しいサイトとしてインポート
3. ビルド設定は自動検出される (`netlify.toml`使用)

### GitHub Pages

```bash
# GitHub Actionsが自動でデプロイ
git push origin main
```

## 🎮 機能

- **ドミニオンゲーム**: 本格的なCPU対戦
- **カード作成**: オリジナルカード作成機能
- **チュートリアル**: 詳細な学習システム
- **コレクション**: 作成したカードの管理
- **レスポンシブUI**: モバイル対応

## 🛠️ 技術スタック

- **フロントエンド**: React + TypeScript + Vite + Tailwind CSS
- **バックエンド**: Node.js + Express (Serverless対応)
- **データベース**: ローカルファイルストレージ (フォールバックモード)
- **リアルタイム**: Socket.IO (オプション)

## 📁 プロジェクト構造

```
├── client/          # React フロントエンド
├── server/          # Node.js バックエンド
├── netlify/         # Netlify Functions
├── .github/         # GitHub Actions
├── vercel.json      # Vercel設定
├── netlify.toml     # Netlify設定
└── deploy.sh        # ローカルデプロイスクリプト
```

## 🔧 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `DATABASE_FALLBACK` | ローカルストレージ使用 | `true` |
| `NODE_ENV` | 環境設定 | `development` |
| `PORT` | サーバーポート | `3001` |

## 📖 ドキュメント

- [ゲームルール](./DOMINION_RULES.md)
- [開発ガイド](./DEVELOPMENT_GUIDE.md)
- [デプロイメント詳細](./DEPLOYMENT.md)
- [トラブルシューティング](./TROUBLESHOOTING.md)

## 🤝 コントリビュート

1. Forkする
2. フィーチャーブランチ作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. Pull Request作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

## 🎯 今後の予定

- [ ] マルチプレイヤー対戦機能
- [ ] AI戦略の強化
- [ ] カードバランス調整
- [ ] モバイルアプリ版