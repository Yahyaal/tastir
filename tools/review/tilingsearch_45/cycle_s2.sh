#!/usr/bin/env bash
# Batch S2 build cycle: generate, render, write the expect block.
# Usage: tools/review/tilingsearch_45/cycle_s2.sh <generator.py> <pieces.json> <tutorial-id>
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
gen="$1"; pieces="$2"; id="$3"
python3 "$root/tools/review/tilingsearch_45/$gen" "$pieces" "$root/tutorials/$id.json"
(cd "$root" && pnpm -s review "$id" >/dev/null)
python3 "$root/tools/review/tilingsearch_45/$gen" finish "$root/docs/review/$id/dump.json" "$root/tutorials/$id.json"
