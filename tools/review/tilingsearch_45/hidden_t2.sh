#!/usr/bin/env bash
# Lists the lines each step hides with helper lines off (batch T2).
# Usage: tools/review/tilingsearch_45/hidden_t2.sh <tutorial-id>
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
"$root/node_modules/.bin/tsx" --conditions=@tastir/source "$root/tools/review/tilingsearch_45/large/hidden.ts" "$1"
