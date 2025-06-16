#!/bin/bash

# 開発環境停止スクリプト
# Usage: ./scripts/stop-dev.sh [--force]

set -e

# 色付きログ関数
log_info() { echo -e "\033[34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[32m[SUCCESS]\033[0m $1"; }
log_warning() { echo -e "\033[33m[WARNING]\033[0m $1"; }

FORCE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--force]"
      exit 1
      ;;
  esac
done

log_info "🛑 Web Card Game 開発環境を停止中..."

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# 保存されたPIDから停止
if [ -f ".tmp/pids" ]; then
  source .tmp/pids
  
  if [ -n "${CLIENT_PID:-}" ]; then
    log_info "クライアント停止中 (PID: $CLIENT_PID)"
    kill $CLIENT_PID 2>/dev/null || true
  fi
  
  if [ -n "${SERVER_PID:-}" ]; then
    log_info "サーバー停止中 (PID: $SERVER_PID)"
    kill $SERVER_PID 2>/dev/null || true
  fi
  
  rm -f .tmp/pids
fi

# プロセス名から停止
log_info "関連プロセスを停止中..."

if [ "$FORCE" = true ]; then
  # 強制停止
  pkill -9 -f "vite" 2>/dev/null || true
  pkill -9 -f "node.*index.js" 2>/dev/null || true
  pkill -9 -f "nodemon" 2>/dev/null || true
  log_warning "強制停止を実行しました"
else
  # 通常停止
  pkill -f "vite" 2>/dev/null || true
  pkill -f "node.*index.js" 2>/dev/null || true
  pkill -f "nodemon" 2>/dev/null || true
fi

# 少し待機してプロセス確認
sleep 2

# まだ残っているプロセスがあるかチェック
remaining=$(ps aux | grep -E "(vite|node.*index\.js|nodemon)" | grep -v grep | wc -l)

if [ $remaining -gt 0 ]; then
  log_warning "一部のプロセスが残っています。強制停止するには --force オプションを使用してください。"
  ps aux | grep -E "(vite|node.*index\.js|nodemon)" | grep -v grep
else
  log_success "✅ すべてのプロセスが正常に停止されました"
fi

# ログファイルクリーンアップ
if [ -d "logs" ]; then
  log_info "ログファイルをアーカイブ中..."
  timestamp=$(date +"%Y%m%d_%H%M%S")
  mkdir -p logs/archive
  [ -f "logs/client.log" ] && mv logs/client.log "logs/archive/client_$timestamp.log"
  [ -f "logs/server.log" ] && mv logs/server.log "logs/archive/server_$timestamp.log"
fi

log_success "🔚 開発環境の停止が完了しました"