# Scripts

Utility scripts for the Mangrove project.

| Directory/File | Purpose |
|----------------|---------|
| `ai-manifest/` | AI-friendly component manifest pipeline. Generates llms.txt, component JSON, and CSS utility reference for AI agents. Entry point: `generate-ai-manifest.js`. |
| `update-cdn-version.js` | Updates CDN links in documentation files to the current version from `package.json`. Run after each release. |
| `build-tokens.cjs` | Builds `stories/assets/scss/generated/_tokens-*.scss` from `tokens/*.yaml` (`yarn build:tokens`, run by `yarn scss`). The generated partials are not committed, so `tokens/output-baseline.json` holds a SHA-256 of each of them and `tokens-source.test.js` fails if the generator stops matching it. **After any deliberate `tokens/*.yaml` change, run `yarn build:tokens` and then `node scripts/build-tokens.cjs --baseline`, and commit the updated baseline with it.** |

See also [`CONTRIBUTING.md`](../CONTRIBUTING.md#ai-manifest-for-component-discovery) for the contributor-facing summary of what to update when components change.
