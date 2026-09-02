# DELTA composition demo — what it proved

This is the write-up of a throwaway demo page that put Mangrove, Tailwind 4 and
a deliberately hostile legacy stylesheet on the same document and measured which
one won. **The page itself is no longer in the repository** — it was a
measurement instrument, not a deliverable, and its verdicts were live computed
values that only meant anything at the moment they were taken. This file is the
record of what it showed.

The question it existed to answer is the one the DELTA team has been asking for
a year: **can a DELTA-shaped application use Mangrove as one part of its stack
without Mangrove taking the whole stack over?**

## How it was set up

A plain HTML page, opened from the filesystem, loading Mangrove's compiled
`dist/assets/css/style-all.css` through a relative path — the same file, at the
same subpath, that an npm consumer imports from the published package. Alongside
it: `aria/react-aria.css`, a real Tailwind 4.3.3 CLI build (theme and utilities,
no preflight), and a simulated legacy stylesheet that was unlayered at source,
id-scoped and aggressive. DELTA app chrome was built with Tailwind; Mangrove
content patterns and the cascade specimens sat below it. Two controls switched
the cascade wiring and the brand, and every specimen printed its own computed
values and a pass/fail verdict.

It was deliberately not a Storybook story. Storybook loads Mangrove's stylesheet
into its own CSS context, on a page it controls, with no competing application
CSS. That arrangement cannot tell you anything about how Mangrove behaves next
to Tailwind and a decade of legacy rules, which is the only thing DELTA actually
needs to know.

## The two cascade modes

### Mode A — source order only (what Mangrove ships today)

```css
@import url('legacy.css');
@import url('../../../dist/assets/css/style-all.css');
@import url('../../../aria/react-aria.css');
@import url('tailwind.built.css');
```

No custom layers anywhere. This was the shape recorded in `SPIKE-FINDINGS.md`
§6 at the time: Mangrove ships as ordinary author CSS, and consumers control the
outcome by import position. Finding 1 below is what reopened that decision.

### Mode B — consumer-declared layers

```css
@layer legacy, mangrove, tw;

@import url('legacy.css') layer(legacy);
@import url('../../../dist/assets/css/style-all.css') layer(mangrove);
@import url('../../../aria/react-aria.css') layer(mangrove);
@import url('tailwind.built.css') layer(tw);
```

Four lines in the consuming application. **Mangrove is unchanged, Tailwind is
unchanged, and the legacy stylesheet is unchanged.** `@import … layer(name)`
lets a consumer assign a layer to CSS it does not own and cannot edit, which
is the part of the layers story that the earlier spike work did not use.

## What was observed

Measured in Chromium via computed styles. Mode A was the shipped shape; mode B
was the same page with the four lines above.

| Specimen | What it tests                                                                             | Mode A                                                   | Mode B                                        |
| -------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| **A**    | Tailwind utility `bg-[rgb(0_106_78)]` vs `.mg-button-primary`                             | `rgb(19, 46, 72)` — **Mangrove wins**                    | `rgb(0, 106, 78)` — **Tailwind wins**         |
| **B1**   | `.mg-card__title` vs ordinary legacy `.event-card-title`                                  | `23px / Roboto Condensed` — **Mangrove wins**            | `23px / Roboto Condensed` — **Mangrove wins** |
| **B2**   | Mangrove `h2` vs legacy `#id .class h2.class`                                             | `11px / 400` — **legacy wins**                           | `23px / 700` — **Mangrove wins**              |
| **D**    | Tailwind `text-white` on the app's own nav link vs Mangrove's bare `a { color }`          | `rgb(19, 46, 72)` — **Mangrove wins, link is invisible** | `rgb(255, 255, 255)` — **the app wins**       |
| **C**    | Brand from `aria/tokens/delta.css` reaching both a Mangrove `.mg-tag` and a Tailwind chip | both `rgb(19, 46, 72)`                                   | both `rgb(19, 46, 72)`                        |

### 1. Today, Tailwind utilities cannot override Mangrove. At all.

This is the finding that matters most and it is not fixable from the page.

Tailwind 4 emits its own output wrapped in `@layer theme` and
`@layer utilities`. Mangrove ships unlayered. In CSS, **unlayered declarations
beat every layered declaration**, whatever the specificity and whatever the
source order. So no amount of import reordering on the consumer's side lets a
Tailwind utility win against a Mangrove rule. Specimen A demonstrates it with
two single-class selectors — a straight tie on specificity that Mangrove wins
anyway.

An application in this position has exactly three options: `!important`
utilities, hand-written CSS outside its utility system, or layering.

### 2. Mangrove beats ordinary legacy CSS by source order, but not aggressive legacy CSS.

Specimen B1 is the easy case and works today: equal specificity, Mangrove
imported later, Mangrove wins. Specimen B2 is the case a real legacy codebase
is full of — one id and two classes — and source order is powerless against it.
Mode B fixes it, because layer order is evaluated before specificity.

Note this is the mirror image of the concern recorded in `SPIKE-FINDINGS.md`
§6, which rejected layers on the grounds that layered Mangrove CSS would lose
to unlayered legacy CSS. That is true only while the legacy CSS stays
unlayered. A consumer that imports its own legacy stylesheet can put it in a
layer at import time, at which point Mangrove wins by construction. The
decision to ship unlayered is still defensible for consumers who cannot reach
their legacy CSS — but it is a choice with a cost, not a free one, and the cost
is finding 1.

### 3. Mangrove's bare-element rules reach into UI that has no Mangrove classes.

Specimen D turned up while building the demo's app bar, not while designing a
test. Mangrove styles bare `a` elements with the brand colour. The DELTA nav
strip carries no `mg-*` class at all, and Tailwind's
`text-white` on the link loses in mode A, so the app's own navigation renders
navy on navy and disappears.

The demo's own header needed an unlayered `.demo-appbar nav a { color: #fff }`
rule purely to work around this. Having to write that rule _is_ the friction
being measured: the application had to leave its own styling system to undo a
design system rule it never opted into.

### 4. Layering fixes specificity fights. It does not fix inheritance.

Even in mode B, specimen B2's heading stays in the legacy font. Mangrove never
declares `font-family` on `h2` — it declares it once on `body` and lets
headings inherit — and an inherited value loses to any declared value, in any
layer, at any specificity. Wherever the design system relies on inheritance and
the legacy app declares directly, the consuming application still has to delete
the legacy rule. Layers are not a substitute for that cleanup.

### 5. Brand-by-token-file works, and works for the app's own UI too.

Specimen C passed in both modes and for all six brand options. Nothing on the
page redefined a Mangrove component. Switching the brand control re-skinned
Mangrove's tags, cards, tabs, buttons and form controls _and_ the Tailwind app
chrome, because the app chrome reads `var(--mg-color-interactive)` through
Tailwind arbitrary values. This is the part of the story that already works
today, and it works whether the brand arrives as `aria/tokens/delta.css` on
`:root` or as an `.mg-theme-*` class on `<body>`.

### 6. DELTA has two brand definitions and they disagree.

`aria/tokens/delta.css` leaves the primary button filled navy.
`_theme-delta.scss`, which compiles to the `.mg-theme-delta` class, sets
`--mg-color-button-background: transparent`, making the primary button an
outline button — visible on the page by switching between the first two brand
options. Whichever is intended, a consumer choosing one route rather than the
other should not get a different button.

## Relationship to `docs/CASCADE-LAYERS.md`

That document and `aria/react-aria.layered.css` were produced in parallel with
the demo and reached finding 1 independently, from the React Aria side. The
two pieces cover different halves of the same problem and agree on the cause:

- `aria/react-aria.layered.css` is a pre-wrapped layered build of the **React
  Aria adapter stylesheet**. It is what a DELTA CRUD screen imports.
- The demo exercised the **component stylesheet**, `style-all.css` — the cards,
  tags, tabs, buttons, form controls and typography a DELTA-branded landing page
  needs. No layered build of that file exists yet, which is why mode B wrapped
  it with `@import … layer(mangrove)` on the consumer side.

`docs/CASCADE-LAYERS.md` also records two build-tool failures worth reading
before copying mode B into a real app: webpack hoists an inlined `@import`
block above the `@layer` order statement and inverts the order, and Drupal's
`CssOptimizer` skips the import entirely. Both hit the consumer-side
`@import … layer()` technique mode B used, and neither hits a pre-wrapped
layered file. A `<link>`-based page like the demo is unaffected.

## What ideal ordering would need

The page proved the target arrangement is reachable today with four lines of
consumer CSS and no changes to Mangrove. That is the cheapest available answer
for a page that loads plain `<link>` tags, and DELTA can adopt it now.

Making it a property of the library rather than of each consumer would need
one of:

1. **A layered build of the component stylesheet**, matching what
   `aria/react-aria.layered.css` already does for the Aria adapter — e.g.
   `dist/assets/css/style-all.layered.css` wrapping everything in
   `@layer mangrove`. Consumers who can layer their legacy CSS import that one;
   consumers who cannot keep importing the unlayered file. This is additive,
   breaks nobody, and is the only option that survives webpack and Drupal's
   CSS optimiser.
2. **Documenting the `@import … layer()` recipe** as a supported integration
   path for `<link>`-based pages, which is what this demo is a working example
   of.

Neither removes findings 3 and 4. Those are about Mangrove's own selector
surface — bare `a`, bare `h2` — rather than about layering, and the fix there
is narrowing the global element rules or scoping them behind a container class.

## Caveats on mode B

- **`!important` still reverses everything.** An `!important` declaration in
  the legacy layer beats a normal declaration in the mangrove layer. Layer
  order is inverted for important declarations by design.
- **Runtime-injected CSS escapes it.** A `<style>` element or inline style
  added by application JavaScript is unlayered and beats every layer. Layering
  only covers stylesheets the app imports.
- **Tailwind preflight was not loaded.** The demo's Tailwind entry point
  imported `theme.css` and `utilities.css` only. With preflight in the `tw` layer it
  would sit _after_ Mangrove and reset Mangrove's typography. An app that wants
  preflight needs it in its own earlier layer:
  `@layer tw-base, legacy, mangrove, tw`.
