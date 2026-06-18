@echo off
setlocal
cd /d %~dp0
echo Starting PostgreSQL + Redis...
docker compose up -d
echo.
echo Run migrations + seed (requires Docker running):
echo   npx pnpm db:migrate
echo   npx pnpm db:seed
echo.
echo Starting API, web and admin...
start "Tres API" cmd /k "npx pnpm dev:api"
start "Tres Web" cmd /k "npx pnpm dev:web"
start "Tres Admin" cmd /k "npx pnpm dev:admin"
echo.
echo Web:   http://localhost:5173
echo Admin: http://localhost:5174/admin/
echo API:   http://localhost:3000/api/content
