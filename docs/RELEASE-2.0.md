# Mangrove 2.0 release notes

Mangrove 2.0 combines three related workstreams: the runtime theming foundation published in `2.0.0-alpha.1`, the experience and interaction baseline in `2.0.0-alpha.2`, and the design token pipeline proposed for `2.0.0-alpha.3`. See [PR #1061](https://github.com/unisdr/undrr-mangrove/pull/1061) for the first alpha, [PR #1086](https://github.com/unisdr/undrr-mangrove/pull/1086) for alpha.2 and [PR #1080](https://github.com/unisdr/undrr-mangrove/pull/1080) for alpha.3. The tagged `v1.8.2...v2.0.0` comparison lands with the stable release.

> **If you consume the base UNDRR compiled CSS (CDN or prebuilt), no sub-brand theming:** the alpha.1 theming migration requires no integration change. Alpha.2 intentionally refreshes component presentation and interaction while retaining existing Drupal hydration and BEM contracts, apart from the deprecated Pagination removal.
>
> **Alpha.3 adds no required integration change, but it does change two system-wide defaults that every consumer will see, in every theme:** the neutral ramp's surface half is now cool-tinted, and the keyboard focus ring is no longer the brand colour. Its token rewrite is otherwise value-identical — apart from those two changes the compiled output for all five themes is unchanged. See [Alpha.3](#alpha3-token-pipeline-and-colour-methodology).
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
| `2.0.0-alpha.3` | Proposed in [PR #1080](https://github.com/unisdr/undrr-mangrove/pull/1080), not yet published | Design token pipeline, status and empty-state components, data-visualisation palette and a perceptual colour-contrast methodology |

### Alpha.2 experience and interaction baseline

Alpha.2 applies a shared experience direction without mechanically homogenising components or overriding theme-owned expression:

- Shared surface, border, shadow, radius, focus and reduced-motion tokens provide a consistent foundation.
- Buttons, forms, cards, hero compositions, tabs, disclosures, menus, on-page navigation, tables, Pager, ScrollContainer and Text CTA receive coordinated responsive and interaction refinements.
- The new `FormAction` composition joins a field and its key action for search, subscription and select-and-continue flows, with accessible help and error wiring, RTL support and optional mobile stacking.
- The new standalone `UserFeedback` component brings the common page-usefulness prompt into Mangrove for the usual pre-footer position. It ships as a package-root React export and direct hydratable bundle while keeping response storage, analytics and consent product-owned.
- The editorial CTA gains stable hover geometry, logical RTL placement and safe wrapping for long translations. Conventional buttons remain the default for forms, consent and utility actions.
- Chips distinguish navigational links from dismiss actions and add visible removal affordances, logical spacing, focus, reduced-motion and forced-colour support.
- Inline code uses a compact theme-aware surface with clearer monospace typography and coherent decoration across wrapped snippets.
- Storybook's global locale toolbar becomes the canonical translation mechanism; dedicated RTL and long-label stories remain where they test a distinct layout condition.
- `FormAction` ships as a direct ESM component entry, and published component bundles are built against React's production JSX runtime rather than reusing Storybook development transforms.
- Every compiled CSS bundle includes a preserved Mangrove version banner synchronized from `package.json`, making deployed asset versions visible in source and diagnostics.

Alpha.2 has been checked across desktop and mobile layouts, Chromium and Firefox, RTL, long labels, keyboard focus, reduced motion, forced colours and representative UNDRR themes. See the [Experience principles](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-experience-principles--docs) for the design guardrails behind these changes.

### Alpha.3 token pipeline and colour methodology

Alpha.3 is a foundation release. It adds no required integration change. Two system-wide defaults change deliberately, and both are visible to every consumer in every theme: the neutral ramp's surface half is cool-tinted, and the keyboard focus ring is no longer the brand colour.

**Design tokens now have a source.** Brand palettes move from hand-maintained SCSS into [W3C DTCG](https://tr.designtokens.org/) YAML sources under `tokens/`, compiled by `scripts/build-tokens.cjs` into the theme CSS and Sass the library already used. `tokens/mangrove.yaml` is a brand-neutral base and UNDRR is a sub-brand alongside PreventionWeb, IRP, MCR and DELTA, rather than the base being UNDRR itself. The rewrite itself is value-identical: apart from the two deliberate default changes described below, compiled output for all five themes is byte-unchanged. The generator fails the build on an unknown or circular reference, a duplicate output name or a wrong token shape, so a malformed token source cannot silently produce a stylesheet with missing colours. Build output is no longer committed: the generated token partials come out of `yarn scss` and are gitignored, as the compiled theme stylesheets already were, and a Jest `globalSetup` writes any missing partial so `yarn test` works on a fresh clone.

**The neutral ramp's surface half is cool-tinted.** Mangrove's neutrals were pure achromatic greys. An institutional survey of GOV.UK, USWDS, NHS, EU ECL, OCHA Common Design, Primer, Carbon and Atlassian found that every peer tints its neutrals toward cool or toward brand, and named Mangrove's pure `#f2f2f2` and `#808080` as the single largest reason the system read as a generic admin kit rather than an institution — one flat grey carried the header, the hover fill, the menu focus fill, the tag fill, the empty-state panel and every form field. Steps `neutral-25` through `neutral-400` now carry a small cool tint (Oklch hue 247.9°, chroma 0.0039–0.0056, inside the band the peers occupy): `#f2f2f2` → `#f0f3f6`, `#e6e6e6` → `#e4e7ea`, `#cccccc` → `#cacdd0`, `#b3b3b3` → `#b1b4b7`, `#999999` → `#96999c`, `#808080` → `#7e8082`. `neutral-0` stays pure white and `neutral-500` through `neutral-900` — muted text, body text, rules and shadows — are untouched, because the "generic" reading lives on surfaces and tinting the page or the text is a much larger claim than tinting the raised and sunken surfaces above it. One shared cool hue rather than five brand-derived ones: no brand overrides this ramp, `tokens/mangrove.yaml` exists on the premise that it carries no brand identity, and PreventionWeb's teal and MCR2030's purple would pull their greys somewhere muddy; a brand that wants its own tint can still override the six steps in its own token file. No graded contrast pair loses in any theme on either measure — each step is nudged in whichever lightness direction its role needs, so every pair that moves, moves upward. Nothing to do to migrate, but a consuming stylesheet that restates Mangrove's greys as literal hex will now show a seam; read `rgb(var(--mg-color-neutral-25))` instead. Full before/after ramp and contrast tables are in the [changelog](https://github.com/unisdr/undrr-mangrove/blob/main/CHANGELOG.md).

**The focus ring is no longer the brand colour.** `--mg-color-focus-ring` had its own token seam since alpha.1 but was aliased to `--mg-color-interactive` in all five themes, so focus and selection were the same signal — a selected row is painted with the interactive colour at low alpha, and the ring was that same hue at full strength. It now resolves to a new base primitive `--mg-color-gold-800` (`#866200`), shared by every theme, measuring 5.58:1 / 68.7 on the page and 5.01:1 / 62.5 on the tinted field surface under the two graded measures. Public-sector systems near-universally use a non-brand focus colour (GOV.UK `#ffdd00`, NHS `#ffeb3b`, USWDS a `blue-40v` distinct from its link blue); those yellows fail Mangrove's own contract unaided (`#ffdd00` is 1.35:1 on white) because their indicator is two bands, a yellow fill over a near-black bar, and the dark band carries the contrast. `gold-800` keeps the yellow register and takes it down the lightness ramp until one band measures on its own. The focused field's *border* (`--mg-color-form-focus`) deliberately stays brand-coloured: the border says "this field is active", the ring says "the keyboard is here". Forced-colours mode is unaffected — focus indicators already repaint to `CanvasText`. Consumers who want a brand-coloured ring back can set `--mg-color-focus-ring` on `:root` or their theme selector, and then own both graded pairs. See the [changelog](https://github.com/unisdr/undrr-mangrove/blob/main/CHANGELOG.md) for the full before/after table.

**New components.** `StatusLabel` (`.mg-status-label`, with `--draft`, `--published`, `--waiting-validation` and `--waiting-information` variants) and `EmptyState` (`.mg-empty-state`, with `--compact`, `--panel` and `--start` variants) fill gaps that consuming products had each been solving locally.

**A data-visualisation palette with real Sendai semantics.** `--mg-sendai-target-a` through `--mg-sendai-target-g` express the seven Sendai Framework targets. The existing `--sendai-red`, `--sendai-orange`, `--sendai-purple` and `--sendai-turquoise` tokens and their `.mg-u-background-color--sendai-*` and `.mg-u-color--sendai-*` utility classes are **deprecated**: they are brand accent hues named by colour and carry no framework meaning. They keep working unchanged and are scheduled for removal in 2.1. SCSS consumers will see a Sass `@warn` on compile.

**Colour contrast is measured perceptually.** WCAG 2's relative-luminance formula is known to misjudge mid-tone and saturated colours. Mangrove now grades every foreground/background token pair with an [Oklab](https://www.w3.org/TR/css-color-4/#ok-lab)-based perceptual measure alongside the WCAG 2 figure, calibrated so its thresholds line up with the familiar 4.5:1 and 3:1 boundaries. Every pair is graded on both measures, covering every theme, hover and active states and the legacy `.mg-*` components, and fails the build if any pair is passed perceptually while WCAG 2 fails it. Pairs that cannot yet meet the target are recorded as explicit exceptions — 40 against WCAG 2 and 49 against the perceptual measure — rather than being silently excluded. APCA was evaluated and rejected on licensing grounds. The reasoning is in [Colour contrast methodology](https://github.com/unisdr/undrr-mangrove/blob/main/docs/COLOUR-CONTRAST-METHODOLOGY.md).

#### Not yet resolved

These are known and deliberately unfinished in alpha.3:

- Sub-brand tab colours are not wired into the alpha.2 underline tab treatment. The brands designed a filled tab (white on a solid brand background); piping those colours into an underline on a white page measures 1.00:1. Resolving it is a design decision, not a wiring change.
- The accent ramp is the largest remaining accessibility debt and is the reason most of the 40 WCAG exceptions exist. Retuning it is a brand decision.
- Forced-colours behaviour has not been verified in real Windows High Contrast, only in emulation.
- Fourteen focus-outline rules across six component stylesheets still draw from `--mg-color-interactive`, `--mg-color-blue-800` or a local Sass variable rather than `--mg-color-focus-ring`, so they keep a brand-coloured ring: `Gallery`, `Pager`, `Tab`, `Boilerplate`, `Forms/_form-base` and `SyndicationSearchWidget`. Routing them through the token is follow-up work.
- The two-band focus treatment GOV.UK and NHS use is not implemented. A dark anchor band inside a loud ring is what lets a colour like `#ffdd00` carry a 3:1 boundary it cannot carry alone. It needs stylesheet rules, not token values, so the placeholder token that used to sit here was removed rather than shipped unread.

## Find your path

| I am... | Go to... |
|---|---|
| A **base UNDRR** Drupal/CDN consumer, no custom SCSS | [What changed visually](#what-changed-visually) and [the alpha.2 baseline](#alpha2-experience-and-interaction-baseline) |
| A **sub-brand** Drupal/CDN consumer (PW, IRP, MCR, DELTA) | [Sub-brand theming migration](#sub-brand-theming-migration) — add the `mg-theme-*` body class |
| A developer who imports Mangrove SCSS | [Breaking changes](#breaking-changes) |
| A developer who overrides sub-brand tokens | [Sub-brand theming migration](#sub-brand-theming-migration) |
| A developer who uses the **`--sendai-*` accent colours** | [Alpha.3](#alpha3-token-pipeline-and-colour-methodology) — deprecated, replaced by `--mg-sendai-target-a`…`-g` |
| An AI agent or tool reading this for API context | [Token API summary](#token-api-summary) |

## What changed visually

In **alpha.1**, colors and spacing remain visually equivalent for base UNDRR consumers: the values moved from SCSS variables to CSS custom properties, but the compiled `style.css` output is equivalent.

**Alpha.2** intentionally refreshes the presentation and interaction of core components. It introduces softer theme-aware surfaces, clearer focus and hover states, more consistent responsive spacing, joined form actions and stronger multilingual behaviour. Semantic shapes remain component-specific: carousel controls stay circular, chips retain meaningful pill geometry and institutional chrome continues to express its owning theme.

**Alpha.3** changes two things visually, both system-wide and in every theme.

The first is the **neutral ramp**: steps `neutral-25` through `neutral-400` are now cool-tinted rather than pure grey. This is subtle per surface and cumulative across a page — headers, hover and menu-focus fills, tag fills, form fields, table stripes, chart gridlines, the empty-state panel and every rule drawn from those steps shift very slightly toward cool. `neutral-0` (the page) and `neutral-500`–`neutral-900` (muted text, body text, black) are unchanged.

The second is the **keyboard focus ring**, now `--mg-color-gold-800` (`#866200`) in every theme instead of the brand's interactive colour, so focus and selection are no longer the same signal.

Everything else is unchanged — the token rewrite is otherwise value-identical, and the new `StatusLabel` and `EmptyState` styles are additions that no existing component uses. The remaining consumer-visible change is a Sass `@warn` for SCSS consumers still using the deprecated `--sendai-*` accent tokens.

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
