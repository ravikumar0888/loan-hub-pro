@echo off
echo ========================================
echo   Complete Backend Setup
echo ========================================
echo.

echo [1/3] Running database migrations...
call npx prisma migrate dev --name add_profile_payout_dsa_invoice_fields
if errorlevel 1 (
    echo.
    echo ❌ Migration failed! Please check your database connection.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/3] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ❌ Prisma generate failed!
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Creating SuperAdmin account...
call npx ts-node create-superadmin.ts
if errorlevel 1 (
    echo.
    echo ❌ SuperAdmin creation failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ Setup Complete!
echo ========================================
echo.
echo You can now:
echo   1. Start the backend: npm run dev
echo   2. Login with: superadmin@rudvir.com / Admin@123
echo.
echo ⚠️  Remember to change the default password after first login!
echo.
pause
