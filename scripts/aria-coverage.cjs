#!/usr/bin/env node
/**
 * React Aria styling coverage for the distributed Mangrove surface.
 *
 * Compares the stock `.react-aria-*` class names that react-aria-components
 * actually renders against the ones `aria/react-aria.css` styles. The gap is
 * the list of components a consumer would get unstyled, which is the number
 * that matters when arguing this surface is a usable alternative to a
 * batteries-included component library.
 *
 * Usage: node scripts/aria-coverage.cjs [--list] [--json]
 */
const fs = require('fs');
const path = require('path');

const PKG = path.join(__dirname, '..', 'node_modules', 'react-aria-components');
const CSS = path.join(__dirname, '..', 'aria', 'react-aria.css');

function stockClasses(dir) {
  const found = new Set();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const name of stockClasses(full)) found.add(name);
    } else if (/\.(js|mjs|cjs|d\.ts)$/.test(entry.name)) {
      const src = fs.readFileSync(full, 'utf8');
      for (const m of src.matchAll(/react-aria-([A-Z][A-Za-z]+)/g))
        found.add(m[1]);
    }
  }
  return found;
}

if (!fs.existsSync(PKG)) {
  console.error(
    'react-aria-components is not installed; run yarn install first.'
  );
  process.exit(1);
}

const all = [...stockClasses(PKG)].sort();
const css = fs.readFileSync(CSS, 'utf8');
const styled = new Set(
  [...css.matchAll(/\.react-aria-([A-Za-z]+)/g)].map(m => m[1])
);

const covered = all.filter(name => styled.has(name));
const missing = all.filter(name => !styled.has(name));
const pct = Math.round((covered.length / all.length) * 100);

if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      { total: all.length, covered: covered.length, pct, missing },
      null,
      2
    )
  );
} else {
  console.log(
    `React Aria styling coverage: ${covered.length}/${all.length} (${pct}%)`
  );
  if (process.argv.includes('--list') && missing.length) {
    console.log(`\nUnstyled (${missing.length}):\n  ${missing.join(' ')}`);
  }
}
