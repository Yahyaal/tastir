import { builtinModules, createRequire } from 'node:module';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const output = join(root, 'dist/studio-function');

export async function buildStudio() {
  // Use the workspace's already pinned esbuild, also used by the live-room build.
  const buildRequire = createRequire(join(root, 'apps/live-room/package.json'));
  const { build } = buildRequire('esbuild');
  const studioRequire = createRequire(join(root, 'apps/studio/package.json'));
  await rm(output, { recursive: true, force: true });
  await mkdir(join(output, 'server'), { recursive: true });
  const result = await build({
    absWorkingDir: root,
    entryPoints: ['apps/studio/src/vercel.ts'],
    outfile: join(output, 'server/index.mjs'),
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    conditions: ['@tastir/source'],
    external: ['@resvg/resvg-js'],
    // ws has correct JS fallbacks; do not introduce optional native accelerators.
    define: {
      'process.env.WS_NO_BUFFER_UTIL': '"1"',
      'process.env.WS_NO_UTF_8_VALIDATE': '"1"',
    },
    minifySyntax: true,
    // Bundled CommonJS dependencies still need Node's require for built-ins.
    banner: {
      js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
    },
    metafile: true,
    legalComments: 'eof',
  });
  const builtins = new Set(
    builtinModules.flatMap((name) => [name, `node:${name}`]),
  );
  for (const chunk of Object.values(result.metafile.outputs)) {
    for (const dependency of chunk.imports) {
      if (
        dependency.external &&
        !builtins.has(dependency.path) &&
        dependency.path !== '@resvg/resvg-js'
      ) {
        throw new Error(`Unexpected runtime dependency: ${dependency.path}`);
      }
    }
  }
  // Keep picture.ts's ../fonts path after bundling, including its licence.
  await cp(join(root, 'apps/studio/fonts'), join(output, 'fonts'), {
    recursive: true,
  });
  // A real, self-contained node_modules tree: no pnpm links back to the checkout.
  const renderer = dirname(
    studioRequire.resolve('@resvg/resvg-js/package.json'),
  );
  const copyOptions = {
    recursive: true,
    dereference: true,
    filter: (path) => !/\.(?:ts|mts|tsx)$/.test(path),
  };
  await cp(renderer, join(output, 'node_modules/@resvg/resvg-js'), copyOptions);
  const rendererRequire = createRequire(join(renderer, 'package.json'));
  const manifest = JSON.parse(
    await readFile(join(renderer, 'package.json'), 'utf8'),
  );
  let natives = 0;
  for (const name of Object.keys(manifest.optionalDependencies ?? {})) {
    let location;
    try {
      location = dirname(rendererRequire.resolve(`${name}/package.json`));
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') continue;
      throw error;
    }
    await cp(location, join(output, 'node_modules', name), copyOptions);
    natives++;
  }
  if (!natives)
    throw new Error(
      'Install optional dependencies: resvg needs its native platform package.',
    );
  // Vercel typechecks the API entry after this build; no source types required.
  await writeFile(
    join(output, 'server/index.d.mts'),
    "import type { RequestListener } from 'node:http';\nexport declare function hostedFromEnv(): Promise<{ app: RequestListener; close: () => void }>;\n",
  );
  await writeFile(
    join(root, 'dist/studio-function-meta.json'),
    `${JSON.stringify(result.metafile, null, 2)}\n`,
  );
  console.log(
    'Built dist/studio-function: server JavaScript, native renderer and fonts.',
  );
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  await buildStudio();
}
