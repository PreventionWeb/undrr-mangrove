/**
 * Design-token source contract.
 *
 * `tokens/*.yaml` is the single source every brand is built from;
 * `scripts/build-tokens.cjs` emits the Sass partials that Mangrove's own
 * stylesheet and the standalone aria/tokens/*.css both consume. Three ways
 * that can rot, all silent:
 *
 *   1. someone edits a generated partial, or edits the YAML without
 *      rebuilding, so the artifact and the shipped CSS disagree;
 *   2. someone re-hardcodes a brand value into a hand-written Sass file,
 *      which is exactly how _theme-delta.scss and aria/_tokens-delta.scss
 *      came to hold two independent copies of the same brand;
 *   3. the generator quietly produces wrong output instead of failing —
 *      the failure mode the whole architecture exists to prevent. The
 *      second half of this file mutation-tests each guard, because a guard
 *      nobody has watched fail is not a guard.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const { build, TokenError } = require(
  path.join(ROOT, 'scripts/build-tokens.cjs')
);

const BRANDS = ['mangrove', 'preventionweb', 'irp', 'mcr', 'delta'];

describe('design-token generator', () => {
  test('generated Sass partials are up to date with the YAML sources', () => {
    const stale = [];
    for (const [relative, expected] of build()) {
      const absolute = path.join(ROOT, relative);
      const actual = fs.existsSync(absolute)
        ? fs.readFileSync(absolute, 'utf8')
        : null;
      if (actual !== expected) stale.push(relative);
    }

    // Run `yarn build:tokens` to fix.
    expect(stale).toEqual([]);
  });

  test('emits one partial per distributed brand', () => {
    expect([...build().keys()].sort()).toEqual(
      BRANDS.map(
        brand => `stories/assets/scss/generated/_tokens-${brand}.scss`
      ).sort()
    );
  });

  test('generated partials warn against hand-editing and name the command', () => {
    for (const [relative, contents] of build()) {
      expect(contents).toContain('GENERATED FILE — DO NOT EDIT.');
      expect(contents).toContain('Regenerate: yarn build:tokens');
      expect(fs.readFileSync(path.join(ROOT, relative), 'utf8')).toContain(
        'GENERATED FILE — DO NOT EDIT.'
      );
    }
  });

  test('writes are idempotent: a second build changes no bytes', () => {
    // Generated output sits inside webpack's watch scope. Rewriting identical
    // bytes bumps mtime, rebuilds, and invalidates the chunk hash held by any
    // open Storybook tab.
    const first = build();
    const second = build();
    for (const [relative, contents] of first) {
      expect(second.get(relative)).toBe(contents);
    }
  });

  test('$description reasoning survives into the generated files', () => {
    // These record real decisions — a hover step that is deliberately lighter
    // than its base, and a deliberate WCAG divergence. Losing them would make
    // the next reader "fix" them.
    const delta = build().get(
      'stories/assets/scss/generated/_tokens-delta.scss'
    );
    expect(delta).toContain('LIGHTER than the base colour');
    expect(delta).toContain('#006968 is 6.52:1');
  });

  test('no hand-written Sass re-hardcodes a generated brand value', () => {
    const literals = [];
    for (const contents of build().values()) {
      for (const match of contents.matchAll(
        /^(?:\$|\s+--)[a-z0-9_-]+: (.+);$/gim
      )) {
        // Channel triplets and rgb() values are distinctive enough to match
        // literally; a bare "1rem" would not be.
        if (/^\d+ \d+ \d+$|^rgb\(\d/.test(match[1])) literals.push(match[1]);
      }
    }
    expect(literals.length).toBeGreaterThan(10);

    // Scoped to the theme and React Aria adapter files, which are where the
    // duplication actually happened: _theme-delta.scss and
    // aria/_tokens-delta.scss each held an independent copy of the DELTA
    // brand. (_tokens-data-viz.scss does re-state neutral and DELTA channel
    // values; that palette is a separate concern and is not migrated here.)
    const hardcoded = [];
    const guarded = [
      ...['preventionweb', 'irp', 'mcr', 'delta'].map(
        brand => `stories/assets/scss/_theme-${brand}.scss`
      ),
      ...BRANDS.map(brand => `stories/assets/scss/aria/_tokens-${brand}.scss`),
      'stories/assets/scss/aria/_runtime-theme-aliases.scss',
      'stories/assets/scss/aria/_tokens-shared.scss',
      'stories/assets/scss/aria/_tokens-inline.scss',
      'stories/assets/scss/_variables.scss',
    ];
    for (const relative of guarded) {
      const contents = fs.readFileSync(path.join(ROOT, relative), 'utf8');
      for (const value of literals) {
        // Anchored: a bare substring search matches "0 0 0" inside a
        // box-shadow offset list and reports a duplication that is not one.
        const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (
          new RegExp(`(?::\\s*|\\(\\s*)${escaped}\\s*(?:[;)]|/)`).test(contents)
        ) {
          hardcoded.push(`${relative}: ${value}`);
        }
      }
    }

    expect(hardcoded).toEqual([]);
  });
});

/**
 * Mutation tests for the loud-failure guards. Each writes a deliberately
 * broken token source into a temporary directory and asserts the generator
 * refuses it rather than emitting something plausible-looking.
 */
describe('the generator fails loudly', () => {
  let dir;

  const BASE = `
$brand: { id: mangrove, base: true, title: Base, selector: ':root' }
color:
  $type: color
  neutral-0: { $value: '#ffffff' }
  interactive: { $value: '{color.neutral-0}' }
`;
  const DEFAULT_BRAND = `
$brand: { id: undrr, output: mangrove, default: true, title: UNDRR, selector: ':root' }
color:
  $type: color
  blue-900: { $value: '#004f91' }
  interactive: { $value: '{color.blue-900}' }
`;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-tokens-'));
    fs.writeFileSync(path.join(dir, 'mangrove.yaml'), BASE);
    fs.writeFileSync(path.join(dir, 'undrr.yaml'), DEFAULT_BRAND);
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const write = (name, body) => fs.writeFileSync(path.join(dir, name), body);
  // The fixture is two tiny files, so the closure is driven from an
  // explicit seed rather than from Mangrove's real adapter sources.
  const run =
    (seeds = ['--mg-color-interactive']) =>
    () =>
      build({ tokensDir: dir, ariaSeedNames: seeds });

  test('the fixture itself builds, so every failure below is the mutation', () => {
    expect(run()).not.toThrow();
  });

  test('unknown reference', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '{color.nope}' } }`
    );
    expect(run()).toThrow(/references unknown token "\{color\.nope\}"/);
    expect(run()).toThrow(TokenError);
  });

  test('circular reference', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color:
  $type: color
  a: { $value: '{color.b}' }
  b: { $value: '{color.a}' }`
    );
    expect(run()).toThrow(/circular reference/);
  });

  test('duplicate output name across brands', () => {
    write(
      'x.yaml',
      `$brand: { id: x, output: shared, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '{color.interactive}' } }`
    );
    write(
      'y.yaml',
      `$brand: { id: y, output: shared, title: Y, selector: '.y' }
color: { $type: color, tag: { $value: '{color.interactive}' } }`
    );
    expect(run()).toThrow(/two brands write the same output name "shared"/);
  });

  test('unknown format', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '#ff0000', $format: srgb-hex } }`
    );
    expect(run()).toThrow(/unknown format "srgb-hex"/);
  });

  test('linking to a $private token, which has no custom property', () => {
    // The mistake that produces a dead var() chain: a brand primitive is not
    // emitted as a property, so it can only be resolved at build time.
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
brand: { $type: color, $private: true, primary: { $value: '#123456' } }
color: { $type: color, tag: { $value: '{brand.primary}' } }`
    );
    expect(run()).toThrow(/is \$private and has no custom property/);
  });

  test('a colour that cannot be expressed in the shape it is emitted in', () => {
    // The value-type trap, caught at the source. A named colour, an oklch()
    // value or a finished rgb() cannot be channels; a triplet in a colour
    // position is invalid CSS and is discarded silently.
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color: { $type: color, tag: { $value: 'papayawhip' } }`
    );
    expect(run()).toThrow(/is not sRGB channels/);
  });

  test('a hex colour that is not 6 digits', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '#f00' } }`
    );
    expect(run()).toThrow(/must be 6-digit hex/);
  });

  test('casting a non-colour token to rgb()', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
size: { $type: dimension, gap: { $value: '4px' } }
color: { $type: color, tag: { $value: '{rgb(size.gap)}' } }`
    );
    expect(run()).toThrow(/casts .* to rgb\(\) but its \$type is "dimension"/);
  });

  test('two tokens claiming the same custom property', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '#123456' } }
alias: { $type: color, dup: { $name: '--mg-color-tag', $value: '#654321' } }`
    );
    expect(run()).toThrow(/is emitted by both/);
  });

  test('a $brand block with no id', () => {
    write('x.yaml', 'color: { $type: color, tag: { $value: "#123456" } }');
    expect(run()).toThrow(/missing \$brand\.id/);
  });

  test('an extends chain naming a brand that does not exist', () => {
    write(
      'x.yaml',
      `$brand: { id: x, extends: ghost, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '{color.interactive}' } }`
    );
    expect(run()).toThrow(/\$brand\.extends "ghost" is not a known brand/);
  });

  test('the React Aria adapter reading a token no source defines', () => {
    // This is the 28-undefined-reference defect, caught at generation time
    // instead of shipping as a stylesheet that silently does nothing.
    const base = fs.readFileSync(path.join(dir, 'mangrove.yaml'), 'utf8');
    fs.writeFileSync(
      path.join(dir, 'mangrove.yaml'),
      base.replace("  interactive: { $value: '{color.neutral-0}' }\n", '')
    );
    fs.writeFileSync(
      path.join(dir, 'undrr.yaml'),
      DEFAULT_BRAND.replace(
        "  interactive: { $value: '{color.blue-900}' }\n",
        ''
      )
    );
    expect(run()).toThrow(
      /the React Aria adapter reads --mg-color-interactive, which no token source defines/
    );
  });
});
