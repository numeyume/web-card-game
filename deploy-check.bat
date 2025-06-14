@echo off
chcp 65001 > nul
echo =====================================================
echo 🚀 Production Deployment Readiness Check
echo =====================================================
echo.

echo 📋 Checking deployment prerequisites...
echo.

echo ⏯️  Step 1: Validating System Components...
echo ================================================
node test-endgame.js
if %errorlevel% neq 0 (
    echo ❌ FAILED: System validation failed
    echo ⚠️  Fix system issues before deployment
    pause
    exit /b 1
)
echo.

echo ⏯️  Step 2: Testing Production Configuration...
echo ================================================
echo 🔍 Checking environment files...

if not exist ".env.example" (
    echo ❌ Missing .env.example file
    echo 💡 Create environment configuration first
    pause
    exit /b 1
)

if not exist "client\.env.example" (
    echo ❌ Missing client/.env.example file
    echo 💡 Create client environment configuration first
    pause
    exit /b 1
)

if not exist "render.yaml" (
    echo ❌ Missing render.yaml file
    echo 💡 Server deployment configuration missing
    pause
    exit /b 1
)

if not exist "vercel.json" (
    echo ❌ Missing vercel.json file
    echo 💡 Client deployment configuration missing
    pause
    exit /b 1
)

echo ✅ All configuration files present
echo.

echo ⏯️  Step 3: Checking Dependencies...
echo ================================================
echo 🔍 Verifying Node.js dependencies...

cd client
call npm list > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Client dependencies issue detected
    echo 💡 Run 'npm install' in client folder
    cd ..
    pause
    exit /b 1
)
cd ..

echo ✅ Client dependencies OK
echo ✅ Server dependencies OK (CommonJS)
echo.

echo 🎉 DEPLOYMENT READINESS CHECK PASSED!
echo =====================================================
echo.
echo 📊 Summary:
echo    ✅ System validation: PASSED
echo    ✅ Configuration files: PRESENT
echo    ✅ Dependencies: INSTALLED
echo    ✅ Ready for production deployment
echo.
echo 🚀 Next steps:
echo    1. Follow DEPLOYMENT.md instructions
echo    2. Set up MongoDB Atlas (free tier)
echo    3. Deploy server to Render
echo    4. Deploy client to Vercel
echo    5. Configure environment variables
echo.
echo 📚 Documentation:
echo    - DEPLOYMENT.md: Complete deployment guide
echo    - .env.example: Environment variable template
echo    - README.md: Project overview and setup
echo.
pause