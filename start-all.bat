@echo off
setlocal
cd /d %~dp0

echo === Tres Amigos local stack ===
echo Poorten: API 3100 ^| Web 5180 ^| Admin 5181 ^| DB 5434 ^| Redis 6380
echo.

call "%~dp0scripts\free-ports.bat"
if errorlevel 1 exit /b 1

docker info >nul 2>&1
if errorlevel 1 (
  echo [FOUT] Docker Desktop draait niet.
  pause
  exit /b 1
)

echo [1/5] PostgreSQL + Redis starten...
docker compose up -d
if errorlevel 1 (
  echo [FOUT] docker compose up mislukt.
  pause
  exit /b 1
)

echo [2/5] Wachten op database...
timeout /t 6 /nobreak >nul

echo [3/5] Migraties + seed...
call npx pnpm db:migrate
if errorlevel 1 (
  echo [FOUT] Database migratie mislukt.
  pause
  exit /b 1
)
call npx pnpm db:seed
if errorlevel 1 (
  echo [FOUT] Database seed mislukt.
  pause
  exit /b 1
)

echo [4/5] Shared packages bouwen...
call npx pnpm build:packages
if errorlevel 1 (
  echo [FOUT] Packages build mislukt.
  pause
  exit /b 1
)

echo [5/5] Apps starten...
start "Tres API :3100" cmd /k "cd /d %~dp0 && npx pnpm dev:api"
timeout /t 6 /nobreak >nul
start "Tres Web :5180" cmd /k "cd /d %~dp0 && npx pnpm dev:web"
start "Tres Admin :5181" cmd /k "cd /d %~dp0 && npx pnpm dev:admin"

echo.
echo Klaar:
echo   Web:   http://localhost:5180
echo   Admin: http://localhost:5181/admin/
echo   API:   http://localhost:3100/api/content
echo.
pause
