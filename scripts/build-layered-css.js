#!/usr/bin/env node
/**
 * Emit the layered flavour of a built CSS artifact.
 *
 * Mangrove ships two flavours of its public stylesheet:
 *
 *   aria/react-aria.css          - unlayered (the historical, default surface)
 *   aria/react-aria.layered.css  - identical rules, wrapped in `@layer mangrove`
 *
 * The layered flavour exists so consumers never have to rely on
 * `@import "…" layer(name)` surviving their bundler or Drupal's CSS aggregator,
 * both of which mishandle it. See docs/CASCADE-LAYERS.md.
 *
 * Usage:
 *   node scripts/build-layered-css.js [--layer=mangrove] in.css:out.css [more…]
 */

import fs from 'node:fs';
import path from 'node:path';
import { wrapInLayer } from './lib/wrap-css-layer.js';

/**
 * Read a CSS file, wrap it in a layer and write the result.
 *
 * @param {string} input - Path to the built CSS file.
 * @param {string} output - Path to write the layered CSS to.
 * @param {string} layerName - Cascade layer name.
 * @returns {void}
 */
function build(input, output, layerName) {
  const css = fs.readFileSync(input, 'utf8');
  const layered = wrapInLayer(css, layerName, input);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  // See build-tokens.cjs: an identical rewrite still bumps mtime and triggers a
  // webpack rebuild, which breaks hot module replacement for open tabs.
  const previous = fs.existsSync(output)
    ? fs.readFileSync(output, 'utf8')
    : null;
  if (previous === layered) {
    console.log(`Unchanged ${output}`);
    return;
  }
  fs.writeFileSync(output, layered);
  process.stdout.write(
    `Wrote ${output} (@layer ${layerName}, ${layered.length} bytes)\n`
  );
}

const args = process.argv.slice(2);
const layerArg = args.find(arg => arg.startsWith('--layer='));
const layerName = layerArg ? layerArg.slice('--layer='.length) : 'mangrove';
const pairs = args.filter(arg => !arg.startsWith('--'));

if (pairs.length === 0) {
  process.stderr.write(
    'Usage: node scripts/build-layered-css.js [--layer=name] in.css:out.css …\n'
  );
  process.exit(1);
}

for (const pair of pairs) {
  const separator = pair.lastIndexOf(':');
  if (separator === -1) {
    process.stderr.write(`Expected "input.css:output.css", got "${pair}"\n`);
    process.exit(1);
  }
  build(pair.slice(0, separator), pair.slice(separator + 1), layerName);
}
