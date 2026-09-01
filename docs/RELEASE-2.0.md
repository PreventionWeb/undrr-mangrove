# Mangrove 2.0 release notes

Mangrove 2.0 combines two related workstreams: the runtime theming foundation published in `2.0.0-alpha.1`, and the experience and interaction baseline in `2.0.0-alpha.2`. See [PR #1061](https://github.com/unisdr/undrr-mangrove/pull/1061) for the first alpha and [PR #1086](https://github.com/unisdr/undrr-mangrove/pull/1086) for alpha.2. The tagged `v1.8.2...v2.0.0` comparison lands with the stable release.

> **If you consume the base UNDRR compiled CSS (CDN or prebuilt), no sub-brand theming:** the alpha.1 theming migration requires no integration change. Alpha.2 intentionally refreshes component presentation and interaction while retaining existing Drupal hydration and BEM contracts, apart from the deprecated Pagination removal.
>
> **If you consume a sub-brand compiled stylesheet** (PreventionWeb, IRP, MCR, DELTA): one required change — add the matching `mg-theme-*` class to `<body>` or a wrapping element, or components fall back to the default UNDRR palette. See [Sub-brand theming migration](#sub-brand-theming-migration).
>
> **If you import Mangrove SCSS directly** or override `$mg-color-*` / `$mg-spacing-*` variables in your own stylesheets: see the [breaking changes](#breaking-changes) below.

> _Edits here show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-2.0.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v2-0--docs)._

## Try the alpha

2.0 ships as a **prerelease** under the `next` dist-tag, so it never lands on `latest` — a plain `npm install @undrr/undrr-mangrove` stays on 1.x until 2.0 is stable. This release is `2.0.0-alpha.2`; until the manual publish completes, `@next` may still resolve to alpha.1.

```bash
# npm (prerelease tag — does not become your default version)
npm install @undrr/undrr-mangrove@next
```

```html
<!-- CDN, versioned path (pick the base or a sub-brand stylesheet) -->
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/2.0.0-alpha.2/css/style.css">
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/2.0.0-alpha.2/css/style-preventionweb.css">
```

For a compiled-CSS consumer the entire trial is two lines: swap the stylesheet href above, and — for a sub-brand — add `class="mg-theme-{brand}"` to `<body>` or a wrapping element. Found a problem? See [where to report](#feedback).

## Alpha roadmap

| Prerelease | Status | Focus |
|---|---|---|
| `2.0.0-alpha.1` | Published under `next` | CSS custom-property theming, 16px root and sub-brand runtime selectors |
| `2.0.0-alpha.2` | Prepared for manual release in [PR #1086](https://github.com/unisdr/undrr-mangrove/pull/1086) | Experience principles, component surfaces, interaction states, responsive behaviour and multilingual resilience |

### Alpha.2 experience and interaction baseline

Alpha.2 applies a shared experience direction without mechanically homogenising components or overriding theme-owned expression:

- Shared surface, border, shadow, radius, focus and reduced-motion tokens provide a consistent foundation.
- Buttons, forms, cards, hero compositions, tabs, disclosures, menus, on-page navigation, tables, Pager, ScrollContainer and Text CTA receive coordinated responsive and interaction refinements.
- The new `FormAction` composition joins a field and its key action for search, subscription and select-and-continue flows, with accessible help and error wiring, RTL support and optional mobile stacking.
- The editorial CTA gains stable hover geometry, logical RTL placement and safe wrapping for long translations. Conventional buttons remain the default for forms, consent and utility actions.
- Chips distinguish navigational links from dismiss actions and add visible removal affordances, logical spacing, focus, reduced-motion and forced-colour support.
- Storybook's global locale toolbar becomes the canonical translation mechanism; dedicated RTL and long-label stories remain where they test a distinct layout condition.
- `FormAction` ships as a direct ESM component entry, and published component bundles are built against React's production JSX runtime rather than reusing Storybook development transforms.

Alpha.2 has been checked across desktop and mobile layouts, Chromium and Firefox, RTL, long labels, keyboard focus, reduced motion, forced colours and representative UNDRR themes. See the [Experience principles](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-experience-principles--docs) for the design guardrails behind these changes.

## Find your path

| I am... | Go to... |
|---|---|
| A **base UNDRR** Drupal/CDN consumer, no custom SCSS | [What changed visually](#what-changed-visually) and [the alpha.2 baseline](#alpha2-experience-and-interaction-baseline) |
| A **sub-brand** Drupal/CDN consumer (PW, IRP, MCR, DELTA) | [Sub-brand theming migration](#sub-brand-theming-migration) — add the `mg-theme-*` body class |
| A developer who imports Mangrove SCSS | [Breaking changes](#breaking-changes) |
| A developer who overrides sub-brand tokens | [Sub-brand theming migration](#sub-brand-theming-migration) |
| An AI agent or tool reading this for API context | [Token API summary](#token-api-summary) |

## What changed visually

In **alpha.1**, colors and spacing remain visually equivalent for base UNDRR consumers: the values moved from SCSS variables to CSS custom properties, but the compiled `style.css` output is equivalent.

**Alpha.2** intentionally refreshes the presentation and interaction of core components. It introduces softer theme-aware surfaces, clearer focus and hover states, more consistent responsive spacing, joined form actions and stronger multilingual behaviour. Semantic shapes remain component-specific: carousel controls stay circular, chips retain meaningful pill geometry and institutional chrome continues to express its owning theme.

**Sub-brand consumers (PreventionWeb, IRP, MCR, DELTA) have one required change.** Brand colors previously baked into every component rule at compile time; they now live in a `.mg-theme-{brand}` selector block. Add `class="mg-theme-{brand}"` to `<body>` or a wrapping element, or components render with the default UNDRR palette instead of the brand palette. See [Sub-brand theming migration](#sub-brand-theming-migration).

**Browser floor changed.** 2.0 now *requires* CSS custom property support: because every color and spacing value resolves through `var(--mg-*)` at runtime, a browser without custom-property support loses **all** Mangrove color and spacing — not just an effect here and there. (In 1.x those values were baked in, so an old browser still rendered.) Alpha-composited colors — overlays, hover tints, modal scrims — additionally use the `rgb(var() / alpha)` syntax. Every browser in the [supported matrix](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-browser-support--docs) handles both correctly; this only matters for browsers below that floor.

## Breaking changes

### 1. `$mg-color-*` and `$mg-spacing-*` SCSS aliases removed

The backward-compat SCSS aliases are gone. Any stylesheet that references these variables will fail to compile.

| Old | New |
|---|---|
| `$mg-color-interactive` | `var(--mg-color-interactive)` |
| `$mg-color-blue-900` | `rgb(var(--mg-color-blue-900))` |
| `$mg-spacing-150` | `var(--mg-spacing-150)` |

**Alpha values:** `rgba($mg-color-X, 0.5)` is not valid once the variable chains to `var()`. Use `rgb(var(--mg-color-X) / 0.5)` instead.

**SCSS `color.adjust()` / `darken()` / `lighten()`:** these SCSS functions cannot accept CSS custom properties as arguments. Replace with a computed hex literal or restructure the logic.

**Silent failure — overrides that compile but do nothing.** The loud case above (a *reference* that fails to compile) is the safe one. The dangerous case is *assigning* one of these variables before importing Mangrove:

```scss
// Compiles cleanly, produces NO effect in 2.0:
$mg-color-interactive: #0a6969;
@import "@undrr/undrr-mangrove/scss/assets/scss/style";
```

Components now read `var(--mg-color-interactive)`, not the SCSS variable — so your brand color silently reverts to the default UNDRR palette and nothing errors. Symptom: *"my brand color went back to UNDRR blue and the build was green."* To catch this, Mangrove's build emits a `@warn` when it sees a commonly-overridden `$mg-color-*` / `$mg-spacing-*` variable defined at import time — watch your Sass build log. The fix is to move the override to a CSS custom property (see [Sub-brand theming migration](#sub-brand-theming-migration)).

The following remain as SCSS variables (BUILD-TIME ONLY — no CSS custom property equivalent):

| Variable | Reason |
|---|---|
| `$mg-breakpoint-*` | `@media` queries require static values at compile time |
| `$mg-font-size-*` | Resolved at compile time for interpolation |
| `$mg-font-family*` | Resolved at compile time |
| `$mg-html-font-size` | Base rem anchor, compile-time only |
| `$mg-tabs-border-bottom` | `@if` conditional, compile-time only |

### 2. Sub-brand `_variables-*.scss` files deleted

The four sub-brand variable override files are gone. Each is replaced by a `_theme-{name}.scss` file.

| Deleted | Replacement |
|---|---|
| `_variables-irp.scss` | `_theme-irp.scss` |
| `_variables-preventionweb.scss` | `_theme-preventionweb.scss` |
| `_variables-mcr.scss` | `_theme-mcr.scss` |
| `_variables-delta.scss` | `_theme-delta.scss` |

If you have a custom SCSS entry point that imports one of these files, update the import:

```scss
// Before
@import "./variables-irp";

// After
@import "./theme-irp";
```

The new files contain a `.mg-theme-irp { }` selector block rather than SCSS variable reassignments. Apply the class to `<body>` or a wrapping element at runtime.

### 3. Hero variant colour map

`hero.scss` stores variant colour names as CSS custom property name strings (`"--mg-color-orange-800"`) rather than resolved SCSS values. Consumers that previously overrode `$mg-color-hero--secondary !default` must instead override the relevant `--mg-color-*` custom property on `:root`.

```scss
// Before (1.x) — reassign the SCSS variable before import
$mg-color-hero--secondary: #b34700 !default;

// After (2.0) — override the custom property (globally on :root,
// or per-brand inside a .mg-theme-* block)
:root {
  --mg-color-hero--secondary: var(--mg-color-orange-800);
}
```

### 4. `storybook-design-token` plugin removed

If you depend on the plugin being present in the Storybook addon registry, it is gone. The Design decisions/Colors, Spacing, Widths, Breakpoints, and Typography pages use `getComputedStyle` and static tables instead.

### 5. Legacy 10px root removed

The `style-legacy.scss`, `style-preventionweb-legacy.scss`, `style-irp-legacy.scss`, and `style-mcr-legacy.scss` entry points are deleted, and `$mg-html-font-size` is now fixed at `16` (the `!default` override is gone). Mangrove 2.0 assumes the **browser-standard 16px document root** and no longer emits a root `font-size` override.

Consumers that ran on the legacy 10px root — a `html { font-size: 62.5% }` (or `10px`) root, or a build that set `$mg-html-font-size: 10` — must migrate:

- Serve your document at a **16px root** (remove the `62.5%`/`10px` `html` font-size).
- **Convert your own rem-based CSS from a 10px to a 16px basis.** A rule that meant 14px as `1.4rem` under a 10px root now renders 22.4px; rewrite it (e.g. `0.875rem`, or use `px`). This is the substantive part of the migration — Mangrove's own output is already correct for the 16px root.

There is no compatibility build; the 16px root is the only supported basis.

### 6. Deprecated Pagination component removed

The deprecated `Pagination` component, its stories and documentation are removed in alpha.2. Use `Pager`, which is the supported 2.0 pagination pattern. Existing consumers that still import or render `Pagination` must migrate before adopting this prerelease.

## Sub-brand theming migration

**Consuming a compiled sub-brand stylesheet?** You do not touch SCSS at all — just add `class="mg-theme-{brand}"` (e.g. `mg-theme-preventionweb`) to `<body>` or a wrapping element. The compiled CSS already carries the brand block; the class is what activates it. Skip to [Apply the class](#sub-brand-theming-migration) below.

**Authoring your own theme in SCSS?** The new pattern applies CSS custom property overrides at runtime via a selector class, rather than at SCSS compile time via `!default` variable reassignment.

**Before (1.x):**

```scss
// _variables-mytheme.scss — imported before components
$mg-color-interactive: #0a6969 !default;
$mg-color-button-background: #0a6969 !default;
```

**After (2.0):**

```scss
// _theme-mytheme.scss
.mg-theme-mytheme {
  --mg-color-interactive:        var(--mg-color-teal-900);
  --mg-color-button-background:  var(--mg-color-interactive);
}
```

Apply the class in your HTML:

```html
<body class="mg-theme-mytheme">
```

The class can be applied to any ancestor element, not just `<body>`. Multiple theme classes can co-exist on different subtrees.

### Multi-brand pages and the combined bundle

Because component CSS is now brand-neutral (it reads `var(--mg-color-*)` rather than baked values), one stylesheet can serve every brand. A **combined bundle** — `style-all.css` — carries the base `:root` palette plus all four `.mg-theme-*` blocks, so a page can host more than one brand, or switch brand at runtime, by toggling the body/wrapper class with no rebuild. Use a per-brand stylesheet (`style-preventionweb.css`, …) when a site only ever renders one brand; use `style-all.css` when it needs several.

> **One Mangrove stylesheet per page.** Each stylesheet defines the token custom properties on `:root`; loading two Mangrove bundles on the same page (for example a base `style.css` and a per-brand `style-preventionweb.css`) makes them fight over the same `:root` globals, and the last one loaded wins. Pick a single bundle — the combined `style-all.css` if you need multiple brands.

## Token API summary

All color and spacing tokens are now CSS custom properties on `:root`. Palette colors use space-separated RGB channels to enable alpha compositing:

```css
--mg-color-blue-900: 0 79 145;           /* channel format */
--mg-color-interactive: var(--mg-color-blue-900);  /* semantic alias */
```

Consuming a color:

```css
color: rgb(var(--mg-color-interactive));
background: rgb(var(--mg-color-interactive) / 0.1);  /* with alpha */
```

Full token list: [Design decisions/Colors](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-colors--docs), [Design decisions/Spacing](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-spacing--docs).

## Feedback

2.0 is an alpha — feedback is wanted. Report issues at the tracker (**canonical location TBD — set before the public alpha**; likely the [GitHub issues](https://github.com/unisdr/undrr-mangrove/issues) or the project's new GitLab home). To make a report actionable, include three things:

1. **Consumption mode** — compiled CSS via CDN, compiled CSS via npm, or SCSS import.
2. **Brand** — base UNDRR, or which sub-brand (PreventionWeb / IRP / MCR / DELTA).
3. **What you saw vs. expected** — including whether your Sass build printed any `Mangrove 2.0:` warning.
