---
title: Build offline & in CI
description: Run builds from a warm cache with no credentials & no network.
templateEngineOverride: md
order: 6
---
A read served from the local cache needs no network & no credentials. That makes offline work, fast CI builds, & reproducible tests possible with one habit: warm the cache once.

## Warm the cache

Run one build with `NETLIFY_SITE_ID` & `NETLIFY_TOKEN` set. Every blob the build reads is written to `.netlify/blobs-cache`. Builds inside the `ttl` window then read from disk.

The cache applies to every build: local, CI, & production alike. `NODE_ENV` plays no part, so a CI build with a warm cache is as fast as a local one.

## Choose a `ttl`

| Goal | Setting |
| --- | --- |
| Fewer Blobs calls, fresh enough content | `ttl: "1h"` (the default) |
| Always the latest content | `ttl: 0` |
| A frozen fixture that never expires | `ttl: "*"` |

## Survive an outage

With `staleIfError` on (the default), a build that cannot reach the store serves the expired copy & flags it with `meta.stale`. Templates that check `meta.stale` can say the content is from an earlier build. See [Read in templates](/guides/read-in-templates/).

## Test without Netlify

The repository's `sample/` is a minimal Eleventy site that reads entirely from the cache. It points `cacheDir` at a committed fixture & pins `ttl: "*"` so the fixture never expires, which needs no network access & no credentials:

```sh
yarn sample
```

To test code that reads blobs without a store at all, supply a [`getStore`](/configuration/) factory. A custom factory skips the credential check.
