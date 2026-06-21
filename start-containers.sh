#!/usr/bin/env bash
# Idempotente development stack: stop botsende processen, docker + migraties, pnpm dev.
#
# Gebruik (development — alleen dit script, geen losse pnpm dev):
#   ./start-containers.sh
#
# Sla git pull over:
#   SKIP_PULL=1 ./start-containers.sh
#
# Productie (apart houden):
#   ./start.sh production
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$ROOT/start.sh" development "$@"
