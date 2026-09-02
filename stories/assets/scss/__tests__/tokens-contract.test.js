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
const fs = require('fs');
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
  'color-track',
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
  'tag-radius',
  'tag-background',
  'tag-background-hover',
  'check-color',
  'check-color-hover',
  'check-color-checked',
  'button-background',
  'button-background-hover',
  'button-color',
  'button-padding',
  'button-font-size',
  'tab-padding',
  'tab-font-size',
  'tab-color',
  'tab-color-hover',
  'tab-color-active',
  'tab-background-hover',
  'tab-min-block-size',
  'tab-indicator-size',
  'tab-indicator-hover',
  'tab-indicator-active',
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

  test('the shipped theme bundle carries no spike-demo selectors either', () => {
    // The boundary was previously guarded only on aria/react-aria.css, while
    // _components.scss still pulled the fixtures into every consumer's
    // style.css. Guarding one artefact and not the other missed that entirely.
    // Narrower than DEMO_SELECTOR: .mg-button and .mg-tag are legitimate in the
    // theme bundle and only count as leaks in the distributed aria artefact.
    const FIXTURE_ONLY =
      /\.(aria-spike-|aria-crud-|aria-integration-demo|aria-calendar-header)/;
    const leaked = compile('style')
      .split('\n')
      .filter(line => FIXTURE_ONLY.test(line))
      .map(line => line.trim());

    expect(leaked).toEqual([]);
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

  test('styles a floor proportion of React Aria stock classes', () => {
    // A consumer importing aria.css gets every unstyled component bare, so
    // coverage is a product fact rather than a metric. This is a floor, not a
    // target: it exists so a refactor cannot quietly drop components. Raise it
    // when coverage genuinely improves. `node scripts/aria-coverage.cjs --list`
    // prints what is still missing.
    const FLOOR = 65;
    const pkgDir = path.resolve(
      __dirname,
      '../../../../node_modules/react-aria-components'
    );
    const stock = new Set();
    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(js|mjs|cjs|d\.ts)$/.test(entry.name)) {
          for (const m of fs
            .readFileSync(full, 'utf8')
            .matchAll(/react-aria-([A-Z][A-Za-z]+)/g))
            stock.add(m[1]);
        }
      }
    };
    walk(pkgDir);

    const styled = new Set(
      [...ariaCss.matchAll(/\.react-aria-([A-Za-z]+)/g)].map(m => m[1])
    );
    const covered = [...stock].filter(name => styled.has(name));

    expect(covered.length).toBeGreaterThanOrEqual(FLOOR);
  });

  test('declares no cascade layer', () => {
    // DELTA has unlayered legacy CSS that outranks any layered rule, so the
    // agreed distribution shape is ordinary author CSS.
    expect(ariaCss).not.toContain('@layer');
  });
});

/**
 * Contrast is a property of the RESOLVED token chain, not of any one file, so
 * it cannot be reviewed by reading the stylesheet. An accessibility audit found
 * real failures here that were invisible in source: DELTA's field borders sat
 * at 2.10:1 and IRP's slider fill at 2.93:1 against its track. These assertions
 * turn that audit into build errors so a future token change or a mechanical
 * restyle cannot quietly reintroduce them.
 */
describe('React Aria token contrast (WCAG 2.2 AA)', () => {
  const srgb = channel => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminance = ({ r, g, b }) =>
    0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  const contrast = (a, b) => {
    const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  // Translucent tokens (selected surfaces) must be composited before measuring.
  const flatten = (fg, bg) =>
    fg.a === 1
      ? fg
      : {
          r: fg.r * fg.a + bg.r * (1 - fg.a),
          g: fg.g * fg.a + bg.g * (1 - fg.a),
          b: fg.b * fg.a + bg.b * (1 - fg.a),
          a: 1,
        };

  const parseColor = value => {
    if (!value) return null;
    if (value.trim() === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    const fn = value
      .trim()
      .match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+))?\s*\)$/);
    if (fn) return { r: +fn[1], g: +fn[2], b: +fn[3], a: fn[4] ? +fn[4] : 1 };
    const triplet = value.trim().match(/^(\d+)\s+(\d+)\s+(\d+)$/);
    return triplet
      ? { r: +triplet[1], g: +triplet[2], b: +triplet[3], a: 1 }
      : null;
  };

  // Custom properties resolve at the element where they are declared, so a
  // theme block's declarations must override the :root ones.
  const declarations = (css, selector) => {
    const out = {};
    // Last-wins: CSS applies the final declaration at equal specificity, so
    // keeping the first would measure a value the browser never uses.
    for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g))
      out[m[1]] = m[2].trim();
    if (selector) {
      const block =
        css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
      for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g))
        out[m[1]] = m[2].trim();
    }
    return out;
  };

  // var() fallbacks can themselves contain var() and rgb(), so the argument
  // list has to be split on balanced parentheses rather than by regex.
  const substitute = (vars, value, depth = 0) => {
    if (depth > 20 || !value || !value.includes('var(')) return value;
    let out = '';
    let i = 0;
    while (i < value.length) {
      const at = value.indexOf('var(', i);
      if (at === -1) {
        out += value.slice(i);
        break;
      }
      out += value.slice(i, at);
      let level = 0;
      let end = at + 3;
      for (; end < value.length; end++) {
        if (value[end] === '(') level++;
        else if (value[end] === ')') {
          level--;
          if (level === 0) break;
        }
      }
      const inner = value.slice(at + 4, end);
      const comma = (() => {
        let lvl = 0;
        for (let k = 0; k < inner.length; k++) {
          if (inner[k] === '(') lvl++;
          else if (inner[k] === ')') lvl--;
          else if (inner[k] === ',' && lvl === 0) return k;
        }
        return -1;
      })();
      const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
      const fallback = comma === -1 ? '' : inner.slice(comma + 1).trim();
      out += vars[name] !== undefined ? vars[name] : fallback;
      i = end + 1;
    }
    return substitute(vars, out, depth + 1);
  };
  const deref = (vars, value) => (substitute(vars, value) || '').trim();

  const WHITE = { r: 255, g: 255, b: 255, a: 1 };

  // [foreground, background, minimum]. 3:1 is SC 1.4.11 non-text contrast;
  // 4.5:1 is SC 1.4.3 for text.
  const PAIRS = [
    ['color-text', 'color-surface', 4.5],
    ['color-muted-text', 'color-surface', 4.5],
    ['color-on-accent', 'color-accent', 4.5],
    ['button-color', 'button-background', 4.5],
    ['color-invalid', 'color-surface', 4.5],
    ['color-border', 'color-surface', 3],
    ['color-border', 'color-field-surface', 3],
    ['color-accent', 'color-surface', 3],
    // The filled portion of a slider, progress bar or switch against its rail.
    ['color-accent', 'color-track', 3],
    ['color-focus-ring', 'color-surface', 3],
    ['color-focus-ring', 'color-field-surface', 3],
  ];

  const THEMES = [['base', null], ...BRANDS.map(b => [b, `.mg-theme-${b}`])];

  const themeCss = {};
  beforeAll(() => {
    themeCss.base = compile('style');
    BRANDS.forEach(brand => {
      themeCss[brand] = compile(`style-${brand}`);
    });
  });

  describe.each(THEMES)('%s theme', (theme, selector) => {
    test.each(PAIRS)('%s on %s meets %s:1', (fg, bg, minimum) => {
      const css = themeCss[theme];
      const vars = declarations(css, selector);
      const read = token => parseColor(deref(vars, vars[`--mg-aria-${token}`]));

      const foreground = read(fg);
      const background = read(bg);
      // A missing token is a contract bug, not a silent pass.
      expect(foreground).not.toBeNull();
      expect(background).not.toBeNull();

      const solidBg = flatten(background, WHITE);
      const ratio = contrast(flatten(foreground, solidBg), solidBg);

      expect(Number(ratio.toFixed(2))).toBeGreaterThanOrEqual(minimum);
    });
  });
});

/**
 * Mangrove stores colours as channel triplets ("0 79 145") so they can be used
 * with an alpha via `rgb(var(--x) / 0.5)`. A triplet is only valid inside
 * rgb(); dropped raw into a colour position it makes the whole declaration
 * invalid, and CSS discards it silently.
 *
 * That is not theoretical. `--mg-border-color-button` was a triplet consumed
 * inside a `border:` shorthand, so border-style fell back to none and
 * .mg-button-outline, which relies on that border for its entire shape,
 * rendered as bare coloured text. The variant was broken from the day it
 * shipped and no test caught it.
 */
describe('channel triplets are never used raw in a colour position', () => {
  const TRIPLET = /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/;
  const COLOUR_PROP =
    /(^|[{;\s])(border|border-top|border-right|border-bottom|border-left|border-block|border-block-end|border-block-start|border-inline|border-inline-end|border-inline-start|border-color|border-[a-z-]+-color|background|background-color|color|outline|outline-color|box-shadow|fill|stroke|text-decoration-color)\s*:/;

  test('no Sass source drops a triplet token into a colour declaration', () => {
    const compiled = compile('style');
    const declared = {};
    for (const m of compiled.matchAll(/(--mg-[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g))
      if (!(m[1] in declared)) declared[m[1]] = m[2].trim();

    const isTriplet = (name, depth = 0) => {
      if (depth > 10) return false;
      const value = declared[name];
      if (!value) return false;
      if (TRIPLET.test(value)) return true;
      const alias = value.match(/^var\(\s*(--mg-[a-z0-9-]+)\s*\)$/);
      return alias ? isTriplet(alias[1], depth + 1) : false;
    };
    const triplets = new Set(
      Object.keys(declared).filter(name => isTriplet(name))
    );

    const offenders = [];
    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!/node_modules|__tests__/.test(full)) walk(full);
        } else if (entry.name.endsWith('.scss')) {
          fs.readFileSync(full, 'utf8')
            .split('\n')
            .forEach((line, index) => {
              if (!COLOUR_PROP.test(line)) return;
              for (const m of line.matchAll(/var\(\s*(--mg-[a-z0-9-]+)/g)) {
                if (!triplets.has(m[1])) continue;
                // Already inside rgb()/rgba()? then it is correct.
                if (/rgba?\([^)]*$/.test(line.slice(0, m.index))) continue;
                offenders.push(
                  `${path.relative(process.cwd(), full)}:${index + 1} ${m[1]}`
                );
              }
            });
        }
      }
    };
    walk(path.resolve(__dirname, '../../../../stories'));

    expect(offenders).toEqual([]);
  });
});
