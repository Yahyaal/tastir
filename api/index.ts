// The hosted studio's server on Vercel: one function for /mcp, the sign-in
// pages and /api (vercel.json sends those addresses here). Vercel's CDN
// serves the hosted build of Tastir itself. Settings: apps/studio/src/vercel.ts.
import { hostedFromEnv } from '../apps/studio/src/vercel.js';

const { app } = await hostedFromEnv();
export default app;
