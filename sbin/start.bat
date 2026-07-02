@echo off
setlocal

rem Windows E2E entry.
rem Default with no args:
rem   .\sbin\start.bat  => all-models-full direct report
rem Examples:
rem   .\sbin\start.bat tree-login direct
rem   .\sbin\start.bat table-login direct
rem   .\sbin\start.bat tree-dashboard direct headed
rem   .\sbin\start.bat table-dashboard direct headed
rem   .\sbin\start.bat tree-full direct
rem   .\sbin\start.bat table-full direct
rem   .\sbin\start.bat all-models-full direct
rem   .\sbin\start.bat all-models-full direct headed
rem   .\sbin\start.bat all-models-full direct report
rem   .\sbin\start.bat all-models-full dev
rem   .\sbin\start.bat all-models-full dev headed

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%\.."

if "%~1"=="" (
  node tests\e2e\scripts\run-e2e-entry.mjs all-models-full direct report
) else (
  node tests\e2e\scripts\run-e2e-entry.mjs %*
)
exit /b %ERRORLEVEL%
