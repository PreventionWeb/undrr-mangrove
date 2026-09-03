# Changelog

Detailed change records live in two places:

- **Project releases**: [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) — library-wide version history.
- **Component changelogs**: Each component's MDX file has a `## Changelog` section with per-component version history. Browse them in [Storybook](https://unisdr.github.io/undrr-mangrove/) or in the `stories/` directory.

For the changelog format specification, see the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs#changelog-format).

This file collects only cross-cutting library-wide notes that don't fit either location above (e.g. repo-wide build / tooling / policy changes).

## Unreleased

_Notable cross-cutting changes between releases land here. Per-component changes belong in the component's MDX changelog._

## 2.0.0 — unreleased

Development releases began with `2.0.0-alpha.1` under the npm `next` dist-tag. See [PR #1061](https://github.com/unisdr/undrr-mangrove/pull/1061) for the first alpha, [PR #1086](https://github.com/unisdr/undrr-mangrove/pull/1086) for alpha.2 and [PR #1080](https://github.com/unisdr/undrr-mangrove/pull/1080) for alpha.3. The [Storybook release notes](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v2-0--docs) cover the complete 2.0 line; the tagged stable GitHub Release link lands with 2.0.0.

### `2.0.0-alpha.3` — unreleased

Proposed in [PR #1080](https://github.com/unisdr/undrr-mangrove/pull/1080). A foundation release: no required integration change, but **two system-wide defaults change deliberately and are visible to every consumer in every theme** — the [neutral ramp's surface half is cool-tinted](#changed-default-the-neutral-ramps-surface-half-is-cool-tinted) and the [keyboard focus ring is no longer the brand colour](#changed-default-the-focus-ring-is-no-longer-the-brand-colour). The token-pipeline rewrite that carries them is itself value-identical: apart from those two changes, compiled output for all five themes is byte-unchanged.

#### Design token pipeline

- Brand palettes move from hand-maintained SCSS to [W3C DTCG](https://tr.designtokens.org/) YAML sources under `tokens/`, compiled by `scripts/build-tokens.cjs` into the theme CSS and Sass the library already consumed.
- `tokens/mangrove.yaml` is a brand-neutral base; UNDRR becomes a sub-brand alongside PreventionWeb, IRP, MCR and DELTA rather than the base itself.
- The generator fails the build on an unknown or circular reference, a duplicate output name, a wrong token shape or a dangling adapter reference, so a malformed source cannot silently emit a stylesheet with missing colours.

#### React Aria Components surface

- Stock `.react-aria-*` classes from [React Aria Components](https://react-spectrum.adobe.com/react-aria/) 1.20 are styled from Mangrove tokens, so React Aria components adopt the active `mg-theme-*` brand with no `className`, wrapper or configuration.
- `aria/react-aria.css` and per-brand `aria/tokens/{brand}.css` are built standalone for consumers who do not load Mangrove's full stylesheet. Token files are wrapped in `:where(:root)` so Mangrove's own palette wins when both are present, regardless of load order. **Not distributed yet:** `aria/` is not copied into `dist/` or the published package, and the published `package.json` is regenerated without an `exports` field.
- The surface ships **unlayered**, and no `@layer`-wrapped flavour is built. Because the same rules are also compiled unlayered into every theme stylesheet, a layered copy could not outrank them — see `docs/CASCADE-LAYERS.md` for why, and for what would have to change first.
- **Known:** the surface also compiles into `style.css`, so it currently reaches every consumer — roughly 59 KB of a 355 KB stylesheet, comment-stripped. Making it opt-in is unresolved.

#### Components and tokens

- New `StatusLabel` (`.mg-status-label`) with `--draft`, `--published`, `--waiting-validation` and `--waiting-information` variants.
- New `EmptyState` (`.mg-empty-state`) with `--compact`, `--panel` and `--start` variants.
- New data-visualisation palette, including `--mg-sendai-target-a` through `--mg-sendai-target-g` for the seven Sendai Framework targets.

#### Changed default: the neutral ramp's surface half is cool-tinted

**Every component in every theme is affected.** Steps `neutral-25` through `neutral-400` gain a small cool tint. `neutral-0` and `neutral-500` through `neutral-900` are unchanged.

Mangrove's neutrals were pure achromatic greys. An institutional survey of GOV.UK, USWDS, NHS, EU ECL, OCHA Common Design, Primer, Carbon and Atlassian found that every peer tints its neutrals toward cool or toward brand, and identified Mangrove's pure greys as the single largest reason the system read as a generic admin kit rather than an institution. One flat grey was doing most of the visual work: the site header, the hover fill, the menu focus fill, the tag fill, the empty-state panel and every form field all resolve to `neutral-25`.

| Token | Before | After | Oklch before | Oklch after |
|---|---|---|---|---|
| `--mg-color-neutral-0` | `#ffffff` | *unchanged* | `L 1.0000 C 0` | — |
| `--mg-color-neutral-25` | `#f2f2f2` | `#f0f3f6` | `L 0.9612 C 0` | `L 0.9627 C 0.0051 H 247.9` |
| `--mg-color-neutral-50` | `#e6e6e6` | `#e4e7ea` | `L 0.9249 C 0` | `L 0.9265 C 0.0052 H 247.9` |
| `--mg-color-neutral-100` | `#cccccc` | `#cacdd0` | `L 0.8452 C 0` | `L 0.8469 C 0.0053 H 247.9` |
| `--mg-color-neutral-200` | `#b3b3b3` | `#b1b4b7` | `L 0.7668 C 0` | `L 0.7684 C 0.0054 H 247.9` |
| `--mg-color-neutral-300` | `#999999` | `#96999c` | `L 0.6830 C 0` | `L 0.6814 C 0.0056 H 247.9` |
| `--mg-color-neutral-400` | `#808080` | `#7e8082` | `L 0.5999 C 0` | `L 0.5988 C 0.0039 H 247.9` |
| `--mg-color-neutral-500` | `#666666` | *unchanged* | `L 0.5103 C 0` | — |
| `--mg-color-neutral-600` | `#4d4d4d` | *unchanged* | `L 0.4202 C 0` | — |
| `--mg-color-neutral-700` | `#333333` | *unchanged* | `L 0.3211 C 0` | — |
| `--mg-color-neutral-800` | `#1a1a1a` | *unchanged* | `L 0.2178 C 0` | — |
| `--mg-color-neutral-900` | `#000000` | *unchanged* | `L 0 C 0` | — |

Four decisions, each deliberate:

- **Only the surface half moves.** The "generic" reading lives on surfaces. The dark half is body text (`neutral-800`), muted text (`neutral-500`), rules and shadows, where a hue shift buys nothing and every text contrast ratio in the system would have to be re-argued. GOV.UK draws the same line: tinted background, near-black text. Primer tints both; we did not follow it there.
- **`neutral-0` stays pure white.** The page is the floor every translucent token composites onto, and tinting it is a far larger claim than tinting the raised and sunken surfaces above it. Primer's `canvas-default` and GOV.UK's page background are both plain white.
- **One shared cool hue, not five brand-derived ones.** No brand overrides this ramp today, and `tokens/mangrove.yaml` exists on the premise that the ramp carries no brand identity — a Mangrove adopted without UNDRR branding still gets it. PreventionWeb's teal (195°) and MCR2030's purple (323°) would also pull their greys somewhere muddy. A brand that wants its own tint can still override these six steps in its own token file; the mechanism is unchanged, only the default moved.
- **Restrained.** Oklch hue 247.9° at chroma 0.0039–0.0056 — 247.9° is the hue of Primer's `bgColor-muted`, and the chroma sits inside the peer band (Atlassian `#f4f5f7` 0.0029, Primer `#f6f8fa` 0.0034, NHS `#f0f4f5` 0.0045, OCHA `#e6ecf1` 0.0093). Below the level at which a tint reads as a colour rather than as a refinement.

**Contrast: no pair loses, in any theme, on either measure.** The Oklab measure is lightness-only, so hue alone would not move it, but WCAG 2's luminance does move with hue — and it moved *downward* on a muted-text pair with only 0.25 of perceptual headroom. So each step is nudged in whichever lightness direction its role needs: the four surface steps (25–200), always the lighter half of a pair, go up by at most 0.0017 in Oklch L; the two mark steps (300, 400), always the darker half, go down by at most 0.0016. Every graded pair that moves, moves upward. Figures are identical in all five themes because no brand overrides any of these tokens (WCAG 2 ratio / Oklab perceptual score):

| Pair | Minimum | Before | After |
|---|---|---|---|
| `color-muted-text` on `color-field-surface` | 4.5 / 63 | 5.13 / 63.2 | **5.16 / 63.5** |
| `color-border` on `color-surface` | 3 / 50 | 3.95 / 59.1 | **3.96 / 59.2** |
| `color-border` on `color-field-surface` | 3 / 50 | 3.53 / 52.2 | **3.56 / 52.6** |
| `color-focus-ring` on `color-field-surface` | 3 / 50 | 4.99 / 62.2 | **5.01 / 62.5** |
| `color-accent` on `color-track` (UNDRR, DELTA) | 3 / 50 | 6.66 / 66.3 | **6.69 / 66.6** |
| `color-accent` on `color-track` (PreventionWeb) | 3 / 50 | 5.20 / 61.4 | **5.23 / 61.7** |
| `color-accent` on `color-track` (IRP) | 3 / 50 | 3.77 / 51.6 | **3.79 / 51.8** |
| `color-accent` on `color-track` (MCR2030) | 3 / 50 | 9.64 / 73.2 | **9.69 / 73.4** |
| `color-fill` on `color-track` | 3 / 50 | as `color-accent` above | as `color-accent` above |

`color-fill` on `color-surface`, `color-text` on `color-surface`, `color-muted-text` on `color-surface` and `color-focus-ring` on `color-surface` are **unmoved**, because `color-surface` resolves to `neutral-0` and `neutral-0` did not change. That covers the tightest pair in the system — IRP's slider and meter fill against the page at 4.71 / 64.6, whose rails lost their borders in alpha.2 — which is exactly why `neutral-0` was left alone.

**Migration.** Nothing to do. Consumers who match Mangrove's greys in their own CSS (a Drupal child theme painting `#f2f2f2` behind a region, for example) will see a seam where their grey meets a Mangrove surface; the fix is to read `rgb(var(--mg-color-neutral-25))` instead of restating the hex. A consumer or brand that wants the achromatic ramp back can restore all six steps on `:root` or on its theme selector, and then owns the graded pairs above.

**Deliberately not retinted.** The data-visualisation Sendai target A series (`--mg-dataviz-sendai-a-*`) is a categorical *data* ramp read off the design file and stays achromatic — moving a categorical data colour changes what a reader decodes from a chart. Chart chrome (`--mg-dataviz-gridline`, `--mg-dataviz-axis`) does follow the neutral ramp and is tinted, so chrome and target A read fractionally differently side by side. That is intended.

#### Changed default: the focus ring is no longer the brand colour

`--mg-color-focus-ring` was aliased to `--mg-color-interactive` in every theme, so the keyboard focus ring and the selection cue were the same signal: `--mg-aria-color-selected-surface` is the interactive colour at 12% and the ring was the same hue at full strength. A focused row in a selected state said one thing twice.

It now resolves to a new base primitive, `--mg-color-gold-800` (`#866200`, emitted as `134 98 0`), shared by all five themes:

| Token | Before | After |
|---|---|---|
| `--mg-color-focus-ring` | `var(--mg-color-interactive)` | `var(--mg-color-gold-800)` |
| `--mg-color-gold-800` | — | `134 98 0` |

Measured against both graded backgrounds, in all five themes (both backgrounds are theme-invariant today), as WCAG 2 ratio / Oklab perceptual score against a non-text floor of 3:1 and 50:

| Pair | Before (UNDRR / PW / IRP / MCR / DELTA) | After (all five) |
|---|---|---|
| ring on `--mg-aria-color-surface` (`#ffffff`) | 8.31 / 78.3 · 6.49 / 73.7 · 4.71 / 64.6 · 12.03 / 84.7 · 8.31 / 78.3 | 5.58 / 68.7 |
| ring on `--mg-aria-color-field-surface` (`#f2f2f2`, now `#f0f3f6`) | 7.42 / 72.1 · 5.79 / 67.4 · 4.21 / 57.9 · 10.75 / 78.8 · 7.42 / 72.1 | 4.99 / 62.2, and 5.01 / 62.5 once the neutral tint above lands |

A deliberately non-brand focus colour is near-universal in public-sector design systems (GOV.UK `#ffdd00`, NHS `#ffeb3b`, USWDS a `blue-40v` distinct from its link blue). Those systems' yellows cannot be used unaided here: `#ffdd00` is 1.35:1 on the raised surface and 1.20:1 on the field surface, scoring 5.3 and −6.6 perceptually. They work because their indicator is two bands — a yellow fill over a near-black bar — and the dark band carries the contrast. `gold-800` keeps the yellow register and takes it down the lightness ramp until a single band measures on its own.

**Migration.** Nothing to do unless you depend on the ring being brand-coloured. If you do, set `--mg-color-focus-ring` on `:root` or on your theme selector; a theme that overrides it owns both graded pairs above. `--mg-color-form-focus`, which drives the focused field's *border* (`--mg-aria-color-border-focus`), is unchanged and stays brand-coloured on purpose: the border says "this field is active", the ring says "the keyboard is here". Forced-colours mode is unaffected — focus indicators are already repainted to `CanvasText`.

**Not yet covered.** Fourteen focus-outline rules across six component stylesheets draw from `--mg-color-interactive`, `--mg-color-blue-800` or a local Sass variable instead of `--mg-color-focus-ring`, so they keep a brand-coloured ring: `Gallery` (4 rules), `SyndicationSearchWidget` (6, `$search-primary`), `Pager`, `Tab`, `Boilerplate` and `Forms/_form-base` (`blue-800`). Routing those through the token is follow-up work.

#### Deprecated: `--sendai-*` accent colours

`--sendai-red`, `--sendai-orange`, `--sendai-purple` and `--sendai-turquoise`, and the matching `.mg-u-background-color--sendai-*` and `.mg-u-color--sendai-*` utility classes, are deprecated. They are brand accent hues named by colour and carry no Sendai Framework meaning. Use `--mg-sendai-target-a` through `-g` for target semantics. They continue to work unchanged; SCSS consumers see a Sass `@warn` on compile. Scheduled for removal in 2.1.

#### Colour contrast methodology

- Token pairs are now graded with an [Oklab](https://www.w3.org/TR/css-color-4/#ok-lab)-based perceptual measure alongside WCAG 2's relative-luminance figure, calibrated so its thresholds align with the familiar 4.5:1 and 3:1 boundaries.
- Every foreground/background token pair is graded on both measures, covering every theme, hover and active states and the legacy `.mg-*` components, and fails if any pair passes perceptually while WCAG 2 fails it. Pairs that cannot yet meet the target are recorded as explicit exceptions — 48 against WCAG 2, 59 against the perceptual measure.
- APCA was evaluated and rejected on licensing grounds. Reasoning in `docs/COLOUR-CONTRAST-METHODOLOGY.md`.

### `2.0.0-alpha.2` — 2026-09-01

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-alpha.2) for the curated release summary once the manual release is published.

[PR #1086](https://github.com/unisdr/undrr-mangrove/pull/1086) establishes the second 2.0 alpha baseline across Mangrove's component surfaces and interactions while preserving Drupal hydration contracts, theme ownership and existing BEM APIs except for the intentionally retired Pagination component.

#### Visual foundations and interaction

- Shared surface, border, shadow, radius, focus and reduced-motion tokens now provide a consistent foundation without forcing every component into the same shape.
- Buttons, form controls, cards, hero compositions, tabs, disclosures, menus, on-page navigation, tables, Pager, ScrollContainer and Text CTA receive coordinated responsive and interaction refinements.
- The opt-in editorial CTA adds a compact directional badge with stable hover geometry, logical RTL placement and safe wrapping for long translated labels. Conventional buttons remain the default for forms, consent and utility actions.
- Chips distinguish navigational links from dismiss actions and add logical RTL spacing, visible removal affordances, keyboard focus, reduced-motion and forced-colour support.
- Inline code now uses a compact theme-aware technical surface with clearer monospace typography and resilient wrapped-line decoration.

#### Components and compositions

- New `FormAction` composition joins a field and its key action for search, subscription and select-and-continue flows, with React and vanilla HTML examples, accessible help/error wiring, RTL support and optional mobile stacking.
- New standalone `UserFeedback` component distils the UNDRR microsites page-usefulness pattern for the common pre-footer position, with a package-root React export, direct hydratable component bundle, product-owned response handling, seven toolbar locales and accessible confirmation focus.
- Vertical, horizontal, book, icon and stats cards receive theme-aware presentation refinements. Vertical-card media now fills its frame consistently without changing the intentional sizing of book, horizontal or icon variants.
- The Storybook introduction and Component Laboratory demonstrate production component compositions, responsive collections, deterministic syndicated-search states, forms and data-rich examples. Landing-page showcase cards now link to relevant library guidance and stories.

#### Accessibility, internationalization and verification

- Logical properties, focus states, target sizing, reduced motion, forced colours, narrow layouts, RTL and long translations are covered across representative components and themes.
- Storybook's global locale toolbar is the canonical translation mechanism. Redundant per-language story groups are removed; dedicated RTL and long-label stories remain only where they exercise a distinct layout or interaction condition.
- Component guidance and changelogs, the Experience principles, contribution guidance and AI manifest examples are synchronized with the updated markup and public classes.

#### Build and packaging

- `FormAction` now ships as a direct `components/FormAction.js` ESM entry as well as SCSS and the package-root export.
- Production component bundles use isolated, uncached Babel output so Storybook's development `jsxDEV` transform cannot leak into published files. Manifest validation now rejects any production component bundle containing development JSX runtime calls.
- Compiled CSS banners now identify the exact Mangrove package version, synchronized from `package.json` before every Sass build.
- The Yarn lockfile is synchronized with the first-alpha dependency removals so immutable installs succeed from the release commit.

#### Removed: deprecated Pagination component

The deprecated `Pagination` component, its stories and documentation are removed. Use `Pager`, which is the supported 2.0 pagination pattern.

### Breaking: CSS custom properties replace SCSS variable theming API

Color and spacing tokens are now CSS custom properties on `:root`. The SCSS backward-compat aliases (`$mg-color-*`, `$mg-spacing-*`) are removed. All component stylesheets use `var(--mg-color-*)` and `var(--mg-spacing-*)` internally.

**Palette format:** colors use space-separated RGB channels (`--mg-color-blue-900: 0 79 145`) so alpha compositing is available without twin variables: `rgb(var(--mg-color-blue-900) / 0.5)`.

**Consumer migration:**

- Replace `$mg-color-*` and `$mg-spacing-*` SCSS variable references with the equivalent CSS custom property: `$mg-color-interactive` becomes `var(--mg-color-interactive)`, etc.
- Anywhere you used `rgba($mg-color-X, 0.N)`, use `rgb(var(--mg-color-X) / 0.N)` instead.
- SCSS variables that remain (BUILD-TIME ONLY — `@media` queries, font sizes, font families, `$mg-html-font-size`, `$mg-tabs-border-bottom`): no change required.

### Breaking: sub-brand theming moves from SCSS `!default` to CSS custom property selector blocks

The `_variables-irp.scss`, `_variables-preventionweb.scss`, `_variables-delta.scss`, and `_variables-mcr.scss` files are deleted. Each is replaced by a `_theme-{name}.scss` file containing a `.mg-theme-{name} { }` selector block that overrides CSS custom properties at runtime.

**Consumer migration:**

- Replace `@import "./variables-{name}"` with `@import "./theme-{name}"` in custom entry-point SCSS files.
- Apply the `.mg-theme-{name}` class to `<body>` or a wrapping element at runtime instead of relying on SCSS compile-time overrides.
- SCSS `$mg-color-* !default` overrides in downstream stylesheets no longer take effect for color/spacing tokens; move those overrides to CSS custom properties inside `.mg-theme-{name} { }`.

### Breaking: `hero.scss` variant colour map

The `$variant-colour-props` map in `hero.scss` now stores CSS custom property name strings (`"--mg-color-orange-800"`) rather than resolved SCSS color values. Consumers that previously overrode `$mg-color-hero--secondary !default` must switch to overriding the relevant `--mg-color-*` custom property on `:root`.

### Removed: `storybook-design-token` plugin

The `storybook-design-token` npm package is removed. The Design decisions/Colors, Spacing, Widths, Breakpoints, and Typography Storybook pages now render token values directly from `getComputedStyle` (for CSS custom properties) or as static tables (for build-time SCSS tokens). (#1061)

### Removed: legacy 10px root

The `style-legacy.scss`, `style-preventionweb-legacy.scss`, `style-irp-legacy.scss`, and `style-mcr-legacy.scss` entry points (and their compiled `*-legacy.css` builds) are removed, and `$mg-html-font-size` is fixed at `16` (the `!default` override is gone). Mangrove 2.0 assumes a browser-standard 16px document root. Consumers on the old 10px root must move to a 16px root and convert their own rem-based CSS from a 10px to a 16px basis. See [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md) breaking change #5. (#1061)

## 1.8.2 — 2026-08-27

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.2) for full details.

### Features

- **Grid layout extended to 12 columns with an auto-fit fallback.** Numbered column classes now cover `col-7`–`col-12`, and a new `.mg-grid--auto-fit` modifier lays any larger item count out in a single row. Fixes StatsCard collapsing to a stacked single column past 6 stats. ([#1081](https://github.com/unisdr/undrr-mangrove/pull/1081))

### Bug fixes

- **Card z-index no longer conflicts with the mega menu.** Cards no longer overlap the open mega-menu overlay. ([#1075](https://github.com/unisdr/undrr-mangrove/pull/1075))
- **Syndication search strips hidden teaser fields.** Hidden teaser fields are now removed programmatically from the React search output. ([#1077](https://github.com/unisdr/undrr-mangrove/pull/1077))

### Build & tooling

- Major toolchain upgrades: Babel 8, `sass-loader` 17, and `jest-axe` 11. ([#1083](https://github.com/unisdr/undrr-mangrove/pull/1083))
- Storybook to 10.5.10, React to 19.2.8, PostCSS to 8.5.26, and a roundup of patch and minor dependency updates. ([#1078](https://github.com/unisdr/undrr-mangrove/pull/1078), [#1082](https://github.com/unisdr/undrr-mangrove/pull/1082), [#1071](https://github.com/unisdr/undrr-mangrove/pull/1071))

## 1.8.1 — 2026-07-06

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.1) for full details.

### Bug fixes

- **Syndication search organization routing.** Organization results now always resolve to PreventionWeb instead of whichever domain appears first in `field_domain_access`, fixing incorrect organization links in multi-domain index data. ([#1066](https://github.com/unisdr/undrr-mangrove/pull/1066))

### Security

- **DOMPurify patched to 3.4.11.** Security dependency update merged as part of patch release maintenance. ([#1051](https://github.com/unisdr/undrr-mangrove/pull/1051))

### Build & tooling

- Dependency maintenance updates: `chromaui/action` v17, `actions/checkout` v7, `serialize-javascript` v7.0.6, `babel-plugin-polyfill-corejs3` v1, Yarn v4.17.0, `autoprefixer` v10.5.2, and `postcss` v8.5.16. ([#1042](https://github.com/unisdr/undrr-mangrove/pull/1042), [#1059](https://github.com/unisdr/undrr-mangrove/pull/1059), [#1062](https://github.com/unisdr/undrr-mangrove/pull/1062), [#1063](https://github.com/unisdr/undrr-mangrove/pull/1063), [#1065](https://github.com/unisdr/undrr-mangrove/pull/1065), [#1067](https://github.com/unisdr/undrr-mangrove/pull/1067), [#1068](https://github.com/unisdr/undrr-mangrove/pull/1068), [#1069](https://github.com/unisdr/undrr-mangrove/pull/1069))

### Documentation

- Added Drupal hydration wrapper integration guidance to `README.md` and expanded release-writing guidance in `docs/RELEASES.md` (curated, themed GitHub Release notes format). ([#1016](https://github.com/unisdr/undrr-mangrove/pull/1016))

## 1.8.0 — 2026-06-19

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.0) for full details.

### Security

- **Dependency update cooldown.** Renovate now waits until a release is at least 7 days old before it proposes the update (`minimumReleaseAge: "7 days"` with `internalChecksFilter: "strict"`), so a compromised package version that gets detected and unpublished within its first days never reaches a pull request here. Security advisories (`vulnerabilityAlerts`) are exempt, so genuine fixes are not delayed. Dependabot is retired and Renovate is now the sole dependency bot, which also ends the duplicate update PRs. A separate spike tracks evaluating pnpm for its scripts-off-by-default behaviour (#1038). (#1039)

### Removed

- **D3 chart components, `MapComponent`, and `Fetcher` removed.** The npm exports `BarChart`, `MapComponent`, and `Fetcher` are no longer published. The internal-only Storybook stories `Histogram`, `IndexChart`, and `ConnectedScatterplot` are also removed. D3 and Leaflet packages are dropped from the dependency tree. Migrate charting to [Recharts](https://recharts.org/), mapping to [MAPX](https://mapx.org/), and data loading to [react-query](https://tanstack.com/query) / [SWR](https://swr.vercel.app/) or server-side load. ([#1011](https://github.com/unisdr/undrr-mangrove/issues/1011))

## 1.7.0 — 2026-05-11

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.7.0) for full details.

### Runtime

- **Node.js 22 is now the declared minimum** (Node 20 reached EOL on 2026-04-30). `engines.node` set to `>=22.0.0`. CI and Docker continue to run Node 24. `.nvmrc` added so `nvm use` picks the CI-pinned version. (#1003)

### Build & tooling

- TypeScript 5 → 6, ESLint 9 → 10 majors (#977).
- React 19.2.5 → 19.2.6 (#991).
- Yarn 4.14.1 (#952).
- Batch dep updates: `jest` 30.4.x monorepo (#997), `typescript-eslint` 8.59.2 (#993), `@babel/preset-env` 7.29.5 (#961), `stylelint` ~17.11.0 (#937), `globals` 17.6.0 (#964), `sass-loader` 16.0.8 (#990), plus batched minor/patch (#960, #984).

### Security

- Patched 17 Dependabot security alerts via yarn resolutions (#978).
- Patched `brace-expansion` ReDoS via resolution (#979).

### Code quality

- New `react-doctor` component-quality linter codified as a project convention. Health score moved 57 → 68 across the sweep, with 66 of the original 398 findings cleared. (#985, #987, #988, #989, #996.)
- House conventions for component authors documented in `docs/AI-CODING-AGENTS.md`: no em-dashes or three-period ellipses in JSX text; prefer `use()` over `useContext()` on React 19+; hoist default `[]` / `{}` props to module-level constants; no inline render helpers (extract as named subcomponents); lazy `useState` init; effect cleanup discipline; per-call-site triage for `dangerouslySetInnerHTML` (inline DOMPurify vs documented caller contract). (#992)
- React Doctor health badge added to `README.md` and the Storybook _Introduction_ page. The badge is a manually-refreshed periodic snapshot — see `docs/AI-CODING-AGENTS.md#refreshing-the-score-badge`. (#992, #996.)
- **Consumer-visible API note:** `Component.defaultProps` has been removed from `FooterIcons`, `FooterConditions`, `FooterConditions2`, `FooterLists`, `Link`, and `ScrollContainer`. React 19 deprecates `defaultProps` on function components; the defaults are now declared via destructured parameters, so component behaviour is unchanged. Only consumers that read `Component.defaultProps` for introspection (rare) need to adjust. (#985, #988)
- `useContext(SearchContext)` swapped to React 19's `use(SearchContext)` in `SyndicationSearchWidget` (#988). Internal change; identical behaviour at top-level call sites.

### Documentation

- `docs/AI-CODING-AGENTS.md` extended with the _Component quality checks with react-doctor_ section (above), linked from `CONTRIBUTING.md`, `docs/DEVELOPMENT.md`, and `docs/REVIEW-CHECKLIST.md`. (#992)
- Tracking issue [#986](https://github.com/unisdr/undrr-mangrove/issues/986) documents the remaining `react-doctor` work, organised into risk buckets for future sweeps.
