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

Mangrove serves content websites (Drupal/Twig, plus non-Drupal sites and the
risk and resilience mapping platform), and already ships React through a Drupal
hydration runtime, so React is not a new commitment. DELTA is a data-heavy
application in its own repository, currently sharing nothing with Mangrove
except hand-copied token values. The duplication concern is concrete: if DELTA
builds its own suite, the next product likely commissions a second one, and we
are back to the position MCR left us in.

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

Layers were originally rejected. The reasoning: DELTA has significant unlayered
legacy CSS, and unlayered styles beat layered ones for normal declarations, so a
layered Mangrove would lose to exactly the rules it needed to beat. The spike
shipped ordinary unlayered author CSS and this was recorded as settled.

What was never tested: Tailwind 4 emits its utilities inside `@layer utilities`.
Nobody checked what an unlayered Mangrove does to a layered Tailwind. Five cases,
measured in a browser rather than reasoned about:

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

C is reachable, which is why the decision reversed. Mangrove now publishes a
pre-wrapped `aria/react-aria.layered.css` alongside the unlayered file.
**`docs/CASCADE-LAYERS.md` is the consumer-facing guidance** — which file to
import, where the layer order statement has to go, why `@import … layer()` is
the wrong tool (webpack hoists the inlined block above the order statement and
Drupal's `CssOptimizer` skips the import outright), and what happens if you
double-wrap. That document supersedes anything about layers written here; this
section records only that the decision moved and what moved it.

Two consequences worth carrying that are not consumer guidance:

- Layering Mangrove wholesale makes it *always the lesser of peers* for normal
  declarations. Not unconditionally: for `!important` the order reverses and
  layered wins, so an `!important` inside a layered Mangrove becomes *harder*
  for a consumer to beat, not easier. Measured. For a design system that is
  often desirable — site overrides become easy — but it inverts current
  behaviour for sites that fight specificity today. 2.0-alpha is the moment to
  make that call if we are going to, and Mangrove v1 is the escape hatch for
  consumers who need the old behaviour.
- Still unverified: whether Drupal's aggregator preserves a plain `@layer`
  block. Nothing in `CssOptimizer` is layer-aware, but nobody has run it.

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

## 6a. What we learned about DELTA

The DELTA product's repository and design file were examined directly during
this work, which corrected a significant error: Mangrove's DELTA theme had been
built on `#132E48`, a navy that does not appear in DELTA at all. **DELTA's brand
blue is `#004F91`** — which is `--mg-color-blue-900`, Mangrove's own UNDRR blue.
DELTA's design file labels that swatch "UNDRR Blue". The theme also had its
primary and outline buttons swapped, and collapsed a two-colour brand into one.

All of that is corrected in the token sources, and the values there carry their
own provenance notes. That is the part which belongs in this repository.

The wider review — DELTA's stack, its styling architecture, and the specific
defects found in its source — is deliberately **not recorded here**. This is a
public repository, and a file-and-line critique of another team's private
codebase does not belong in one, however useful the analysis. It has been kept
separately for sharing with the DELTA team directly.


## 6b. Form control states: what each surface expresses

DELTA's design file models every form control across seven states — default,
hover, focus active, focus typing, filled, error, disabled. Mangrove has two
form surfaces that are meant to agree: the legacy `.mg-form-*` controls and the
React Aria surface in `aria/_react-aria.scss`. A specimen sheet was built that
rendered both side by side, one live control per state, and each cell was
verdicted with `getComputedStyle` in Chromium rather than by reading the
stylesheet — hover driven with a real pointer, keyboard focus with a real Tab,
pointer focus with a real click. It was checked in all five themes and both
directions. The sheet itself is not kept: hardcoded computed-style snapshots
that nothing re-runs rot the moment the CSS beneath them changes. The findings
are kept, because they were expensive to obtain and nothing else records them.

### Which states each surface actually expresses

Measured at the UNDRR default, per control (legacy → aria):

- **Text input** — hover: neither. Focus active: legacy draws the full ring;
  aria draws it only for keyboard focus. Filled: neither. Error: both.
  Disabled: legacy inverts to a *white* background, lighter than the enabled
  grey, and leaves the border alone; aria is measurably identical to default —
  no opacity, no colour, no border change, only the UA cursor differs.
- **Textarea** — hover: aria moves the border to the focus colour, legacy does
  nothing. Focus/filled/error as the text input. Disabled: aria uses opacity
  0.55 and `cursor: not-allowed`; legacy repeats the white inversion.
- **Date** — legacy is a native `input type="date"`, so segment-level focus is
  drawn by the user agent and varies by browser. Aria is the only place in
  either surface that distinguishes **focus typing**: `DateSegment[data-focused]`
  highlights the segment being typed while the field keeps its focus-within
  treatment. But aria's DateInput has no `[data-invalid]` and no `[data-disabled]`
  rule, so an invalid or disabled date field looks ordinary — only the
  `FieldError` text signals a problem. `DateSegment[data-placeholder]` is muted,
  which marks the *unfilled* case rather than the filled one.
- **Select** — aria hovers (`[data-hovered]` lightens the trigger), legacy does
  not. Neither distinguishes a chosen option from a placeholder. Aria has no
  `[data-invalid]` rule reaching the trigger, so an invalid select looks valid.
  Disabled: legacy measures opacity 0.7 — different from the disabled input and
  textarea beside it; aria inherits the base Button's 0.55, a CTA treatment
  applied to a field.
- **Stepper** — legacy is a native `input type="number"` with the browser's own
  spinner, not a Mangrove control. On aria the increment/decrement buttons hover
  and dim; the Input between them does neither, for the same reason the plain
  text input does not.

### Controls that do not exist on either surface

- **Dropdown breadcrumb.** Mangrove has a Breadcrumb and a Select; nothing
  composes them. React Aria offers `Breadcrumbs` plus a `Select` hand-composed,
  with none of the seven states defined for the composition as a whole.
- **Multiselect.** Legacy offers a checkbox group, which is a different
  interaction with a different affordance. Aria styles `ListBox` with
  `selectionMode="multiple"`, but `[data-selected]` shares the `[data-focused]`
  background so a focused-unselected option and a selected one look the same,
  and there is no multiselect trigger, token display or removal affordance.

### Where the two surfaces disagree

- **hover** — three behaviours for one state: aria TextArea hovers, aria Input
  does not, neither legacy control does.
- **disabled** — four treatments: legacy input/textarea white-plus-grey at
  opacity 1, legacy select at 0.7, aria TextArea at 0.55, aria Input nothing at
  all.
- **error** — every legacy control turns its border red. On aria, Input and
  TextArea do; DateInput and the Select trigger do not.
- **focus from a pointer** — the sharpest one. Legacy uses the CSS
  `:focus-visible` pseudo-class, which browsers *do* apply when a pointer user
  clicks into a text field. The aria surface uses `[data-focus-visible]`, which
  React Aria withholds on a pointer click. Measured: a clicked aria text input
  has `data-focused` but not `data-focus-visible`, so it keeps its default
  border, background and 1px UA outline while the legacy field in the same
  situation shows the full ring. Keyboard focus is fine on both. The loser is
  the sighted pointer user who needs to see where they are.
- **focus indicator shape** — legacy draws a 2px white band inside a 2px blue
  band with `box-shadow`; aria draws one 2px outline with an offset. Both settle
  on `0 79 145`, but the legacy focus *border* re-themes per sub-brand (teal on
  PreventionWeb, purple on MCR2030) while the ring around it stays UNDRR blue in
  every theme — a themed border inside an unthemed ring.
- **focus typing** — only the aria DateInput expresses it, and only because
  React Aria gives each segment its own focus. Everywhere else it collapses into
  focus active.
- **filled** — neither surface expresses it on any control.
- **reduced motion and forced colours** — aria gates every transition behind
  `prefers-reduced-motion: no-preference` and repaints focus and selection under
  `forced-colors: active`. `forced-colors` appears nowhere in the legacy
  stylesheet and the legacy form controls carry no transitions at all. The two
  surfaces will not match for a user who has asked their OS for either.

RTL was clean on both: layout and reading order mirror, the legacy select moves
its chevron and the legacy date input its picker button, and the aria surface
reflows on its own because it is written in logical properties. The error red is
`193 9 32` in every theme.

---

## 7. Open questions

- Do we invert the token hierarchy to palette → semantic → component, and drop
  the `aria` prefix?
- Is Figma the upstream for brand values? They currently reach both
  repositories by hand and nothing syncs. (Per-brand token file generation is
  no longer open — see §3.)
- Do we adopt cascade layers in 2.0, given it is breaking and v1 is the escape
  hatch?
- Where should font loading live? A token file currently carries an
  `@font-face`.
- Portalled overlays render under `<body>`. Any site scoping `.mg-theme-*` to a
  wrapper gets unbranded popovers and menus.
- Forced-colours rendering has never been verified in Windows High Contrast.

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

**And one thing that is not an architecture problem at all:** the DELTA-branded
landing page a programme has been asking for over a year is not blocked on any
of this. `_theme-delta.scss` and `style-delta.scss` already exist and the theme
switch already works. It is blocked because nobody owns keeping the DELTA brand
file faithful to DELTA's design. That is governance.
