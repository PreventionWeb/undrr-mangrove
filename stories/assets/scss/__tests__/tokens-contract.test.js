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

      expect(themeBlock).toMatch(
        /--mg-aria-color-accent:\s*rgb\(var\(--mg-color-interactive\)\)/
      );
      expect(themeBlock).toMatch(
        /--mg-aria-radius-button:\s*var\(--mg-radius-button\)/
      );
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
