#!/usr/bin/env bash
# Start Docker containers + volledige dev stack (inclusief git pull).
# Gebruik: ./start-containers.sh
# Sla git pull over: SKIP_PULL=1 ./start-containers.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$ROOT/start.sh" development "$@"
