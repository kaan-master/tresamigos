#!/usr/bin/env bash
set -euo pipefail

echo "Stoppen oude Tres Amigos processen op poort 3100, 5180, 5181..."

for port in 3100 5180 5181; do
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  elif command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -ti tcp:"${port}" 2>/dev/null || true)
    if [ -n "${pids}" ]; then
      echo "  Poort ${port} > PID ${pids}"
      kill -9 ${pids} 2>/dev/null || true
    fi
  fi
done

sleep 1
