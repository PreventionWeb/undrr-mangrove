# How Mangrove measures colour contrast

Mangrove grades every colour pair twice: **WCAG 2**, for continuity with every
other tool in the ecosystem, and a **perceptual lightness measure on Oklab**,
because WCAG 2 is not a reliable model of what people can read.

## Why not WCAG 2 alone

WCAG 2 compares *relative luminance*, which is not perceptually uniform, so one
ratio can describe two pairs that are visibly different to read. It is weakest
where design systems spend their time: mid-tones, warm hues, light-on-dark.

A label on Mangrove's orange accent, `#eb752a`:

| Label | WCAG 2 | Oklab | APCA |
| --- | --- | --- | --- |
| white | 2.95 | 46.7 | Lc 60.8 |
| **black** | **7.11** | **57.4** | **Lc 48.6** |

WCAG 2 rates black-on-orange a comfortable pass; this measure puts it under the
63 body-text threshold. So "flip the label to dark text" satisfies WCAG 2 and
still leaves text hard to read at body size. Note the limit on display too: this
measure is polarity-insensitive, so it ranks black above white, while APCA,
which models polarity, prefers white. The disagreement is the useful output; the
ranking is not.

## Why not APCA

APCA is the best-known perceptual algorithm. We do not use it, for four reasons:

- It is **patent-pending**, and its licence restricts the main repository to
  "Registered Beta Testers OR Personal use only ... unless authorized in
  writing".
- The npm package `apca-w3` is licensed to the W3C "for use with WCAG
  accessibility guidelines ... and not for any other use"; outside that, AGPL
  v3. Its only dependency is AGPL v3.
- **"APCA" is a trademark**, usable only for implementations deemed correct and
  current.
- It is **not the WCAG 3 direction**, contrary to common belief. It was removed
  from WCAG 3 in early 2023, and the April 2026 Editor's Draft still says "the
  contrast algorithm used in WCAG 3 is yet to be determined".

Canonical hit the same wall building Ubuntu's palette and shipped a
WCAG-anchored approach instead, declining to claim APCA compliance for licence
reasons.
<https://canonical.design/blog/generating-color-palettes-for-design-systems-inspired-by-apca>

## Why Oklab

Oklab is defined in **CSS Color Level 4**, a W3C specification in the **public
domain**, and `oklab()`/`oklch()` have been Baseline Widely available since May
2023 — so the maths that grades our colours is the maths the browser uses to
render them. No licence, patent, trademark or attribution requirement.

## The measure

Contrast is the difference in Oklab lightness, put through a power curve —
`|L₂^φ − L₁^φ|^(1/φ)` — and shifted onto a roughly 0-100 scale
(`scripts/lib/perceptual-contrast.cjs`). It is **a local invention, not a
published measure**: the curve has no standard form behind it, its scale and
offset are only what the two anchors below solve to (1.408 and 39.61, shipped
rounded to √2 and 40), and a `NORM` term moves the result by 0.035%. Only the
calibration is load-bearing.

Thresholds are **calibrated, not asserted** — anchored to the two boundaries the
field already agrees on:

| Anchor | WCAG 2 | Oklab | Threshold |
| --- | --- | --- | --- |
| `#767676` on white | exactly 4.5:1, body text | 63.3 | `BODY_TEXT` 63 |
| `#949494` on white | exactly 3.0:1, non-text | 50.0 | `NON_TEXT` 50 |

A pair WCAG 2 puts precisely on a boundary lands on the same boundary here, so
the two diverge only where WCAG 2 is unreliable. Adopting this does not silently
re-baseline decisions already taken. Both anchors are grey on white, so nothing
calibrates the measure on dark backgrounds; treat those scores as indicative.

## Limitations

- **Polarity-insensitive**, so dark-on-light and light-on-dark score the same,
  and nothing calibrates it on dark surfaces. APCA models polarity; we do not.
- **Not size or weight aware** beyond the coarse large-text threshold.
- **Assumes sRGB** and an ordinary viewing environment.
- It is a model. Where a decision is marginal, the answer is a person reading
  the screen, not a number.

## How it is applied

- Both measures run over the resolved token chain per theme, so a value is
  graded as it renders, not as it is written.
- Known failures are individually listed with their measured value and reason,
  so they read as a to-do rather than a waiver.
- Disabled and inactive components are exempt, as WCAG 2 exempts them.
- Where the two measures disagree, that pair is worth a human look. That is the
  signal this approach exists to produce.
