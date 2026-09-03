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
const {
  perceptualContrast,
  THRESHOLD,
} = require('../../../../scripts/lib/perceptual-contrast.cjs');
const {
  coverage: ariaCoverage,
  summary,
  listMissing,
} = require('../../../../scripts/aria-coverage.cjs');
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
  'color-rule',
  'color-hover-surface',
  'color-inset-surface',
  'color-invalid-surface',
  'color-overlay-backdrop',
  'color-track',
  'color-fill',
  'color-invalid',
  'space-1',
  'space-2',
  'space-3',
  'space-4',
  'radius-button',
  'radius-control',
  'radius-surface',
  'radius-item',
  'radius-check',
  'radius-control-inner',
  'control-block-size',
  'color-focus-ring',
  'focus-width',
  'focus-offset',
  'surface-shadow',
  'surface-shadow-hover',
  'overlay-shadow',
  'modal-shadow',
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
  'button-outline-color',
  'button-outline-color-hover',
  'button-border-width',
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
  'motion-duration-medium',
  'motion-easing',
];

// Memoised: the same handful of entry points are compiled by four describe
// blocks, and Sass compilation dominates this file's runtime.
const compiled = new Map();
function compile(entry) {
  if (!compiled.has(entry)) {
    compiled.set(
      entry,
      sass.compile(path.join(SCSS_DIR, `${entry}.scss`), {
        loadPaths: [SCSS_DIR],
        silenceDeprecations: ['import'],
        logger: sass.Logger.silent,
      }).css
    );
  }
  return compiled.get(entry);
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
 * The React Aria surface is built as a standalone artifact
 * (`aria/react-aria.css`) and is compiled into every theme stylesheet.
 * Storybook's spike demos live in the same
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
    ['preventionweb', 'aria/_tokens-preventionweb'],
    ['irp', 'aria/_tokens-irp'],
    ['mcr', 'aria/_tokens-mcr'],
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
    // when coverage genuinely improves.
    //
    // The measurement itself comes from `scripts/aria-coverage.cjs` rather than
    // being repeated here, so the CLI a developer runs and the guard CI runs
    // cannot disagree. The script defaults to the built `aria/react-aria.css`;
    // this passes the freshly compiled Sass so the guard does not depend on a
    // build artifact being current.
    const FLOOR = 65;
    const result = ariaCoverage(ariaCss);

    // Jest's expect() carries no custom message, so name the components a
    // consumer would get bare before asserting. Without this the failure says
    // only that a number shrank.
    if (result.covered.length < FLOOR) {
      throw new Error(
        `React Aria styling coverage ${summary(result)} is below the floor of ` +
          `${FLOOR}.\n${listMissing(result)}`
      );
    }
    expect(result.covered.length).toBeGreaterThanOrEqual(FLOOR);
  });

  test('declares no cascade layer', () => {
    // DELTA has unlayered legacy CSS that outranks any layered rule, so the
    // agreed distribution shape is ordinary author CSS.
    expect(ariaCss).not.toContain('@layer');
  });
});

/* -------------------------------------------------------------------------
 * Shared contrast machinery.
 *
 * Contrast is a property of the RESOLVED token chain, not of any one file, so
 * it cannot be reviewed by reading the stylesheet. Everything below resolves a
 * token the way a browser would — walking var() chains with balanced-paren
 * parsing, honouring theme-block shadowing, and compositing alpha — so the two
 * contrast suites that follow measure what is actually painted.
 * ---------------------------------------------------------------------- */
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

// oklch() reaches the token layer from design-tool exports (DELTA's hero title
// arrives that way). Without this it would parse as null and be reported as a
// missing token, which is a false alarm rather than a finding.
const oklchToRgb = (L, C, H) => {
  const hue = (H * Math.PI) / 180;
  const a = C * Math.cos(hue);
  const b = C * Math.sin(hue);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.089484178 * a - 1.291485548 * b) ** 3;
  const encode = channel => {
    const v =
      channel <= 0.0031308
        ? 12.92 * channel
        : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
    return Math.min(255, Math.max(0, Math.round(v * 255)));
  };
  return {
    r: encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a: 1,
  };
};

const parseColor = value => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const hex = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h =
      hex[1].length === 3 ? [...hex[1]].map(c => c + c).join('') : hex[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }
  const oklch = trimmed.match(
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/
  );
  if (oklch) {
    return oklchToRgb(
      oklch[2] === '%' ? +oklch[1] / 100 : +oklch[1],
      +oklch[3],
      +oklch[4]
    );
  }
  const fn = trimmed.match(
    /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+))?\s*\)$/
  );
  if (fn) return { r: +fn[1], g: +fn[2], b: +fn[3], a: fn[4] ? +fn[4] : 1 };
  const triplet = trimmed.match(/^(\d+)\s+(\d+)\s+(\d+)$/);
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

// The base theme plus every brand. Every contrast pair is measured in all
// five, because a brand can retint one end of a pair and not the other.
const ALL_THEMES = ['base', ...BRANDS];
const THEME_BLOCK = /\.mg-theme-[a-z0-9-]+\s*\{[^}]*\}/g;

/**
 * Resolve a theme's token table the way a browser would.
 *
 * Deliberately read out of the COMBINED style-all bundle, not the per-brand
 * one. A per-brand bundle contains exactly one theme block, so a flat
 * last-declaration-wins scan happens to land on the right values whether or
 * not the scan is theme-aware — which means a theme-scoping bug would not
 * show up. style-all carries all four blocks, so the two steps below have to
 * be right: strip every brand block to get the `:root` layer, then overlay
 * only the requested brand's.
 */
const themeVars = theme => {
  const css = compile('style-all');
  const vars = declarations(css.replace(THEME_BLOCK, ''), null);
  if (theme === 'base') return vars;
  const block =
    css.match(new RegExp(`\\.mg-theme-${theme}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g))
    vars[m[1]] = m[2].trim();
  return vars;
};

/**
 * Resting-state React Aria pairs, as [foreground, background, minimum].
 * 3:1 is SC 1.4.11 non-text contrast; 4.5:1 is SC 1.4.3 for text.
 *
 * Module scope rather than describe scope so the perceptual measure and the
 * disagreement report grade this exact list — one list, two measures.
 */
const ARIA_PAIRS = [
  ['color-text', 'color-surface', 4.5],
  ['color-muted-text', 'color-surface', 4.5],
  // Muted text is painted on form surfaces too (help text under a field), and
  // the field surface is tinted, so the surface pair alone does not cover it.
  ['color-muted-text', 'color-field-surface', 4.5],
  ['color-on-accent', 'color-accent', 4.5],
  ['button-color', 'button-background', 4.5],
  ['color-invalid', 'color-surface', 4.5],
  ['color-border', 'color-surface', 3],
  ['color-border', 'color-field-surface', 3],
  ['color-accent', 'color-surface', 3],
  // The filled portion of a slider, progress bar or switch against its rail.
  // Graded on the fill seam as well as the accent: a theme may repoint
  // --mg-aria-color-fill away from the accent (see the rail note in
  // _runtime-theme-aliases.scss), and the rail contract has to follow it.
  ['color-accent', 'color-track', 3],
  ['color-fill', 'color-track', 3],
  // The rail carries no border, so the fill's own edge against the page is
  // what makes a part-full bar readable.
  ['color-fill', 'color-surface', 3],
  ['color-focus-ring', 'color-surface', 3],
  ['color-focus-ring', 'color-field-surface', 3],
];

const ARIA_THEMES = [['base', null], ...BRANDS.map(b => [b, `.mg-theme-${b}`])];

/* -------------------------------------------------------------------------
 * The second measure.
 *
 * WCAG 2's ratio compares relative luminance, which is not perceptually
 * uniform, so it misjudges mid-tones, warm hues and light-on-dark. Every pair
 * defined in this file is therefore graded TWICE — once with WCAG 2 (the
 * assertions that were already here, unchanged) and once with the Oklab
 * lightness measure in scripts/lib/perceptual-contrast.cjs.
 *
 * The two measures share one pair list and one resolved colour, so a
 * disagreement between them can only ever be about the maths, never about
 * measuring different things. `docs/COLOUR-CONTRAST-METHODOLOGY.md` explains
 * the calibration and the limitations.
 * ---------------------------------------------------------------------- */

/**
 * Which perceptual threshold a pair is graded against.
 *
 * Derived from the WCAG role the pair ALREADY declares, rather than restated:
 * a 4.5 minimum is SC 1.4.3 normal text, and a 3 minimum is either SC 1.4.3
 * large text or SC 1.4.11 non-text, which the `why` field distinguishes.
 * BODY_TEXT and LARGE_TEXT/NON_TEXT are the two calibrated anchors (#767676
 * and #949494 on white); LARGE_TEXT and NON_TEXT happen to share a value
 * because WCAG 2's 3:1 boundary serves both, so they are kept apart by name
 * only, to keep the reported role honest.
 */
const perceptualRole = (min, why = '') => {
  if (min >= 4.5) return ['BODY_TEXT', THRESHOLD.BODY_TEXT];
  return /large text/i.test(why)
    ? ['LARGE_TEXT', THRESHOLD.LARGE_TEXT]
    : ['NON_TEXT', THRESHOLD.NON_TEXT];
};

const triple = ({ r, g, b }) => [r, g, b];
const perceptual = (fg, bg) =>
  Number(perceptualContrast(triple(fg), triple(bg)).toFixed(1));

/**
 * Every measured pair in this file, graded by both measures, computed once.
 *
 * The two contrast suites and the disagreement report all read this table, so
 * the WCAG verdict and the perceptual verdict are guaranteed to describe the
 * same composited pixels. Memoised because compositing is cheap but the Sass
 * compile behind `compile()` is not.
 */
let MEASUREMENTS = null;
const measurements = () => {
  if (MEASUREMENTS) return MEASUREMENTS;
  const rows = [];

  const grade = ({ suite, theme, name, min, why, foreground, backdrop }) => {
    const row = {
      suite,
      theme,
      name,
      min,
      why,
      key: `${suite}|${theme}|${name}`,
    };
    const [role, floor] = perceptualRole(min, why);
    row.role = role;
    row.floor = floor;
    if (!foreground || !backdrop) {
      rows.push(row);
      return row;
    }
    const solidBg = flatten(backdrop, WHITE);
    const solidFg = flatten(foreground, solidBg);
    row.ratio = Number(contrast(solidFg, solidBg).toFixed(2));
    row.score = perceptual(solidFg, solidBg);
    row.wcagPasses = row.ratio >= min;
    row.perceptualPasses = row.score >= floor;
    rows.push(row);
    return row;
  };

  // Suite one: resting-state --mg-aria-* pairs, read out of each brand's own
  // bundle exactly as the WCAG assertions below do.
  for (const [theme, selector] of ARIA_THEMES) {
    const css = theme === 'base' ? compile('style') : compile(`style-${theme}`);
    const vars = declarations(css, selector);
    const read = token => parseColor(deref(vars, vars[`--mg-aria-${token}`]));
    for (const [fg, bg, min] of ARIA_PAIRS) {
      grade({
        suite: 'aria',
        theme,
        name: `${fg} on ${bg}`,
        min,
        // These eleven are borders, fills, focus rings and accent-on-surface;
        // none is large text, so a 3 minimum here is always SC 1.4.11.
        why: min >= 4.5 ? 'SC 1.4.3' : 'SC 1.4.11',
        foreground: read(fg),
        // A missing background token is a contract bug, not a silent pass;
        // `grade` leaves the row ungraded and the assertion below reports it.
        backdrop: read(bg),
      });
    }
  }

  // Suite two: component tokens including hover and active states, resolved
  // out of the combined bundle with the theme block overlaid.
  for (const theme of ALL_THEMES) {
    const vars = themeVars(theme);
    const resolve = token =>
      token.startsWith('--') ? deref(vars, vars[token]) : token;
    for (const pair of COMPONENT_PAIRS) {
      let backdrop = WHITE;
      let resolved = true;
      for (const token of [...pair.bg].reverse()) {
        const layer = parseColor(resolve(token));
        if (!layer) {
          resolved = false;
          break;
        }
        backdrop = flatten(layer, backdrop);
      }
      grade({
        suite: 'component',
        theme,
        name: pair.name,
        min: pair.min,
        why: pair.why,
        foreground: parseColor(resolve(pair.fg)),
        backdrop: resolved ? backdrop : null,
      });
    }
  }

  MEASUREMENTS = rows;
  return rows;
};

const measurement = key => {
  const row = measurements().find(candidate => candidate.key === key);
  if (!row) throw new Error(`no measurement for ${key}`);
  return row;
};

/**
 * The perceptual half of a pair's verdict, asserted the same way the WCAG half
 * is: a recorded exception must STILL fail and must not get worse, so a fix
 * deletes the exception rather than hiding behind it.
 */
const assertPerceptual = (row, exception) => {
  const label = `${row.score} — ${row.role} needs ${row.floor} — ${row.why}`;
  if (!exception) {
    expect(label).toBe(
      row.perceptualPasses
        ? label
        : `at least ${row.floor} — ${row.role} — ${row.why}`
    );
    return;
  }
  const [recorded] = exception;
  expect(`${row.score} vs the ${row.floor} this pair needs`).toBe(
    row.perceptualPasses
      ? `now passing, so remove this exception (${recorded} was recorded)`
      : `${row.score} vs the ${row.floor} this pair needs`
  );
  // ...and no worse than when it was recorded. 0.1 is the rounding step.
  expect(row.score).toBeGreaterThanOrEqual(recorded - 0.1);
};

/**
 * Perceptual failures among the resting-state React Aria pairs.
 *
 * Empty, and that is a finding rather than an oversight: all 55 resting-state
 * pairs clear both measures. The adapter's contrast problems are all in the
 * hover and active states, which this suite does not reach and the component
 * suite below does. Kept as an explicit table so a regression lands here with
 * its measured score, on the same terms as every other exception in the file.
 */
const ARIA_PERCEPTUAL_EXCEPTIONS = {};

/**
 * An accessibility audit found real failures in the React Aria adapter that
 * were invisible in source: DELTA's field borders sat at 2.10:1 and IRP's
 * slider fill at 2.93:1 against its track. These assertions turn that audit
 * into build errors so a future token change or a mechanical restyle cannot
 * quietly reintroduce them.
 *
 * Resting states only. Interactive states and the legacy `.mg-*` component
 * tokens are covered by the suite below this one.
 */
describe('React Aria token contrast (WCAG 2.2 AA)', () => {
  const PAIRS = ARIA_PAIRS;
  const THEMES = ARIA_THEMES;

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

    // The same pair, the same resolved pixels, the second measure. Kept as a
    // separate test so a perceptual failure names itself rather than hiding
    // inside a WCAG failure.
    test.each(PAIRS)(
      '%s on %s is perceptually readable at the %s:1 role',
      (fg, bg) => {
        const row = measurement(`aria|${theme}|${fg} on ${bg}`);
        // Guards the shared table against the resolution silently going null.
        expect(
          `${row.name}: ${row.score === undefined ? 'unresolved' : 'ok'}`
        ).toBe(`${row.name}: ok`);

        const exception = ARIA_PERCEPTUAL_EXCEPTIONS[`${theme}|${row.name}`];
        assertPerceptual(row, exception);
      }
    );
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

/**
 * The standalone React Aria token files must RESOLVE, not merely define.
 *
 * The existing "every --mg-aria-* it consumes is defined by the token file"
 * assertion checks that a key exists. It does not check that the key's value
 * bottoms out in anything. aria/tokens/mangrove.css passed 929 green tests
 * while carrying 28 var() references to --mg-* properties it never defined,
 * so a consumer importing it without Mangrove's stylesheet got no accent, no
 * surface, no spacing and no focus indicator — and, in forced colours, no
 * focus ring at all. Nothing failed, because "defined" and "resolves" are
 * different questions.
 *
 * Each file is therefore compiled and evaluated ALONE here, exactly as an
 * external consumer would load it.
 */
describe('standalone React Aria token files resolve on their own', () => {
  const BRAND_FILES = [
    ['mangrove', 'aria/_tokens-mangrove'],
    ['preventionweb', 'aria/_tokens-preventionweb'],
    ['irp', 'aria/_tokens-irp'],
    ['mcr', 'aria/_tokens-mcr'],
    ['delta', 'aria/_tokens-delta'],
  ];

  // A single flat table: the file declares one block, so nothing shadows.
  const declarationsOf = css => {
    const table = {};
    for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g)) {
      table[match[1]] = match[2].replace(/\s+/g, ' ').trim();
    }
    return table;
  };

  // Substitution over balanced parentheses: a var() fallback may itself hold
  // var() and rgb(), so this cannot be a regex. An unresolvable reference
  // with no fallback is reported rather than silently dropped, which is the
  // whole point of the test.
  const resolveValue = (table, value, missing, depth = 0) => {
    if (depth > 25) {
      missing.push('depth limit — probable reference cycle');
      return value;
    }
    if (!value || !value.includes('var(')) return value;
    let out = '';
    let index = 0;
    while (index < value.length) {
      const at = value.indexOf('var(', index);
      if (at === -1) {
        out += value.slice(index);
        break;
      }
      out += value.slice(index, at);
      let level = 0;
      let end = at + 3;
      for (; end < value.length; end++) {
        if (value[end] === '(') level++;
        else if (value[end] === ')' && --level === 0) break;
      }
      const inner = value.slice(at + 4, end);
      let lvl = 0;
      let comma = -1;
      for (let k = 0; k < inner.length; k++) {
        if (inner[k] === '(') lvl++;
        else if (inner[k] === ')') lvl--;
        else if (inner[k] === ',' && lvl === 0) {
          comma = k;
          break;
        }
      }
      const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
      const fallback = comma === -1 ? null : inner.slice(comma + 1).trim();
      if (table[name] !== undefined) out += table[name];
      else if (fallback !== null) out += fallback;
      else missing.push(name);
      index = end + 1;
    }
    return resolveValue(table, out, missing, depth + 1);
  };

  let ariaCss;
  beforeAll(() => {
    ariaCss = compile('aria/_react-aria');
  });

  describe.each(BRAND_FILES)('%s', (brand, entry) => {
    let table;
    let css;
    beforeAll(() => {
      css = compile(entry);
      table = declarationsOf(css);
    });

    test('is emitted at zero specificity, not at :root', () => {
      // :where(:root) means the published file works alone AND still loses to
      // Mangrove's own stylesheet whenever both are loaded, regardless of load
      // order. A plain :root block would let a stale package win.
      const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
      expect(rules).toContain(':where(:root)');
      expect(rules).not.toMatch(/(^|[\s,}])\:root\s*[,{]/m);
    });

    test('every --mg-aria-* it declares bottoms out in a real value', () => {
      const unresolved = [];
      for (const [property, value] of Object.entries(table)) {
        if (!property.startsWith('--mg-aria-')) continue;
        const missing = [];
        const resolved = resolveValue(table, value, missing);
        if (missing.length > 0) {
          unresolved.push(`${property} -> ${[...new Set(missing)].join(', ')}`);
        } else if (!resolved.trim() || resolved.includes('var(')) {
          unresolved.push(`${property} -> "${resolved}"`);
        }
      }
      expect(unresolved).toEqual([]);
    });

    test('every --mg-aria-* the shared stylesheet reads resolves here', () => {
      // The other direction: the token file may resolve everything it happens
      // to declare while still missing something aria/react-aria.css uses.
      const used = new Set(
        [...ariaCss.matchAll(/var\(\s*(--mg-aria-[a-z0-9-]+)/g)].map(m => m[1])
      );
      const unresolved = [];
      for (const property of used) {
        if (table[property] === undefined) {
          unresolved.push(`${property} (not declared)`);
          continue;
        }
        const missing = [];
        const resolved = resolveValue(table, table[property], missing);
        if (
          missing.length > 0 ||
          !resolved.trim() ||
          resolved.includes('var(')
        ) {
          unresolved.push(`${property} -> ${missing.join(', ') || resolved}`);
        }
      }
      expect(unresolved).toEqual([]);
    });

    test('carries no unresolved --mg-* reference at all', () => {
      // The 28-reference defect stated directly: nothing in the file may point
      // at a Mangrove property the file does not itself define.
      const declared = new Set(Object.keys(table));
      const dangling = new Set();
      for (const value of Object.values(table)) {
        for (const match of value.matchAll(/var\(\s*(--mg-[a-z0-9-]+)/g)) {
          if (!declared.has(match[1])) dangling.add(match[1]);
        }
      }
      expect([...dangling]).toEqual([]);
    });

    test(`names ${brand} as its source and forbids hand-editing`, () => {
      expect(css).toContain('do not edit that');
    });
  });
});

// The page itself. Asserted rather than assumed, because every pair whose
// lowest layer is translucent composites down onto it.
const PAGE = '--mg-color-neutral-0';

/**
 * fg  — the painted foreground token, or a literal the component hardcodes.
 * bg  — background layers, nearest first; the page is the implicit floor.
 * min — 4.5 (SC 1.4.3 normal text) or 3 (SC 1.4.3 large text / SC 1.4.11).
 */
const COMPONENT_PAIRS = [
  // --- Buttons: cta-button.scss ------------------------------------------
  {
    name: 'button label on primary background',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-primary label text',
  },
  {
    name: 'button label on primary background, hover',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-background--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-primary:hover label text',
  },
  {
    name: 'button label on secondary background',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-secondary-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-secondary label text',
  },
  {
    name: 'button label on secondary background, hover',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-secondary-background--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-secondary:hover label text',
  },
  {
    name: 'outline primary button label on the page',
    fg: '--mg-color-button-outline-primary',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-outline is transparent; label and border are the same token',
  },
  {
    name: 'outline primary button label, hover fill',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-outline-primary--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — outline button fills on hover and the label flips to --mg-color-button',
  },
  {
    name: 'outline secondary button label on the page',
    fg: '--mg-color-button-outline-secondary',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-secondary.mg-button-outline label text',
  },
  {
    name: 'outline secondary button label, hover fill',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-outline-secondary--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — outline secondary fills on hover',
  },
  {
    name: 'editorial CTA label on the page',
    fg: '--mg-color-text',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-cta is a transparent text button',
  },
  {
    name: 'editorial CTA label on the page, hover',
    fg: '--mg-color-interactive-active',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-cta:hover recolours its label',
  },
  {
    name: 'editorial CTA chevron badge, resting',
    fg: PAGE,
    bg: ['--mg-color-interactive'],
    min: 3,
    why: 'SC 1.4.11 — the ::after chevron is a graphical affordance, not the label',
  },
  {
    name: 'editorial CTA chevron badge, hover',
    fg: PAGE,
    bg: ['--mg-color-interactive-active'],
    min: 3,
    why: 'SC 1.4.11 — .mg-button-cta:hover::after retints the badge',
  },

  // --- Tags: tag.scss ----------------------------------------------------
  // tag.scss paints `color: #fff` literally, not through a token, so the
  // literal is what gets measured. `tag.scss still paints its label #fff`
  // below pins that so the pairing cannot go stale silently.
  {
    name: 'tag label',
    fg: '#fff',
    bg: ['--mg-color-tag'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag label text',
  },
  {
    name: 'tag label, hover',
    fg: '#fff',
    bg: ['--mg-color-tag--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag:hover',
  },
  {
    name: 'secondary tag label',
    fg: '#fff',
    bg: ['--mg-color-tag-secondary'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--secondary',
  },
  {
    name: 'secondary tag label, hover',
    fg: '#fff',
    bg: ['--mg-color-tag-secondary--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--secondary:hover',
  },
  {
    name: 'accent tag label',
    fg: '#fff',
    bg: ['--mg-color-tag-accent'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--accent',
  },
  {
    name: 'accent tag label, hover',
    fg: '#fff',
    bg: ['--mg-color-tag-accent--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--accent:hover',
  },
  {
    name: 'outline tag label on the page',
    fg: '--mg-color-tag',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--outline is transparent; label and border share the token',
  },
  {
    name: 'outline tag label, hover fill',
    fg: '--mg-color-tag',
    bg: ['--mg-color-blue-50'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--outline:hover keeps the label and tints the fill',
  },

  // --- Legacy tabs: tab.scss `.mg-tabs` ----------------------------------
  {
    name: 'legacy tab label, inactive',
    fg: '--mg-color-text-tab',
    bg: ['--mg-color-tab-background--inactive'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tabs__link resting label',
  },
  {
    name: 'legacy tab label, hover',
    fg: '--mg-color-text-tab--hover',
    bg: ['--mg-color-tab-background--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tabs__link:hover and :focus-visible share this rule',
  },
  {
    name: 'legacy tab label, active',
    fg: '--mg-color-text-tab-active',
    bg: ['--mg-color-tab-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tabs__link.is-active',
  },
  {
    name: 'legacy tab empty-filter message',
    fg: '--mg-color-text-tab-no-results',
    bg: ['--mg-color-tab-section-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tabs__no-results sits in the tab panel',
  },

  // --- v2 tabs: tab.scss `.mg-tabs--horizontal` --------------------------
  // The v2 list background is `transparent`, so these resolve against the
  // page, not against the legacy tab-bar tint.
  {
    name: 'v2 tab label, resting',
    fg: '--mg-tab-color',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tabs--horizontal .mg-tabs__link on a transparent list',
  },
  {
    name: 'v2 tab label, hover',
    fg: '--mg-tab-color--hover',
    bg: ['--mg-tab-background--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — hover tints the tab and recolours the label',
  },
  {
    name: 'v2 tab label, active',
    fg: '--mg-tab-color--active',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — the active v2 tab keeps a transparent background',
  },
  {
    name: 'v2 tab indicator, active',
    fg: '--mg-tab-indicator--active',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — the inset underline is how the selected tab is identified',
  },
  {
    name: 'v2 tab indicator, hover',
    fg: '--mg-tab-indicator--hover',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — hover state indicator on a transparent tab',
  },

  // --- Form controls: _form-base.scss ------------------------------------
  {
    name: 'input value text',
    fg: '--mg-color-text',
    bg: ['--mg-form-input-background'],
    min: 4.5,
    why: 'SC 1.4.3 — typed value on the resting field',
  },
  {
    name: 'input value text, focused/filled field',
    fg: '--mg-color-text',
    bg: ['--mg-form-input-background--focus'],
    min: 4.5,
    why: 'SC 1.4.3 — the field lifts to a second surface on focus and when filled',
  },
  {
    name: 'input placeholder',
    fg: '--mg-color-neutral-500',
    bg: ['--mg-form-input-background'],
    min: 4.5,
    why: 'SC 1.4.3 — ::placeholder is text',
  },
  {
    name: 'input border',
    fg: '--mg-form-input-border-color',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — the border is the only thing defining the field boundary',
  },
  {
    name: 'input border, focused',
    fg: '--mg-color-form-focus',
    bg: ['--mg-form-input-background--focus'],
    min: 3,
    why: 'SC 1.4.11 — focus recolours the border against the lifted surface',
  },
  {
    name: 'checkbox/radio border, resting',
    fg: '--mg-color-form-check',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — an unchecked control is nothing but its 2px border',
  },
  {
    name: 'checkbox/radio border, hover',
    fg: '--mg-color-form-check--hover',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — :hover recolours that border',
  },
  {
    name: 'checkbox/radio fill, checked',
    fg: '--mg-color-form-check--checked',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — the fill is how checked is identified',
  },
  {
    name: 'checkbox tick glyph on the checked fill',
    fg: '#fff',
    bg: ['--mg-color-form-check--checked'],
    min: 3,
    why: 'SC 1.4.11 — the tick is an inline SVG stroked #fff by _form-base.scss',
  },
  {
    name: 'field error message',
    fg: '--mg-color-red-900',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-form-error, and .mg-form-label--required::after',
  },
  {
    name: 'error summary text on its tinted panel',
    fg: '--mg-color-red-900',
    bg: ['--mg-color-red-50'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-form-error-summary__title and its links',
  },
  {
    name: 'form help text',
    fg: '--mg-color-neutral-500',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-form-help',
  },
  {
    name: 'focus ring against the page',
    fg: '--mg-color-focus-ring',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — buttons and fields draw the ring on the page, inside a --mg-color-neutral-0 separator',
  },

  // --- Card: card.scss ---------------------------------------------------
  {
    name: 'card body text',
    fg: '--mg-color-text',
    bg: ['--mg-card-background'],
    min: 4.5,
    why: 'SC 1.4.3 — the card is a raised surface, not always the page colour',
  },
  {
    name: 'card title link',
    fg: '--mg-color-interactive',
    bg: ['--mg-card-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-card__title a, and .mg-card__text-link',
  },
  {
    name: 'card label',
    fg: '--mg-color-tag',
    bg: ['--mg-card-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-card__label is small text',
  },
  {
    name: 'card title, secondary variant',
    fg: '--mg-color-secondary',
    bg: ['--mg-card-background'],
    min: 3,
    why: 'SC 1.4.3 large text — .mg-card__title is 23px bold, over 18.66px bold',
  },
  {
    name: 'card title, tertiary variant',
    fg: '--mg-color-tertiary',
    bg: ['--mg-card-background'],
    min: 3,
    why: 'SC 1.4.3 large text — .mg-card--tertiary title link',
  },
  {
    name: 'card title, quaternary variant',
    fg: '--mg-color-quaternary',
    bg: ['--mg-card-background'],
    min: 3,
    why: 'SC 1.4.3 large text — .mg-card--quaternary title link',
  },
  {
    name: 'card search-hit highlight',
    fg: '--mg-color-neutral-800',
    bg: ['--mg-color-neutral-50'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-card__title .active marks the matched term',
  },

  // --- Hero: hero.scss ---------------------------------------------------
  {
    name: 'hero body text on the split hero',
    fg: PAGE,
    bg: ['--mg-color-hero'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-hero--split has a flat token background, no photo',
  },
  {
    name: 'hero title on the split hero',
    fg: '--mg-color-hero-title',
    bg: ['--mg-color-hero'],
    min: 3,
    why: 'SC 1.4.3 large text — .mg-hero__title clamps from 38px up',
  },
  {
    name: 'hero primary CTA label',
    fg: '--mg-color-hero',
    bg: [PAGE],
    min: 4.5,
    why: 'SC 1.4.3 — the hero CTA inverts: white pill, hero-coloured label',
  },
  {
    name: 'hero secondary CTA label',
    fg: '--mg-color-hero-button-secondary-color',
    bg: ['--mg-color-hero-button-secondary-background', '--mg-color-hero'],
    min: 4.5,
    why: 'SC 1.4.3 — the secondary pill is 90% white over the hero, so it composites',
  },
  {
    name: 'hero secondary CTA border',
    fg: '--mg-border-color-hero-button-secondary',
    bg: ['--mg-color-hero'],
    min: 3,
    why: 'SC 1.4.11 — the border is the pill boundary against the hero',
  },
  {
    name: 'hero body text, secondary variant',
    fg: PAGE,
    bg: ['--mg-color-orange-800'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-hero--split.mg-hero--secondary paints orange-800 flat',
  },
  {
    name: 'hero CTA label, secondary variant',
    fg: '--mg-color-orange-800',
    bg: [PAGE],
    min: 4.5,
    why: 'SC 1.4.3 — the variant CTA is orange-800 on the white pill',
  },
  {
    name: 'hero body text, tertiary variant',
    fg: PAGE,
    bg: ['--mg-color-neutral-900'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-hero--split.mg-hero--tertiary',
  },
  {
    name: 'hero CTA label, tertiary variant',
    fg: '--mg-color-neutral-900',
    bg: [PAGE],
    min: 4.5,
    why: 'SC 1.4.3 — the variant CTA on the white pill',
  },
  {
    name: 'hero body text, quaternary variant',
    fg: PAGE,
    bg: ['--mg-color-red-800'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-hero--split.mg-hero--quaternary',
  },
  {
    name: 'hero CTA label, quaternary variant',
    fg: '--mg-color-red-800',
    bg: [PAGE],
    min: 4.5,
    why: 'SC 1.4.3 — the variant CTA on the white pill',
  },

  // --- Status label: _variables.scss + status-label.scss ------------------
  {
    name: 'status label text',
    fg: '--mg-status-label-color',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — the text, not the dot, is what names the status',
  },
  {
    name: 'status indicator ring',
    fg: '--mg-status-label-indicator-border-color',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — the pale swatches sit at 1.3-2.2:1, so the ring is their boundary',
  },

  // --- React Aria interactive states: aria/_react-aria.scss ---------------
  // The adapter's own hover/pressed rules, which the resting-state suite
  // above does not reach.
  {
    name: 'aria button label on the hover background',
    fg: '--mg-aria-button-color',
    bg: ['--mg-aria-button-background-hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .react-aria-Button[data-hovered] and [data-pressed]',
  },
  {
    name: 'aria on-accent text on the active accent',
    fg: '--mg-aria-color-on-accent',
    bg: ['--mg-aria-color-accent-active'],
    min: 4.5,
    why: 'SC 1.4.3 — .react-aria-ToggleButton[data-selected][data-hovered]',
  },
  {
    name: 'aria selected tag label',
    fg: '--mg-aria-color-on-accent',
    bg: ['--mg-aria-tag-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .react-aria-Tag[data-selected]',
  },
  {
    name: 'aria selected tag label, hover',
    fg: '--mg-aria-color-on-accent',
    bg: ['--mg-aria-tag-background-hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .react-aria-Tag[data-selected][data-hovered]',
  },
  {
    name: 'aria link text, hover and pressed',
    fg: '--mg-aria-color-accent-active',
    bg: ['--mg-aria-color-surface'],
    min: 4.5,
    why: 'SC 1.4.3 — .react-aria-Link[data-hovered] and [data-pressed]',
  },
  {
    name: 'aria tab label, resting',
    fg: '--mg-aria-tab-color',
    bg: ['--mg-aria-color-surface'],
    min: 4.5,
    why: 'SC 1.4.3 — .react-aria-Tab',
  },
  {
    name: 'aria tab label, hover',
    fg: '--mg-aria-tab-color-hover',
    bg: ['--mg-aria-tab-background-hover', '--mg-aria-color-surface'],
    min: 4.5,
    why: 'SC 1.4.3 — .react-aria-Tab[data-hovered] tints its background',
  },
  {
    name: 'aria tab label, selected',
    fg: '--mg-aria-tab-color-active',
    bg: ['--mg-aria-color-surface'],
    min: 4.5,
    why: 'SC 1.4.3 — the selected tab keeps a transparent background',
  },
  {
    name: 'aria tab indicator, selected',
    fg: '--mg-aria-tab-indicator-active',
    bg: ['--mg-aria-color-surface'],
    min: 3,
    why: 'SC 1.4.11 — the inset underline identifies the selected tab',
  },
  {
    name: 'aria tab indicator, hover',
    fg: '--mg-aria-tab-indicator-hover',
    bg: ['--mg-aria-color-surface'],
    min: 3,
    why: 'SC 1.4.11 — .react-aria-Tab[data-hovered] state indicator',
  },
  {
    name: 'aria check control, resting',
    fg: '--mg-aria-check-color',
    bg: ['--mg-aria-color-surface'],
    min: 3,
    why: 'SC 1.4.11 — an unchecked Checkbox/Radio is only its border',
  },
  {
    name: 'aria check control, hover',
    fg: '--mg-aria-check-color-hover',
    bg: ['--mg-aria-color-surface'],
    min: 3,
    why: 'SC 1.4.11 — [data-hovered] recolours the control boundary',
  },
  {
    name: 'aria check control, checked',
    fg: '--mg-aria-check-color-checked',
    bg: ['--mg-aria-color-surface'],
    min: 3,
    why: 'SC 1.4.11 — the checked fill and its outline',
  },
  {
    name: 'aria text on a selected row',
    fg: '--mg-aria-color-text',
    bg: ['--mg-aria-color-selected-surface', '--mg-aria-color-surface'],
    min: 4.5,
    why: 'SC 1.4.3 — selection is a 12% accent wash the label sits on',
  },
  {
    name: 'aria text on the subtle surface',
    fg: '--mg-aria-color-text',
    bg: ['--mg-aria-color-subtle-surface'],
    min: 4.5,
    why: 'SC 1.4.3 — table headers, popover sections',
  },
  {
    name: 'aria muted text on a field',
    fg: '--mg-aria-color-muted-text',
    bg: ['--mg-aria-color-field-surface'],
    min: 4.5,
    why: 'SC 1.4.3 — descriptions and placeholders inside form controls',
  },
];

/**
 * Known, unfixed contrast failures — a to-do list, not a waiver.
 *
 * Keyed `theme|pair name`, each entry carries the measured ratio so the
 * assertion still bites: the pair must STILL fail (a fix makes this test
 * fail with "remove this exception") and must not get worse. Nothing here is
 * an exemption from WCAG; every line is a brand-colour decision that belongs
 * to a human, which is why no colour was changed to make a test pass.
 */
const WCAG_EXCEPTIONS = {
  // orange-900 is 2.95:1 against white. Affects the primary button and the
  // outline button's hover fill, which share the token chain.
  'preventionweb|button label on primary background, hover': [
    2.95,
    'orange-900 hover fill; needs ~orange-1000 or a dark label',
  ],
  'irp|button label on primary background, hover': [
    2.95,
    'orange-900 hover fill; needs ~orange-1000 or a dark label',
  ],
  'preventionweb|outline primary button label, hover fill': [
    2.95,
    'same orange-900 chain as the primary hover',
  ],
  'irp|outline primary button label, hover fill': [
    2.95,
    'same orange-900 chain as the primary hover',
  ],
  'preventionweb|aria button label on the hover background': [
    2.95,
    'the adapter inherits --mg-color-button-background--hover',
  ],
  'irp|aria button label on the hover background': [
    2.95,
    'the adapter inherits --mg-color-button-background--hover',
  ],

  // The accent tag is white on orange in every theme, at rest and on hover.
  'base|accent tag label': [
    2.95,
    'orange-900 fill under #fff; darken the fill or use --mg-color-text',
  ],
  'preventionweb|accent tag label': [2.95, 'orange-900 fill under #fff'],
  'irp|accent tag label': [2.95, 'orange-900 fill under #fff'],
  'mcr|accent tag label': [2.95, 'orange-900 fill under #fff'],
  'delta|accent tag label': [2.95, 'orange-900 fill under #fff'],
  'base|accent tag label, hover': [
    2.65,
    'hover LIGHTENS to orange-800, so hover is worse than rest',
  ],
  'preventionweb|accent tag label, hover': [
    2.65,
    'hover lightens to orange-800',
  ],
  'irp|accent tag label, hover': [2.65, 'hover lightens to orange-800'],
  'mcr|accent tag label, hover': [2.65, 'hover lightens to orange-800'],
  'delta|accent tag label, hover': [2.65, 'hover lightens to orange-800'],

  // IRP's tag colour is its lighter interactive blue; the blue-50 hover wash
  // takes it under 4.5.
  'irp|outline tag label, hover fill': [
    3.99,
    'IRP tag blue on blue-50; a darker tag token or a white hover fill fixes it',
  ],

  // Legacy tabs: three brands tint the hover background without moving the
  // hover label off white.
  'irp|legacy tab label, hover': [
    2.05,
    'white label on IRP tab-background--hover',
  ],
  'mcr|legacy tab label, hover': [
    3.39,
    'white label on MCR tab-background--hover',
  ],
  'delta|legacy tab label, hover': [
    4.0,
    'white label on DELTA tab-background--hover; just short',
  ],

  // v2 tabs.
  'irp|v2 tab label, hover': [
    4.35,
    'IRP interactive-active on its own 6% wash; marginal',
  ],
  'irp|aria tab label, hover': [4.35, 'same token chain as the v2 tab'],
  'base|v2 tab indicator, hover': [
    2.28,
    '45% accent wash; raise the alpha or use the solid accent',
  ],
  'preventionweb|v2 tab indicator, hover': [2.09, '45% accent wash'],
  'irp|v2 tab indicator, hover': [1.9, '45% accent wash'],
  'mcr|v2 tab indicator, hover': [2.58, '45% accent wash'],
  'delta|v2 tab indicator, hover': [2.28, '45% accent wash'],
  'base|aria tab indicator, hover': [2.28, 'same 45% wash as the v2 tab'],
  'preventionweb|aria tab indicator, hover': [
    2.09,
    'same 45% wash as the v2 tab',
  ],
  'irp|aria tab indicator, hover': [1.9, 'same 45% wash as the v2 tab'],
  'mcr|aria tab indicator, hover': [2.58, 'same 45% wash as the v2 tab'],
  'delta|aria tab indicator, hover': [2.28, 'same 45% wash as the v2 tab'],

  // Card and hero share the orange secondary accent.
  'base|card title, secondary variant': [
    2.65,
    'orange-800 title link; fails even the large-text 3:1',
  ],
  'preventionweb|card title, secondary variant': [
    2.65,
    'orange-800 title link',
  ],
  'irp|card title, secondary variant': [2.65, 'orange-800 title link'],
  'mcr|card title, secondary variant': [2.65, 'orange-800 title link'],
  'delta|card title, secondary variant': [
    2.37,
    "orange-800 on DELTA's tinted card surface",
  ],
  'base|hero body text, secondary variant': [
    2.65,
    'white body copy on orange-800',
  ],
  'preventionweb|hero body text, secondary variant': [
    2.65,
    'white body copy on orange-800',
  ],
  'irp|hero body text, secondary variant': [
    2.65,
    'white body copy on orange-800',
  ],
  'mcr|hero body text, secondary variant': [
    2.65,
    'white body copy on orange-800',
  ],
  'delta|hero body text, secondary variant': [
    2.65,
    'white body copy on orange-800',
  ],
  'base|hero CTA label, secondary variant': [
    2.65,
    'orange-800 label on the white pill',
  ],
  'preventionweb|hero CTA label, secondary variant': [
    2.65,
    'orange-800 label on the white pill',
  ],
  'irp|hero CTA label, secondary variant': [
    2.65,
    'orange-800 label on the white pill',
  ],
  'mcr|hero CTA label, secondary variant': [
    2.65,
    'orange-800 label on the white pill',
  ],
  'delta|hero CTA label, secondary variant': [
    2.65,
    'orange-800 label on the white pill',
  ],

  // IRP's hero blue under a 90% white pill.
  'irp|hero secondary CTA label': [
    4.13,
    'IRP hero blue behind a 90%-white pill; marginal',
  ],
};

/**
 * Known perceptual failures, on the same terms as the WCAG table above: a
 * to-do list, not a waiver. Keyed `theme|pair name`, carrying the measured
 * Oklab score so the assertion still bites.
 *
 * A pair can appear here, in EXCEPTIONS, or in both. Where it appears in only
 * one, the two measures disagree about it, and the disagreement report at the
 * bottom of this file is the list of exactly those pairs.
 */
const PERCEPTUAL_EXCEPTIONS = {
  'base|accent tag label': [46.7, 'orange-900 fill under #fff'],
  'preventionweb|accent tag label': [46.7, 'orange-900 fill under #fff'],
  'irp|accent tag label': [46.7, 'orange-900 fill under #fff'],
  'mcr|accent tag label': [46.7, 'orange-900 fill under #fff'],
  'delta|accent tag label': [46.7, 'orange-900 fill under #fff'],

  'base|accent tag label, hover': [
    42.5,
    'hover lightens to orange-800, so hover is worse than rest',
  ],
  'preventionweb|accent tag label, hover': [
    42.5,
    'hover lightens to orange-800, so hover is worse than rest',
  ],
  'irp|accent tag label, hover': [
    42.5,
    'hover lightens to orange-800, so hover is worse than rest',
  ],
  'mcr|accent tag label, hover': [
    42.5,
    'hover lightens to orange-800, so hover is worse than rest',
  ],
  'delta|accent tag label, hover': [
    42.5,
    'hover lightens to orange-800, so hover is worse than rest',
  ],

  'base|legacy tab label, active': [
    60.8,
    'a mid-tone pair just short of body-text readable (WCAG 2 disagrees: 7.47:1 clears the 4.5:1 minimum)',
  ],

  'base|v2 tab label, hover': [
    61.1,
    'the interactive-active label on its own faint wash (WCAG 2 disagrees: 4.64:1 clears the 4.5:1 minimum)',
  ],
  'irp|v2 tab label, hover': [
    59.8,
    'the interactive-active label on its own faint wash',
  ],
  'delta|v2 tab label, hover': [
    62.6,
    'the interactive-active label on its own faint wash (WCAG 2 disagrees: 4.94:1 clears the 4.5:1 minimum)',
  ],

  'base|v2 tab indicator, hover': [
    38.3,
    '45% accent wash; raise the alpha or use the solid accent',
  ],
  'preventionweb|v2 tab indicator, hover': [
    34.5,
    '45% accent wash; raise the alpha or use the solid accent',
  ],
  'irp|v2 tab indicator, hover': [
    29,
    '45% accent wash; raise the alpha or use the solid accent',
  ],
  'mcr|v2 tab indicator, hover': [
    42.5,
    '45% accent wash; raise the alpha or use the solid accent',
  ],
  'delta|v2 tab indicator, hover': [
    38.3,
    '45% accent wash; raise the alpha or use the solid accent',
  ],

  'base|error summary text on its tinted panel': [
    59.5,
    'red-900 on red-50; a warm hue at this lightness is not body-readable (WCAG 2 disagrees: 5.27:1 clears the 4.5:1 minimum)',
  ],
  'preventionweb|error summary text on its tinted panel': [
    59.5,
    'red-900 on red-50; a warm hue at this lightness is not body-readable (WCAG 2 disagrees: 5.27:1 clears the 4.5:1 minimum)',
  ],
  'irp|error summary text on its tinted panel': [
    59.5,
    'red-900 on red-50; a warm hue at this lightness is not body-readable (WCAG 2 disagrees: 5.27:1 clears the 4.5:1 minimum)',
  ],
  'mcr|error summary text on its tinted panel': [
    59.5,
    'red-900 on red-50; a warm hue at this lightness is not body-readable (WCAG 2 disagrees: 5.27:1 clears the 4.5:1 minimum)',
  ],
  'delta|error summary text on its tinted panel': [
    59.5,
    'red-900 on red-50; a warm hue at this lightness is not body-readable (WCAG 2 disagrees: 5.27:1 clears the 4.5:1 minimum)',
  ],

  'base|card title, secondary variant': [42.5, 'orange-800 title link'],
  'preventionweb|card title, secondary variant': [
    42.5,
    'orange-800 title link',
  ],
  'irp|card title, secondary variant': [42.5, 'orange-800 title link'],
  'mcr|card title, secondary variant': [42.5, 'orange-800 title link'],
  'delta|card title, secondary variant': [34.7, 'orange-800 title link'],

  'base|hero body text, secondary variant': [
    42.5,
    'white body copy on orange-800',
  ],
  'preventionweb|hero body text, secondary variant': [
    42.5,
    'white body copy on orange-800',
  ],
  'irp|hero body text, secondary variant': [
    42.5,
    'white body copy on orange-800',
  ],
  'mcr|hero body text, secondary variant': [
    42.5,
    'white body copy on orange-800',
  ],
  'delta|hero body text, secondary variant': [
    42.5,
    'white body copy on orange-800',
  ],

  'base|hero CTA label, secondary variant': [
    42.5,
    'orange-800 label on the white pill',
  ],
  'preventionweb|hero CTA label, secondary variant': [
    42.5,
    'orange-800 label on the white pill',
  ],
  'irp|hero CTA label, secondary variant': [
    42.5,
    'orange-800 label on the white pill',
  ],
  'mcr|hero CTA label, secondary variant': [
    42.5,
    'orange-800 label on the white pill',
  ],
  'delta|hero CTA label, secondary variant': [
    42.5,
    'orange-800 label on the white pill',
  ],

  'base|aria tab label, hover': [
    61.1,
    'same token chain as the v2 tab (WCAG 2 disagrees: 4.64:1 clears the 4.5:1 minimum)',
  ],
  'irp|aria tab label, hover': [59.8, 'same token chain as the v2 tab'],
  'delta|aria tab label, hover': [
    62.6,
    'same token chain as the v2 tab (WCAG 2 disagrees: 4.94:1 clears the 4.5:1 minimum)',
  ],

  'base|aria tab indicator, hover': [38.3, 'same 45% wash as the v2 tab'],
  'preventionweb|aria tab indicator, hover': [
    34.5,
    'same 45% wash as the v2 tab',
  ],
  'irp|aria tab indicator, hover': [29, 'same 45% wash as the v2 tab'],
  'mcr|aria tab indicator, hover': [42.5, 'same 45% wash as the v2 tab'],
  'delta|aria tab indicator, hover': [38.3, 'same 45% wash as the v2 tab'],

  'preventionweb|button label on primary background, hover': [
    46.7,
    'orange-900 hover fill under a white label',
  ],
  'irp|button label on primary background, hover': [
    46.7,
    'orange-900 hover fill under a white label',
  ],

  'preventionweb|outline primary button label, hover fill': [
    46.7,
    'same orange-900 chain as the primary hover',
  ],
  'irp|outline primary button label, hover fill': [
    46.7,
    'same orange-900 chain as the primary hover',
  ],

  'preventionweb|aria button label on the hover background': [
    46.7,
    'the adapter inherits --mg-color-button-background--hover',
  ],
  'irp|aria button label on the hover background': [
    46.7,
    'the adapter inherits --mg-color-button-background--hover',
  ],

  'irp|outline tag label, hover fill': [54.7, 'IRP tag blue on blue-50'],

  'irp|legacy tab label, hover': [
    34.9,
    'white label on the tinted hover background',
  ],
  'mcr|legacy tab label, hover': [
    52.6,
    'white label on the tinted hover background',
  ],
  'delta|legacy tab label, hover': [
    59.8,
    'white label on the tinted hover background',
  ],

  'irp|hero secondary CTA label': [
    56.6,
    'IRP hero blue behind a 90%-white pill',
  ],

  // The widest disagreement in the file: WCAG 2 clears DELTA's hero title
  // for large text at 3.07:1, the Oklab measure puts it at 27.2 out of 50.
  'delta|hero title on the split hero': [
    27.2,
    'DELTA paints a mid-tone oklch sky blue on blue-900; the two blues are barely 27 apart (WCAG 2 disagrees: 3.07:1 clears the 3:1 minimum)',
  ],
};

/**
 * The union of both exception tables, keyed the same way. The disagreement
 * report reads this to prove that whichever measure fails a disagreeing pair
 * has actually recorded it, rather than the pair slipping between the two.
 */
const EXCEPTION_KEYS = new Set([
  ...Object.keys(WCAG_EXCEPTIONS),
  ...Object.keys(PERCEPTUAL_EXCEPTIONS),
]);

/**
 * Component-token contrast, including INTERACTIVE STATES.
 *
 * The suite above covers eleven `--mg-aria-*` pairs, all of them resting
 * states. That is a narrow slice of the design system: most of Mangrove lives
 * in the legacy `.mg-*` component tokens, and a hover background is a
 * different colour from the base one. A WCAG 1.4.3 failure shipped through
 * that gap — white on DELTA's secondary-button hover at 3.40:1 — because
 * nothing here measured a `--hover` token.
 *
 * Every pair below is derived from a component stylesheet: the foreground
 * token is one a rule actually paints on the background token beneath it, read
 * out of cta-button.scss, tag.scss, tab.scss, _form-base.scss, card.scss,
 * hero.scss and _variables.scss. Pairs that merely look related by name are
 * noise and are not here.
 *
 * Thresholds are per-pair, not global:
 *   4.5 — SC 1.4.3 Contrast (Minimum), normal text.
 *   3   — SC 1.4.3 for LARGE text (>=24px, or >=18.66px bold), or SC 1.4.11
 *         Non-text Contrast for a border, control boundary, state indicator or
 *         meaningful glyph.
 * The per-pair `why` field records which of those applies and why.
 *
 * NOT asserted, deliberately:
 *   - `.mg-button.disabled`, `.mg-form-*--disabled`, `[data-disabled]`. SC
 *     1.4.3 and 1.4.11 both exempt inactive components.
 *   - `--mg-color-tab-border--active` / `--hover` against the tab bar. The
 *     legacy tab's state is carried redundantly by background AND label colour
 *     (both asserted), the underline sits on the link with the section below
 *     it rather than the bar, and picking a single backdrop for it would be
 *     inventing an adjacency the CSS does not have.
 *   - The status-label dots. _variables.scss states the case: the label text
 *     always names the status, so the swatch is decoration under SC 1.4.1 and
 *     its 1px ring is what needs the 3:1 — that ring IS asserted.
 *   - Hero titles over a photographic gradient. No token pair exists there;
 *     it needs a rendered-pixel check, not a token check.
 */
describe('component token contrast, including hover and active states', () => {
  const PAIRS = COMPONENT_PAIRS;

  const EXCEPTIONS = WCAG_EXCEPTIONS;

  test.each(ALL_THEMES)(
    '%s: the page floor --mg-color-neutral-0 really is white',
    theme => {
      // Every translucent stack composites down onto the page, so this is the
      // one value the measurements are allowed to assume.
      const vars = themeVars(theme);
      expect(parseColor(deref(vars, vars[PAGE]))).toEqual(WHITE);
    }
  );

  test('tag.scss still paints its label #fff rather than through a token', () => {
    // The tag pairs above measure a literal. If the component moves to a
    // token, they would silently measure the wrong foreground.
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../Atom/Tag/tag.scss'),
      'utf8'
    );
    expect(source).toMatch(/color:\s*#fff;/);
  });

  describe.each(ALL_THEMES)('%s theme', theme => {
    test.each(PAIRS.map(pair => [pair.name, pair]))('%s', (name, pair) => {
      const vars = themeVars(theme);
      const resolve = token =>
        token.startsWith('--') ? deref(vars, vars[token]) : token;

      const foreground = parseColor(resolve(pair.fg));
      // A missing token is a contract bug, not a silent pass.
      expect(`${pair.fg}: ${foreground && 'ok'}`).toBe(`${pair.fg}: ok`);

      // Composite the stack from the page upward.
      let backdrop = WHITE;
      for (const token of [...pair.bg].reverse()) {
        const layer = parseColor(resolve(token));
        expect(`${token}: ${layer && 'ok'}`).toBe(`${token}: ok`);
        backdrop = flatten(layer, backdrop);
      }

      const ratio = Number(
        contrast(flatten(foreground, backdrop), backdrop).toFixed(2)
      );
      const exception = EXCEPTIONS[`${theme}|${name}`];

      if (!exception) {
        // The test name already carries the theme and the pair; `why` names
        // the criterion in the failure output.
        expect(`${ratio}:1 — ${pair.why}`).toBe(
          ratio >= pair.min
            ? `${ratio}:1 — ${pair.why}`
            : `at least ${pair.min}:1 — ${pair.why}`
        );
        return;
      }

      const [recorded] = exception;
      // Still broken — a fix must DELETE the exception, not hide behind it.
      expect(`${ratio}:1 vs the ${pair.min}:1 this pair needs`).toBe(
        ratio < pair.min
          ? `${ratio}:1 vs the ${pair.min}:1 this pair needs`
          : `now passing, so remove this exception (${recorded}:1 was recorded)`
      );
      // ...and no worse than when it was recorded.
      expect(ratio).toBeGreaterThanOrEqual(recorded - 0.01);
    });

    // Same pair, same composited pixels, second measure.
    test.each(PAIRS.map(pair => [pair.name, pair]))(
      '%s, perceptually',
      name => {
        const row = measurement(`component|${theme}|${name}`);
        // Guards the shared table against a token silently resolving to null.
        expect(
          `${name}: ${row.score === undefined ? 'unresolved' : 'ok'}`
        ).toBe(`${name}: ok`);

        assertPerceptual(row, PERCEPTUAL_EXCEPTIONS[`${theme}|${name}`]);
      }
    );
  });
});

/* -------------------------------------------------------------------------
 * The disagreements.
 *
 * This is the artefact the second measure exists to produce. Everywhere the
 * two agree, nothing has been learned. The pairs below are the ones where
 * WCAG 2's luminance ratio and the Oklab lightness measure reach OPPOSITE
 * verdicts, and each is a place where one of the two is wrong about something
 * a person has to read.
 *
 * The list is checked in rather than merely printed, so it cannot drift
 * silently: adding a colour that WCAG 2 over-rates, or fixing one, fails this
 * test with the full before/after table in the diff.
 * ---------------------------------------------------------------------- */
describe('where the two contrast measures disagree', () => {
  const line = row =>
    [
      `${row.theme} | ${row.name}`,
      row.wcagPasses
        ? `WCAG 2 PASSES ${row.ratio}:1 (min ${row.min})`
        : `WCAG 2 fails ${row.ratio}:1 (min ${row.min})`,
      row.perceptualPasses
        ? `perceptual PASSES ${row.score} (${row.role} needs ${row.floor})`
        : `perceptual fails ${row.score} (${row.role} needs ${row.floor})`,
    ].join(' | ');

  /**
   * Every disagreement, in measurement order.
   *
   * Direction matters. All eleven run the same way — WCAG 2 passes a pair the
   * perceptual measure fails — which is WCAG 2 OVER-rating readability, the
   * failure mode with a user behind it. Nothing here runs the other way: no
   * pair that WCAG 2 rejects is perceptually fine, so adopting the second
   * measure loosens nothing.
   */
  const DISAGREEMENTS = [
    'base | legacy tab label, active | WCAG 2 PASSES 7.47:1 (min 4.5) | perceptual fails 60.8 (BODY_TEXT needs 63)',
    'base | v2 tab label, hover | WCAG 2 PASSES 4.64:1 (min 4.5) | perceptual fails 61.1 (BODY_TEXT needs 63)',
    'base | error summary text on its tinted panel | WCAG 2 PASSES 5.27:1 (min 4.5) | perceptual fails 59.5 (BODY_TEXT needs 63)',
    'base | aria tab label, hover | WCAG 2 PASSES 4.64:1 (min 4.5) | perceptual fails 61.1 (BODY_TEXT needs 63)',
    'preventionweb | error summary text on its tinted panel | WCAG 2 PASSES 5.27:1 (min 4.5) | perceptual fails 59.5 (BODY_TEXT needs 63)',
    'irp | error summary text on its tinted panel | WCAG 2 PASSES 5.27:1 (min 4.5) | perceptual fails 59.5 (BODY_TEXT needs 63)',
    'mcr | error summary text on its tinted panel | WCAG 2 PASSES 5.27:1 (min 4.5) | perceptual fails 59.5 (BODY_TEXT needs 63)',
    'delta | v2 tab label, hover | WCAG 2 PASSES 4.94:1 (min 4.5) | perceptual fails 62.6 (BODY_TEXT needs 63)',
    'delta | error summary text on its tinted panel | WCAG 2 PASSES 5.27:1 (min 4.5) | perceptual fails 59.5 (BODY_TEXT needs 63)',
    'delta | hero title on the split hero | WCAG 2 PASSES 3.07:1 (min 3) | perceptual fails 27.2 (LARGE_TEXT needs 50)',
    'delta | aria tab label, hover | WCAG 2 PASSES 4.94:1 (min 4.5) | perceptual fails 62.6 (BODY_TEXT needs 63)',
  ];

  test('the two measures disagree about exactly these pairs', () => {
    const found = measurements()
      .filter(row => row.wcagPasses !== row.perceptualPasses)
      .map(line);

    expect(found).toEqual(DISAGREEMENTS);
  });

  test('every disagreement is recorded as an exception on the failing side', () => {
    // A disagreement is only honest if the failing measure still records it as
    // an unfixed failure. This binds the report to the two exception tables:
    // a pair cannot appear here and be silently unlisted there.
    const unrecorded = measurements()
      .filter(row => row.wcagPasses !== row.perceptualPasses)
      .filter(row => !EXCEPTION_KEYS.has(`${row.theme}|${row.name}`))
      .map(line);

    expect(unrecorded).toEqual([]);
  });

  test('no pair is failed by WCAG 2 and passed perceptually', () => {
    // Stated as its own guard because the day this stops being true is the day
    // the perceptual measure starts WAIVING something the standard rejects,
    // and that needs a human decision rather than a green suite.
    const loosened = measurements()
      .filter(row => !row.wcagPasses && row.perceptualPasses)
      .map(line);

    expect(loosened).toEqual([]);
  });
});
