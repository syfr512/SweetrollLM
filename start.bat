@echo off
setlocal

cd /d "%~dp0"

echo.
echo ========================================
echo  SweetrollLM - Launcher
echo ========================================
echo.

if not exist "%~dp0venv\Scripts\activate.bat" (
    echo ERROR: Local virtual environment was not found.
    echo Please run install.bat first.
    echo.
    pause
    exit /b 1
)

echo Activating virtual environment...
call "%~dp0venv\Scripts\activate.bat"
if errorlevel 1 (
    echo.
    echo ERROR: Could not activate the virtual environment.
    pause
    exit /b 1
)

echo Starting SweetrollLM backend...
start "SweetrollLM Backend" /B python run.py

echo Waiting for the local server to initialize...
timeout /t 2 /nobreak >nul

echo Opening SweetrollLM in your default browser...
start "" "http://127.0.0.1:7865"

echo.
echo SweetrollLM is starting. You can close this window after the app opens.
echo.
