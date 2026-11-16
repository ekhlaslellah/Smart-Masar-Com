/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Bundles `server.ts` and all local TypeScript modules (`src/**`) into a single,
 * self-contained ESM serverless handler at `api/index.js` for Vercel deployment.
 * Eliminates ERR_MODULE_NOT_FOUND (/var/task/server) on Vercel Serverless.
 */

import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outFile = path.join(projectRoot, 'api', 'index.js');

async function buildVercelServerlessBundle() {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  await build({
    entryPoints: [path.join(projectRoot, 'server.ts')],
    outfile: outFile,
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    packages: 'external',
    treeShaking: true,
    minifySyntax: true,
    define: {
      'process.env.VERCEL_BUNDLE': '"1"',
    },
    banner: {
      js: '// Auto-generated unified Vercel Serverless Function bundle from server.ts — DO NOT EDIT MANUALLY',
    },
    logLevel: 'info',
  });

  const generatedCode = fs.readFileSync(outFile, 'utf8');
  if (
    generatedCode.includes("from '../server'") ||
    generatedCode.includes('from "../server"') ||
    generatedCode.includes("from '../../../server'") ||
    generatedCode.includes('import("vite")') ||
    generatedCode.includes('apiApp.listen(')
  ) {
    throw new Error(
      'api/index.js contains unbundled relative server imports, vite dev server, or listen() call!'
    );
  }

  // Verify the compiled ESM bundle loads cleanly in native Node.js without starting listen()
  process.env.VERCEL = '1';
  process.env.SMART_MASAR_NO_LISTEN = '1';
  const mod = await import(pathToFileURL(outFile).href);
  if (typeof mod.default !== 'function' || typeof mod.apiApp !== 'function') {
    throw new Error('Compiled api/index.js does not export a valid Express function handler.');
  }

  console.log('✓ Unified Vercel Serverless Function bundle verified at api/index.js');
}

buildVercelServerlessBundle().catch((err) => {
  console.error('Failed to build Vercel Serverless bundle:', err);
  process.exit(1);
});
