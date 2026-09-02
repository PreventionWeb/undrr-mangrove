import fs from 'node:fs';
import path from 'node:path';

import { wrapInLayer } from '../lib/wrap-css-layer.js';

const repoRoot = path.resolve(__dirname, '..', '..');
const unlayeredPath = path.join(repoRoot, 'aria', 'react-aria.css');
const layeredPath = path.join(repoRoot, 'aria', 'react-aria.layered.css');

describe('wrapInLayer', () => {
  it('wraps rules in the named layer', () => {
    expect(wrapInLayer('.a { color: red; }\n', 'mangrove')).toContain(
      '@layer mangrove {'
    );
  });

  it('hoists @charset and @import above the layer block', () => {
    const out = wrapInLayer(
      '@charset "UTF-8";\n@import url("x.css");\n.a { color: red; }\n',
      'mangrove'
    );
    expect(out.indexOf('@charset')).toBeLessThan(out.indexOf('@layer'));
    expect(out.indexOf('@import')).toBeLessThan(out.indexOf('@layer'));
  });

  it('preserves the original whitespace between rules', () => {
    const source = '.a {\n  color: red;\n}\n\n.b {\n  color: blue;\n}\n';
    expect(wrapInLayer(source, 'mangrove')).toContain(
      '.a {\n  color: red;\n}\n\n.b {'
    );
  });

  it('does not declare a layer order, leaving that to the consumer', () => {
    // A bare `@layer a, b;` statement in the shipped file would silently
    // reorder a consumer's own layers.
    expect(wrapInLayer('.a { color: red; }\n', 'mangrove')).not.toMatch(
      /@layer[^{]*,/
    );
  });
});

describe('the built aria artifacts', () => {
  it('ships a layered flavour alongside the unlayered one', () => {
    expect(fs.existsSync(layeredPath)).toBe(true);
  });

  it('keeps the layered flavour in sync with the unlayered one', () => {
    const unlayered = fs.readFileSync(unlayeredPath, 'utf8');
    const layered = fs.readFileSync(layeredPath, 'utf8');
    expect(layered).toBe(wrapInLayer(unlayered, 'mangrove', unlayeredPath));
  });
});
