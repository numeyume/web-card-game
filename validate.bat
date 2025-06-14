@echo off
chcp 65001 > nul
echo =====================================================
echo 🎮 Web Card Game MVP Validation Suite
echo =====================================================
echo.

echo 📋 Running comprehensive validation tests...
echo.

echo ⏯️  Step 1: Testing End Condition Engine...
node test-endgame.js
if %errorlevel% neq 0 (
    echo ❌ End Condition Engine test failed!
    pause
    exit /b 1
)
echo ✅ End Condition Engine test passed!
echo.

echo ⏯️  Step 2: Testing Voting System & Card Usage...
node test-voting-system.js
if %errorlevel% neq 0 (
    echo ❌ Voting System test failed!
    pause
    exit /b 1
)
echo ✅ Voting System test passed!
echo.

echo ⏯️  Step 3: Starting Server...
echo 🚀 Starting server on port 3001...
echo 📱 Client will be available at: http://localhost:5173
echo 🌐 Alternative WSL IP: http://192.168.23.44:5173
echo.
echo ⚠️  Note: Keep this window open while testing
echo ⚠️  Press Ctrl+C to stop the server
echo.

node index.cjs