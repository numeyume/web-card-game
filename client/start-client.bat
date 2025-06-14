@echo off
chcp 65001 > nul
echo =====================================================
echo 📱 Web Card Game Client Startup
echo =====================================================
echo.

echo 📍 Starting Web Card Game client...
echo.
echo 🌐 Client URL: http://localhost:5173
echo 🔄 Alternative: http://192.168.23.44:5173 (WSL IP)
echo.
echo 💡 Make sure the server is running first:
echo    1. Navigate to parent folder
echo    2. Run 'start-server.bat'
echo    3. Then come back here and run this client
echo.
echo ⚠️  Press Ctrl+C to stop the client
echo.

cd /d "%~dp0"
npm run dev