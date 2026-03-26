#!/usr/bin/env bash
# Smoke-test the local app over HTTP by checking the main routes and key assets.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-8131}"
BASE_URL="http://127.0.0.1:${PORT}/star-wars-timeline"
SERVER_LOG="${SERVER_LOG:-/tmp/star-wars-timeline-smoke.log}"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

cd "${ROOT}/.."
python3 -m http.server "${PORT}" >"${SERVER_LOG}" 2>&1 &
SERVER_PID=$!

for _ in {1..20}; do
  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if ! curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
  echo "Smoke test server failed to start on port ${PORT}" >&2
  if [[ -f "${SERVER_LOG}" ]]; then
    cat "${SERVER_LOG}" >&2
  fi
  exit 1
fi

check_route() {
  local url="$1"
  curl -fsS "${url}" >/dev/null
  echo "OK ${url}"
}

INDEX_HTML="$(mktemp)"
curl -fsS "${BASE_URL}/" >"${INDEX_HTML}"
grep -q 'id="app"' "${INDEX_HTML}"
grep -q './app.js' "${INDEX_HTML}"
rm -f "${INDEX_HTML}"
echo "OK ${BASE_URL}/ contains app shell"

check_route "${BASE_URL}/guide/"
check_route "${BASE_URL}/privacy/"
check_route "${BASE_URL}/terms/"
check_route "${BASE_URL}/data/timeline-data.json"
check_route "${BASE_URL}/data/music-data.json"
check_route "${BASE_URL}/app.js"
check_route "${BASE_URL}/content-page.js"
check_route "${BASE_URL}/styles.css"

echo "Smoke test OK"
