@echo off
setlocal

rem Windows one-click E2E environment setup.
rem Examples:
rem   .\sbin\setup-e2e-env.bat
rem   .\sbin\setup-e2e-env.bat --download-only
rem   .\sbin\setup-e2e-env.bat --no-start

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%\.."

node tests\e2e\scripts\setup-e2e-env.mjs %*
exit /b %ERRORLEVEL%
