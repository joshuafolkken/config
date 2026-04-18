# @joshuafolkken/config

Shared toolchain config for TypeScript / SvelteKit projects.

Covers: ESLint · Prettier · TypeScript · Lefthook · cspell · VS Code · AI files (CLAUDE.md, AGENTS.md, GEMINI.md, prompts/, scripts-ai/)

## Authentication

GitHub Packages requires authentication even for public packages. Set up auth before installing:

1. Add the auth token to `.npmrc`:

   ```
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```

2. Export the token in your shell (uses your existing `gh` CLI session):

   ```bash
   export NODE_AUTH_TOKEN=$(gh auth token)
   ```

   If `gh auth token` fails or installation returns a 401, your token may be missing the `read:packages` scope. Re-authenticate with:

   ```bash
   gh auth login --scopes read:packages
   ```

## Install

Add the registry to `.npmrc` first (or let `config-init` do it):

```
@joshuafolkken:registry=https://npm.pkg.github.com
```

Then install:

```bash
pnpm add -D @joshuafolkken/config
```

## Setup

Run once after installing:

```bash
pnpm exec config-init
```

Auto-detects SvelteKit vs vanilla. Creates or merges:

| File                                  | Behavior                   |
| ------------------------------------- | -------------------------- |
| `.npmrc`                              | Adds registry line         |
| `eslint.config.js`                    | Created (shown if exists)  |
| `prettier.config.js`                  | Created (shown if exists)  |
| `playwright.config.ts`                | Created (shown if exists)  |
| `tsconfig.json`                       | Merges `extends`           |
| `cspell.config.yaml`                  | Merges `import`            |
| `lefthook.yml`                        | Merges `extends`           |
| `.vscode/extensions.json`             | Merges `recommendations`   |
| `.vscode/settings.json`               | Merges missing keys        |
| `package.json`                        | Merges missing scripts     |
| `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` | Copied (skipped if exists) |
| `prompts/`, `scripts-ai/`             | Copied (skipped if exists) |

Runs `lefthook install` at the end.

## Update AI files

To overwrite AI files with the latest version from the package:

```bash
pnpm exec config-sync
```

## Package exports

Use individual configs directly if you prefer manual setup:

```js
// eslint.config.js

// or
import { create_sveltekit_config } from '@joshuafolkken/config/eslint/sveltekit'
import { create_vanilla_config } from '@joshuafolkken/config/eslint/vanilla'
```

```js
// prettier.config.js
import { config } from '@joshuafolkken/config/prettier'
```

```jsonc
// tsconfig.json
{ "extends": ["@joshuafolkken/config/tsconfig/base"] }
// or sveltekit:
{ "extends": [".svelte-kit/tsconfig.json", "@joshuafolkken/config/tsconfig/sveltekit"] }
```

```yaml
# cspell.config.yaml
import:
  - node_modules/@joshuafolkken/config/cspell/index.yaml
```

```yaml
# lefthook.yml
extends:
  - node_modules/@joshuafolkken/config/lefthook/vanilla.yml
  # or sveltekit.yml
```
