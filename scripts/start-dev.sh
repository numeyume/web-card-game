#!/bin/bash

# 開発環境起動スクリプト - 自動復旧機能付き
# Usage: ./scripts/start-dev.sh [--force-clean] [--client-only] [--server-only]

set -e

# 色付きログ関数
log_info() { echo -e "\033[34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[32m[SUCCESS]\033[0m $1"; }
log_warning() { echo -e "\033[33m[WARNING]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

# オプション解析
FORCE_CLEAN=false
CLIENT_ONLY=false
SERVER_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --force-clean)
      FORCE_CLEAN=true
      shift
      ;;
    --client-only)
      CLIENT_ONLY=true
      shift
      ;;
    --server-only)
      SERVER_ONLY=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--force-clean] [--client-only] [--server-only]"
      exit 1
      ;;
  esac
done

# プロセス停止関数
cleanup_processes() {
  log_info "既存プロセスを停止中..."
  
  # graceful stop
  pkill -f "vite" 2>/dev/null || true
  pkill -f "node.*index.js" 2>/dev/null || true
  pkill -f "nodemon" 2>/dev/null || true
  
  sleep 2
  
  # force stop if needed
  pkill -9 -f "vite" 2>/dev/null || true
  pkill -9 -f "node.*index.js" 2>/dev/null || true
  pkill -9 -f "nodemon" 2>/dev/null || true
  
  log_success "プロセス停止完了"
}

# ポート確認関数
check_ports() {
  local ports=("5173" "5174" "5175" "3001" "3003")
  local used_ports=()
  
  for port in "${ports[@]}"; do
    if ss -tuln | grep -q ":$port "; then
      used_ports+=("$port")
    fi
  done
  
  if [ ${#used_ports[@]} -gt 0 ]; then
    log_warning "使用中のポート: ${used_ports[*]}"
    if [ "$FORCE_CLEAN" = true ]; then
      log_info "強制クリーンアップを実行中..."
      cleanup_processes
    fi
  fi
}

# ヘルスチェック関数
health_check() {
  local url=$1
  local service_name=$2
  local max_attempts=10
  local attempt=1
  
  log_info "$service_name のヘルスチェック中..."
  
  while [ $attempt -le $max_attempts ]; do
    if curl -s --max-time 3 "$url" > /dev/null 2>&1; then
      log_success "$service_name は正常に起動しました: $url"
      return 0
    fi
    
    log_info "$service_name 起動待機中... ($attempt/$max_attempts)"
    sleep 2
    ((attempt++))
  done
  
  log_error "$service_name の起動に失敗しました: $url"
  return 1
}

# メイン処理開始
log_info "🚀 Web Card Game 開発環境を起動中..."

# 強制クリーンアップまたはポート確認
if [ "$FORCE_CLEAN" = true ]; then
  cleanup_processes
else
  check_ports
fi

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# 依存関係チェック
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
  log_info "依存関係をインストール中..."
  npm install
fi

# サーバー起動
if [ "$CLIENT_ONLY" = false ]; then
  log_info "🌐 サーバーを起動中..."
  cd server
  PORT=3001 node index.js > ../logs/server.log 2>&1 &
  SERVER_PID=$!
  cd ..
  
  # サーバーヘルスチェック
  if ! health_check "http://localhost:3001" "サーバー"; then
    log_error "サーバー起動に失敗しました"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
fi

# クライアント起動
if [ "$SERVER_ONLY" = false ]; then
  log_info "💻 クライアントを起動中..."
  cd client
  
  # 利用可能ポートを検出
  CLIENT_PORT=5173
  for port in 5173 5174 5175 5176 5177; do
    if ! ss -tuln | grep -q ":$port "; then
      CLIENT_PORT=$port
      break
    fi
  done
  
  log_info "クライアントポート: $CLIENT_PORT"
  VITE_PORT=$CLIENT_PORT npm run dev > ../logs/client.log 2>&1 &
  CLIENT_PID=$!
  cd ..
  
  # クライアントヘルスチェック
  if ! health_check "http://localhost:$CLIENT_PORT" "クライアント"; then
    log_error "クライアント起動に失敗しました"
    kill $CLIENT_PID 2>/dev/null || true
    [ "$CLIENT_ONLY" = false ] && kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
  
  log_success "🎯 アプリケーションにアクセス: http://localhost:$CLIENT_PORT/"
fi

# プロセス情報保存
mkdir -p .tmp
echo "CLIENT_PID=${CLIENT_PID:-}" > .tmp/pids
echo "SERVER_PID=${SERVER_PID:-}" >> .tmp/pids
echo "CLIENT_PORT=${CLIENT_PORT:-}" >> .tmp/pids

log_success "✅ 開発環境の起動が完了しました！"

# 終了時のクリーンアップ設定
trap 'log_info "終了処理中..."; kill ${CLIENT_PID:-} ${SERVER_PID:-} 2>/dev/null || true; exit' INT TERM

# フォアグラウンドで実行継続（Ctrl+Cで終了）
if [ "$CLIENT_ONLY" = false ] && [ "$SERVER_ONLY" = false ]; then
  log_info "Ctrl+C で終了します..."
  wait
fi