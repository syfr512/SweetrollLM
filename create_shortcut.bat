@echo off
chcp 65001 > nul
setlocal

set "SWEETROLL_TARGET=%~dp0start.bat"
set "SWEETROLL_WORKDIR=%~dp0"
set "SWEETROLL_ICON=%~dp0sweetroll_lm\static\assets\icon.ico"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$desktop = [Environment]::GetFolderPath('Desktop'); $shortcut = Join-Path $desktop 'SweetrollLM.lnk'; $ws = New-Object -ComObject WScript.Shell; $link = $ws.CreateShortcut($shortcut); $link.TargetPath = $env:SWEETROLL_TARGET; $link.WorkingDirectory = $env:SWEETROLL_WORKDIR; if (Test-Path $env:SWEETROLL_ICON) { $link.IconLocation = $env:SWEETROLL_ICON }; $link.Save()"

if not errorlevel 1 goto shortcut_success
echo Failed to create the SweetrollLM desktop shortcut.
pause
exit /b 1

:shortcut_success
echo Success! A shortcut to the SweetrollLM Tavern has been created on your Desktop.
pause
