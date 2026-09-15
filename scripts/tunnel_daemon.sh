#!/usr/bin/env bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
URL_FILE="$ROOT_DIR/LIVE_URL.txt"

echo "[Tunnel Daemon] Starting persistent tunnel watchdog..."

while true; do
  echo "[Tunnel Daemon] Connecting to localhost.run..."
  ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -R 80:127.0.0.1:3000 nokey@localhost.run 2>&1 | while IFS= read -r line; do
    echo "$line"
    if [[ "$line" =~ (https://[a-zA-Z0-9.-]+\.lhr\.life) ]]; then
      FOUND_URL="${BASH_REMATCH[1]}"
      echo "$FOUND_URL" > "$URL_FILE"
      echo "=================================================="
      echo "[Tunnel Daemon] LIVE PREVIEW URL: $FOUND_URL"
      echo "=================================================="
      (cd "$ROOT_DIR" && git add "$URL_FILE" && git commit -m "chore: update live preview tunnel URL [skip ci]" && git push origin preview) >/dev/null 2>&1 || true
    fi
  done
  echo "[Tunnel Daemon] Connection dropped. Reconnecting in 2 seconds..."
  sleep 2
done
