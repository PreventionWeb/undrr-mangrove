# React Aria integration: architecture notes and decision record

Working notes from the PR #1080 spike and the reconciliation work that followed.
This is a thinking document, not a specification. It records what was decided,
what was measured, what turned out to be wrong, and what is still open, so that
whoever picks this up can see the reasoning rather than just the diff.

Status: in progress. Nothing here is a commitment.

Every factual claim below was independently verified against the repository and,
where relevant, re-measured in a browser. That pass found four wrong claims and
three imprecise ones, all since corrected. Where something remains unverified it
says so.

---

## 1. The question this work is actually answering

Two different questions have been running together, and separating them is most
of the value:

1. **Can Mangrove style React Aria components and re-theme them by swapping a
   CSS file?** The spike answers yes, in detail.
2. **Can DELTA, and the next product after it, share brand with the estate
   without sharing a component suite?** This is the question the organisation is
   asking, and the spike only partly addresses it.

Most of the disagreement in this workstream comes from people answering
different ones of these in the same conversation.

### The organisational context

- Mangrove serves content websites (Drupal/Twig, plus non-Drupal sites and the
  risk and resilience mapping platform). It already ships React and runs it in
  Drupal through a hydration runtime, so React itself is not a new commitment.
- DELTA is a data-heavy application in its own repository, currently sharing
  nothing with Mangrove except hand-copied token values.
- A programme has asked for a DELTA-branded landing page with editable content
  for over a year. It cannot be built because DELTA's design lives inside the
  application, so DELTA's publications, news and events sit on the UNDRR site
  under UNDRR branding.
- The duplication concern is concrete: if DELTA builds its own suite, the next
  product likely commissions a second one, and we are back to the position MCR
  left us in.

### The framing that works best

Not "DELTA should adopt Mangrove", but **DELTA uses Mangrove as one part of its
solution**: its own React Aria usage, its own Tailwind, and Mangrove for the
parts that help. Tokens always, CSS optionally, components only where useful.

That reframing requires four things of us. Three already hold:

| Requirement | Status |
| --- | --- |
| Selective consumption without the component bundle | proven in the spike |
| No requirement to adopt our component model | true today |
| Overridable by the consumer's own tooling | **gap — see cascade layers** |
| Tokens consumable by Tailwind | not yet built |

---

## 2. Cascade layers: the decision that reversed

This is the most important technical finding in the whole workstream, and it
went the opposite way from where it started.

### What was originally decided

Layers were rejected. The reasoning: DELTA has significant unlayered legacy CSS,
and unlayered styles beat layered ones for normal declarations, so a layered Mangrove
would lose to exactly the rules it needed to beat. The spike therefore shipped
ordinary unlayered author CSS, and this was recorded as settled.

### What was never tested

Tailwind 4 emits its utilities inside `@layer utilities`. Nobody checked what an
unlayered Mangrove does to a layered Tailwind.

### What the browser actually does

Five cases, tested directly rather than reasoned about:

| Setup | Result |
| --- | --- |
| A — everything unlayered | Tailwind utility wins |
| B — Mangrove unlayered, Tailwind in `@layer utilities` (**the real DELTA shape**) | **Mangrove wins** |
| C — all layered, order `legacy, mangrove, utilities` | utility wins, and Mangrove still beats legacy |
| D — Mangrove layered, legacy unlayered | legacy wins |
| E — both unlayered, Mangrove imported later | Mangrove beats legacy |

The original decision was right about D and never considered B. B is the
situation DELTA is actually in: **our unlayered stylesheet silently outranks
every Tailwind utility they write.** That is precisely the chokehold they are
worried about, delivered by the cascade rather than by policy — and the PR
comment told them the opposite, that their Tailwind would win by source order.

### The resolution

C is achievable and costs the consumer one line: they layer their own legacy CSS
too, and declare the order explicitly.

```css
@layer legacy, mangrove, utilities;
@import "legacy.css" layer(legacy);
@import "@undrr/undrr-mangrove/aria.css" layer(mangrove);
/* Tailwind's own @layer utilities */
```

This gives the consumer strictly more control than today, which is a far better
conversation than asking them to trust our specificity.

**The order statement must be parsed before any of those layer names is first
used.** If a `@layer utilities { ... }` block appears above it, order is fixed by
first appearance instead and Mangrove beats the utility again — silently. This
was reproduced. It is one file-concatenation away, which is the same aggregator
risk noted below.

### Open risk

Browser support for `@layer` is not the concern (Baseline since 2022). The
concern is toolchain: bundlers that inline `@import` may drop `layer()`, and
Drupal's CSS aggregator concatenates files, which plausibly breaks import-time
layering altogether. The safer shipping shape is to emit a **pre-wrapped
layered variant** alongside the unlayered file, so no consumer depends on
`@import ... layer()` surviving their build. **This now exists**:
`aria/react-aria.layered.css`, generated by `scripts/build-layered-css.js` and
exported as `./aria.layered.css`. The unlayered file is unchanged.

Measured toolchain behaviour, which is worse than anticipated and is the reason
pre-wrapping is the recommendation rather than a nicety:

| Toolchain | `@import ... layer()` |
| --- | --- |
| Sass | passes through untouched |
| **webpack** (`css-loader`) | **inlines the import but hoists the resulting `@layer` block above the order statement**, so layer order inverts silently and a consumer's `legacy` layer ends up above `mangrove` |
| **Drupal** `CssOptimizer` | regex does not accommodate a trailing `layer(...)`, so the import is skipped rather than inlined. Open core issue [#3470829](https://www.drupal.org/project/drupal/issues/3470829), unmerged |

Every failure mode lives in `@import ... layer()`, which is precisely what
pre-wrapping removes from the consumer's hands. Still unverified: whether
Drupal's aggregator preserves a plain `@layer` block. Nothing in `CssOptimizer`
is layer-aware, but nobody has run it.

Also worth noting: layering Mangrove wholesale makes it *always the lesser of
peers* for normal declarations. (Not unconditionally: for `!important` the
order reverses and layered wins, so an `!important` inside a layered Mangrove
becomes *harder* for a consumer to beat, not easier. Measured.) For a design
system
that is often desirable — site overrides become easy — but it inverts current
behaviour for sites that fight specificity today. 2.0-alpha is the moment to
make that call if we are going to, and Mangrove v1 is the escape hatch for
consumers who need the old behaviour.

---

## 3. The token layer: what is wrong with its current shape

The `--mg-aria-*` layer is really Mangrove's **missing semantic tier wearing an
adapter's name**, and it is wired upside down.

`_variables.scss` jumps straight from palette (`--mg-color-blue-900`) to
component tokens (`--mg-color-button-background`). The semantic tier that does
exist — `--mg-color-interactive`, `--mg-color-text`, `--mg-surface-raised` — is
partial, never declared as a tier, and used inconsistently. Component tokens do
resolve through it where it exists, so the accurate criticism is not that it is
missing but that `--mg-aria-*` **renames** it under a second, library-specific
prefix rather than promoting it. `_runtime-theme-aliases.scss` then invents one — `color-accent`,
`color-surface`, `color-border`, `space-1..4`, `radius-control` — and labels it
private and library-specific.

Then the rule adopted during reconciliation, "the adapter reads the legacy
component's tokens", inverts the hierarchy: the semantic layer now depends on
the component layer. That is why the key count grows with every component
reconciled — each one is mirrored one-for-one under a second prefix, and the
contract test's alias list has to be hand-extended each time.

**The right shape is the other way up:** palette → semantic → component. Both
`.mg-button` and `.react-aria-Button` read the component token; the semantic
tier is what we hand a consumer. The `aria` prefix should go entirely, since it
encodes a rendering library DELTA has not chosen.

This is recorded as a direction, not a decision. Reversing it is a larger change
than anything done so far.

### The value-type trap

Mangrove stores colours as channel triplets (`0 79 145`) so they can carry alpha
via `rgb(var(--x) / 0.5)`. A triplet is only valid inside `rgb()`. Dropped raw
into a colour position it makes the whole declaration invalid, and CSS discards
it **silently**.

This is not theoretical. It has produced two real, shipped bugs (see §5). A
token layer whose readers must remember each key's value type will keep
producing them, especially as brand files are edited by brand owners rather than
by whoever wrote the mixin. Any future token format should carry the type
explicitly.

### Why theme-dependent aliases live in a mixin

A custom property's inner `var()` is substituted **on the element the property
is declared on**, and descendants inherit the already-substituted value. A theme
override applied *lower down the tree* therefore never reaches an alias declared
at `:root`. The rule is per-element, not `:root`-specific: put the theme class
on `<html>` and the alias does pick up the override (measured). It bites here
because Mangrove's theme class goes on `<body>` or a wrapper. This is why `mg-aria-runtime-theme-aliases` is re-included
inside every `.mg-theme-*` block rather than declared once.

The cost is real: each brand block carries a copy of the alias table, and the
*distributed* `aria/tokens/mangrove.css` had no theme blocks at all, so an
external consumer importing the published CSS got **no sub-brand theming**.
Generating one token file per brand with everything in one flat block removes
the resolution problem, the duplication, and that gap in one move.

**Done.** `scripts/build-tokens.cjs` now emits one standalone file per brand —
`aria/tokens/{mangrove,preventionweb,irp,mcr,delta}.css` — each carrying the
transitive closure of the ~55 Mangrove tokens the `--mg-aria-*` adapter reads,
resolved for that brand. Two corrections to the sketch above:

- The block is `:where(:root)`, not `:root`. Zero specificity is what lets the
  file work standalone *and* still lose to Mangrove's own stylesheet whenever
  both are loaded, in either load order. A plain `:root` block would let a
  stale published package outrank a newer stylesheet.
- The closure is computed, not curated: the generator scans the adapter Sass
  for `var(--mg-*)` and refuses to build if any of it names a token no source
  defines. `aria/tokens/mangrove.css` previously carried 28 references to
  properties it never defined; the contract test now resolves each file in
  isolation rather than only checking that keys exist.

---

## 4. Reciprocity: the claim that does not survive

The argument made to DELTA was: if both sides style through React Aria's stock
`.react-aria-*` classes, Mangrove can consume anything DELTA builds and vice
versa.

It is not enforced and will not be followed, and the evidence is inside our own
repository. (React Aria does offer a composition path — a function-valued
`className` receiving `defaultClassName` — so the library does not force the
choice. The convention fails through disuse, not by design.)

React Aria applies its stock class **only when `className` is not supplied**.
`stories/Documentation/AriaCrudSpike.stories.jsx` passes `className` 68 times,
including `className="react-aria-Column aria-crud-selection-column"` — manually
re-adding the stock class the moment a second class was needed. Mangrove's own
proof abandoned the convention inside one file. A Tailwind codebase will not
hold it either.

A second problem: a DELTA component styled with Tailwind utilities carries no
CSS of its own. It depends on utility CSS generated by scanning DELTA's source.
Mangrove cannot import that.

**What actually survives contact with two teams is tokens, not classes.** Custom
properties are technology-neutral. Tailwind 4 can be pointed at them via
`@theme`, and MUI 6 has a CSS-variables mode. That is the only reciprocity that
costs neither team autonomy. If component-level sharing is genuinely wanted, it
needs a package boundary — thin wrappers that own default styling and merge a
consumer `className` — not a naming convention nobody will follow.

---

## 5. Bugs found, and what they say about the system

These were all found by measuring rather than reading, and each points at a
systemic weakness rather than a one-off slip.

| Bug | Consequence | What it says |
| --- | --- | --- |
| `--mg-border-color-button` was a triplet in a `border:` shorthand | `.mg-button-outline` rendered as **bare text** — no border, no background. Non-functional since it shipped | value-type ambiguity; no test covered a variant's rendered result |
| `--mg-color-button-background` triplet everywhere except DELTA, which needs `transparent` | DELTA's button hover was **dead**, and a "buttons match across four themes" claim was two invalid declarations both collapsing to transparent | a convention that one theme cannot express will be broken by that theme |
| Form input border was `rgb(neutral-600 / 0.22)` | **1.43:1** against the page, **1.39:1** against its own fill. Every input, textarea and select in the design system failed WCAG 1.4.11 | contrast is a property of the resolved chain and cannot be reviewed by reading |
| `.react-aria-Text[data-slot="description"]` | React Aria emits no `data-slot`; field descriptions and errors were **never styled** | selectors were written from documentation rather than from the installed package |
| `:where()` on base Button/Input | zero specificity, so normalize's `button { font-size: 100% }` beat the themed value | zero specificity is wrong for a surface that ships unlayered |
| Spike fixtures imported into the theme rollup | `.aria-crud-*` shipped in `style.css` to **every** consumer | guarding one artefact and not the other |

**Half of that last one is still open.** Only `aria/spike-demo` was removed from
the rollup. `_components.scss` still imports `aria/react-aria`, so the React Aria
surface itself is compiled into `style.css` for every Drupal and CDN consumer
(28 `react-aria-Button` matches in the current build). Whether that belongs in
the theme bundle is a product decision, not a defect, but it should be a
decision rather than an accident.

Two general lessons worth keeping:

- **Coverage scales cheaply; correctness does not.** Agents took React Aria
  styling coverage from 29% to 56% in one session (57% today, after later work), and the same pass introduced
  accessibility defects that a separate audit had to find. Neither half worked
  alone.
- **A guard you have not mutation-tested is not a guard.** Two detectors written
  in this session reported "zero problems" while being silently broken.

---

## 6. Legacy and React Aria coexistence

Mangrove will have two implementations of several components. That is
legitimate: the legacy components are CSS plus progressive enhancement that work
in server-rendered Drupal with no React, while React Aria requires React. They
serve the two consumption tiers Mangrove actually has.

The risk is not duplication, it is **divergence**. Measured under PreventionWeb
before reconciliation, legacy and React Aria tabs shared only their accent
colour: radius 0px vs 5px, 15px/20px padding vs 10px/15px, 18px type vs 16px,
56px tall vs 44px. Colour flowed through the tokens and geometry did not.

Tabs, buttons, tags, checkbox/radio and form inputs have since been converged
onto shared tokens. Colour, padding and type size were verified identical for
tabs and buttons across four brands; the other components were not measured that
broadly, and §5's second row is exactly a case where a wider "identical across
four themes" claim turned out to be two broken declarations agreeing. Hero, CTA
and
navigation have no React Aria counterpart and carry no divergence risk.

**Caveat worth carrying:** the brands' *tab identity* is dead for the default
horizontal variant, and this predates the convergence — alpha.2's modernisation
bypassed the tab-specific tokens. The underline colour still reads
`--mg-color-interactive`, so brand *accent* reaches the default tab; what died is
each brand's tab *identity* — radius, padding, fill, text and tabbar colour. The
reconciliation
tokenised what was already there and propagated it to a second surface. MCR2030
and PreventionWeb still define tab tokens that no longer affect the default
variant. Brand owners will notice.

---

## 6a. What DELTA actually is

Everything above section 6 was written before anyone read DELTA's production
repository or its Figma file. Both have now been examined. Several premises this
workstream ran on were wrong, and the corrected picture is more favourable to
sharing, not less.

Sources: `/Users/khawkins/Documents/git/delta-pw` (read-only) and the DLDTS
design file, decoded losslessly from its binary format.

### DELTA's brand colour is UNDRR blue

`#132E48`, the navy Mangrove's entire DELTA theme was built on, appears **zero
times** in DELTA's codebase. DELTA's brand blue is **`#004F91`** (54 uses in
code; 1551 fills and 1645 strokes in Figma).

`#004F91` is `rgb(0 79 145)` — Mangrove's `--mg-color-blue-900`, the UNDRR brand
blue. And DELTA's own design file labels that swatch **"UNDRR Blue - Corporate
blue"**, marked "Brand".

Every comparison this workstream published between "DELTA navy" and "UNDRR blue"
was comparing UNDRR blue against a colour that exists only in our guess. The
values were internally consistent, which is why no test caught it.

### DELTA already contains a broken fork of Mangrove

`public/assets/css/style-dts.css` is a compiled Mangrove build, stamped
`?asof=20250630` and frozen since. It carries 23 `.mg-*` selectors used at
roughly 300 call sites (113 `mg-grid`, 82 `mg-button`, 37 `mg-button-primary`,
32 `mg-container`).

It is also demonstrably a copy-paste rather than a build: it contains 14
references to `url(~/stories/assets/icons/...)`, a Mangrove **Sass source path**,
which in DELTA resolve against `public/` and 404 because `public/stories/` does
not exist. Those button arrow icons have never rendered.

So the question was never "will DELTA adopt Mangrove". A degraded, drifted,
partly-broken fork of Mangrove is already in DELTA. The conversation is about
replacing a stale fork with a maintained dependency, which is a much easier
argument and a more urgent one.

### PrimeReact 10.9 cannot be themed with custom properties

DELTA runs styled-mode PrimeReact 10.9.7 with `<PrimeReactProvider value={{ ripple: true }}>`
as its entire configuration, and a vendored `lara-light-blue` theme that is
byte-identical to upstream.

That theme declares ~200 CSS custom properties on `:root` and then **consumes
`var()` exactly 14 times in 224 KB, against 1518 hardcoded hex literals**
(`#3b82f6` alone appears 97 times). The `:root` variables are a one-way export
for consumer CSS, not a theming input. Overriding `--primary-color` repaints
nothing.

The design-token API (`definePreset`, `--p-*`) does not exist in 10.x at all; it
arrives in PrimeReact 11, which is a rewrite-level migration across DELTA's 103
PrimeReact files **and is no longer MIT** — it moves to a dual
community/commercial licence requiring a key, with a non-profit carve-out UNDRR
would have to assess legally. That should not be discovered mid-migration.

Consequence: feeding Mangrove tokens into PrimeReact is not a config change. The
only working path in 10.9 is a hand-authored unlayered override sheet
enumerating every `.p-*` selector and state, re-verified on every patch bump.

### DELTA already has the cascade problem, from its own stack

`@layer primereact` is declared **after** `utilities`, so the PrimeReact theme
outranks every Tailwind utility a DELTA developer writes. There are zero uses of
Tailwind's `!` important modifier across 304 `.tsx` files, which suggests the
team is absorbing this as "Tailwind classes sometimes don't stick" rather than
diagnosing it. `style-dts.css` and four local CSS files are unlayered and
outrank all of Tailwind including preflight.

This matters for the chokehold argument: DELTA is not defending a clean cascade
from Mangrove. They already have the problem, twice, from their own dependencies.

### What DELTA genuinely decided, and what is vendor default

Real, documented decisions worth respecting: `#004F91` and a teal secondary
`#007B7A`/`#00AFAE`; a spacing scale of 2/4/8/12/16/24/32/40/48/64/72/80/88/96;
6px corner radius (1134 uses); a full Roboto type scale; breakpoints
1440/768/375; Sendai target colour ramps; and 77 `[dir="rtl"]` rules, which is
real engineering.

Not decided, inherited: stock PrimeReact `lara-light-blue` unmodified except four
toast selectors; **no Tailwind `@theme` block at all**, so every Tailwind colour
is a stock v4 default; `Inter var` as the effective body font, inherited from the
vendor theme rather than chosen; slate and gray mixed roughly 50/50 as body text;
three competing radius conventions; three different focus rings. Most of DELTA's
235 PrimeReact buttons render generic Tailwind blue `#3b82f6`, not brand colour.

The accurate framing is not "DELTA made no design decisions". It is that **the
few real decisions mostly align with UNDRR already**, and most of what surrounds
them is vendor default that nobody chose.

### Wins available now

1. **Root font size.** `style-dts.css` sets `html { font-size: 14px }`, scaling
   every rem in the app — Tailwind's, PrimeReact's and Mangrove's — to 87.5%.
   The Figma type scale is px-based and assumes a 16px body (Body 16/24), so the
   design file contradicts the code. Mangrove removed non-16px roots in 2.0.
2. **Arabic typography.** Three artifacts, three answers: Mangrove says Dubai,
   DELTA's code has Cairo, the Figma says Noto Sans Arabic. **Correction:** an
   earlier version said Arabic users may be getting a fallback, because the
   `@font-face` declares `format("woff2")` for a static `Cairo-SemiBold.ttf`.
   That is wrong on the spec. A `format()` hint is only used to skip an
   unsupported format, and woff2 is universally supported, so the file is
   fetched, sniffed and rendered. The real defects are that one static SemiBold
   face is declared across `font-weight: 200 1000`, flattening Arabic weight
   hierarchy, and that the correct variable font ships uncited alongside it. Note that
   choosing Dubai overrides DELTA's stated design system rather than filling a
   vacuum; the argument for it is UN-family provenance, not absence of a
   decision.
3. **Brand alignment.** Correcting Mangrove's DELTA theme to `#004F91` makes it
   match both the code and the Figma, and reveals that DELTA's brand is UNDRR's.

### Where the evidence lives

Paths are in the DELTA repository, which was examined read-only and left
untouched (clean tree, empty stash, no new refs).

| Claim | File and lines |
| --- | --- |
| Three-stylesheet link order; dead `primereact.min.css` import; styled-mode provider | `app/root.tsx` 61-65, 30, 253-256 |
| No Tailwind `@theme`; `@import "tailwindcss"` last | `app/styles/all.css` (5 lines) |
| The copied `.mg-*` fork | `public/assets/css/style-dts.css` from line 539 |
| 14px root | `public/assets/css/style-dts.css:18` |
| Mangrove Sass paths that 404 | `public/assets/css/style-dts.css` 598, 611, 654, 660, 672, 677, 689, 695, 714, 719 |
| Vendored theme, byte-identical to upstream; layer opens after Tailwind's | `public/assets/themes/lara-light-blue/theme.css` 292, 6997 |
| The `--p-*` assumption that does not hold on 10.9 | `_docs/refactoring-plan/design-system-unification-roadmap.md` 43-48 |
| Dev-only CSP; no production CSP in the repo | `vite.config.ts:54` |

One consequence of that last row: the dev CSP allows styles from `unpkg`,
`cdnjs` and `*.preventionweb.net` but not `assets.undrr.org`, so a `<link>` to a
Mangrove stylesheet on that host would be blocked in development. Bundling
locally avoids it. What production enforces is unknown, because no production
CSP exists in the repository.

### Corrections this forces on earlier sections

- Mangrove's `_theme-delta.scss` has **primary and outline swapped**. DELTA's
  primary button is filled `#004f91` with white text, 40px tall, 6px radius, per
  both the code and the Figma button spec. The `background: transparent` our
  guess copied is the unstyled base that every variant overrides. The standalone
  token file was structurally right and the theme file wrong.
- The MUI-versus-React-Aria framing was aimed at the wrong target. DELTA's
  documented position is *"PrimeReact is the team's stated direction for
  interactive widgets going forward"*, already executed across 103 files. React
  Aria is not a live option for them.
- DELTA has **no Figma Variables of its own**. All 26 collections and 664
  variables are imported third-party kits. There is nothing to sync from Figma;
  tokens would have to be authored.

## 7. Open questions

- Do we invert the token hierarchy to palette → semantic → component, and drop
  the `aria` prefix?
- Do we generate one token file per brand, and is Figma the upstream? Brand
  values currently reach both repositories by hand and nothing syncs.
- Do we adopt cascade layers in 2.0, given it is breaking and v1 is the escape
  hatch?
- Where should font loading live? A token file currently carries an
  `@font-face`.
- Portalled overlays render under `<body>`. Any site scoping `.mg-theme-*` to a
  wrapper gets unbranded popovers and menus.
- Forced-colours rendering has never been verified in Windows High Contrast.
- The distributed `aria/tokens/mangrove.css` is not standalone: it references
  base values it does not define, so it only works alongside Mangrove's full
  stylesheet — the one thing an external consumer wants to avoid.

---

## 8. What would be decided, and by whom

The choice is a spectrum, not a binary, and each rung is independently useful:

1. **Shared tokens only** — brand coherence, no component coupling.
2. **Tokens plus the shared Aria stylesheet** — what the spike proves.
3. **Plus Mangrove content patterns per route** — syndicated search, tabs,
   cards, the UNDRR footer. This is the rung that unblocks the landing page.
4. **Full component adoption** — only where it helps.

A team can sit on rung 1 indefinitely and step to rung 3 the week a programme
asks for a branded page, without rework.

Whichever rung is chosen, the reasoning should be written down, including what
is knowingly given up. A faster product-only path is a legitimate choice;
discovering in a year that it cannot be reused should be an accepted consequence
rather than a surprise.

**And one thing that is not an architecture problem at all:** the year-old
landing page is not blocked on any of this. `_theme-delta.scss` and
`style-delta.scss` already exist and the theme switch already works. It is
blocked because nobody owns keeping the DELTA brand file faithful to DELTA's
design. That is governance.
