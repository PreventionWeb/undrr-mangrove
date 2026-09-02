# Cascade layers

Mangrove ships two flavours of the React Aria stylesheet. Which one you import
decides whether your own CSS can override Mangrove, or whether Mangrove wins
every time.

| File                          | Wrapped in a layer?  | Import this when                                                          |
| ----------------------------- | -------------------- | ------------------------------------------------------------------------- |
| `aria/react-aria.css`         | No                   | Your page has no cascade layers, or you want today's behaviour unchanged.  |
| `aria/react-aria.layered.css` | Yes, `@layer mangrove` | You use Tailwind, or any framework that puts its CSS in a cascade layer. |

Both files contain byte-identical rules. The layered one adds a single
`@layer mangrove { … }` wrapper (with `@charset` hoisted above it, where it is
still legal). Nothing else differs, and no version of Mangrove declares a layer
order — the order is yours to set.

Package entry points:

```js
import '@undrr/undrr-mangrove/aria.css'; // unlayered
import '@undrr/undrr-mangrove/aria.layered.css'; // @layer mangrove
```

## The problem the layered file solves

An unlayered rule beats a layered rule, always, no matter the specificity. That
is the whole point of cascade layers: unlayered CSS sits at the top of the layer
order.

So if you use Tailwind 4 — which puts its utilities in `@layer utilities` — and
you import the unlayered Mangrove file, **your utility classes cannot override
Mangrove.** Measured in a browser:

```html
<link rel="stylesheet" href="aria/react-aria.css" />
<!-- .react-aria-Button { display: inline-flex } -->
<style>
  @layer utilities {
    .u-block {
      display: block;
    }
  }
</style>
<button class="react-aria-Button u-block">…</button>
<!-- computed display: inline-flex — Mangrove wins, the utility loses -->
```

Swap in `react-aria.layered.css`, declare an order, and the utility wins:

```html
<style>
  @layer legacy, mangrove, utilities;
</style>
<link rel="stylesheet" href="aria/react-aria.layered.css" />
<!-- computed display: block — the utility wins -->
```

## What a consumer must do

### 1. Declare the layer order first, before any stylesheet loads

**This is the one thing that must be right.** Layer order is set by first
appearance. Put the order statement in an inline `<style>` in `<head>`, above
every `<link>` and every bundler-injected stylesheet:

```html
<head>
  <style>
    @layer legacy, mangrove, utilities;
  </style>
  <link rel="stylesheet" href="/path/to/react-aria.layered.css" />
  <link rel="stylesheet" href="/path/to/your-utilities.css" />
</head>
```

In a bundled app, the equivalent is a stylesheet imported before all others:

```css
/* layers.css — imported first in your entry point */
@layer legacy, mangrove, utilities;
```

Get this wrong and the order silently inverts. If `@layer mangrove { … }`
appears before the order statement, `mangrove` registers as the *first* layer
and everything named after it in the statement — including `legacy` — ends up
*above* Mangrove:

```css
@layer mangrove {
  .x {
    color: rgb(1, 1, 1);
  }
}
@layer legacy, mangrove, utilities; /* too late */
@layer legacy {
  .x {
    color: rgb(2, 2, 2);
  }
}
/* computed: rgb(2,2,2) — legacy beats mangrove, which is backwards */
```

There is no warning and no console error. The page just looks wrong.

### 2. Put your unlayered legacy CSS into a layer — the one-line change

This is the trap that made Mangrove ship unlayered in the first place. Layered
Mangrove versus **unlayered** legacy CSS means legacy wins every rule, even a
low-specificity one:

```html
<link rel="stylesheet" href="aria/react-aria.layered.css" />
<style>
  .legacy button {
    display: grid;
  }
</style>
<!-- computed display: grid — legacy beats Mangrove -->
```

The fix is one line at each `<link>` for a legacy stylesheet you do not want
outranking Mangrove — wrap it at import time:

```css
/* in the stylesheet that loads your legacy CSS */
@import url('./legacy.css') layer(legacy);
```

Or, if that stylesheet is yours to edit, wrap its contents directly:

```css
@layer legacy {
  /* … all of your existing legacy CSS, unchanged … */
}
```

**Prefer wrapping the contents over `@import … layer()`.** See the toolchain
warnings below — `@import … layer()` is the part that breaks in build tools,
which is precisely why Mangrove pre-wraps its own file rather than telling you
to `@import` it into a layer.

### 3. Do not double-wrap

Import the layered file plainly. Doing
`@import url('react-aria.layered.css') layer(vendor)` nests it as
`vendor.mangrove`, so `@layer legacy, mangrove, utilities` no longer refers to
it and your ordering silently stops applying.

## What breaks if you get it wrong

| Mistake                                        | Symptom                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| Unlayered Mangrove + Tailwind                  | Utility classes have no effect on React Aria elements.                      |
| Layered Mangrove, no order statement           | Order falls back to first appearance; usually still fine, but not stated.   |
| Order statement after the first `@layer` block | Order silently inverts; legacy CSS outranks Mangrove.                       |
| Layered Mangrove + unlayered legacy CSS        | Legacy CSS wins every conflict, including single-class selectors.           |
| Both files imported                            | The unlayered copy wins everything. Import exactly one.                     |

## Toolchain warnings — measured, not assumed

These were tested in this repository on 2026-09-02.

### Sass preserves everything (verified)

`sass` 1.103.1 passes `@layer` blocks, bare `@layer a, b, c;` order statements
and `@import url("x.css") layer(name)` through untouched, in both expanded and
`--style=compressed` output. Sass is not a risk.

### webpack + css-loader reorders `@import … layer()` (verified, and it breaks ordering)

Compiling through this repo's own webpack stack (`css-loader` 7,
`sass-loader` 17, `mini-css-extract-plugin`, `css-minimizer-webpack-plugin`),
this input:

```css
@import url('./plain.css') layer(mangrove);
@layer legacy, mangrove, utilities;
@layer mangrove {
  .a {
    color: red;
  }
}
```

produced this output:

```css
@layer mangrove{.imported{color:#639}.a{color:red}}@layer legacy, mangrove, utilities;@layer mangrove{}.c{color:#000}
```

css-loader inlined the import correctly, but **hoisted the resulting
`@layer mangrove` block above the order statement.** Loading that artifact in a
browser confirmed the consequence: a consumer's `@layer legacy` rule then beat
Mangrove, the exact inverse of the intent.

Do not rely on `@import … layer()` surviving a bundler. Wrap layer contents
directly instead.

### Drupal's CSS aggregator does not understand `@import … layer()` (researched)

Drupal core's `CssOptimizer` inlines local `@import` statements during
aggregation using a regex that has no accommodation for a trailing `layer(…)`:

```
/@import\s*(?:url\(\s*)?['"]?(?![a-z]+:)(?!\/\/)([^'"\()]+)['"]?\s*\)?\s*;/
```

An `@import url('x.css') layer(y);` does not match, so it is left in place
rather than inlined — it still works in the browser, but it is excluded from the
aggregate and costs an extra request. This is a known, still-open core issue:
[#3470829 "Support for CSS Cascade Layer import in CssOptimizer"](https://www.drupal.org/project/drupal/issues/3470829)
(opened Aug 2024, MR
[!9361](https://git.drupalcode.org/project/drupal/-/merge_requests/9361) not
merged as of Sept 2026). `@import` handling in `CssOptimizer` has a long history
of edge-case breakage generally — see
[#2936067](https://www.drupal.org/project/drupal/issues/2936067),
[#413296](https://www.drupal.org/project/drupal/issues/413296),
[#3133572](https://www.drupal.org/project/drupal/issues/3133572).

**What we could not confirm:** whether Drupal aggregation preserves plain
`@layer name { … }` *blocks*. Nothing in `CssOptimizer` is `@layer`-aware and
its transformations are comment stripping, whitespace minification and `url()`
rewriting, none of which should touch an at-rule block — but we found no
drupal.org issue or test that states this either way, and we did not run a live
Drupal aggregation. If you are the first Drupal site to ship
`react-aria.layered.css`, verify with aggregation switched on before trusting it
in production.

Note also that aggregation strips comments and rewrites relative `url()` paths.
Neither affects layering.

### Browser support (researched)

Both features are Baseline "widely available":

| Feature                 | Chrome/Edge | Firefox | Safari / iOS | Shipped     |
| ----------------------- | ----------- | ------- | ------------ | ----------- |
| `@layer` block          | 99          | 97      | 15.4         | ~March 2022 |
| `@import … layer(name)` | 99          | 97      | 15.4         | ~March 2022 |

They are tracked as separate compatibility entries but shipped together in every
engine, so there is no browser-side reason to prefer one over the other. The
risk with `@import … layer()` is entirely in build tooling, above.

Browsers that predate `@layer` ignore the whole `@layer { … }` block, so an old
browser loading `react-aria.layered.css` gets **no Mangrove styling at all**. If
you still support pre-2022 browsers, ship the unlayered file.

## Design tokens stay unlayered

`aria/tokens/mangrove.css` and `aria/tokens/delta.css` are deliberately **not**
layered. They only declare custom properties, and keeping them out of a layer
means a consumer can override a token from anywhere without thinking about layer
order. Import them alongside either flavour.

## How the layered file is built

`yarn build:aria` compiles the Sass to `aria/react-aria.css` as before, then
runs:

```
node scripts/build-layered-css.js --layer=mangrove \
  aria/react-aria.css:aria/react-aria.layered.css
```

The script (`scripts/lib/wrap-css-layer.js`) parses the built CSS with postcss,
hoists `@charset` / `@import` / `@namespace` above the wrapper because those are
illegal inside `@layer`, and wraps the rest. Rule text and whitespace are
preserved byte for byte, so the two files diff cleanly.
`scripts/__tests__/build-layered-css.test.js` asserts the two stay in sync, so a
stale layered artifact fails CI.

To layer another stylesheet, add a `input.css:output.css` pair to that command.
