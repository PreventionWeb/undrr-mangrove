#!/usr/bin/env node
/**
 * Design-token generator.
 *
 * Reads the W3C DTCG token sources in `tokens/` and emits the Sass partials
 * that Mangrove itself compiles. The point is that the token artifact is the
 * SOURCE, not a side-export: `stories/assets/scss/_theme-delta.scss` (the CSS
 * Mangrove ships) and `stories/assets/scss/aria/_tokens-delta.scss` (the
 * standalone --mg-aria-* file for external consumers) both read the generated
 * partials, so one edit in the JSON reaches both surfaces and the two cannot
 * drift apart.
 *
 * Usage:
 *   node scripts/build-tokens.cjs           # write the generated partials
 *   node scripts/build-tokens.cjs --check    # exit 1 if they are stale
 *
 * BUILD WIRING (not yet applied — package.json is owned elsewhere this
 * session). Add to package.json "scripts":
 *   "build:tokens": "node scripts/build-tokens.cjs",
 * and prefix the two Sass entry points:
 *   "scss":       "yarn build:tokens && yarn build:icons && ...",
 *   "scss-watch": "yarn build:tokens && yarn build:icons && ...",
 *   "build:aria": "yarn build:tokens && sass stories/assets/scss/aria/...",
 * Until that lands, `stories/assets/scss/__tests__/tokens-source.test.js`
 * fails the suite whenever the generated partials are stale, so the artifact
 * still cannot silently diverge from its source.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_DIR = path.join(ROOT, 'tokens');
const NS = 'org.undrr.mangrove';

/**
 * Output targets. Each generated file is a Sass partial: `$` outputs become
 * Sass variables, `--` outputs become custom properties inside the target's
 * mixin (so the consuming file decides which selector they land in).
 */
const TARGETS = {
  'mangrove-sass': {
    file: 'stories/assets/scss/generated/_delta-brand.scss',
    mixin: 'mg-delta-brand-sass-tokens',
    banner:
      'Brand primitives for the .mg-theme-delta runtime theme.\n' +
      'Consumed by stories/assets/scss/_theme-delta.scss, which Mangrove\n' +
      'compiles into stories/assets/css/style-delta.css.',
  },
  'aria-tokens': {
    file: 'stories/assets/scss/generated/_delta-brand-aria.scss',
    mixin: 'mg-delta-brand-tokens',
    banner:
      "Brand primitives for DELTA's standalone React Aria token file.\n" +
      'Consumed by stories/assets/scss/aria/_tokens-delta.scss, which is\n' +
      'published to external consumers as aria/tokens/delta.css.',
  },
};

/* ------------------------------------------------------------------ *
 * Value formatting.
 *
 * `format` is mandatory on every output and is the whole reason this file
 * exists: Mangrove stores colours BOTH as bare sRGB channel triplets
 * ("19 46 72", composable with rgb(... / alpha)) and as finished colour
 * values ("rgb(19 46 72)"). A reader that guesses wrong produces CSS that
 * silently does nothing. The source holds one unambiguous colour; each
 * consumer states the shape it needs.
 * ------------------------------------------------------------------ */
const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'math',
  'emoji',
  'fangsong',
]);

/**
 * Formats whose value is CSS syntax rather than a bare token, and so must be
 * carried as a Sass *string* and interpolated (`#{$var}`) at the use site.
 * Assigning `"Dubai", sans-serif` to a Sass variable makes a list whose
 * interpolation drops the quotes, silently changing the compiled CSS.
 */
const SASS_STRING_FORMATS = new Set(['font-family-stack']);

/**
 * stylelint runs with --fix over stories/**​/*.scss and would rewrite some
 * generated values, putting the linter and the generator in a loop. Font
 * family names are the live case: `value-keyword-case` lowercases `Dubai` to
 * `dubai` when it appears as a Sass variable value.
 */
const FORMAT_STYLELINT_DISABLE = {
  'font-family-name': 'value-keyword-case',
};

const FORMATTERS = {
  'srgb-channels': (value, type) => `${srgb(value, type).join(' ')}`,
  'srgb-rgb-function': (value, type) => `rgb(${srgb(value, type).join(' ')})`,
  'font-family-name': (value, type) => {
    assertType(type, 'fontFamily');
    return toArray(value)[0];
  },
  'font-family-stack': (value, type) => {
    assertType(type, 'fontFamily');
    // CSS generic families must stay unquoted; every real family name is
    // quoted so a name with a space or a digit cannot change meaning.
    return toArray(value)
      .map(family => (GENERIC_FAMILIES.has(family) ? family : `"${family}"`))
      .join(', ');
  },
  literal: value => String(value),
};

function assertType(actual, expected) {
  if (actual !== expected) {
    throw new Error(`expected $type "${expected}", got "${actual}"`);
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

function srgb(value, type) {
  assertType(type, 'color');
  const hex = String(value).trim();
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) {
    throw new Error(
      `colour "${hex}" must be 6-digit hex; the generator emits 8-bit sRGB ` +
        'channels and will not guess at other colour spaces'
    );
  }
  return [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16));
}

/* ------------------------------------------------------------------ *
 * DTCG traversal
 * ------------------------------------------------------------------ */
function* walk(node, pathParts, inheritedType) {
  const type = node.$type || inheritedType;
  if (Object.prototype.hasOwnProperty.call(node, '$value')) {
    yield { path: pathParts, token: node, type };
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$') || child === null || typeof child !== 'object') {
      continue;
    }
    yield* walk(child, [...pathParts, key], type);
  }
}

function collect(source, sourceFile) {
  const byTarget = new Map(Object.keys(TARGETS).map(name => [name, []]));

  for (const { path: tokenPath, token, type } of walk(source, [], undefined)) {
    const id = tokenPath.join('.');
    if (!type) throw new Error(`${id}: token has no $type`);
    const outputs = ((token.$extensions || {})[NS] || {}).outputs || [];
    for (const output of outputs) {
      if (!byTarget.has(output.target)) {
        throw new Error(`${id}: unknown output target "${output.target}"`);
      }
      const formatter = FORMATTERS[output.format];
      if (!formatter) {
        throw new Error(
          `${id}: unknown format "${output.format}" (expected one of ` +
            `${Object.keys(FORMATTERS).join(', ')})`
        );
      }
      let value;
      try {
        value = formatter(token.$value, type);
      } catch (error) {
        throw new Error(`${id} -> ${output.name}: ${error.message}`);
      }
      byTarget.get(output.target).push({
        id,
        name: output.name,
        value,
        format: output.format,
        description: token.$description,
        sourceFile,
      });
    }
  }
  return byTarget;
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */
function render(targetName, entries, sourceFiles) {
  const target = TARGETS[targetName];
  const sassVars = entries.filter(entry => entry.name.startsWith('$'));
  const customProps = entries.filter(entry => entry.name.startsWith('--'));

  const lines = [];
  // Silent (`//`) comments throughout: this partial is @import-ed into the
  // published CSS artifacts, and generator bookkeeping does not belong in a
  // file consumers download.
  lines.push('// GENERATED FILE — DO NOT EDIT.');
  for (const line of target.banner.split('\n')) {
    lines.push(`// ${line}`);
  }
  lines.push(`// Source: ${sourceFiles.join(', ')}`);
  lines.push('// Regenerate: node scripts/build-tokens.cjs');
  lines.push('// Edit the JSON source, never this file.');
  lines.push('// `npx jest tokens-source` fails if the two disagree.');

  for (const entry of sassVars) {
    lines.push('');
    lines.push(`// ${entry.id} (${entry.format})`);
    if (entry.description) lines.push(...comment(entry.description, '// '));
    const disable = FORMAT_STYLELINT_DISABLE[entry.format];
    if (disable) {
      lines.push(`// stylelint-disable-next-line ${disable}`);
    }
    if (SASS_STRING_FORMATS.has(entry.format)) {
      // Interpolate at the use site: `--prop: #{$var};`
      lines.push(`${entry.name}: '${entry.value}';`);
    } else {
      lines.push(`${entry.name}: ${entry.value};`);
    }
  }

  if (customProps.length > 0) {
    lines.push('');
    lines.push(`@mixin ${target.mixin} {`);
    for (const [index, entry] of customProps.entries()) {
      if (index > 0) lines.push('');
      lines.push(`  // ${entry.id} (${entry.format})`);
      lines.push(`  ${entry.name}: ${entry.value};`);
    }
    lines.push('}');
  }
  lines.push('');

  return lines.join('\n');
}

function comment(text, prefix) {
  const words = String(text).split(/\s+/);
  const out = [];
  let line = prefix;
  for (const word of words) {
    if (line.length + word.length + 1 > 76 && line !== prefix) {
      out.push(line);
      line = prefix;
    }
    line += (line === prefix ? '' : ' ') + word;
  }
  if (line !== prefix) out.push(line);
  return out;
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */
function build() {
  const sourceFiles = fs
    .readdirSync(TOKENS_DIR)
    .filter(name => name.endsWith('.tokens.json'))
    .sort();
  if (sourceFiles.length === 0) {
    throw new Error(`no *.tokens.json files found in ${TOKENS_DIR}`);
  }

  const merged = new Map(Object.keys(TARGETS).map(name => [name, []]));
  for (const name of sourceFiles) {
    const source = JSON.parse(
      fs.readFileSync(path.join(TOKENS_DIR, name), 'utf8')
    );
    for (const [target, entries] of collect(source, `tokens/${name}`)) {
      merged.get(target).push(...entries);
    }
  }

  const files = new Map();
  for (const [targetName, entries] of merged) {
    files.set(
      TARGETS[targetName].file,
      render(
        targetName,
        entries,
        sourceFiles.map(name => `tokens/${name}`)
      )
    );
  }
  return files;
}

function main(argv) {
  const check = argv.includes('--check');
  const files = build();
  const stale = [];

  for (const [relative, contents] of files) {
    const absolute = path.join(ROOT, relative);
    const current = fs.existsSync(absolute)
      ? fs.readFileSync(absolute, 'utf8')
      : null;
    if (current === contents) continue;
    if (check) {
      stale.push(relative);
      continue;
    }
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, contents);
    process.stdout.write(`build-tokens: wrote ${relative}\n`);
  }

  if (check && stale.length > 0) {
    process.stderr.write(
      'build-tokens: generated files are stale:\n' +
        stale.map(f => `  ${f}\n`).join('') +
        'Run `node scripts/build-tokens.cjs`.\n'
    );
    process.exitCode = 1;
  }
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`build-tokens: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { build, TARGETS };
