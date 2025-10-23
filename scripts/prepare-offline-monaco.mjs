#!/usr/bin/env node
/**
 * Copy monaco-editor minimized "vs" folder into public for offline usage.
 * Also copies i18n json bundles so that locale 'zh-cn' works without CDN.
 */
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync, lstatSync, chownSync } from 'node:fs';
import path from 'node:path';

const sourceVs = path.resolve('node_modules/monaco-editor/min/vs');
// New target location under public/assets to align with other static assets
const targetVs = path.resolve('public/assets/monaco/vs');
// Legacy path (old location) for cleanup
const legacyRoot = path.resolve('public/monaco');

/**
 * @param {string} src
 * @param {string} dest
 */
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

// If the script was executed as root (e.g., in a container or with sudo),
// fix the ownership of the copied files to match the project directory owner
// to prevent root-owned files in the working tree (which can break CI caches, local edits, etc.).
/**
 * Determine the desired non-root file owner to apply to the target directory.
 * @returns {{uid:number, gid:number|undefined}|undefined}
 */
function resolveDesiredOwner() {
  try {
    // Prefer SUDO_UID/GID when available (sudo preserves the original user here)
    const sudoUid = process.env.SUDO_UID !== undefined ? Number(process.env.SUDO_UID) : undefined;
    const sudoGid = process.env.SUDO_GID !== undefined ? Number(process.env.SUDO_GID) : undefined;
    if (typeof sudoUid === 'number' && Number.isFinite(sudoUid) && sudoUid >= 0) {
      return {
        uid: sudoUid,
        gid: typeof sudoGid === 'number' && Number.isFinite(sudoGid) ? sudoGid : undefined,
      };
    }
    // Fallback: use owner of the current working directory (usually the repo owner, e.g., jenkins)
    const st = lstatSync(process.cwd());
    if (typeof st.uid === 'number' && st.uid >= 0) {
      return { uid: st.uid, gid: typeof st.gid === 'number' ? st.gid : undefined };
    }
  } catch {
    // ignore and return undefined below
  }
  return undefined;
}

/**
 * Recursively change ownership of a directory tree.
 * @param {string} rootPath
 * @param {number} uid
 * @param {number|undefined} gid
 */
function chownRecursive(rootPath, uid, gid) {
  // Depth-first to ensure directories are writable for children
  /** @type {string[]} */
  const stack = [rootPath];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    stack.pop();
    try {
      const entries = readdirSync(cur, { withFileTypes: true });
      for (const entry of entries) {
        const p = path.join(cur, entry.name);
        if (entry.isDirectory()) {
          stack.push(p);
        }
        try {
          if (gid !== undefined) {
            chownSync(p, uid, gid);
          } else {
            // Some platforms may not have gid; still set uid in that case
            chownSync(p, uid, lstatSync(p).gid ?? 0);
          }
        } catch {
          // Best-effort; ignore individual failures
        }
      }
      // Finally chown the directory itself
      try {
        if (gid !== undefined) {
          chownSync(cur, uid, gid);
        } else {
          chownSync(cur, uid, lstatSync(cur).gid ?? 0);
        }
      } catch {
        /* ignore */
      }
    } catch {
      // Not a directory or unreadable; attempt to chown the file itself
      try {
        if (gid !== undefined) {
          chownSync(cur, uid, gid);
        } else {
          chownSync(cur, uid, lstatSync(cur).gid ?? 0);
        }
      } catch {
        /* ignore */
      }
    }
  }
}

try {
  const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;
  if (isRoot) {
    const owner = resolveDesiredOwner();
    if (owner && typeof owner.uid === 'number') {
      console.log(`[monaco-offline] Detected root execution. Fixing ownership of ${targetVs} to uid:${owner.uid}` + (typeof owner.gid === 'number' ? ` gid:${owner.gid}` : ''));
      chownRecursive(targetVs, owner.uid, owner.gid);
    } else {
      console.warn('[monaco-offline] Running as root and could not determine a non-root owner. Skipping ownership fix.');
    }
  }
} catch {
  // Non-fatal: ownership fix is best-effort only
}

console.log('[monaco-offline] Done.');
