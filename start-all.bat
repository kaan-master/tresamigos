@echo off
setlocal
cd /d %~dp0

echo.
echo ========================================================
echo          Tres Amigos - volledige stack start
echo ========================================================
echo.
echo   Web   - http://localhost:5180
echo   Admin - http://localhost:5181/admin/
echo   API   - http://localhost:3100/api/content
echo   DB    - localhost:5434  ^|  Redis - localhost:6380
echo.

echo --------------------------------------------------------
echo   Stap 1/6 - Poorten vrijmaken
echo --------------------------------------------------------
call "%~dp0scripts\free-ports.bat"
if errorlevel 1 exit /b 1
echo   OK Poorten vrij
echo.

echo --------------------------------------------------------
echo   Stap 2/6 - Docker controleren
echo --------------------------------------------------------
docker info >nul 2>&1
if errorlevel 1 (
  echo   FOUT Docker Desktop draait niet.
  pause
  exit /b 1
)
echo   OK Docker actief
echo.

echo --------------------------------------------------------
echo   Stap 3/6 - PostgreSQL + Redis containers starten
echo --------------------------------------------------------
docker compose up -d
if errorlevel 1 (
  echo   FOUT docker compose up mislukt.
  pause
  exit /b 1
)
echo   OK Containers gestart
echo.

echo --------------------------------------------------------
echo   Stap 4/6 - Wachten op database
echo --------------------------------------------------------
timeout /t 8 /nobreak >nul
echo   OK Database bereikbaar
echo.

echo --------------------------------------------------------
echo   Stap 5/6 - Migraties + seed
echo --------------------------------------------------------
call npx pnpm db:migrate
if errorlevel 1 (
  echo   FOUT Database migratie mislukt.
  pause
  exit /b 1
)
call npx pnpm db:seed
if errorlevel 1 (
  echo   FOUT Database seed mislukt.
  pause
  exit /b 1
)
echo   OK Database up-to-date
echo.

echo --------------------------------------------------------
echo   Stap 6/6 - Packages bouwen + apps starten
echo --------------------------------------------------------
call npx pnpm build:packages
if errorlevel 1 (
  echo   FOUT Packages build mislukt.
  pause
  exit /b 1
)
echo   OK Packages gebouwd
echo.

echo ========================================================
echo   Stack is klaar - apps openen in aparte vensters
echo ========================================================
echo.

start "Tres API :3100" cmd /k "cd /d %~dp0 && npx pnpm dev:api"
timeout /t 6 /nobreak >nul
start "Tres Web :5180" cmd /k "cd /d %~dp0 && npx pnpm dev:web"
start "Tres Admin :5181" cmd /k "cd /d %~dp0 && npx pnpm dev:admin"

echo   Web:   http://localhost:5180
echo   Admin: http://localhost:5181/admin/
echo   API:   http://localhost:3100/api/content
echo.
pause
