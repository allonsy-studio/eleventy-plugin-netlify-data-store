---
title: API & options
description: Three runtime functions, a date filter, & every option.
order: 3
---
Three runtime functions & a date filter, all bound to the options passed at registration.

## Functions

| Function | Returns | Behavior |
| --- | --- | --- |
| `readBlob(name, storeName?)` | `Promise<object>` | Cache first, then Netlify Blobs. Returns the full `{ meta, ...content }` envelope, or `{ meta: { error } }` on any failure. Never throws |
| `writeBlob(name, data, storeName?)` | `Promise<object>` | Writes to the store & refreshes the cached copy. Returns `{ statusCode, body }`, never throws |
| `listData(storeName?)` | `Promise<string[]>` | The blob keys held in the store |

## Options

| Option | Type | Default | Behavior |
| --- | --- | --- | --- |
| `storeName` | `string` | `"content"` | The Netlify Blobs store every call uses unless one is named explicitly |
| `ttl` | `string \| number` | `"1h"` | How long a cached entry stays fresh. Takes `eleventy-fetch` durations: `"30m"`, `"1h"`, `"7d"`, plus `"*"` to never expire & `0` to always refetch. An unparseable value throws at registration |
| `staleIfError` | `boolean` | `true` | Serve an expired entry when the store is unreachable, flagged with `meta.stale` & `meta.cacheAge`. Set `false` to never serve data past its TTL |
| `cacheDir` | `string` | `".netlify/blobs-cache"` | The local, uncommitted cache. Each file wraps the value with the time it was fetched. Written by the plugin, safe to delete, & gitignored via `.netlify` |
| `siteID` / `token` | `string` | from the environment | Fall back to `NETLIFY_SITE_ID` & `NETLIFY_TOKEN`. Missing credentials are logged as a configuration error, then returned as the usual envelope |
| `quiet` | `boolean` | `false` | Suppress the per-read log line. Errors are always surfaced. Logging routes through Eleventy's own logger |
| `filterName` | `string \| false` | `"generatedAt"` | Name of the registered date filter for `meta.generatedAt`; `false` skips registration. Pair with `locale` & `dateFormat` |
