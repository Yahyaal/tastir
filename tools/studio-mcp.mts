// The studio's MCP server on stdio, for Claude Code, Codex, Gemini and
// other MCP clients. Start the studio first with pnpm studio.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMcp } from '../apps/studio/src/index.js';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
await runMcp(process.env['TASTIR_STUDIO_DIR'] ?? join(repo, 'studio'));
