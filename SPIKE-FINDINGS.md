# React Aria and Mangrove integration spike

## Result

This spike establishes a separate CSS distribution surface for React Aria Components:

- `@undrr/undrr-mangrove/tokens/mangrove.css`
- `@undrr/undrr-mangrove/tokens/delta.css`
- `@undrr/undrr-mangrove/aria.css`

The spike deliberately avoids custom CSS layers. DELTA has significant
unlayered legacy CSS, which would outrank ordinary declarations inside a named
layer. Token and Aria imports are first in DELTA's global stylesheet.

## Questions

1. **Token emission: yes.** Mangrove already emits palette, semantic colour,
   spacing, and form properties on `:root`. The spike adds the small font and
   component-semantic subset needed by these components as standalone files.
2. **Aria styling layer: yes.** `aria/react-aria.css` targets React Aria's
   default classes and data attributes. Every visual value resolves through a
   `--mg-aria-*` custom property; literals are confined to the two token files.
3. **Theme swap: yes.** The Aria stylesheet is identical for both token files.
   DELTA's file uses its existing navy (`rgb(19 46 72)`) and Mangrove's Dubai
   Arabic body typography.
4. **Selective consumption: yes.** DELTA imports only the two CSS subpaths and
   imports React Aria Components directly. It does not import Mangrove's root
   export, so Mangrove's component stylesheet is not an input to its bundle.
5. **Distribution shape: yes.** `npm pack` created a local tarball, which was
   installed in DELTA with `yarn add @undrr/undrr-mangrove@file:/tmp/undrr-undrr-mangrove-1.8.1.tgz`.
   The installed package's explicit exports resolved during `yarn build`.
6. **Cascade determinism: qualified no.** DELTA uses Tailwind 4.2 alongside
   unlayered legacy CSS. A dedicated Aria layer was overridden by that legacy
   CSS, so the spike removes its custom layers rather than imposing a partial
   layer architecture. This restores normal CSS behaviour but means a future
   foundation needs an agreed cascade strategy before claiming that Tailwind
   utilities always win.
7. **Overlay theming: yes.** The `Popover` targets the portalled React Aria
   overlay and all token definitions are on `:root`, so it does not depend on a
   wrapper theme class. Browser verification opened the portal, confirmed it
   had a white token surface, then swapped only to DELTA tokens and confirmed
   the trigger changed to DELTA navy (`rgb(19, 46, 72)`) while the portal
   remained correctly themed.

## Evidence

- `yarn build` succeeds in DELTA with the tarball installed and creates an
  `aria-spike` client chunk.
- The emitted DELTA stylesheet is the only CSS that contains the new React
  Aria selectors; the imports do not traverse Mangrove's root entry, which is
  the only entry that imports Mangrove's full component stylesheet.
- `npm pack` contains `aria/react-aria.css` and both token files.
- `aria-mangrove-overlay.png` and `aria-delta-overlay.png` capture the open
  Select overlay before and after the token-only theme swap.

## Limitations and follow-up

The current package tarball still includes much more source than necessary.
That does not block selective CSS consumption, but a production package should
use a `files` allow-list and publish prebuilt CSS artifacts. The full Mangrove
build was started after the Storybook demo was added; its Sass stage completed
and Storybook compiled the new story bundle. Browser verification of the
Storybook variant completed; DELTA's own scratch route was built successfully,
but its full data-backed application server did not remain available in this
environment for a second browser pass.

The implementation is intentionally only Button, TextField, and Select. It is
not a public wrapper API and does not claim a full component-system contract.

## Effort estimate

- Production-ready foundation: 5–8 engineer days (token contract, package
  allow-list/build output, visual regression coverage, browser/a11y checks,
  and integration documentation).
- Full React Aria component set: 8–14 engineer weeks, depending on the number
  of component variants and required responsive/RTL states.

## Recommendation

**Proceed with React Aria only if the team accepts an unlayered initial styling
surface, with a short hardening phase first.** Distribution hygiene and a
holistic cascade strategy are prerequisites to a broad rollout.
