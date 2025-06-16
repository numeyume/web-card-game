import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 自動ポート検出とフォールバック
const getAvailablePort = () => {
  const preferredPorts = [5173, 5174, 5175, 5176, 5177]
  const envPort = process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : null
  
  if (envPort && !preferredPorts.includes(envPort)) {
    preferredPorts.unshift(envPort)
  }
  
  // 開発時は最初の利用可能ポートを使用
  return preferredPorts[0]
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: getAvailablePort(),
    host: '0.0.0.0', // WSL対応：すべてのネットワークインターフェースでリスニング
    strictPort: false, // ポート競合時に自動的に次のポートを試行
    open: false, // 自動ブラウザ起動を無効化（WSL環境対応）
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})