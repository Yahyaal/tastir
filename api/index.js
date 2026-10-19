// The hosted studio's server on Vercel: one function for /mcp, the sign-in
// pages and /api (vercel.json sends those addresses here). Vercel's CDN
// serves the hosted build of Tastir itself. Settings: apps/studio/src/vercel.ts.
// Plain JavaScript on purpose: tools/studio-build.mjs has already bundled the
// server, and Vercel would otherwise compile this file with the repository's
// top-level TypeScript settings, which build nothing ("Emit skipped").
import { hostedFromEnv } from '../dist/studio-function/server/index.mjs';

const { app } = await hostedFromEnv();
export default app;
