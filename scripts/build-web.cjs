/**
 * The Pie Lab — Web Build Script
 * Copies web app files to www/ for Capacitor native builds,
 * then generates sw-manifest.json with content hashes and
 * stamps a unique CACHE_NAME into www/sw.js.
 *
 * Uses only Node built-ins (fs, path, crypto) — zero external dependencies.
 *
 * Usage: npm run build   (or:  node scripts/build-web.js)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'www');

// Top-level names to EXCLUDE from the copy
const EXCLUDE = new Set([
  'node_modules',
  'www',
  'android',
  'ios',
  '.git',
  '.claude',
  'scripts',
  'resources',
  'Logos',
  'plan_raw.txt',
  'capacitor.config.ts',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  '.gitignore',
  '.DS_Store',
  'Thumbs.db',
  '.prettierrc',
  '.prettierignore',
  'eslint.config.js',
  '.husky',
  'PLAN.md',
]);

// 1. Clean www/ directory
if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true });
}
fs.mkdirSync(DEST, { recursive: true });

// 2. Recursive copy with exclusions
function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    // Only apply exclusion list at the root level
    if (src === ROOT && EXCLUDE.has(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(ROOT, DEST);

// 3. Generate sw-manifest.json with content hashes
//    Reads APP_SHELL_PATHS from sw.js, hashes each file, and derives
//    a unique CACHE_NAME so the SW auto-updates when any asset changes.

const swPath = path.join(DEST, 'sw.js');
const swSource = fs.readFileSync(swPath, 'utf8');

// Extract APP_SHELL_PATHS array entries from sw.js
const arrayMatch = swSource.match(/const APP_SHELL_PATHS = \[([\s\S]*?)\];/);
if (!arrayMatch) {
  console.error('✗ Could not find APP_SHELL_PATHS in sw.js');
  process.exit(1);
}

const assetPaths = arrayMatch[1]
  .split('\n')
  .map((line) => {
    const m = line.match(/'([^']*)'/);
    return m ? m[1] : null;
  })
  .filter((p) => p !== null && p !== '');

// Hash each asset file
function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 10);
}

const manifest = {};
for (const assetPath of assetPaths) {
  const filePath = path.join(DEST, assetPath);
  if (fs.existsSync(filePath)) {
    manifest[assetPath] = hashFile(filePath);
  } else {
    console.warn(`  ⚠ Asset not found: ${assetPath}`);
  }
}

// Derive cache name from a hash of the full manifest
const manifestJSON = JSON.stringify(manifest, Object.keys(manifest).sort(), 2);
const cacheHash = crypto.createHash('sha256').update(manifestJSON).digest('hex').slice(0, 10);
const cacheName = 'pielab-' + cacheHash;

// Write sw-manifest.json to www/
const fullManifest = { _cacheName: cacheName, _hash: cacheHash, assets: manifest };
fs.writeFileSync(path.join(DEST, 'sw-manifest.json'), JSON.stringify(fullManifest, null, 2));

// Stamp CACHE_NAME into www/sw.js
const swUpdated = swSource.replace(
  /const CACHE_NAME = '[^']*'/,
  `const CACHE_NAME = '${cacheName}'`
);
fs.writeFileSync(swPath, swUpdated);

// 4. Report
function countFiles(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += countFiles(path.join(dir, entry.name));
    else n++;
  }
  return n;
}

const total = countFiles(DEST);
console.log(`✓ Build complete: ${total} files copied to www/`);
console.log(`✓ SW manifest: ${Object.keys(manifest).length} assets hashed → ${cacheName}`);
