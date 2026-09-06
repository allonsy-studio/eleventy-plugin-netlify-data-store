# Contributing to @allons-y/eleventy-plugin-netlify-data-store

This project follows the [Allons-y Studio Contributing Guide](https://github.com/allonsy-studio/.github/blob/main/CONTRIBUTING.md) for the general workflow (forking, branching, conventional commits, PR etiquette). The notes below cover **plugin-specific** topics: how the cache and the store fit together, how to add to the runtime API, the local test/lint commands, and how releases are cut with [Changesets](https://github.com/changesets/changesets).

Allons-y — let's go! Contributions of all kinds are welcome: new options, bug fixes, documentation improvements, and test coverage. If you're unsure whether your idea fits the project, open an issue first and we'll figure it out together.

## Before you start

1. **Search existing issues** before opening a new one — your bug or idea may already be in progress.
2. **Open an issue** to discuss non-trivial changes (new runtime functions, breaking API changes, new dependencies) before writing code. This saves everyone time and avoids PRs that can't be merged.
3. **Fork the repository** and clone your fork locally:
    ```sh
    git clone https://github.com/<your-username>/eleventy-plugin-netlify-data-store.git
    cd eleventy-plugin-netlify-data-store
    corepack enable
    yarn install
    ```

## Development workflow

### Branching

Create a branch from `main` that describes your change:

```sh
git checkout -b fix/cache-miss-on-malformed-json
git checkout -b feat/add-blob-delete
```

### How the pieces fit together

There is one source of truth & one cache in front of it:

| Stage | Behaviour |
| --- | --- |
| Cache hit, inside `ttl` | Returned as-is; the store is never constructed |
| Cache miss or expired | Fetched from Netlify Blobs, then written to the cache |
| Store unreachable, stale entry present | The stale entry is served with `meta.stale` (unless `staleIfError` is off) |
| Store unreachable, nothing cached | An error envelope |

The plugin must never read Eleventy's data directory. Content that belongs in
git belongs in `_data/`, which Eleventy loads on its own — this package is
about the Blobs half only.

### Adding to the runtime API

Pick the right home:

| Kind | Where it lives | Registration |
| --- | --- | --- |
| Runtime function | `src/<name>.js`, taking `context` as its last argument | Bound to the options object in `createDataStore()` in `src/index.js` |
| Plugin option | The defaults object in `normalizeOptions()` in `src/index.js` | Documented in the README options block & the `DataStoreOptions` typedef |
| Cache behaviour | `src/cache.js` — paths, the on-disk entry shape, duration parsing, expiry | Imported by `read.js` & `write.js` |
| Eleventy binding (filter, watch target) | The plugin body in `src/index.js` | Registered inside `netlifyDataStorePlugin()`, guarded so a bare config object still works |
| Store plumbing | `src/store.js` | Imported by `read.js`, `write.js`, & `list.js` |

Each addition must:

1. **Carry an SPDX header.** Every file under `src/` & `test/` opens with the MPL-2.0 block; `yarn lint` fails without it.
2. **Never throw on a data error.** Reads resolve to a `{ meta: { name, store, source, error } }` envelope & writes to `{ statusCode, body }`. A malformed cache file, a dead network, & absent credentials are all data errors from a template's point of view. Only `getStore` & an unparseable `ttl` throw, & both are configuration errors surfaced before or around the call.
3. **Take `context` as its last argument** rather than reading module-level state, so a caller can hold two differently-configured stores at once.
4. **Stay environment-agnostic.** Behaviour is governed by `ttl` & `staleIfError`, never by `NODE_ENV` — a build must behave the same locally & in CI.
5. **Carry full JSDoc** with `@param` & `@returns`. Keep comments short — details belong in the README, not in the source.
6. **Have an Ava spec** under `test/<module>.test.js` covering the happy path, the failure envelope, & the fresh/expired split where relevant.
7. **Be documented in `README.md`** — added to the API or options table.

### Testing against Netlify Blobs

**Tests never hit the network.** Pass a fake store factory through the `getStore` option; `test/_helpers.js` provides `fakeBlobs()` & `failingBlobs()` for the success and failure paths, plus `seedCache()` to plant a cache entry of a given age. Anything that reads `process.env` — `NETLIFY_SITE_ID`, `NETLIFY_TOKEN` — must use `test.serial` with the `setEnv` / `clearCredentials` helpers, since the environment is process-global.

### Running commands

```sh
yarn test                       # Run the Ava suite once
yarn test:watch                 # Watch mode
yarn lint                       # ESLint over src/ and test/
yarn format                     # yarn lint --fix
yarn sample                     # Build the sample site offline against the cache fixture
yarn changeset                  # Add a changeset for your PR (see below)
```

### Linting and formatting

ESLint (flat config in `eslint.config.js`) covers `.js` and enforces the MPL-2.0 SPDX header on everything under `src/` and `test/` via `eslint-plugin-license-header`. Formatting conventions live in `.editorconfig` — tabs, LF, final newline.

### The sample site

`sample/` is a minimal Eleventy site that reads entirely from the cache, with no network access and no credentials. It points `cacheDir` at the committed fixture in `sample/blobs-cache/` rather than the real `.netlify/blobs-cache`, and pins `ttl: "*"` so that fixture never expires — which is why `yarn sample` works anywhere, forever. The plugin test suite builds it end to end, so a change that breaks the sample breaks CI.

### Commit messages

Conventional Commits (`feat:`, `fix:`, `chore:`, …) are **encouraged** for scannable history, but no longer enforced — version bumps come from changesets, not commit messages. Use a scope like `read` or `cache` when the change is localized to one module.

### Pull requests

- Keep PRs focused — one logical change per PR.
- Every new capability or changed behavior **must** include tests and a README update.
- **Every PR that changes the published surface needs a changeset.** Run `yarn changeset` and commit the generated file alongside your changes. PRs without a changeset will not produce a release.
- Fill out the PR description — explain the "why", not just the "what". If you're adding an option, include a config-side usage example.
- New dependencies require a brief justification in the PR description. This package ships one runtime dependency on purpose.

## Project structure

```sh
eleventy-plugin-netlify-data-store/
├── package.json                # npm package manifest
├── src/                        # Source — pure ESM, no build step
│   ├── index.js                # Plugin entry, option defaults, createDataStore()
│   ├── cache.js                # Cache paths, entry format, ttl parsing & expiry
│   ├── store.js                # getStore() + the Map-based store cache
│   ├── read.js                 # readBlob() — cache, then Blobs, then stale fallback
│   ├── write.js                # writeBlob() — Blobs, then refresh the cache
│   ├── list.js                 # listData()
│   ├── format.js               # formatGeneratedAt() + shared Intl.DateTimeFormat
│   └── logger.js               # Eleventy logger passthrough, console fallback
├── test/                       # Ava specs mirroring src/
├── sample/                     # Minimal Eleventy site reading from a committed cache fixture
├── docs/                       # Landing page published to GitHub Pages
├── eslint.config.js
├── .changeset/                 # Pending changesets + Changesets config
└── .github/
    └── workflows/              # CI automation
```

## Release process

Releases are managed by [Changesets](https://github.com/changesets/changesets).

**As a contributor:**

1. Make your changes on a feature branch.
2. Run `yarn changeset`, pick the bump type (`patch` / `minor` / `major`), and write a short user-facing summary.
3. Commit the generated `.changeset/*.md` file with your PR.

**What happens on merge:**

1. On every push to `main`, the **Release** workflow asks `changesets/action/select-mode` whether the repo needs versioning or publishing.
2. If pending changesets exist, the **version** job opens (or updates) a **"Version packages"** PR that consumes them, bumps `package.json`, and prepends an entry to `CHANGELOG.md`.
3. Merging the "Version packages" PR triggers the workflow again. This time there are no changesets and an unpublished version, so the **publish** job publishes to npm and tags the release on GitHub.

**Do not** edit `version` in `package.json` or the released sections of `CHANGELOG.md` by hand — those are owned by the Release workflow.

### npm authentication

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers). There is no npm token: the publish job requests a GitHub Actions OIDC token, and Yarn exchanges it with npm for a short-lived, single-package publish credential. That is also what signs the [provenance](https://docs.npmjs.com/generating-provenance-statements) attestation enabled by `publishConfig.provenance` in `package.json`.

For this to work, npm must list this repository's `release.yml` workflow as a trusted publisher for the package — under **Settings → Trusted publisher** on the package's npm page, or with `npm trust github` (npm 11.15+). Publishing fails with `YN0033: No authentication configured for request` when that entry is missing, because Yarn has no other credential to fall back on.

Two things follow from this:

- **A new package cannot bootstrap itself.** npm only accepts a trusted publisher for a package that already exists, so the very first version of a new package has to be published by a maintainer running `npm publish` while signed in. Every release after that goes through the workflow.
- **Yarn ignores `.npmrc`.** An `NPM_TOKEN` secret and a `registry-url:` on `setup-node` do nothing here — both write to `.npmrc`, which Yarn Berry does not read. Yarn only reads `.yarnrc.yml` and `YARN_NPM_*` environment variables. Don't add either back expecting them to authenticate the publish.

## Code of Conduct

This project is governed by the [Allons-y Studio Code of Conduct](https://github.com/allonsy-studio/.github/blob/main/CODE_OF_CONDUCT.md). By participating you agree to uphold a welcoming and respectful environment for everyone. Report unacceptable behavior to **report@allons-y.studio**.

## Security

To report a security vulnerability, **do not open a public issue**. See the [Allons-y Studio Security Policy](https://github.com/allonsy-studio/.github/blob/main/SECURITY.md) for the disclosure process.
