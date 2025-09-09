#!/usr/bin/env node
/**
 * Copy monaco-editor minimized "vs" folder into public for offline usage.
 * Also copies i18n json bundles so that locale 'zh-cn' works without CDN.
 */
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const sourceVs = path.resolve('node_modules/monaco-editor/min/vs');
// New target location under public/assets to align with other static assets
const targetVs = path.resolve('public/assets/monaco/vs');
// Legacy path (old location) for cleanup
const legacyRoot = path.resolve('public/monaco');

function copyDir(src, dest) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[monaco-offline] Copied ${src} -> ${dest}`);
}

if (!existsSync(sourceVs)) {
  console.error('[monaco-offline] monaco-editor not installed yet. Run npm install first.');
  process.exit(1);
}

// Cleanup legacy directory if exists to avoid shipping duplicate large assets
if (existsSync(legacyRoot)) {
  rmSync(legacyRoot, { recursive: true, force: true });
  console.log('[monaco-offline] Removed legacy directory', legacyRoot);
}

copyDir(sourceVs, targetVs);

console.log('[monaco-offline] Done.');
