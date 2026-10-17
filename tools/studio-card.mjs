// Builds the studio card (apps/studio/src/card/card.ts and the MCP Apps
// library it uses) into one self-contained page, written as a module the
// studio serves: apps/studio/src/card/page.ts. Run it after changing the
// card: node tools/studio-card.mjs   (a studio test checks it is current)
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const { build } = createRequire(join(root, 'apps/live-room/package.json'))(
  'esbuild',
);

export async function cardPage() {
  const result = await build({
    absWorkingDir: join(root, 'apps/studio'),
    entryPoints: ['src/card/card.ts'],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
  });
  const script = result.outputFiles[0].text.replace(
    /<\/script/gi,
    '<\\/script',
  );
  const style = await readFile(
    join(root, 'apps/studio/src/card/card.css'),
    'utf8',
  );
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tastir studio</title><style>${style}</style></head><body><main><h1 id="title">Tastir studio</h1><p id="meta" class="muted"></p><img id="picture" hidden alt=""><h2 id="questions-heading" hidden>Questions for you</h2><div id="questions"></div><p id="status" class="muted" role="status"></p></main><script>${script}</script></body></html>`;
  return `// Made by tools/studio-card.mjs from card.ts and card.css; do not edit.\nexport const CARD_HTML = ${JSON.stringify(html)};\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(join(root, 'apps/studio/src/card/page.ts'), await cardPage());
  process.stdout.write('Wrote apps/studio/src/card/page.ts\n');
}
