# How Mangrove measures colour contrast

Mangrove measures contrast two ways and reports both: **WCAG 2** for continuity
with every other tool in the ecosystem, and a **perceptual lightness measure on
Oklab** because WCAG 2 is not a reliable model of what people can actually read.

This document exists so the choice is a documented methodology rather than a
preference. If someone asks why a colour was accepted or rejected, the answer is
here.

## Why not WCAG 2 alone

WCAG 2's contrast ratio compares *relative luminance*. Relative luminance is not
perceptually uniform, so the same ratio can describe two pairs that are visibly
different to read. It is weakest exactly where design systems spend their time:
mid-tones, warm hues, and light-on-dark.

A live example from this repository. Mangrove's orange accent, `#eb752a`:

| Pair | WCAG 2 | Oklab | |
| --- | --- | --- | --- |
| white on orange-900 | 2.95 | 46.7 | both say fail |
| **black on orange-900** | **7.11** | **57.4** | **they disagree** |

WCAG 2 rates black-on-orange a comfortable pass. Perceptually it sits below the
body-text threshold. So "flip the label to dark text" satisfies WCAG 2 and still
leaves text that is hard to read at body size. Only the perceptual measure says
so.

## Why not APCA

APCA is the best-known perceptual contrast algorithm, and we do not use it.

- It is **patent-pending**, and its licence restricts the main repository to
  "Registered Beta Testers OR Personal use only ... unless authorized in
  writing".
- The npm package `apca-w3` is licensed to the W3C "for use with WCAG
  accessibility guidelines ... and not for any other use", with anything outside
  that agreement falling under AGPL v3. Its only dependency, `colorparsley`, is
  AGPL v3.
- **"APCA" is a trademark**, usable only for implementations deemed correct and
  current; incorrect ones are stated to be "in breech of license and a copyright
  violation".
- It is **not the WCAG 3 direction**, contrary to common belief. APCA was
  removed from WCAG 3 in early 2023 under the working group's rule that
  exploratory content without support is dropped after six months. The April
  2026 Editor's Draft still states "the contrast algorithm used in WCAG 3 is yet
  to be determined", and the Visual Contrast of Text subgroup is inactive.

Canonical reached the same conclusion building Ubuntu's palette: they explored an
APCA-inspired generator, shipped a WCAG-anchored approach instead, and noted *"I'm
not sure if what I did is compatible with the APCA trademark license, so I'll
refrain from claiming that my result is APCA-compliant"*.
<https://canonical.design/blog/generating-color-palettes-for-design-systems-inspired-by-apca>

ServiceNow's Horizon system layers a perceptual measure on top of WCAG 2 rather
than replacing it. Nobody credible has swapped WCAG 2 out, because there is no
successor standard to swap to.

## Why Oklab

Oklab (Björn Ottosson, 2020) is defined in **CSS Color Level 4**, a W3C
specification in the **public domain**. `oklab()` and `oklch()` have been
Baseline Widely available in browsers since May 2023, so the same maths that
grades our colours is the maths the browser uses to render them.

No licence, no patent, no trademark, no attribution requirement.

## The measure, and how its thresholds were set

Contrast is the difference in Oklab lightness, shaped by a standard
perceptual-difference curve and scaled to roughly 0-100. It is implemented in
`scripts/lib/perceptual-contrast.cjs`.

Thresholds are **calibrated, not asserted**. They are anchored to the two
boundaries the field already agrees on:

| Anchor | WCAG 2 | Oklab | Threshold |
| --- | --- | --- | --- |
| `#767676` on white | exactly 4.5:1, the body-text boundary | 63.3 | `BODY_TEXT` 63 |
| `#949494` on white | exactly 3.0:1, the non-text boundary | 50.0 | `NON_TEXT` 50 |

A pair that WCAG 2 puts precisely on a boundary lands on the same boundary here.
The two measures therefore diverge only where WCAG 2 is unreliable. That is
deliberate: adopting this does not silently re-baseline every colour decision
already taken.

## Limitations, stated rather than buried

- **Polarity-insensitive.** Dark-on-light and light-on-dark score the same.
  Perception is not symmetric; APCA models that and this does not.
- **Not size or weight aware** beyond the coarse large-text threshold. Real
  readability depends on both.
- **Assumes sRGB**, a lit display and an ordinary viewing environment.
- It is a **model**, and no model replaces testing with people. Where a decision
  is marginal, the answer is a person reading the screen, not a number.

## How this is applied

- Both measures run over the resolved token chain for every theme, so a value is
  graded as it actually renders, not as it is written.
- Known failures are recorded as explicit, individually listed exceptions with
  the measured value and the reason, so they read as a to-do rather than a
  waiver.
- Disabled and inactive components are exempt, consistent with WCAG 2's own
  exemption.
- Where the two measures disagree, that pair is worth a human look. That is the
  signal this whole approach exists to produce.
