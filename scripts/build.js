/**
 * Spec-Align Build Script
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const cliDir = path.join(root, 'packages', 'cli');
const uiDir = path.join(root, 'packages', 'ui');
const sharedDir = path.join(root, 'packages', 'shared', 'src');

console.log('🔨 Spec-Align Build\n');

// Clean
fs.rmSync(path.join(cliDir, 'dist'), { recursive: true, force: true });

// ── 1. Bundle CLI with esbuild JS API ──
console.log('[1/3] Bundling CLI...');

// Dynamically import esbuild from the nested pnpm location
const esbuild = await importEsbuild(root);
if (!esbuild) {
  console.error('❌ esbuild not found. Run: pnpm install');
  process.exit(1);
}

await esbuild.build({
  entryPoints: [path.join(cliDir, 'src', 'index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: path.join(cliDir, 'dist', 'index.js'),
  external: ['commander', 'chalk', 'ora', 'hono', '@hono/node-server', 'open'],
  alias: {
    '@spec-thought-align/shared': path.join(sharedDir, 'index.ts'),
  },
});

console.log('   ✓ dist/index.js');

// ── 2. Build UI ──
console.log('[2/3] Building UI...');
execSync('npx vite build', { cwd: uiDir, stdio: 'inherit' });

// ── 3. Copy UI into dist ──
console.log('[3/3] Copying UI assets...');
const uiOut = path.join(cliDir, 'dist', 'ui');
fs.rmSync(uiOut, { recursive: true, force: true });
copyDir(path.join(uiDir, 'dist'), uiOut);

console.log('\n✅ Build complete!');
console.log('   dist/index.js');
console.log('   dist/ui/index.html');

// ── Helpers ──

async function importEsbuild(fromDir) {
  // Try various locations pnpm might put esbuild
  const candidates = [
    path.join(fromDir, 'node_modules', 'esbuild'),
    path.join(fromDir, 'node_modules', '.pnpm', 'esbuild@0.21.5', 'node_modules', 'esbuild'),
    path.join(fromDir, 'node_modules', 'vite', 'node_modules', 'esbuild'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return (await import(`file://${c}/lib/main.js`)).default || (await import(`file://${c}/lib/main.js`));
    }
  }
  return null;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
