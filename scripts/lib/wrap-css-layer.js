/**
 * Wrap a built CSS artifact in a cascade layer.
 *
 * See docs/CASCADE-LAYERS.md for why Mangrove ships a pre-wrapped layered
 * variant instead of asking consumers to write `@import "…" layer(mangrove)`.
 */

import postcss from 'postcss';

/**
 * At-rules that are only legal at the top level of a stylesheet. Nesting them
 * inside `@layer` makes them invalid and browsers drop them silently, so they
 * are hoisted above the layer block instead.
 */
const TOP_LEVEL_ONLY = new Set(['charset', 'import', 'namespace']);

/**
 * Wrap every rule in `css` in `@layer <layerName>`.
 *
 * @param {string} css - Source CSS.
 * @param {string} layerName - Cascade layer name to wrap the rules in.
 * @param {string} [from] - Source path, used for postcss error messages.
 * @returns {string} The layered CSS. Rule text is byte-identical to the input;
 *   only the wrapper and the hoisted top-level at-rules move.
 */
export function wrapInLayer(css, layerName, from = undefined) {
  const root = postcss.parse(css, { from });
  const layer = postcss.atRule({
    name: 'layer',
    params: layerName,
    raws: { before: '\n', between: ' ', after: '\n' },
  });

  // `Root.removeChild` copies the removed node's leading whitespace onto the
  // node that becomes first, so every `raws.before` is captured up front and
  // restored after the move. Without this the layered file loses all of its
  // line breaks and stops being reviewable against the unlayered one.
  const nodes = [...root.nodes];
  const befores = nodes.map(node => node.raws.before);

  const hoisted = [];
  nodes.forEach((node, index) => {
    node.remove();
    if (node.type === 'atrule' && TOP_LEVEL_ONLY.has(node.name.toLowerCase())) {
      hoisted.push(node);
    } else {
      layer.append(node);
    }
    node.raws.before = befores[index];
  });

  root.append(...hoisted);
  root.append(layer);
  return root.toString();
}

export { TOP_LEVEL_ONLY };
