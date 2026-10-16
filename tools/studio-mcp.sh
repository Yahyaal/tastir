#!/usr/bin/env bash
# Runs the Tastir studio MCP server. MCP clients start this command; it
# works from any folder. Nothing but the protocol may go to stdout.
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo"
exec node --conditions=@tastir/source --import tsx tools/studio-mcp.mts
