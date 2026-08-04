#!/usr/bin/env bash
# Idempotente development stack: stop botsende processen, docker + migraties, pnpm dev.
#
# Gebruik (development — alleen dit script, geen losse pnpm dev):
#   ./start-containers.sh
#
# Sla git pull over:
#   SKIP_PULL=1 ./start-containers.sh
#
# Seed overslaan (als seed hangt of je content wilt behouden):
#   SKIP_SEED=1 ./start-containers.sh
#
# Productie: NOOIT dit script — altijd:
#   ./start.sh production
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Op de live server forceert dit script anders "development" (vite + soft git pull),
# wat conflict-markers (<<<<<<< Updated upstream) en kapotte builds veroorzaakt.
if [[ "$ROOT" == /var/www/tresamigos* ]] || [[ "${TRESAMIGOS_ENV:-}" == "production" ]]; then
  echo "Productie-pad gedetecteerd — doorsturen naar ./start.sh production"
  echo "(start-containers.sh is alleen voor lokale development)"
  exec "$ROOT/start.sh" production "$@"
fi

exec "$ROOT/start.sh" development "$@"
