# Development Instructions for Claude

## 🚨 IMPORTANT: Debugging Policy
**ユーザーにデバッグをさせるのではなく、提示する前にデバッグを行う**

Claudeは以下の手順でデバッグを完了してからユーザーに結果を提示すること：

1. **事前確認**: コマンド実行前にサーバー状態、ポート使用状況、プロセス状況を確認
2. **完全テスト**: 機能を提示する前に実際に動作するかテスト
3. **エラー解決**: 発見したエラーは即座に修正してから提示
4. **動作確認**: 最終的にユーザーが使用可能な状態になってから報告
5. **実環境テスト**: 実際の環境で修正されているかをテストしてから報告すること

**NG例**: "接続が拒否されました。ポートを確認してください。"
**OK例**: "問題を確認して修正しました。http://localhost:5173/ でゲームをお楽しみください。"

## ⚠️ 必須: 実環境テスト報告
**すべての修正は実際の環境でテストしてから報告すること**
- コード修正後は必ずTypeScriptコンパイルとビルドを実行
- 開発サーバーが正常に動作することを確認
- ブラウザで実際の動作を検証してから報告
- 推測や理論ではなく、実際のテスト結果を報告すること

## Commands to Remember

### Development
```bash
# ✅ 推奨：自動復旧機能付き起動（ポート競合を自動解決）
npm run dev

# 🔧 問題発生時：強制クリーンアップ後に起動
npm run dev:safe

# 🎯 個別起動
npm run dev:client    # クライアントのみ
npm run dev:server    # サーバーのみ

# 🛑 安全な停止
npm run stop          # 通常停止
npm run stop:force    # 強制停止

# 📦 ビルド・テスト
npm run build
npm run test
npm run lint
```

### 🚨 緊急時の手動復旧
```bash
# プロセス強制停止
./scripts/stop-dev.sh --force

# クリーンアップ後に再起動
./scripts/start-dev.sh --force-clean

# 手動プロセス確認
ps aux | grep -E "(vite|node|npm)"
ss -tuln | grep -E ":5173|:5174|:3001"
```

## 🚨 機能変更に関する重要な注意事項

### ❌ 絶対にやってはいけないこと
**機能の大幅な改修はしてはいけません**

- **UI・UXの改善**: ✅ OK（ボタンのスタイル、アニメーション、レイアウト変更など）
- **機能の追加・削除・変更**: ❌ NG（ゲームルール、データ構造、API仕様など）

### 🔍 機能変更の境界線
**OK例（UI/UX改善）:**
- ボタンのデザイン変更（色、サイズ、hover効果）
- アニメーション追加・改善
- レスポンシブデザイン調整
- ツールチップ・説明文の追加
- ローディング画面の改善

**NG例（機能変更）:**
- ゲームのルール変更
- カードの効果や仕様変更
- API の構造変更
- 新しい機能の追加
- データベースの構造変更
- 既存の動作フローの変更

### 🔧 過去の問題例と再発防止策
**問題**: CPU対戦のブラックスクリーン修正で意図せず機能変更が発生

**原因分析:**
1. デバッグ機能の追加により予期しない副作用が発生
2. ゲーム初期化ロジックの変更で既存動作に影響
3. UI改善とコア機能修正の境界が曖昧

**再発防止策:**
1. **変更前チェック**: 修正がUI/UXのみかコア機能に影響するか確認
2. **段階的修正**: UI改善とバグ修正を分離して実行
3. **テスト重視**: 既存機能への影響を必ず確認
4. **変更理由の明確化**: なぜその変更が必要かを説明してから実行

### 📋 修正時のチェックリスト
修正作業前に以下を確認:
- [ ] この変更はUI/UXの改善のみか？
- [ ] 既存のゲーム機能に影響しないか？
- [ ] 新しい機能を追加していないか？
- [ ] データ構造やAPIに変更がないか？

### 🔧 問題解決報告前の実動作検証必須
**問題を解決したと発言する前に実際に動作させて検証してください**

**検証手順:**
1. **修正完了後**: 必ず実際のブラウザでテスト実行
2. **動作確認**: 修正した機能が正常に動作することを確認
3. **エラーチェック**: コンソールエラーがないことを確認
4. **完全フロー**: ユーザーが実際に使用する流れをテスト
5. **検証完了後**: 検証結果を含めて報告

**NG例**: 「修正しました。これで問題は解決しているはずです。」
**OK例**: 「修正を行い、実際にブラウザで動作確認しました。http://localhost:5173でCPU対戦が正常に開始されることを確認済みです。」

### ⚡ 効率化のための並行ツール使用
**効率を高めるためならば並行して複数のツールを起動してもよいです**

**並行実行推奨例:**
- 複数ファイルの同時読み取り
- ビルド + リント + テストの並行実行
- 複数のデバッグコマンド同時実行
- 複数のポート・プロセス確認を並行実行

**並行実行のメリット:**
- 作業時間の大幅短縮
- 包括的な状況把握
- 効率的なデバッグ

**例:**
```bash
# 並行実行例
npm run build & npm run lint & npm run test
ps aux | grep node & ss -tuln | grep 5173 & curl localhost:5173
```

## ⚠️ 重要: 完了時の必須チェック

### 🔧 ビルドテスト
**必ず以下のコマンドが成功することを確認してください:**
```bash
# 1. リンティングチェック
npm run lint

# 2. TypeScriptチェック（クライアント）
cd client && npm run build:check

# 3. プロダクションビルド
npm run build

# 4. テスト実行
npm run test
```

### 🎯 動作確認チェックリスト
**すべての機能が動作することを確認:**
- ✅ **http://localhost:5173/** でクライアントアクセス可能
- ✅ **WebSocket接続**: ブラウザコンソールで「接続済み」表示
- ✅ **カード作成**: 保存ボタンで正常にカード作成可能
- ✅ **カードコレクション**: 保存したカードが表示される
- ✅ **CPU対戦**: 🤖ボタンでCPU対戦が開始される
- ✅ **マルチプレイヤー**: ルーム作成・参加が可能

### 🐛 トラブルシューティング
**問題が発生した場合:**
```bash
# ✅ 推奨: 自動復旧機能を使用
npm run dev:safe

# 🔧 手動復旧（レガシー）
npm run stop:force
npm run dev
```

**詳細なトラブルシューティング:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### 🏗️ 自動復旧システム
- **ポート競合の自動検出・回避**
- **プロセス残留の自動クリーンアップ**  
- **ヘルスチェック機能**
- **WSL環境対応**

### Setup (First Time)
```bash
# Install dependencies
npm install

# Setup environment files
cp .env.example .env
cp client/.env.example client/.env

# Start development
npm run dev
```

## Project Structure

```
/client      # React + Vite + TypeScript frontend
  /src
    /components # React components (GameBoard, Lobby, WebSocketProvider)
    /types     # TypeScript type definitions
    /hooks     # Custom React hooks
    /utils     # Utility functions

/server      # Node.js + Express + Socket.IO backend  
  /src
    /routes    # REST API routes (/rooms, /cards)
    /socket    # Socket.IO event handlers
    /services  # Business logic (MatchmakerService)
    /engine    # Game engines (scoring, deck, end conditions)
    /middleware # Auth, error handling
    /types     # TypeScript type definitions

/infrastructure # Terraform / k8s manifests (future)
```

## Current Implementation Status

### ✅ COMPLETE MVP - Phase 4 実装完了 (Full Feature Set)
- Full monorepo setup with workspaces
- React client with Tailwind CSS and responsive design
- Node.js server with Express + Socket.IO + CommonJS compatibility
- Real-time multiplayer game functionality with Socket.IO v4
- Room creation/joining system with matchmaker
- Complete game board UI with hand, field, timer, end condition status
- Scoring system with Formula 4.4 (GameScore + CreatorScore)
- Anonymous authentication system with JWT fallback
- **CardBuilder component** with drag & drop effects and auto-description
- **MongoDB integration** with development fallback mode
- **End Condition Engine** with 3 termination types (time/turn/empty piles)
- **Deck Engine** with Fisher-Yates shuffle, draw, discard mechanics
- **EndGameModal** with animated rankings and comprehensive scoring
- **Real-time end game detection** with WebSocket notifications
- **Complete test suite** for all engines (test-endgame.js)
- **🗳️ Card Usage Tracking Engine** with real-time play/buy recording
- **📊 Player Analytics** with play style analysis (Aggressive/Balanced/Creator/etc.)
- **🎯 Voting System** with like/dislike, toggle votes, and controversy detection
- **📈 ResultModal** with detailed card rankings, usage statistics, and voting UI
- **🌍 Global Statistics** for cross-game card popularity and player insights
- **⚡ Real-time voting sessions** with automatic timeout and result calculation

### 📚 ゲームルール

### ドミニオン基本ルール
詳細なルールは [DOMINION_RULES.md](./DOMINION_RULES.md) を参照してください。

**要点:**
- **3フェーズ制**: アクション → 購入 → クリーンアップ
- **手動財宝プレイ**: 購入フェーズで財宝カードを手動でプレイしてコイン獲得
- **制限システム**: アクション1回・購入1回（カード効果で増加可能）
- **勝利条件**: 属州枯渇 or 3種類のカード山枯渇
- **得点計算**: 自分のデッキ内の勝利点カード合計

## 🔮 Future Enhancements (Optional P3+)
- BigQuery analytics for production usage tracking
- Production deployment configs with Docker/k8s
- Advanced card balancing AI recommendations
- Performance optimizations and load testing
- Spectator mode and tournament features

## Architecture Notes

### Game Flow
1. **Lobby** → Create/join rooms via REST API + WebSocket
2. **Game Start** → Matchmaker initializes game state  
3. **Game Loop** → Socket events (playCard, buyCard, endTurn)
4. **Game End** → Score calculation with creator bonuses
5. **Results** → Match results with rankings

### Real-time Communication
- **REST API** for room management, card CRUD
- **WebSocket** for real-time game state synchronization
- **Authentication** via JWT with anonymous fallback

### Scoring Formula (4.4)
- **GameScore** = Victory Points × Base Multiplier
- **CreatorScore** = (Others' card usage × 10) + (Own usage × 5)  
- **TotalScore** = GameScore + CreatorScore

### Advanced Features
- **Card Usage Tracking**: Every card play/buy is recorded with player analytics
- **Voting System**: Post-game voting on cards with like/dislike and controversy detection
- **Player Analysis**: Automatic play style classification (Aggressive/Balanced/Creator/Explorer/Builder)
- **Real-time Statistics**: Live game stats and end condition monitoring
- **Community Features**: Global card popularity and cross-game insights

## Testing

Run tests with coverage:
```bash
npm run test
```

For load testing (when implemented):
```bash
# k6 load test for 100 concurrent players
k6 run --vus 100 --duration 30s loadtest.js
```