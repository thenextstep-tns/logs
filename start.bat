@echo off
setlocal enabledelayedexpansion

title ESOlogs Veteran Hard Mode Roster Prophet

echo ===================================================================
echo             ESOlogs Hard Mode Roster & Build Prophet
echo ===================================================================

set PORT=3000

echo [*] Checking for existing instances on port %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":%PORT% *LISTENING"') do (
    set "TARGET_PID=%%a"
    if defined TARGET_PID (
        echo [!] Port %PORT% is in use by PID: !TARGET_PID!
        echo [*] Stopping previous instance (PID !TARGET_PID!)...
        taskkill /F /PID !TARGET_PID! >nul 2>&1
    )
)

timeout /t 1 /nobreak >nul

if not exist "node_modules" (
    echo [*] First-time setup: Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [!] Failed to install dependencies.
        pause
        exit /b %errorlevel%
    )
)

if not exist ".next" (
    echo [*] Building production bundle...
    call npm run build
    if %errorlevel% neq 0 (
        echo [!] Build failed.
        pause
        exit /b %errorlevel%
    )
)

echo.
echo [*] Starting Prophet production server on http://localhost:%PORT% ...
echo [*] Press Ctrl+C in this window to stop the server.
echo ===================================================================
echo.

call npm run start
pause
