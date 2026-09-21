# @allons-y/eleventy-plugin-netlify-data-store

An Eleventy v3 plugin that reads & writes build-time content from Netlify Blobs, with
a TTL-based local cache so builds stay fast and survive going offline. ESM only,
Node >= 22.12, Yarn 4. `@11ty/eleventy` (>= 3.0.0) is a peer dependency.
`@netlify/blobs` is the only runtime dependency, and it should stay that way.

## Layout

| Path        | Purpose                                                               |
| ----------- | --------------------------------------------------------------------- |
| `src/index.js` | Plugin entry: `normalizeOptions`, `createDataStore`, default export |
| `src/store.js` | Resolves & memoizes the Netlify Blobs store per store name         |
| `src/cache.js` | TTL parsing & on-disk cache paths                                  |
| `src/read.js` / `write.js` / `list.js` | The three store operations             |
| `src/format.js` | Timestamp formatting (`formatGeneratedAt`)                        |
| `src/logger.js` | `createLogger`, with a `quiet` option                             |
| `test/`     | AVA specs, one per `src` module, plus `_helpers.js`                   |
| `sample/`   | A runnable Eleventy site with a committed `blobs-cache/` fixture      |
| `docs/`     | The published GitHub Pages site (its own CSS token set)               |

## Commands

```sh
yarn test        # ava
yarn test:watch
yarn lint        # eslint
yarn format      # eslint --fix
yarn sample      # build the sample site against the committed cache fixture
```

`yarn sample` is the fastest way to see a real build: it runs with
`NODE_ENV=development` against `sample/blobs-cache/`, so it needs no Netlify
credentials.

## Credentials

Live store access needs `NETLIFY_SITE_ID` & `NETLIFY_TOKEN` in the environment, or
`siteID` & `token` passed as plugin options. `getStore` throws with that message when
neither is present. Tests must never need real credentials; inject a `getStore`
factory through the context instead, the way `test/_helpers.js` does.

## Conventions

- Every source file carries an SPDX copyright header. New files get one too.
- Keep code self-documenting. When a comment is warranted, keep it brief and explain
  only the *why* the code can't show; never restate what the code does.
- README sections between `weaver:*:START` / `weaver:*:END` markers are auto-generated
  by Weaver; never edit inside them.

## Commits, releases & pull requests

Conventional Commits. Releases are automated by Changesets: any change that affects
consumers ships with `yarn changeset`, and its summary becomes the CHANGELOG entry, so
write it for the upgrader rather than the reviewer. Docs, CI, and test-only changes
need no changeset. Never hand-edit `CHANGELOG.md` or the `version` field in
`package.json`.

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) for the full contributor flow.

Never add AI attribution to a commit or a PR: no `Co-Authored-By` trailer, no
"Generated with …" footer, no session URLs.

## Prose style

Prose in this repo (README, commit bodies, PR descriptions) follows the
[studio style guide](https://github.com/allonsy-studio/.github/blob/main/AGENTS.md#style-guide):
sentence-case headings, `&` over "and", `:` over em dashes.
