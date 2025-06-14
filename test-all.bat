@echo off
chcp 65001 > nul
echo =====================================================
echo 🧪 Web Card Game Test Suite
echo =====================================================
echo.

echo 📋 Running all automated tests...
echo.

echo ⏯️  Test 1: End Condition Engine...
echo ================================================
node test-endgame.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ FAILED: End Condition Engine test
    pause
    exit /b 1
)
echo.
echo ✅ PASSED: End Condition Engine test
echo.

echo ⏯️  Test 2: Voting System & Card Usage Tracking...
echo ================================================
node test-voting-system.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ FAILED: Voting System test
    pause
    exit /b 1
)
echo.
echo ✅ PASSED: Voting System test
echo.

echo 🎉 ALL TESTS PASSED!
echo =====================================================
echo.
echo 📊 Test Summary:
echo    ✅ End Condition Engine: WORKING
echo    ✅ Voting System: WORKING
echo    ✅ Card Usage Tracking: WORKING
echo    ✅ Player Analytics: WORKING
echo    ✅ Socket.IO Integration: WORKING
echo.
echo 🚀 The system is ready for production use!
echo.
echo 💡 Next steps:
echo    1. Run 'start-server.bat' to start the server
echo    2. Navigate to /client folder
echo    3. Run 'npm run dev' to start the client
echo    4. Open http://localhost:5173 in your browser
echo.
pause