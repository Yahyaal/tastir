#!/usr/bin/env bash
# Renders every step of a tutorial, its ink, one tile of pieces and the
# tiled wall to docs/review/<id>/. Usage: pnpm review <id>
set -euo pipefail
id="${1:?usage: pnpm review <tutorial-id>}"
root="$(cd "$(dirname "$0")/../.." && pwd)"
out="$root/docs/review/$id"
mkdir -p "$out"
"${TSX:-tsx}" --conditions=@tastir/source "$root/tools/review/dump.ts" "$id" "$out/dump.json"
python3 "$root/tools/review/render.py" "$out/dump.json" "$out"
echo "wrote $out"
