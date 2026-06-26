@echo off
setlocal

cd /d "%~dp0"

echo.
echo ========================================
echo  SweetrollLM - Automated Installation
echo ========================================
echo.

if not exist "%~dp0venv\Scripts\activate.bat" (
    echo [1/3] Creating local Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo.
        echo ERROR: Could not create the virtual environment.
        echo Make sure Python is installed and available on PATH.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Existing virtual environment found.
)

echo [2/3] Activating virtual environment...
call "%~dp0venv\Scripts\activate.bat"
if errorlevel 1 (
    echo.
    echo ERROR: Could not activate the virtual environment.
    pause
    exit /b 1
)

echo [3/3] Installing project dependencies...
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo ERROR: Dependency installation failed.
    pause
    exit /b 1
)

echo.
echo [Optional] Installing native llama-cpp-python CPU runtime for AVX2-capable PCs...
python -m pip install llama-cpp-python
if errorlevel 1 (
    echo.
    echo WARNING: Optional llama-cpp-python install failed.
    echo SweetrollLM will still run cloud APIs and can use koboldcpp-oldpc.exe fallback on legacy PCs.
    echo Re-run this inside venv manually if you want native GGUF loading on a modern CPU.
)

echo.
echo Installation complete.
echo Run start.bat to launch SweetrollLM.
echo.
pause
