#!/usr/bin/env bash
# The lines each step of <id> hides when helper lines are off (large/hidden.ts).
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$root"
pnpm -s exec tsx --conditions=@tastir/source tools/review/tilingsearch_45/large/hidden.ts "$1"
