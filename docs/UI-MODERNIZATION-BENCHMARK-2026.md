# Mangrove UI modernization benchmark (2026)

Prepared for: UNDRR Mangrove component library  
Branch/worktree: `research/mangrove-design-benchmark` in `.worktrees/mangrove-research`

## Executive summary

1. Mangrove’s core architecture (BEM + multi-theme CSS distributions) is still a strong institutional pattern and aligns with proven systems (EU ECL, GOV.UK, USWDS), but its visual expression needs a refresh layer rather than a rewrite.
2. Compared with UNDP, UNEP/UN.org, UNHCR, and World Bank, the likely perception gap is less about component availability and more about typography rhythm, spacing scale, imagery treatment, and interaction polish.
3. Fast wins should focus on tokens, type scale, card/header density, hover/focus motion, and navigation affordances while preserving WCAG 2.2 AA and multilingual robustness.
4. The best path is a “modernization shell”: keep semantic component contracts stable, introduce refreshed design tokens + variant themes, then migrate high-traffic components first.
5. A dated look can be corrected in one release cycle (6-12 weeks) if the team treats this as a design-system program with measurable gates (a11y, visual regression, and task-based UX heuristics).

## Comparative matrix

> **Note:** The matrix combines direct homepage metadata/markup observations (where fetchable) and institutional design-system references. Two sites (UNDP, UNHCR) blocked direct fetch in this environment (HTTP 403), so those rows use secondary public documentation and observed ecosystem patterns.

| Organization | Visual style maturity | Homepage IA pattern | Navigation & discovery | Card/content modules | Accessibility maturity signals | Perceived modernity (1-10) |
|---|---|---|---|---|---|---|
| **UNDP** | Strong branded, contemporary, design-system-led | Hero + campaign/feature modules + story/program cards | Persistent global nav, strong sectioning, search-centric discovery | Modular cards with clear editorial hierarchy | Public design system + Storybook practices; mature component governance | **8.5** – cohesive type/image system and stronger visual rhythm |
| **UNEP** | Institutional-modern hybrid | Mission framing + thematic content panels | Conventional top nav with language/global UN patterns | Card grids for content and campaigns | UN web standards alignment + multilingual accessibility baseline | **7.5** – modern in structure, conservative in interaction polish |
| **UN.org** | Standards-first institutional design | Language-first entry + global UN content hubs | Multilingual gateway is primary discovery affordance | Utility-oriented content modules | Explicit UN web guidelines and accessibility framing | **7.0** – robust but intentionally conservative |
| **UNHCR** | Editorially modern humanitarian style | Story-led, campaign + emergency + donation pathways | Action-oriented top-level navigation, strong CTA paths | High-contrast cards/tiles, image-heavy modules | Mature public-sector nonprofit accessibility expectations | **8.0** – stronger emotional storytelling + conversion clarity |
| **World Bank** | Highly modern enterprise-public blend | Large-scale portal with featured insights + data/news streams | Deep navigation + search action patterns + language variants | Rich module system with varied media/data cards | Structured metadata, multilanguage links, large ecosystem standards | **8.5** – advanced information layering and modern media treatment |
| **UNDRR / PreventionWeb** | Content-strong, visually conservative | Knowledge/event/report-first architecture | Discovery-heavy but can feel dense under navigation/content load | Functional modules that prioritize information density | Mangrove docs explicitly target WCAG 2.2 AA | **6.5** – credible and useful, but lower visual freshness vs peers |

## What likely reads as “dated” in Mangrove (hypotheses)

These are **hypotheses** inferred from repository context and common public-sector UX patterns; validate with screenshot-based audits before implementation.

1. **Typography cadence may be too flat**: older heading/body ratios and line-height rhythm can reduce perceived sophistication even when content is clear.
2. **Spacing and density likely favor legacy desktop layouts**: tighter stacks and uneven vertical rhythm create visual fatigue on long pages.
3. **Card hierarchy may be under-signaled**: if cards have weak elevation/state differentiation, scanning feels harder than on newer peers.
4. **Navigation affordance may be functional but not progressive**: modern peers increasingly improve wayfinding with clearer active states, grouped tasks, and intent-driven labels.
5. **Imagery treatment may be inconsistent**: mixed aspect ratios, limited art direction rules, and weak caption/metadata hierarchy can make pages feel older.
6. **Micro-interaction layer may be minimal**: missing or abrupt transitions, conservative hover/focus treatments, and little motion hierarchy can feel static.
7. **Theme token expression may lag contemporary semantic tokens**: if themes rely heavily on raw values instead of semantic intent tokens, refresh velocity slows.

## Modernization roadmap

### 0-30 days: quick wins (low risk, high perception lift)

1. **Tokenize visual rhythm first**: define/normalize semantic tokens for `font-size`, `line-height`, spacing, radius, border, shadow, and motion durations/easing while retaining existing theme outputs.
2. **Refresh top typography primitives**: modernize display/heading/body scales and clamp behavior for responsive readability.
3. **Upgrade interactive states globally**: consistent hover/focus/active patterns; retain strong visible focus per WCAG 2.2 AA.
4. **Card polish pass**: improve title hierarchy, spacing, metadata contrast, and state affordances on the top 3 most-used card variants.
5. **Navigation clarity tweaks**: increase active-state salience, simplify first-level labels, and tighten mobile menu spacing/hit targets.

### 1-3 months: structural improvements

1. **Component modernization sprint set**: prioritize `Header/Nav`, `Hero`, `Card`, `Teaser/List`, and `Footer` as a visual system cluster.
2. **Content layout primitives**: standardize section wrappers and grid/stack primitives to improve consistency across pages and themes.
3. **Imagery ruleset**: define canonical aspect ratios, crop guidance, focal-safe zones, and caption/meta patterns.
4. **Editorial hierarchy patterns**: ship reusable “homepage bands” (feature, insight, event, report, CTA strip) with explicit IA guidance.
5. **Multilingual quality pass**: stress-test type wraps, nav labels, and card heights across long-language strings.

### 3-6 months: system-level investments

1. **Full semantic token architecture**: move toward global → alias → component token layering, mapped to current theme files.
2. **Theme quality contracts**: codify each theme’s contrast/motion/spacing requirements with automated checks.
3. **Design-ops integration**: align Figma tokens and code tokens with change governance and release notes per component family.
4. **Usage telemetry loop**: add low-risk UX instrumentation (component exposure/click depth/search success proxies) to guide future refinements.
5. **Pattern governance**: formalize deprecation policy and migration recipes for outdated component variants.

## Implementation setup recommendations for this repository

### Storybook workflow updates

1. Add a **“Modernization” Storybook section** for side-by-side legacy vs refreshed component stories.
2. Add standardized **viewport and content-stress stories** (long titles, translated strings, dense metadata).
3. Keep/expand visual regression via existing Chromatic workflow and require review for token or foundational component changes.
4. Add a curated **“homepage composition” story set** to preview IA blocks in realistic sequence, not only isolated components.

### Token strategy compatible with Mangrove architecture

1. Preserve current multi-theme distribution model; do **not** break shared markup contracts.
2. Introduce semantic tokens first (e.g., `--mg-color-surface-primary`, `--mg-space-section-lg`, `--mg-text-heading-2`) mapped to existing per-theme values.
3. Phase out hard-coded per-component values where a semantic token exists.
4. Add a token fallback policy so older consumers continue rendering during migration.

### Components to refresh first

1. **Header / global navigation** (highest perceived freshness impact).
2. **Hero / featured content modules** (first-impression area).
3. **Core card family** (repeated across list/report/event pages).
4. **Search/filter/result list shells** (critical for PreventionWeb-style discovery journeys).
5. **Footer and utility rails** (trust, discoverability, and global consistency).

### Validation approach (a11y + visual + UX)

1. **Accessibility:** enforce WCAG 2.2 AA gates already documented in `docs/ACCESSIBILITY.md`; include keyboard-only and focus-order checks for nav/card interactions.
2. **Visual regression:** use existing Chromatic pipeline; require baseline approvals for token and component family updates.
3. **UX heuristics:** run a fixed checklist per release (scanability, hierarchy clarity, CTA salience, search/findability, mobile thumb reach, multilingual robustness).
4. **Performance guardrails:** set practical thresholds for component/page composition stories (image payload discipline, layout stability, interaction readiness).

## Risks and tradeoffs (avoid over-modernization)

1. **Brand drift risk:** over-indexing on trendy UI motifs can weaken UN institutional trust cues.
2. **Accessibility regression risk:** subtle/low-contrast aesthetics and motion-heavy patterns can violate WCAG intent.
3. **Consumer breakage risk:** changing markup contracts instead of token/style layers would disrupt downstream non-React integrations.
4. **Content discoverability risk:** visual simplification that hides metadata harms PreventionWeb’s knowledge use cases.
5. **Governance risk:** introducing new styles without deprecating old variants increases entropy and perceived inconsistency.

## Definition of done for first modernization release

- [ ] New semantic token layer shipped across all active themes without markup-breaking changes.
- [ ] Header, Hero, and core Card variants refreshed and documented with migration notes.
- [ ] Storybook includes modernization comparison stories and multilingual stress cases.
- [ ] Chromatic baselines updated with explicit review sign-off for foundational components.
- [ ] WCAG 2.2 AA checks pass for updated components (keyboard, focus visibility, contrast, semantics).
- [ ] Mobile layouts validated for top homepage/discovery compositions at key breakpoints.
- [ ] “Before/after” screenshots and rationale documented for stakeholders.
- [ ] Release notes include what changed, what stayed stable, and downstream integration impact.

## References

- UNDRR Mangrove docs: `README.md`, `docs/ACCESSIBILITY.md`, `docs/DESIGN-SYSTEM-RESEARCH.md`
- UN Web Guidelines: https://www.un.org/en/webguidelines/design.shtml
- UN Web Style Guide: https://www.un.org/styleguide/
- World Bank homepage metadata/markup: https://www.worldbank.org/ext/en/home
- USWDS (public-sector benchmark): https://designsystem.digital.gov/
- GOV.UK Design System: https://design-system.service.gov.uk/
- Europa Component Library (ECL): https://ec.europa.eu/component-library/
- UNDP design system references: https://design.undp.org/ and https://github.com/undp/design-system

