#!/bin/bash

# Web Card Game Vercel Deployment Script
# Vercelへの安全で確実なデプロイメントを実行

set -e  # エラー時に停止

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# デプロイ前チェック
log_info "🚀 Web Card Game Vercelデプロイメント開始..."

# 1. Git状態確認
log_info "📋 Git状態確認中..."
if [ -n "$(git status --porcelain)" ]; then
    log_warning "未コミットの変更があります。コミットしてからデプロイすることを推奨します。"
    read -p "続行しますか？ (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "デプロイをキャンセルしました"
        exit 1
    fi
fi

# 2. 依存関係の確認
log_info "📦 依存関係の確認とインストール..."
if [ ! -d "node_modules" ]; then
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    cd client && npm install && cd ..
fi

# 3. リンティングチェック
log_info "🔍 コードクオリティチェック中..."
npm run lint 2>/dev/null || log_warning "リンティングでワーニングがあります"

# 4. TypeScriptビルドチェック
log_info "🔨 TypeScriptビルドチェック中..."
cd client
if ! npm run build:check 2>/dev/null; then
    log_error "TypeScriptエラーがあります。修正してからデプロイしてください。"
    cd ..
    exit 1
fi
cd ..

# 5. プロダクションビルド
log_info "🏗️ プロダクションビルド実行中..."
cd client
if ! npm run build; then
    log_error "ビルドに失敗しました"
    cd ..
    exit 1
fi
cd ..

# 6. ビルド出力確認
log_info "📁 ビルド出力確認中..."
if [ ! -d "client/dist" ]; then
    log_error "ビルド出力ディレクトリが見つかりません"
    exit 1
fi

if [ ! -f "client/dist/index.html" ]; then
    log_error "index.htmlが見つかりません"
    exit 1
fi

# バンドルサイズチェック
log_info "📊 バンドルサイズチェック中..."
BUNDLE_SIZE=$(du -sm client/dist | cut -f1)
if [ "$BUNDLE_SIZE" -gt 5 ]; then
    log_warning "バンドルサイズが大きいです: ${BUNDLE_SIZE}MB"
fi

# 7. API Functions確認
log_info "🔧 API Functions確認中..."
required_apis=("api/cards.js" "api/cards/[id].js" "api/health.js" "api/package.json")
for api in "${required_apis[@]}"; do
    if [ ! -f "$api" ]; then
        log_error "必須APIファイルが見つかりません: $api"
        exit 1
    fi
done

# API構文チェック
log_info "🧪 API構文チェック中..."
for js_file in api/*.js api/*/*.js; do
    if [ -f "$js_file" ]; then
        if ! node -c "$js_file" 2>/dev/null; then
            log_error "APIファイルに構文エラーがあります: $js_file"
            exit 1
        fi
    fi
done

# 8. vercel.json確認
log_info "⚙️ Vercel設定確認中..."
if [ ! -f "vercel.json" ]; then
    log_error "vercel.jsonが見つかりません"
    exit 1
fi

# vercel.json構文チェック
if ! python3 -m json.tool vercel.json > /dev/null 2>&1; then
    log_error "vercel.jsonに構文エラーがあります"
    exit 1
fi

# 9. ローカルAPIテスト（サーバーが起動している場合）
log_info "🧪 ローカルAPIテスト実行中..."
if curl -f -s --max-time 3 http://localhost:3001/health > /dev/null 2>&1; then
    log_success "ローカルサーバーが応答しています"
    
    # カード作成テスト
    TEST_CARD_DATA='{"name":"デプロイテスト","type":"Action","description":"デプロイ前テスト用カード","effects":[]}'
    if curl -f -s --max-time 5 -X POST http://localhost:3001/api/cards \
        -H "Content-Type: application/json" \
        -d "$TEST_CARD_DATA" > /dev/null 2>&1; then
        log_success "カード作成APIが正常に動作しています"
    else
        log_warning "カード作成APIテストが失敗しました（本番環境では正常に動作する可能性があります）"
    fi
    
    # カード一覧取得テスト
    if curl -f -s --max-time 3 http://localhost:3001/api/cards > /dev/null 2>&1; then
        log_success "カード一覧APIが正常に動作しています"
    else
        log_warning "カード一覧APIテストが失敗しました"
    fi
else
    log_warning "ローカルサーバーが起動していません（本番環境テストのみ実行されます）"
fi

# 10. デプロイ準備完了
log_success "✅ 全ての事前チェックが完了しました"
echo
echo "📋 デプロイ準備状況:"
echo "   ✅ Git状態確認済み"
echo "   ✅ 依存関係確認済み"
echo "   ✅ TypeScriptビルド成功"
echo "   ✅ プロダクションビルド成功"
echo "   ✅ API Functions確認済み"
echo "   ✅ Vercel設定確認済み"
echo

# 11. デプロイ実行確認
log_info "🚀 Vercelへのデプロイを開始します"

# プロダクションかプレビューかを選択
echo "デプロイ環境を選択してください:"
echo "  1) プレビュー環境 (テスト用)"
echo "  2) プロダクション環境 (本番)"
read -p "選択 (1 or 2): " -n 1 -r
echo

case $REPLY in
    1)
        log_info "🔍 プレビュー環境にデプロイ中..."
        DEPLOY_CMD="vercel"
        ENVIRONMENT="preview"
        ;;
    2)
        log_info "🌟 プロダクション環境にデプロイ中..."
        DEPLOY_CMD="vercel --prod"
        ENVIRONMENT="production"
        ;;
    *)
        log_error "無効な選択です"
        exit 1
        ;;
esac

# Vercel CLI確認
if ! command -v vercel >/dev/null 2>&1; then
    log_error "Vercel CLIがインストールされていません"
    log_info "以下のコマンドでインストールしてください:"
    log_info "npm install -g vercel"
    exit 1
fi

# デプロイ実行
log_info "📤 デプロイを実行しています..."
echo "実行コマンド: $DEPLOY_CMD"
echo

if DEPLOY_OUTPUT=$($DEPLOY_CMD 2>&1); then
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^[:space:]]*' | tail -1)
    
    if [ -n "$DEPLOY_URL" ]; then
        log_success "✅ デプロイが完了しました！"
        log_info "🌐 デプロイURL: $DEPLOY_URL"
        
        # デプロイ後テスト
        log_info "🧪 デプロイ後テスト実行中..."
        log_info "デプロイ完了を待機中..."
        
        # 段階的に待機時間を増やしてテスト
        for wait_time in 10 20 30; do
            sleep $wait_time
            log_info "テスト実行中... (${wait_time}秒後)"
            
            # Health Check
            if curl -f -s --max-time 10 "$DEPLOY_URL/health" > /dev/null 2>&1; then
                log_success "Health Checkが成功しました"
                break
            else
                log_warning "Health Check待機中... (${wait_time}秒経過)"
                if [ $wait_time -eq 30 ]; then
                    log_warning "Health Checkがタイムアウトしました。手動で確認してください。"
                fi
            fi
        done
        
        # Cards API テスト
        sleep 5
        if curl -f -s --max-time 10 "$DEPLOY_URL/api/cards" > /dev/null 2>&1; then
            log_success "Cards APIが応答しています"
        else
            log_warning "Cards APIテストが失敗しました。手動で確認してください。"
        fi
        
        log_success "🎉 デプロイメントプロセスが完了しました！"
        echo
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📋 デプロイ完了情報"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🌐 URL:        $DEPLOY_URL"
        echo "📱 環境:        $ENVIRONMENT"
        echo "📅 デプロイ日時: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "📊 バンドルサイズ: ${BUNDLE_SIZE}MB"
        echo
        echo "🔗 重要なエンドポイント:"
        echo "   メイン:      $DEPLOY_URL"
        echo "   ヘルス:      $DEPLOY_URL/health"
        echo "   カードAPI:   $DEPLOY_URL/api/cards"
        echo
        echo "✅ 確認事項:"
        echo "   - [ ] アプリケーションが正常に表示される"
        echo "   - [ ] カード作成が動作する"
        echo "   - [ ] カードコレクションが表示される"
        echo "   - [ ] API エンドポイントが応答する"
        echo "   - [ ] WebSocket機能が適切に動作する（本番では無効化済み）"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo
        
        # ブラウザで開くかの確認
        read -p "ブラウザでアプリケーションを開きますか？ (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if command -v xdg-open >/dev/null 2>&1; then
                xdg-open "$DEPLOY_URL"
            elif command -v open >/dev/null 2>&1; then
                open "$DEPLOY_URL"
            else
                log_info "ブラウザで以下のURLにアクセスしてください: $DEPLOY_URL"
            fi
        fi
        
    else
        log_error "デプロイURLの取得に失敗しました"
        log_info "デプロイ出力:"
        echo "$DEPLOY_OUTPUT"
        exit 1
    fi
else
    log_error "デプロイに失敗しました"
    log_info "エラー出力:"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

log_success "🏁 Vercelデプロイメントスクリプトが正常に完了しました"