---
title: How it works
description: The envelope, the order reads resolve in, & the local cache.
templateEngineOverride: md
order: 2
---
## The envelope

Every blob is a `{ meta, ...content }` envelope. Whatever writes it decides the content keys; `meta` carries the facts about the entry, so a template can destructure both together.

| Key | Set by | Meaning |
| --- | --- | --- |
| `meta.generatedAt` | The writer | When the content was produced. The `generatedAt` filter formats it |
| `meta.stale` | The plugin | `true` when an expired entry was served because the store was unreachable |
| `meta.cacheAge` | The plugin | How old a stale entry is, in milliseconds |
| `meta.error` | The plugin | The reason a read failed. Present only on the error envelope |

Reads & writes never throw. A failed read resolves to `{ meta: { error } }` & a failed write to `{ statusCode, body }`, so a template renders a fallback instead of failing the build.

## Read order

`readBlob` resolves in this order:

1. **The local cache**, when the entry exists & is younger than `ttl`.
2. **Netlify Blobs** otherwise, & the result is written into the cache for the next build.
3. **The stale cache**, if the store could not be reached & `staleIfError` is on. The envelope comes back with `meta.stale` & `meta.cacheAge` added, & the original `meta.generatedAt` intact.

`writeBlob` writes to the store & refreshes the cached copy, so a read that follows it sees the new value immediately.

## The local cache

`cacheDir` holds a mirror of the store at `<cacheDir>/<storeName>/<name>.json`. Each file wraps the value with the time it was fetched:

```json
{
	"cachedAt": "2026-09-05T06:15:00.000Z",
	"value": { "meta": { "generatedAt": "2026-09-05T06:00:00.000Z" }, "entries": [] }
}
```

It is a cache, not a fixture: written by the plugin, never committed, & safe to delete. Add it to `.gitignore`:

```gitignore
.netlify
```

Warming it takes one build with credentials present. Every build after that runs offline until the TTL lapses. The cache applies to every build, not just local development: caching is governed by `ttl`, never by `NODE_ENV`.

## Credentials

`NETLIFY_SITE_ID` & `NETLIFY_TOKEN` must be set for any read or write that reaches Netlify Blobs through the default `@netlify/blobs` factory. Missing credentials are a configuration error: the failure is logged, & the read or write converts it into the usual envelope or `{ statusCode: 500 }`, so the build still completes.

A custom [`getStore`](/configuration/) factory skips the check, because it owns its own configuration.
