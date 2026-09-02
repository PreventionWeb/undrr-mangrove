/**
 * Design-token source contract.
 *
 * `tokens/delta.tokens.json` is the source DELTA's brand values are built
 * from; `scripts/build-tokens.cjs` emits the Sass partials that Mangrove's own
 * stylesheet and the standalone aria/tokens/delta.css both consume. Two ways
 * that can rot, both silent:
 *
 *   1. someone edits a generated partial, or edits the JSON without
 *      rebuilding, so the artifact and the shipped CSS disagree;
 *   2. someone re-hardcodes a brand value into a hand-written Sass file, which
 *      is exactly how _theme-delta.scss and aria/_tokens-delta.scss came to
 *      hold two independent copies of the same brand in the first place.
 *
 * Until `build:tokens` is wired into the `yarn scss` script, (1) is what keeps
 * the generator honest in CI.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const { build } = require(path.join(ROOT, 'scripts/build-tokens.cjs'));
const source = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'tokens/delta.tokens.json'), 'utf8')
);

describe('design-token generator', () => {
  test('generated Sass partials are up to date with the JSON source', () => {
    const stale = [];
    for (const [relative, expected] of build()) {
      const absolute = path.join(ROOT, relative);
      const actual = fs.existsSync(absolute)
        ? fs.readFileSync(absolute, 'utf8')
        : null;
      if (actual !== expected) stale.push(relative);
    }

    // Run `node scripts/build-tokens.cjs` to fix.
    expect(stale).toEqual([]);
  });

  test('generated partials warn against hand-editing', () => {
    for (const relative of build().keys()) {
      expect(fs.readFileSync(path.join(ROOT, relative), 'utf8')).toContain(
        'GENERATED FILE — DO NOT EDIT.'
      );
    }
  });

  test('every output declares an explicit value format', () => {
    // A colour in this repo is written both as bare sRGB channels ("19 46 72",
    // composable with rgb(... / alpha)) and as a finished colour value. A
    // reader that guesses wrong emits CSS that does nothing, which is a bug
    // this codebase has actually shipped.
    const missing = [];
    const walk = (node, trail) => {
      for (const [key, child] of Object.entries(node)) {
        if (key.startsWith('$') || !child || typeof child !== 'object')
          continue;
        const id = [...trail, key].join('.');
        if (Object.prototype.hasOwnProperty.call(child, '$value')) {
          const outputs =
            ((child.$extensions || {})['org.undrr.mangrove'] || {}).outputs ||
            [];
          for (const output of outputs) {
            if (!output.format || !output.target || !output.name) {
              missing.push(id);
            }
          }
        } else {
          walk(child, [...trail, key]);
        }
      }
    };
    walk(source, []);

    expect(missing).toEqual([]);
  });

  test('no hand-written Sass re-hardcodes a generated DELTA brand value', () => {
    const hardcoded = [];
    const literals = [];
    for (const [relative, contents] of build()) {
      for (const match of contents.matchAll(
        /^(?:\$|\s+--)[a-z0-9-]+: (.+);$/gim
      )) {
        literals.push({ relative, value: match[1] });
      }
    }

    for (const file of [
      'stories/assets/scss/_theme-delta.scss',
      'stories/assets/scss/aria/_tokens-delta.scss',
    ]) {
      const contents = fs.readFileSync(path.join(ROOT, file), 'utf8');
      for (const { value } of literals) {
        // Channel triplets and rgb() values are distinctive enough to match
        // literally; a bare "1rem" would not be, but none are generated.
        if (!/^\d+ \d+ \d+$|^rgb\(/.test(value)) continue;
        if (contents.includes(value)) hardcoded.push(`${file}: ${value}`);
      }
    }

    expect(hardcoded).toEqual([]);
  });
});
