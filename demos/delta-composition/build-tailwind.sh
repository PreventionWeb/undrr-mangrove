#!/usr/bin/env bash
#
# Regenerate css/tailwind.built.css with the real Tailwind 4 CLI.
#
# Tailwind is installed into a throwaway temp directory rather than into this
# repository, because this demo must not add a dependency to package.json.
# The generated CSS is committed so the page opens with no build step.
#
# Usage:  ./build-tailwind.sh    (run from demos/delta-composition/)
set -euo pipefail

DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

echo "Installing Tailwind 4 into $WORK_DIR"
(
  cd "$WORK_DIR"
  npm init -y >/dev/null
  npm install --no-audit --no-fund tailwindcss@4 @tailwindcss/cli@4 >/dev/null
)

# css/tailwind.in.css is the source of record. It is copied here with its
# @source globs rewritten to absolute paths, because compilation happens from
# the temp directory where tailwindcss is resolvable.
sed \
  -e "s#@source '../index.html';#@source '$DEMO_DIR/index.html';#" \
  -e "s#@source '../js/demo.js';#@source '$DEMO_DIR/js/demo.js';#" \
  "$DEMO_DIR/css/tailwind.in.css" >"$WORK_DIR/in.css"

"$WORK_DIR/node_modules/.bin/tailwindcss" \
  -i "$WORK_DIR/in.css" \
  -o "$DEMO_DIR/css/tailwind.built.css"

echo "Wrote $DEMO_DIR/css/tailwind.built.css"
