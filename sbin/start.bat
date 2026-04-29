@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%\.."

node tests\e2e\scripts\run-e2e-entry.mjs %*
exit /b %ERRORLEVEL%
