# 🔧 Web Card Game トラブルシューティングガイド

## 📋 概要

このガイドでは、Web Card Game の開発・運用中に発生する可能性のある問題と、その解決方法を詳しく説明します。

---

## 🚨 起動・接続問題の解決方法

### 1. **接続が拒否される / ポート競合**

#### 症状
- ブラウザで「接続が拒否されました」
- `EADDRINUSE` エラー
- 空白ページが表示される

#### 解決方法
```bash
# ✅ 最も簡単な解決法
npm run dev:safe

# または手動で段階的に解決
npm run stop:force
npm run dev
```

#### 根本原因
- 以前のプロセスが残留している
- ポート5173/5174が他のアプリケーションで使用中
- WSL環境でのネットワーク設定問題

---

### 2. **プロセスが停止しない**

#### 症状
- `npm run stop` が効かない
- バックグラウンドプロセスが残る
- 新しい起動ができない

#### 解決方法
```bash
# 強制停止
npm run stop:force

# 手動確認と停止
ps aux | grep -E "(vite|node|npm)"
pkill -9 -f "vite|node.*index.js"
```

---

### 3. **ビルドエラー**

#### 症状
- TypeScriptエラー
- 依存関係エラー
- `build:check` 失敗

#### 解決方法
```bash
# 依存関係の再インストール
rm -rf node_modules client/node_modules server/node_modules
npm install

# TypeScript設定確認
npm run lint
npm run build:check
```

---

### 4. **WSL環境での特有問題**

#### 症状
- ローカルホストにアクセスできない
- ネットワークエラー
- ポートが見つからない

#### 解決方法
```bash
# ホストIPでアクセス試行
hostname -I
# 出力されたIPアドレス:5173でアクセス

# WSL再起動
wsl --shutdown
# WSLを再起動後、再度アプリ起動
```

---

## 🔍 診断コマンド

### ポート使用状況確認
```bash
ss -tuln | grep -E ":5173|:5174|:3001"
```

### プロセス確認
```bash
ps aux | grep -E "(vite|node|npm)" | grep -v grep
```

### ログ確認
```bash
# サーバーログ
tail -f logs/server.log

# クライアントログ  
tail -f logs/client.log
```

### ネットワーク接続テスト
```bash
# クライアント接続テスト
curl -Is http://localhost:5173 | head -3

# サーバー接続テスト
curl -Is http://localhost:3001 | head -3
```

---

## 🛠️ 予防策

### 1. **正しい起動手順**
```bash
# 推奨: 自動復旧機能付きで起動
npm run dev

# 問題発生時: 強制クリーンアップ
npm run dev:safe
```

### 2. **正しい停止手順**
```bash
# Ctrl+C で停止 または
npm run stop
```

### 3. **定期メンテナンス**
```bash
# 月1回程度：依存関係更新
npm update

# 問題発生時：完全リセット
npm run stop:force
rm -rf node_modules */node_modules
npm install
npm run dev:safe
```

---

## 📋 チェックリスト

起動前に確認すべき項目：

- [ ] 以前のプロセスが停止されている
- [ ] `node_modules` が存在する
- [ ] ポート5173-5177が利用可能
- [ ] WSL環境の場合、ネットワーク設定が正常

問題発生時の報告に含める情報：

- [ ] エラーメッセージの全文
- [ ] `ps aux | grep -E "(vite|node)"` の出力
- [ ] `ss -tuln | grep -E ":5173|:5174|:3001"` の出力
- [ ] OS環境（WSL/Linux/macOS）
- [ ] 実行したコマンドの履歴

---

## 🆘 それでも解決しない場合

1. **完全リセット**
```bash
./scripts/stop-dev.sh --force
rm -rf node_modules client/node_modules server/node_modules logs
npm install
npm run dev:safe
```

2. **環境情報収集**
```bash
node --version
npm --version
uname -a
```

3. **GitHub Issues報告**
- エラーメッセージ
- 環境情報
- 実行手順
- 期待する動作

---

## 🎮 ゲーム関連の問題

### 1. **「サーバーに接続できませんでした」ポップアップ**

#### 症状
- トップページで継続的にエラーポップアップが表示
- 「サーバーに接続できませんでした」メッセージ

#### 解決方法
```bash
# 1. サーバー状態確認
curl http://localhost:3001/health

# 2. ポート番号確認（3001が正しい）
# client/.env の内容確認
cat client/.env
# VITE_SERVER_URL=http://localhost:3001

# 3. クライアント再起動
npm run stop
npm run dev
```

#### 根本原因
- 間違ったポート番号への接続試行（3003など）
- 環境変数の設定ミス
- サーバー未起動状態での自動接続試行

---

### 2. **WebSocket接続エラー**

#### 症状
- 画面上部で「未接続」が継続表示
- リアルタイム機能が動作しない

#### 解決方法
```bash
# 1. WebSocket接続確認
# ブラウザの開発者ツールで確認
# Console タブで WebSocket エラーをチェック

# 2. 環境変数確認
echo $VITE_SERVER_URL  # http://localhost:3001 であること

# 3. サーバー再起動
npm run stop:force
npm run dev
```

#### 本番環境での対処
```bash
# Vercel等のサーバーレス環境では WebSocket 制限あり
# 代替案：
# - Socket.io の polling fallback 使用
# - Pusher, Ably などの外部サービス利用
```

---

### 3. **カード作成エラー**

#### 症状
- 「カードの保存に失敗しました」エラー
- フォーム送信後にエラーレスポンス

#### 解決方法
```bash
# 1. バリデーション確認
カード名: 1-30文字以内
説明文: 1-200文字以内  
コスト: 0-20の数値
効果: 最大3つまで

# 2. サーバーAPI確認
curl -X POST http://localhost:3001/api/cards \
  -H "Content-Type: application/json" \
  -H "X-Player-Id: test_player" \
  -d '{"name":"テスト","cost":3,"type":"Action","effects":[],"description":"テスト"}'

# 3. ネットワーク接続確認
# ブラウザの Network タブでリクエストが正常に送信されているか確認
```

---

### 4. **CPU対戦が開始できない**

#### 症状
- 「🤖 CPU対戦」ボタンを押してもゲーム画面に移らない
- 難易度選択後に応答なし

#### 解決方法
```bash
# 1. ブラウザコンソール確認
# F12 → Console タブでJavaScriptエラーをチェック

# 2. WebSocket接続状態確認
# 「接続済み」になっていることを確認

# 3. サーバーログ確認
tail -f server/server.log
# startSinglePlayer イベントが正常に処理されているか確認

# 4. 代替手順
# ページを更新してから再試行
# 別の難易度で試行
```

---

## 🗄 データベース関連の問題

### 1. **MongoDB接続エラー**

#### 症状
- 「MongoDB接続失敗」ログ出力
- フォールバックモードでの動作

#### 解決方法
```bash
# 1. MongoDB接続文字列確認
echo $MONGODB_URI
# mongodb+srv://user:pass@cluster.mongodb.net/db 形式であること

# 2. ネットワーク接続確認
# MongoDB Atlas の IP ホワイトリスト設定確認
# 0.0.0.0/0 が設定されているか確認

# 3. フォールバックモード確認
# サーバー起動時に以下のメッセージが表示されるか
# "📦 フォールバックモードで動作します"
```

#### 本番環境設定
```bash
# 環境変数設定
DATABASE_FALLBACK=false  # 本番では false
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/webcardgame

# MongoDB Atlas ネットワークアクセス
# Vercel IP ranges を追加、または 0.0.0.0/0 を設定
```

---

### 2. **データ保存エラー**

#### 症状
- カード作成後にデータが保存されない
- ゲーム結果が記録されない

#### 解決方法
```bash
# 1. フォールバック状態確認
curl http://localhost:3001/health
# fallbackStorage の内容確認

# 2. MongoDB 接続復旧
# 接続文字列・認証情報の再確認
# ネットワーク設定の見直し

# 3. 手動データ確認
# MongoDB Compass等でデータが正常に保存されているか確認
```

---

## 🌐 デプロイ関連の問題

### 1. **Vercel デプロイエラー**

#### 症状
- Build failed エラー
- 関数の実行時間制限エラー

#### 解決方法
```bash
# 1. ローカルビルド確認
npm run build
# エラーが出る場合はローカルで修正

# 2. 環境変数確認
vercel env ls
# 必要な環境変数がすべて設定されているか確認

# 3. 再デプロイ実行
vercel --prod --force

# 4. ログ確認
vercel logs
```

#### よくあるエラー
```bash
# TypeScript エラー
解決: npm run lint で事前チェック

# 依存関係エラー  
解決: package.json の dependencies 確認

# メモリ不足
解決: Vercel Pro プランへアップグレード

# 実行時間制限（10秒）
解決: 処理の最適化またはサーバー移行
```

---

### 2. **環境変数が反映されない**

#### 症状
- 本番環境で環境変数が undefined
- 設定したはずの値が取得できない

#### 解決方法
```bash
# 1. Vercel Dashboard 確認
# https://vercel.com/dashboard
# プロジェクト → Settings → Environment Variables

# 2. スコープ確認
# Production, Preview, Development のスコープが正しく設定されているか

# 3. 変数名確認
# VITE_ プレフィックスがクライアント側変数に付いているか
# サーバー側は VITE_ なしで設定

# 4. 再デプロイ
vercel --prod  # 環境変数変更後は再デプロイ必須
```

---

## 🔍 パフォーマンス関連の問題

### 1. **ページロードが遅い**

#### 症状
- 初回アクセス時の読み込みが5秒以上
- JavaScript バンドルサイズが大きい

#### 解決方法
```bash
# 1. バンドルサイズ分析
npm run build
npm run analyze  # webpack-bundle-analyzer 必要

# 2. 不要なライブラリ削除
npm ls --depth=0
# 使用していないパッケージを package.json から削除

# 3. コード分割
# 動的インポートの活用
const Component = lazy(() => import('./Component'))

# 4. 画像最適化
# WebP形式の使用、適切なサイズでの配信
```

---

### 2. **WebSocket接続が不安定**

#### 症状
- 頻繁な切断・再接続
- リアルタイム更新の遅延

#### 解決方法
```bash
# 1. 接続設定最適化
# client/src/components/WebSocketProvider.tsx
const socket = io(serverUrl, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  retries: 3,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
})

# 2. ハートビート設定
# 定期的な ping/pong で接続維持

# 3. ネットワーク状況確認
# 開発者ツール → Network タブで接続状況確認
```

---

## 🔐 セキュリティ関連の問題

### 1. **CORS エラー**

#### 症状
- ブラウザコンソールで CORS エラー
- API リクエストが失敗

#### 解決方法
```bash
# 1. サーバー側 CORS 設定確認
# server/index.js で適切なオリジン設定

# 2. 本番環境 URL 設定
CLIENT_URL=https://your-app.vercel.app

# 3. 開発環境での設定
# localhost:5173 が許可されているか確認
```

---

### 2. **CSP (Content Security Policy) エラー**

#### 症状
- インライン スクリプト/スタイルがブロック
- 外部リソースの読み込み失敗

#### 解決方法
```bash
# 1. CSP ヘッダー調整
# Helmet.js 設定の見直し

# 2. nonce 使用
# インライン スクリプトに nonce 属性追加

# 3. unsafe-inline 許可（開発時のみ）
# 本番では適切な CSP 設定を維持
```

---

## 🧪 テスト関連の問題

### 1. **テストが失敗する**

#### 症状
- npm run test でエラー
- CI/CD パイプラインでの失敗

#### 解決方法
```bash
# 1. 依存関係確認
npm install
npm run test

# 2. テスト環境設定
# テスト用の環境変数設定
# .env.test ファイル作成

# 3. モックの設定確認
# WebSocket, fetch API等のモック設定
```

---

### 2. **E2E テストが不安定**

#### 症状
- ランダムな失敗
- タイミング依存の問題

#### 解決方法
```bash
# 1. 待機処理追加
# 要素の表示を待つ処理を追加

# 2. テスト環境の分離
# 専用のテスト環境でのテスト実行

# 3. リトライ機能
# 失敗時の自動リトライ設定
```

---

## 📊 監視・ログ関連の問題

### 1. **ログが出力されない**

#### 症状
- サーバーログが空
- エラーが記録されない

#### 解決方法
```bash
# 1. ログ設定確認
# console.log が適切に設定されているか

# 2. ログレベル確認
LOG_LEVEL=debug  # 詳細ログの有効化

# 3. ログファイル権限確認
ls -la logs/
# 書き込み権限があるか確認
```

---

### 2. **メトリクス収集エラー**

#### 症状
- パフォーマンスデータが取得できない
- 分析データが不正確

#### 解決方法
```bash
# 1. 分析ツール設定確認
# Google Analytics, Vercel Analytics の設定

# 2. プライバシー設定影響
# ブラウザの追跡防止機能の影響確認

# 3. サンプリング設定
# 適切なサンプリング率の設定
```

---

## 🔧 開発環境の問題

### 1. **Hot Reload が動作しない**

#### 症状
- ファイル変更が反映されない
- ブラウザの手動更新が必要

#### 解決方法
```bash
# 1. Vite 設定確認
# vite.config.ts の HMR 設定

# 2. ファイル監視設定
# WSL環境での polling 設定

# 3. ブラウザキャッシュクリア
# Ctrl+Shift+R または Cmd+Shift+R
```

---

### 2. **TypeScript エラーが解決されない**

#### 症状
- IDE でエラー表示が消えない
- ビルド時のエラー

#### 解決方法
```bash
# 1. TypeScript サーバー再起動
# VSCode: Ctrl+Shift+P → "TypeScript: Restart TS Server"

# 2. 型定義確認
npm install --save-dev @types/node

# 3. tsconfig.json 確認
# 適切なパス設定、ライブラリ設定
```

---

## 📋 問題解決チェックリスト

### 基本確認事項
- [ ] **サーバー起動確認**: `curl http://localhost:3001/health`
- [ ] **クライアント起動確認**: `curl http://localhost:5173/`
- [ ] **WebSocket接続確認**: ブラウザで「接続済み」表示
- [ ] **ポート使用状況**: `ss -tuln | grep -E ":5173|:3001"`
- [ ] **プロセス確認**: `ps aux | grep -E "(vite|node)"`

### ログ確認手順
```bash
# 1. ブラウザ開発者ツール
F12 → Console タブ → エラーメッセージ確認

# 2. Network タブ
API リクエストの状況確認

# 3. サーバーログ
tail -f server/server.log

# 4. 構造化ログ検索
grep "ERROR" logs/server.log
```

### 環境情報収集
```bash
# システム情報
node --version
npm --version
uname -a

# プロジェクト情報
npm ls --depth=0
git status
git log --oneline -5

# ネットワーク情報
hostname -I
ss -tuln | grep LISTEN
```

---

## 🆘 緊急対応手順

### 即座に試すべき解決策

#### 1. **完全リセット**
```bash
# 全プロセス停止
npm run stop:force

# 依存関係再インストール
rm -rf node_modules client/node_modules server/node_modules
npm install

# クリーン起動
npm run dev:safe
```

#### 2. **環境変数リセット**
```bash
# クライアント環境変数
echo 'VITE_SERVER_URL=http://localhost:3001' > client/.env

# サーバー再起動
npm run stop
npm run dev
```

#### 3. **ブラウザリセット**
```bash
# ハードリロード
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# キャッシュクリア
開発者ツール → Application → Storage → Clear storage
```

---

## 📞 サポート・問い合わせ

### 問題が解決しない場合

#### 情報収集
以下の情報を整理してから問い合わせ：

```bash
# 1. エラーメッセージ
完全なエラーメッセージとスタックトレース

# 2. 再現手順
問題が発生するまでの具体的な操作手順

# 3. 環境情報
OS、Node.js版、ブラウザ等の詳細

# 4. ログ出力
関連するサーバー・クライアントログ

# 5. 設定ファイル
package.json、環境変数等の設定内容
```

#### 問い合わせ先
- **GitHub Issues**: プロジェクトリポジトリのイシュー
- **技術ドキュメント**: 関連ドキュメントの再確認
- **コミュニティ**: Stack Overflow、Discord等

### 🔮 予防的メンテナンス

#### 定期実行推奨
```bash
# 週1回：依存関係チェック
npm audit
npm outdated

# 月1回：完全クリーンアップ
npm run stop:force
rm -rf node_modules */node_modules logs/*
npm install
npm run dev:safe

# 四半期：セキュリティ更新
npm audit fix
npm update
```

---

**このガイドで問題が解決されることを願っています。それでも解決しない場合は、遠慮なくサポートにお問い合わせください！🛠️✨**