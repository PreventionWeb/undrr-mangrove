# Changelog

Detailed change records live in two places:

- **Project releases**: [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) — library-wide version history.
- **Component changelogs**: Each component's MDX file has a `## Changelog` section with per-component version history. Browse them in [Storybook](https://unisdr.github.io/undrr-mangrove/) or in the `stories/` directory.

For the changelog format specification, see the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs#changelog-format).

This file collects only cross-cutting library-wide notes that don't fit either location above (e.g. repo-wide build / tooling / policy changes).

## Unreleased

_Notable cross-cutting changes between releases land here. Per-component changes belong in the component's MDX changelog._

## 2.0.0 — unreleased

Development releases began with `2.0.0-alpha.1` under the npm `next` dist-tag. See [PR #1061](https://github.com/unisdr/undrr-mangrove/pull/1061) for the first alpha and [PR #1086](https://github.com/unisdr/undrr-mangrove/pull/1086) for alpha.2. The [Storybook release notes](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v2-0--docs) cover the complete 2.0 line; the tagged stable GitHub Release link lands with 2.0.0.

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
