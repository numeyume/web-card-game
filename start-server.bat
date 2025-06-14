@echo off
chcp 65001 > nul
echo =====================================================
echo 🚀 Web Card Game Server Startup
echo =====================================================
echo.

echo 📍 Starting Web Card Game server...
echo.
echo 🌐 Server URL: http://localhost:3001
echo 📱 Client URL: http://localhost:5173 (when client is running)
echo 🔄 Alternative: http://192.168.23.44:3001 (WSL IP)
echo.
echo 💡 To test the full application:
echo    1. Keep this server running
echo    2. Open another terminal in /client folder
echo    3. Run: npm run dev
echo    4. Open browser to http://localhost:5173
echo.
echo ⚠️  Press Ctrl+C to stop the server
echo ⚠️  Check server.log for detailed logs
echo.

node index.cjs