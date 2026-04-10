#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-8132}"
SERVER_LOG="${TMPDIR:-/tmp}/checkpoint-smoke-test.log"

echo "[checkpoint] Running syntax checks..."
node --check checkpoint/app.js
node --check checkpoint/data/sample-data.js
node --check checkpoint/scripts/verify_phase2_integrations.mjs
node --check checkpoint/scripts/verify_phase4_hardening.mjs
node --check checkpoint/scripts/verify_pricing_services.mjs
node --check checkpoint/scripts/verify_pricing_watch_states.mjs
node --check checkpoint/scripts/preflight_config.mjs
node --check checkpoint/modules/render.js
node --check checkpoint/modules/store.js
node --check checkpoint/modules/schema.js
node --check checkpoint/modules/persistence.js
node --check checkpoint/modules/normalization.js
node --check checkpoint/services/index.js
node --check checkpoint/services/storefronts.js
node --check checkpoint/services/steamgrid.js
node --check checkpoint/services/google-drive.js
node --check checkpoint/services/config.js
node --check checkpoint/services/mock-data.js
node --check checkpoint/config.js
node --check checkpoint/config.example.js

echo "[checkpoint] Running runtime config preflight..."
node checkpoint/scripts/preflight_config.mjs

echo "[checkpoint] Starting local server on :$PORT..."
python3 -m http.server "$PORT" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT
sleep 1

echo "[checkpoint] Verifying app shell..."
curl -fsSI "http://127.0.0.1:$PORT/checkpoint/" >/dev/null
curl -fsSI "http://127.0.0.1:$PORT/checkpoint/discover/" >/dev/null
curl -fsSI "http://127.0.0.1:$PORT/checkpoint/discover/search/" >/dev/null
curl -fsSI "http://127.0.0.1:$PORT/checkpoint/discover/search/?query=elden%20ring" >/dev/null
curl -fsSI "http://127.0.0.1:$PORT/checkpoint/discover/game/?id=17269" >/dev/null
curl -fsSI "http://127.0.0.1:$PORT/checkpoint/app.js" >/dev/null
curl -fsSI "http://127.0.0.1:$PORT/checkpoint/tailwind.generated.css" >/dev/null
curl -fsSI "http://127.0.0.1:$PORT/checkpoint/styles.css" >/dev/null
curl -fsSI "http://127.0.0.1:$PORT/checkpoint/config.js" >/dev/null
curl -fsSI "http://127.0.0.1:$PORT/checkpoint/modules/render.js" >/dev/null
curl -fsSI "http://127.0.0.1:$PORT/checkpoint/modules/store.js" >/dev/null

HTML="$(curl -fsS "http://127.0.0.1:$PORT/checkpoint/")"

if [[ "$HTML" != *"<title>Checkpoint</title>"* ]]; then
  echo "[checkpoint] Expected app title was not found in index.html output." >&2
  exit 1
fi

if [[ "$HTML" != *'id="app"'* ]]; then
  echo "[checkpoint] Expected #app mount node was not found in index.html output." >&2
  exit 1
fi

if [[ "$HTML" == *'cdn.tailwindcss.com'* ]]; then
  echo "[checkpoint] Tailwind CDN script should not be present in production HTML." >&2
  exit 1
fi

if [[ "$HTML" != *'https://accounts.google.com/gsi/client'* ]]; then
  echo "[checkpoint] Expected Google Identity Services script was not found in index.html output." >&2
  exit 1
fi

CONFIG_JS="$(curl -fsS "http://127.0.0.1:$PORT/checkpoint/config.js")"

if [[ "$CONFIG_JS" != *'steamGridWorkerUrl'* ]]; then
  echo "[checkpoint] Expected SteamGrid worker config was not found in config.js." >&2
  exit 1
fi

if [[ "$CONFIG_JS" != *'googleDriveClientId'* ]]; then
  echo "[checkpoint] Expected Google Drive client config was not found in config.js." >&2
  exit 1
fi

echo "[checkpoint] Verifying integration failure, bulk-refresh, and add-flow paths..."
node checkpoint/scripts/verify_phase2_integrations.mjs

echo "[checkpoint] Verifying pricing service adapter paths..."
node checkpoint/scripts/verify_pricing_services.mjs

echo "[checkpoint] Verifying pricing watch defaults, trigger guard, and status UI states..."
node checkpoint/scripts/verify_pricing_watch_states.mjs

echo "[checkpoint] Verifying Phase 4 hardening coverage..."
node checkpoint/scripts/verify_phase4_hardening.mjs

echo "[checkpoint] Smoke test passed."
