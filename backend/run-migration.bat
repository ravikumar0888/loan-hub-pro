@echo off
echo ===================================
echo Running Database Migration
echo ===================================
echo.

REM Read database URL from .env file
for /f "tokens=1,2 delims==" %%a in ('findstr "DATABASE_URL" .env') do set DB_URL=%%b

echo Database URL found in .env file
echo.

REM Extract database connection details from DATABASE_URL
REM Expected format: postgresql://user:password@host:port/database

echo Running migration SQL script...
echo.

REM Use psql to run the migration
REM You may need to adjust this command based on your PostgreSQL setup
psql %DB_URL% -f run-migration.sql

if %errorlevel% equ 0 (
    echo.
    echo ===================================
    echo Migration completed successfully!
    echo ===================================
    echo.
    echo Now run: npm run prisma:generate
    echo Then restart your backend server
) else (
    echo.
    echo ===================================
    echo Migration failed!
    echo ===================================
    echo.
    echo Please run the SQL manually:
    echo 1. Open pgAdmin or your PostgreSQL client
    echo 2. Connect to your 'loanms' database
    echo 3. Run the SQL from run-migration.sql
)

pause
