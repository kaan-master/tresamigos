#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

MODE="${1:-auto}"
STEP=0
TOTAL=0

step() {
  STEP=$((STEP + 1))
  echo
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Stap ${STEP}/${TOTAL} — $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

ok() {
  echo "  ✓ $1"
}

warn() {
  echo "  ! $1"
}

fail() {
  echo
  echo "  ✗ FOUT: $1"
  exit 1
}

if command -v pnpm >/dev/null 2>&1; then
  PNPM=pnpm
else
  PNPM="npx pnpm"
fi

detect_mode() {
  case "$MODE" in
    auto)
      if [[ "$ROOT" == /var/www/tresamigos* ]] || [[ "${TRESAMIGOS_ENV:-}" == "production" ]]; then
        echo "production"
      else
        echo "development"
      fi
      ;;
    production|prod|--production)
      echo "production"
      ;;
    development|dev|--dev)
      echo "development"
      ;;
    *)
      fail "Onbekende modus: $MODE (gebruik: ./start.sh [production|development])"
      ;;
  esac
}

read_server_ip() {
  if [[ -n "${SERVER_IP:-}" ]]; then
    echo "$SERVER_IP"
    return
  fi
  if [[ -f .env ]]; then
    local origin
    origin="$(grep -E '^CORS_ORIGINS=' .env | head -n1 | cut -d= -f2- | cut -d, -f1 | tr -d ' "'\''')"
    origin="${origin#http://}"
    origin="${origin#https://}"
    if [[ -n "$origin" && "$origin" != "localhost"* ]]; then
      echo "$origin"
      return
    fi
  fi
  hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1"
}

# Verwijder lokale TypeScript build-cache (wordt bij elke build opnieuw gemaakt).
clean_tsbuildinfo_drift() {
  local f
  for f in apps/web/tsconfig.tsbuildinfo apps/admin/tsconfig.tsbuildinfo apps/api/tsconfig.tsbuildinfo; do
    if [[ -f "$f" ]] && git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
      git checkout -- "$f" 2>/dev/null || true
    fi
  done
}

resolve_upstream_ref() {
  local branch="$1"
  local ref="origin/${branch}"
  if git rev-parse --verify "${ref}" >/dev/null 2>&1; then
    echo "${ref}"
    return
  fi
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    echo "origin/main"
    return
  fi
  if git rev-parse --verify origin/master >/dev/null 2>&1; then
    echo "origin/master"
    return
  fi
  fail "Geen remote branch gevonden (fetch origin/main of origin/${branch})"
}

# Productie: server volgt altijd remote — .env blijft staan (gitignored).
git_sync_production() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Geen git repository"

  local branch upstream
  branch="$(git rev-parse --abbrev-ref HEAD)"
  echo "  · branch: ${branch}"
  echo "  · git fetch origin..."
  git fetch origin

  upstream="$(resolve_upstream_ref "${branch}")"
  clean_tsbuildinfo_drift

  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "  · lokale wijzigingen gedetecteerd — reset naar ${upstream}"
    git status --short | sed 's/^/    /' || true
  fi

  git reset --hard "${upstream}"
  chmod +x start.sh start-containers.sh scripts/*.sh 2>/dev/null || true
  ok "Repository = ${upstream} ($(git rev-parse --short HEAD))"
}

# Development: zachte pull, autostash als nodig.
git_sync_development() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 0

  clean_tsbuildinfo_drift

  if git pull --ff-only --autostash; then
    ok "Repository bijgewerkt"
    return
  fi

  warn "Pull met autostash mislukt — reset tracked files en opnieuw"
  git reset --hard "@{u}" 2>/dev/null || git pull --ff-only --autostash || warn "Git pull overgeslagen"
  ok "Repository bijgewerkt"
}

# Development: stop oude dev-processen en maak poorten 3100/5180/5181 vrij.
stop_conflicting_dev_processes() {
  echo "  · oude dev-processen stoppen..."

  pkill -f "pnpm -r --parallel" 2>/dev/null || true
  pkill -f "@tresamigos/api.*dev" 2>/dev/null || true
  pkill -f "@tresamigos/web.*dev" 2>/dev/null || true
  pkill -f "@tresamigos/admin.*dev" 2>/dev/null || true

  for port in 3100 5180 5181; do
    if command -v fuser >/dev/null 2>&1; then
      fuser -k "${port}/tcp" 2>/dev/null || true
    elif command -v lsof >/dev/null 2>&1; then
      local pids
      pids="$(lsof -ti tcp:"${port}" 2>/dev/null || true)"
      if [[ -n "$pids" ]]; then
        echo "  · poort ${port} → PID ${pids}"
        kill -9 ${pids} 2>/dev/null || true
      fi
    fi
  done

  sleep 2

  if ! command -v ss >/dev/null 2>&1; then
    fail "ss niet gevonden — kan poorten 3100/5180/5181 niet controleren"
  fi

  for port in 3100 5180 5181; do
    if ss -tulpn | grep -q ":${port} "; then
      echo "Poort ${port} is nog bezet:"
      ss -tulpn | grep ":${port} "
      exit 1
    fi
  done
}

port_3100_pids() {
  if command -v ss >/dev/null 2>&1; then
    ss -tulpn 2>/dev/null | grep ':3100 ' || true
    return
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:3100 2>/dev/null || true
  fi
}

stop_port_3100() {
  echo "  · controleren poort 3100..."
  port_3100_pids | sed 's/^/    /' || true

  if [ -f /etc/systemd/system/tresamigos-api.service ]; then
    if systemctl is-active --quiet tresamigos-api 2>/dev/null; then
      warn "systemd service tresamigos-api draait al — wordt straks herstart"
      return
    fi
  fi

  if command -v fuser >/dev/null 2>&1; then
    fuser -k 3100/tcp 2>/dev/null && echo "  · oude processen op 3100 gestopt" || true
  elif command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -ti tcp:3100 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      echo "  · stoppen PID(s): $pids"
      kill -9 $pids 2>/dev/null || true
    fi
  fi
  sleep 1
}

restart_api() {
  if [ -f /etc/systemd/system/tresamigos-api.service ]; then
    echo "  · systemctl restart tresamigos-api"
    systemctl restart tresamigos-api
    sleep 2
    systemctl --no-pager --full status tresamigos-api || true
    ok "API herstart via systemd"
    return
  fi

  warn "Geen systemd service gevonden — start API handmatig op de achtergrond"
  stop_port_3100
  nohup $PNPM --filter @tresamigos/api start >> /var/log/tresamigos-api.log 2>&1 &
  sleep 2
  ok "API gestart (nohup, log: /var/log/tresamigos-api.log)"
}

health_checks() {
  local ip="$1"
  local base="http://${ip}"

  echo
  echo "╔══════════════════════════════════════════════════╗"
  echo "║              Health checks                       ║"
  echo "╚══════════════════════════════════════════════════╝"
  echo

  echo "  curl -I ${base}/"
  curl -sS -I "${base}/" | head -n 5 || warn "Web check mislukt"
  echo

  echo "  curl -I ${base}/admin/"
  curl -sS -I "${base}/admin/" | head -n 5 || warn "Admin check mislukt"
  echo

  local admin_js
  admin_js="$(grep -oE '/admin/assets/[^"'\'' ]+\.js' apps/admin/dist/index.html | head -n1 || true)"
  if [[ -n "$admin_js" ]]; then
    echo "  curl -I ${base}${admin_js}"
    if curl -sS -I "${base}${admin_js}" | head -n 1 | grep -q "200"; then
      ok "Admin JS bundle laadt (${admin_js})"
    else
      warn "Admin JS bundle niet bereikbaar (${admin_js}) — nginx alias/try_files controleren"
    fi
    echo
  fi

  if curl -sS "${base}/admin/" | grep -q 'id="root"'; then
    ok "Admin HTML bevat root mount"
  else
    warn "Admin HTML lijkt onjuist (geen #root)"
  fi
  echo

  echo "  curl ${base}/api/content | head -c 300"
  curl -sS "${base}/api/content" | head -c 300 || warn "API content check mislukt"
  echo
  echo

  echo "  curl ${base}/api/instagram/feed | head -c 300"
  curl -sS "${base}/api/instagram/feed" | head -c 300 || warn "Instagram feed check mislukt"
  echo
  echo

  echo "  grep -R \"/api/api\" apps/web/dist apps/admin/dist"
  if grep -R "/api/api" apps/web/dist apps/admin/dist 2>/dev/null; then
    warn "Dubbele /api/api gevonden in build — zet VITE_API_URL= leeg en rebuild"
  else
    ok "Geen /api/api in dist builds"
  fi
  echo

  echo "  ss -tulpn | grep :3100"
  ss -tulpn 2>/dev/null | grep ':3100 ' || warn "Geen proces op poort 3100"
  echo
}

run_production() {
  TOTAL=13
  SERVER_IP="$(read_server_ip)"

  echo
  echo "╔══════════════════════════════════════════════════╗"
  echo "║     Tres Amigos — PRODUCTIE deploy               ║"
  echo "╚══════════════════════════════════════════════════╝"
  echo
  echo "  Web   → http://${SERVER_IP}/"
  echo "  Admin → http://${SERVER_IP}/admin/"
  echo "  API   → http://${SERVER_IP}/api/ (intern :3100)"
  echo

  step "Git sync (production)"
  git_sync_production

  step "Dependencies installeren"
  $PNPM install
  ok "pnpm install voltooid"

  step "Docker (PostgreSQL + Redis)"
  command -v docker >/dev/null 2>&1 || fail "Docker niet gevonden."
  docker info >/dev/null 2>&1 || fail "Docker daemon draait niet."
  docker compose up -d
  ok "Containers actief"

  step "Redis bereikbaar"
  redis_ready=0
  for attempt in $(seq 1 20); do
    if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
      redis_ready=1
      break
    fi
    echo "  · poging ${attempt}/20..."
    sleep 1
  done
  [[ "$redis_ready" -eq 1 ]] || fail "Redis reageert niet — live analytics werkt niet zonder Redis."
  ok "Redis healthy"

  step "Database bereikbaar"
  ready=0
  for attempt in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U tresamigos -d tresamigos >/dev/null 2>&1; then
      ready=1
      break
    fi
    echo "  · poging ${attempt}/30..."
    sleep 2
  done
  [[ "$ready" -eq 1 ]] || fail "PostgreSQL reageert niet."
  ok "PostgreSQL healthy"

  step "Prisma client genereren"
  $PNPM db:generate
  ok "Prisma client gegenereerd"

  step "Database migraties"
  $PNPM db:migrate
  ok "Migraties toegepast"

  step "Database seed"
  $PNPM db:seed
  ok "Seed voltooid"

  step "Production build (packages + web + admin + api)"
  export VITE_API_URL="${VITE_API_URL:-}"
  $PNPM build
  [[ -f apps/web/dist/index.html ]] || fail "Web build ontbreekt: apps/web/dist/index.html"
  [[ -f apps/admin/dist/index.html ]] || fail "Admin build ontbreekt: apps/admin/dist/index.html"
  [[ -f apps/api/dist/main.js ]] || fail "API build ontbreekt: apps/api/dist/main.js"
  ok "Build voltooid"

  step "API proces controleren (poort 3100)"
  stop_port_3100
  ok "Poort 3100 vrij of via systemd beheerd"

  step "API herstarten"
  restart_api

  step "Nginx config + reload"
  if command -v nginx >/dev/null 2>&1; then
    if [[ -f deploy/nginx-tresamigos.conf ]]; then
      if [[ -d /etc/nginx/sites-available ]]; then
        cp deploy/nginx-tresamigos.conf /etc/nginx/sites-available/tresamigos
        ln -sf /etc/nginx/sites-available/tresamigos /etc/nginx/sites-enabled/tresamigos
        rm -f /etc/nginx/sites-enabled/default
        ok "Nginx config gekopieerd naar sites-available/tresamigos"
      else
        warn "Geen /etc/nginx/sites-available — pas deploy/nginx-tresamigos.conf handmatig toe"
      fi
    fi
    nginx -t
    systemctl reload nginx
    ok "Nginx herladen"
  else
    warn "nginx niet gevonden — sla reload over"
  fi

  health_checks "$SERVER_IP"

  echo "╔══════════════════════════════════════════════════╗"
  echo "║  Productie deploy voltooid                       ║"
  echo "╚══════════════════════════════════════════════════╝"
}

run_development() {
  TOTAL=8

  echo
  echo "╔══════════════════════════════════════════════════╗"
  echo "║         Tres Amigos — development stack          ║"
  echo "╚══════════════════════════════════════════════════╝"
  echo
  echo "  Web   → http://localhost:5180"
  echo "  Admin → http://localhost:5181/admin/"
  echo "  API   → http://localhost:3100/api/content"
  echo "  DB    → localhost:5434  ·  Redis → localhost:6380"
  echo

  if [[ "${SKIP_PULL:-}" != "1" ]] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    step "Git sync"
    git_sync_development
  fi

  step "Oude dev-processen stoppen (3100, 5180, 5181)"
  stop_conflicting_dev_processes
  ok "Poorten vrij — geen botsende dev-processen"

  step "Docker controleren"
  command -v docker >/dev/null 2>&1 || fail "Docker niet gevonden. Installeer Docker Engine."
  docker info >/dev/null 2>&1 || fail "Docker daemon draait niet. Start Docker en probeer opnieuw."
  ok "Docker actief"

  step "PostgreSQL + Redis containers starten"
  docker compose up -d
  ok "Containers gestart ($(docker compose ps --format '{{.Name}}' 2>/dev/null | tr '\n' ' '))"

  step "Redis bereikbaar"
  redis_ready=0
  for attempt in $(seq 1 20); do
    if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
      redis_ready=1
      break
    fi
    echo "  · poging ${attempt}/20..."
    sleep 1
  done
  [[ "$redis_ready" -eq 1 ]] || warn "Redis reageert nog niet — analytics kan tijdelijk in geheugen draaien"
  [[ "$redis_ready" -eq 1 ]] && ok "Redis healthy"

  step "Wachten tot database bereikbaar is"
  ready=0
  for attempt in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U tresamigos -d tresamigos >/dev/null 2>&1; then
      ready=1
      break
    fi
    echo "  · poging ${attempt}/30..."
    sleep 2
  done
  [ "${ready}" -eq 1 ] || fail "PostgreSQL reageert niet. Check: docker compose logs postgres"
  ok "PostgreSQL healthy"

  step "Database migraties en seed"
  echo "  · migraties..."
  $PNPM db:migrate
  echo "  · seed..."
  $PNPM db:seed
  ok "Database up-to-date"

  step "Shared packages bouwen en dev servers starten"
  $PNPM build:packages
  ok "Packages gebouwd"

  echo
  echo "╔══════════════════════════════════════════════════╗"
  echo "║  Dev stack — logs verschijnen hieronder          ║"
  echo "╚══════════════════════════════════════════════════╝"
  echo "  Ctrl+C om alles te stoppen"
  echo

  stop_conflicting_dev_processes

  exec $PNPM dev
}

RESOLVED_MODE="$(detect_mode)"

case "$RESOLVED_MODE" in
  production) run_production ;;
  development) run_development ;;
esac
