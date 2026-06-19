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

  if systemctl list-unit-files tresamigos-api.service >/dev/null 2>&1; then
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
  if systemctl list-unit-files tresamigos-api.service >/dev/null 2>&1; then
    echo "  · systemctl restart tresamigos-api"
    systemctl restart tresamigos-api
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
  TOTAL=11
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

  step "Git pull"
  git pull --ff-only
  ok "Repository up-to-date"

  step "Dependencies installeren"
  $PNPM install
  ok "pnpm install voltooid"

  step "Docker (PostgreSQL + Redis)"
  command -v docker >/dev/null 2>&1 || fail "Docker niet gevonden."
  docker info >/dev/null 2>&1 || fail "Docker daemon draait niet."
  docker compose up -d
  ok "Containers actief"

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
  ok "Build voltooid"

  step "API proces controleren (poort 3100)"
  stop_port_3100
  ok "Poort 3100 vrij of via systemd beheerd"

  step "API herstarten"
  restart_api

  step "Nginx herladen"
  if command -v nginx >/dev/null 2>&1; then
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
  TOTAL=6

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

  step "Docker controleren"
  command -v docker >/dev/null 2>&1 || fail "Docker niet gevonden. Installeer Docker Engine."
  docker info >/dev/null 2>&1 || fail "Docker daemon draait niet. Start Docker en probeer opnieuw."
  ok "Docker actief"

  step "Poorten vrijmaken (3100, 5180, 5181)"
  for port in 3100 5180 5181; do
    if command -v fuser >/dev/null 2>&1; then
      fuser -k "${port}/tcp" 2>/dev/null && echo "  · poort ${port} vrijgemaakt" || true
    elif command -v lsof >/dev/null 2>&1; then
      pids=$(lsof -ti tcp:"${port}" 2>/dev/null || true)
      if [ -n "${pids}" ]; then
        echo "  · poort ${port} → PID ${pids}"
        kill -9 ${pids} 2>/dev/null || true
      fi
    fi
  done
  sleep 1
  ok "Poorten vrij"

  step "PostgreSQL + Redis containers starten"
  docker compose up -d
  ok "Containers gestart ($(docker compose ps --format '{{.Name}}' 2>/dev/null | tr '\n' ' '))"

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

  exec $PNPM dev
}

RESOLVED_MODE="$(detect_mode)"

case "$RESOLVED_MODE" in
  production) run_production ;;
  development) run_development ;;
esac
