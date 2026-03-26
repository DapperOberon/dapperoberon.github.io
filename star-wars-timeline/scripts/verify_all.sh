#!/usr/bin/env bash
# Run the lightweight project verification pass: syntax, data validators, and smoke test.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Running JavaScript syntax checks..."
python3 "${ROOT}/scripts/check_js_syntax.py"

echo "Validating timeline data..."
python3 "${ROOT}/scripts/validate_timeline_data.py"

echo "Validating music data..."
python3 "${ROOT}/scripts/validate_music_data.py"

echo "Running local HTTP smoke test..."
bash "${ROOT}/scripts/smoke_test.sh"

echo "All verification checks passed"
