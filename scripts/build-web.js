/**
 * The Pie Lab — Web Build Script
 * Copies web app files to www/ for Capacitor native builds.
 * Uses only Node built-ins (fs, path) — zero external dependencies.
 *
 * Usage: npm run build   (or:  node scripts/build-web.js)
 */

const fs = require('fs');
const path = require('path');

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

// 3. Report
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
