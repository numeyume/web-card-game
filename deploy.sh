#!/bin/bash

# Web Card Game ローカルデプロイメントスクリプト
# このスクリプトはプロダクション環境でのローカル配信用です

set -e

echo "🚀 Web Card Game ローカルデプロイメント開始..."

# 色付きログ関数
log_info() {
    echo -e "\033[34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[32m[SUCCESS]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

log_warn() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

# 必要なディレクトリ作成
log_info "📁 デプロイメント用ディレクトリを作成中..."
mkdir -p dist/client
mkdir -p dist/server
mkdir -p dist/logs

# 現在のプロセスを停止
log_info "🛑 既存プロセスを停止中..."
pkill -f "node.*index.js" || true
pkill -f "vite" || true
sleep 2

# クライアントビルド
log_info "🏗️ クライアントをビルド中..."
cd client
npm run build
log_success "✅ クライアントビルド完了"

# ビルドファイルをコピー
log_info "📦 ビルドファイルをコピー中..."
cp -r dist/* ../dist/client/
cd ..

# サーバーファイルをコピー
log_info "🖥️ サーバーファイルをコピー中..."
cp -r server/* dist/server/
cp package.json dist/
cp -r node_modules dist/ 2>/dev/null || log_warn "node_modules not found, will install dependencies"

# 依存関係のインストール
if [ ! -d "dist/node_modules" ]; then
    log_info "📦 依存関係をインストール中..."
    cd dist
    npm install --production
    cd ..
fi

# プロダクション用設定ファイル作成
log_info "⚙️ プロダクション設定を作成中..."
cat > dist/.env << EOF
NODE_ENV=production
PORT=3001
CLIENT_URL=http://localhost:3001
MONGODB_URI=mongodb://localhost:27017/web-card-game
DATABASE_FALLBACK=true
LOG_LEVEL=info
EOF

# プロダクション用スタートスクリプト作成
cat > dist/start.sh << 'EOF'
#!/bin/bash

# Web Card Game プロダクション起動スクリプト

set -e

echo "🎮 Web Card Game を起動中..."

# 環境変数読み込み
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# ログディレクトリ作成
mkdir -p logs

# サーバー起動
echo "🚀 サーバーを起動中... (ポート: ${PORT:-3001})"
cd server
node index.js > ../logs/server.log 2>&1 &
SERVER_PID=$!

echo "📋 プロセス情報:"
echo "  - サーバーPID: $SERVER_PID"
echo "  - アクセスURL: http://localhost:${PORT:-3001}"
echo "  - ログファイル: logs/server.log"

# PIDファイル保存
echo $SERVER_PID > ../logs/server.pid

echo "✅ 起動完了！"
echo ""
echo "🌐 ブラウザで http://localhost:${PORT:-3001} にアクセスしてください"
echo "🛑 停止するには: ./stop.sh を実行してください"
EOF

# 停止スクリプト作成
cat > dist/stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Web Card Game を停止中..."

# PIDファイルから停止
if [ -f logs/server.pid ]; then
    SERVER_PID=$(cat logs/server.pid)
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "📋 サーバープロセス ($SERVER_PID) を停止中..."
        kill $SERVER_PID
        sleep 2
        if kill -0 $SERVER_PID 2>/dev/null; then
            echo "⚠️ 強制停止中..."
            kill -9 $SERVER_PID
        fi
    fi
    rm -f logs/server.pid
fi

# 念のため関連プロセス全て停止
pkill -f "node.*index.js" || true

echo "✅ 停止完了"
EOF

# 実行権限付与
chmod +x dist/start.sh
chmod +x dist/stop.sh

# サーバーのexpress設定を静的ファイル配信用に修正
log_info "🔧 サーバー設定を修正中..."
cat > dist/server/static-server.js << 'EOF'
// プロダクション用静的ファイル配信設定
const express = require('express');
const path = require('path');

module.exports = function setupStaticServer(app) {
    // 静的ファイル配信
    app.use(express.static(path.join(__dirname, '../client')));
    
    // SPAのルーティング対応
    app.get('*', (req, res, next) => {
        // API リクエストは除外
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
            return next();
        }
        
        // 静的ファイルリクエストは除外
        if (req.path.includes('.')) {
            return next();
        }
        
        // SPAのindex.htmlを返す
        res.sendFile(path.join(__dirname, '../client/index.html'));
    });
};
EOF

# サーバーのindex.jsを修正してスタティックサーバーを追加
log_info "📝 サーバーコードを修正中..."
if ! grep -q "static-server" dist/server/index.js; then
    # static-server の require を追加
    sed -i '/^const app = express();/a const setupStaticServer = require('"'"'./static-server'"'"');' dist/server/index.js
    
    # static server setup を追加
    sed -i '/^app.use(express.json());/a setupStaticServer(app);' dist/server/index.js
fi

# デプロイメント情報ファイル作成
cat > dist/deployment-info.json << EOF
{
    "name": "Web Card Game",
    "version": "1.0.0",
    "deployedAt": "$(date -Iseconds)",
    "environment": "production-local",
    "endpoints": {
        "frontend": "http://localhost:3001",
        "api": "http://localhost:3001/api",
        "health": "http://localhost:3001/health"
    },
    "features": [
        "Dominion Card Game",
        "Custom Card Creation", 
        "CPU Battle",
        "Tutorial System",
        "Card Collection",
        "Real-time Multiplayer"
    ]
}
EOF

# README作成
cat > dist/README.md << 'EOF'
# Web Card Game - ローカルデプロイメント

## 🎮 概要
Web Card Game のプロダクション用ローカルデプロイメントです。

## 🚀 起動方法

```bash
# サーバー起動
./start.sh

# ブラウザでアクセス
# http://localhost:3001
```

## 🛑 停止方法

```bash
./stop.sh
```

## 📋 機能

- **ドミニオンゲーム**: 本格的なCPU対戦
- **カード作成**: オリジナルカードの作成機能  
- **チュートリアル**: 詳細な学習システム
- **コレクション**: 作成したカードの管理
- **マルチプレイヤー**: リアルタイム対戦（オプション）

## 🔧 技術仕様

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Node.js + Express + Socket.IO
- **データベース**: MongoDB (フォールバックモード対応)
- **配信**: Express静的ファイルサーバー

## 📁 ディレクトリ構成

```
dist/
├── client/          # ビルド済みフロントエンド
├── server/          # サーバーコード
├── logs/            # ログファイル
├── start.sh         # 起動スクリプト
├── stop.sh          # 停止スクリプト
└── .env             # 環境設定
```

## 🐛 トラブルシューティング

### ポートが使用中の場合
```bash
# プロセス確認
lsof -i :3001

# 強制停止
./stop.sh
```

### ログ確認
```bash
tail -f logs/server.log
```

### 再ビルド
```bash
# 元のディレクトリで再デプロイ
cd ..
./deploy.sh
```
EOF

log_success "🎉 デプロイメント完了！"
echo ""
echo "📁 デプロイ先: $(pwd)/dist"
echo "🚀 起動コマンド: cd dist && ./start.sh"
echo "🌐 アクセス URL: http://localhost:3001"
echo "🛑 停止コマンド: cd dist && ./stop.sh"
echo ""
echo "📖 詳細情報: dist/README.md を参照してください"