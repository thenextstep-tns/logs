@echo off
setlocal enabledelayedexpansion

title ESOlogs Roster Prophet [DEV MODE]

set PORT=3000

echo [*] Checking for existing instances on port %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":%PORT% *LISTENING"') do (
    set "TARGET_PID=%%a"
    if defined TARGET_PID (
        echo [!] Stopping process !TARGET_PID!...
        taskkill /F /PID !TARGET_PID! >nul 2>&1
    )
)

timeout /t 1 /nobreak >nul

if not exist "node_modules" (
    echo [*] Installing dependencies...
    call npm install
)

echo [*] Starting Next.js in development mode on http://localhost:%PORT% ...
call npm run dev
pause
