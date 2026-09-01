/**
 * Mangrove 2.0 token contract — compiled-CSS assertions.
 *
 * The 2.0 migration's safety claim is "the compiled output is equivalent and
 * each brand's tokens live in a `.mg-theme-{brand}` block." Nothing else
 * verifies that, so a mistyped token or a vanished theme block would ship
 * silently. This suite compiles the SCSS entry points and asserts the
 * structural invariants the release depends on. It intentionally checks
 * compiled output (not source) because that is what consumers actually load.
 */
const path = require('path');
const sass = require('sass');
const { version } = require('../../../../package.json');

const SCSS_DIR = path.resolve(__dirname, '..');
const BRANDS = ['preventionweb', 'irp', 'mcr', 'delta'];
const RUNTIME_ARIA_ALIASES = [
  'color-accent',
  'color-accent-active',
  'color-on-accent',
  'color-text',
  'color-muted-text',
  'color-surface',
  'color-field-surface',
  'color-field-surface-focus',
  'color-subtle-surface',
  'color-selected-surface',
  'color-border',
  'color-border-focus',
  'color-invalid',
  'space-1',
  'space-2',
  'space-3',
  'space-4',
  'radius',
  'radius-button',
  'radius-control',
  'radius-surface',
  'color-focus-ring',
  'focus-width',
  'focus-offset',
  'shadow',
  'surface-shadow',
  'surface-shadow-hover',
  'overlay-shadow',
  'overlay-z-index',
  'motion-duration-fast',
  'motion-easing',
];

function compile(entry) {
  return sass.compile(path.join(SCSS_DIR, `${entry}.scss`), {
    loadPaths: [SCSS_DIR],
    silenceDeprecations: ['import'],
    logger: sass.Logger.silent,
  }).css;
}

describe('Mangrove 2.0 token contract (compiled CSS)', () => {
  let base;
  let brandCss;
  let allCss;

  beforeAll(() => {
    base = compile('style');
    brandCss = Object.fromEntries(BRANDS.map(b => [b, compile(`style-${b}`)]));
    allCss = compile('style-all');
  });

  test('base :root emits the palette as channel triplets', () => {
    expect(base).toMatch(/--mg-color-blue-900:\s*0 79 145/);
  });

  test('base bundle carries no brand theme block', () => {
    expect(base).not.toMatch(/\.mg-theme-/);
  });

  test('every bundle identifies the package version in its preserved banner', () => {
    ['style', ...BRANDS.map(b => `style-${b}`), 'style-all'].forEach(name => {
      expect(bundleName(name)).toContain(`Version: ${version}`);
    });
  });

  describe.each(BRANDS)('per-brand bundle: style-%s', brand => {
    test('is activated by its own theme marker and no other', () => {
      const css = brandCss[brand];
      // The marker proves the brand's _theme-*.scss block compiled in — this is
      // the guard against a theme block silently vanishing from the build.
      expect(css).toMatch(new RegExp(`--mg-theme-loaded:\\s*${brand}\\b`));
      BRANDS.filter(other => other !== brand).forEach(other => {
        expect(css).not.toMatch(
          new RegExp(`--mg-theme-loaded:\\s*${other}\\b`)
        );
      });
    });

    test('still carries the base :root palette', () => {
      expect(brandCss[brand]).toMatch(/--mg-color-blue-900:\s*0 79 145/);
    });

    test('refreshes React Aria aliases inside the runtime theme', () => {
      const themeBlock = brandCss[brand].match(
        new RegExp(`\\.mg-theme-${brand}\\s*\\{([^}]*)\\}`)
      )?.[1];

      RUNTIME_ARIA_ALIASES.forEach(alias => {
        expect(themeBlock).toMatch(new RegExp(`--mg-aria-${alias}:`));
      });
    });
  });

  test('combined style-all bundle carries every brand theme', () => {
    BRANDS.forEach(brand => {
      expect(allCss).toMatch(new RegExp(`--mg-theme-loaded:\\s*${brand}\\b`));
      expect(allCss).toMatch(new RegExp(`\\.mg-theme-${brand}\\b`));
    });
  });

  const bundleName = name => {
    if (name === 'style' || name === 'style-all')
      return name === 'style' ? base : allCss;
    return brandCss[name.replace('style-', '')];
  };
  const ALL_BUNDLES = ['style', ...BRANDS.map(b => `style-${b}`), 'style-all'];

  // Components standardized on `rgb(var(--x) / a)`; `rgba(var(` is the classic
  // typo that renders inconsistently across browsers.
  test.each(ALL_BUNDLES)(
    '%s leaks no $mg- SCSS variable and no rgba(var(',
    name => {
      const css = bundleName(name);
      expect(css).not.toMatch(/\$mg-/);
      expect(css).not.toContain('rgba(var(');
    }
  );
});

/**
 * The distributed React Aria surface is a *public package export*
 * (`@undrr/undrr-mangrove/aria.css`). Storybook's spike demos live in the same
 * Sass tree and are trivially easy to re-add to the shipped entry point by
 * accident, which would leak `.aria-crud-*` fixture styling into every
 * consumer's bundle. These assertions pin the boundary.
 */
describe('distributed React Aria surface', () => {
  // Selector prefixes that belong to the Storybook spike demos, plus the
  // Mangrove component classes the demos compose with. None may appear in the
  // shipped stylesheet.
  const DEMO_SELECTOR =
    /\.(aria-spike-|aria-crud-|aria-integration-demo|aria-calendar-header|mg-button|mg-tag)/;

  let ariaCss;

  beforeAll(() => {
    ariaCss = compile('aria/_react-aria');
  });

  test('carries the reusable React Aria primitives', () => {
    [
      'Button',
      'Input',
      'Table',
      'Cell',
      'Popover',
      'Modal',
      'Checkbox',
    ].forEach(part => {
      expect(ariaCss).toContain(`.react-aria-${part}`);
    });
  });

  test('carries no spike-demo composition selectors', () => {
    const leaked = ariaCss
      .split('\n')
      .filter(line => DEMO_SELECTOR.test(line))
      .map(line => line.trim());

    expect(leaked).toEqual([]);
  });

  test('resolves every value through a --mg-aria-* custom property', () => {
    // Literals belong in the token files; the shared stylesheet must stay
    // theme-neutral so a token swap fully re-skins it.
    expect(ariaCss).not.toMatch(/:\s*#[0-9a-f]{3,8}\b/i);
    expect(ariaCss).not.toMatch(/:\s*rgb\(\s*\d/);
  });

  test.each([
    ['mangrove', 'aria/_tokens-mangrove'],
    ['delta', 'aria/_tokens-delta'],
  ])(
    'every --mg-aria-* it consumes is defined by the %s token file',
    (_name, entry) => {
      // This is what makes "swap one token file to retheme" true. A property
      // added to the stylesheet but not to both token files degrades silently
      // to an unset value rather than failing the build.
      const used = new Set(
        [...ariaCss.matchAll(/var\(\s*(--mg-aria-[a-z0-9-]+)/g)].map(m => m[1])
      );
      const tokenCss = compile(entry);
      const defined = new Set(
        [...tokenCss.matchAll(/(--mg-aria-[a-z0-9-]+)\s*:/g)].map(m => m[1])
      );

      expect([...used].filter(prop => !defined.has(prop))).toEqual([]);
    }
  );

  test('declares no cascade layer', () => {
    // DELTA has unlayered legacy CSS that outranks any layered rule, so the
    // agreed distribution shape is ordinary author CSS.
    expect(ariaCss).not.toContain('@layer');
  });
});
