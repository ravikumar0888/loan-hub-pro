@echo off
echo ========================================
echo Restarting LoanMS Backend Server
echo ========================================
echo.
echo Step 1: Generating Prisma Client...
call npm run prisma:generate
if %ERRORLEVEL% NEQ 0 (
    echo Error generating Prisma client!
    pause
    exit /b 1
)
echo.
echo Step 2: Starting Development Server...
call npm run dev
