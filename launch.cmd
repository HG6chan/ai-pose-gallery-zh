@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 24 LTS and pnpm, then run pnpm install --frozen-lockfile.
  pause
  exit /b 1
)
set "NODE_USE_ENV_PROXY=1"
node scripts\launcher.mjs %*
if errorlevel 1 (
  echo Launcher failed. Check the error above.
  pause
  exit /b 1
)
