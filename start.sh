#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

TOTAL=6
STEP=0

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

echo
echo "╔══════════════════════════════════════════════════╗"
echo "║         Tres Amigos — volledige stack start      ║"
echo "╚══════════════════════════════════════════════════╝"
echo
echo "  Web   → http://localhost:5180"
echo "  Admin → http://localhost:5181/admin/"
echo "  API   → http://localhost:3100/api/content"
echo "  DB    → localhost:5434  ·  Redis → localhost:6380"
echo

# ── 1. Docker ──────────────────────────────────────────
step "Docker controleren"
command -v docker >/dev/null 2>&1 || fail "Docker niet gevonden. Installeer Docker Engine."
docker info >/dev/null 2>&1 || fail "Docker daemon draait niet. Start Docker en probeer opnieuw."
ok "Docker actief"

# ── 2. Poorten ─────────────────────────────────────────
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

# ── 3. Containers ──────────────────────────────────────
step "PostgreSQL + Redis containers starten"
docker compose up -d
ok "Containers gestart ($(docker compose ps --format '{{.Name}}' 2>/dev/null | tr '\n' ' '))"

# ── 4. Database ready ──────────────────────────────────
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

# ── 5. Migraties + seed ────────────────────────────────
step "Database migraties en seed"
echo "  · migraties..."
$PNPM db:migrate
echo "  · seed..."
$PNPM db:seed
ok "Database up-to-date"

# ── 6. Packages + apps ─────────────────────────────────
step "Shared packages bouwen en apps starten"
$PNPM build:packages
ok "Packages gebouwd"

echo
echo "╔══════════════════════════════════════════════════╗"
echo "║  Stack is klaar — logs verschijnen hieronder     ║"
echo "╚══════════════════════════════════════════════════╝"
echo "  Ctrl+C om alles te stoppen"
echo

exec $PNPM dev
