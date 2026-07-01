@echo off
setlocal

rem Windows E2E entry.
rem Examples:
rem   .\sbin\start.bat tree-full direct
rem   .\sbin\start.bat table-full direct
rem   .\sbin\start.bat all-models-full direct
rem   .\sbin\start.bat all-models-full direct headed
rem   .\sbin\start.bat all-models-full direct report
rem   .\sbin\start.bat all-models-full-dev dev
rem   .\sbin\start.bat all-models-full-dev dev headed

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%\.."

node tests\e2e\scripts\run-e2e-entry.mjs %*
exit /b %ERRORLEVEL%
