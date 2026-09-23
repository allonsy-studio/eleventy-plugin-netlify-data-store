# @allons-y/eleventy-plugin-netlify-data-store

## 0.1.1

### Patch Changes

- 98b40d5: A custom `getStore` factory no longer needs `siteID` & `token`. The plugin only checks for Netlify Blobs credentials when it uses its default `@netlify/blobs` factory; a custom factory owns its own configuration & receives `siteID`/`token` only when they are set. If you were passing placeholder credentials to get past the check, you can remove them.
  
  Reads & writes through a custom factory now log a `custom` store rather than a Netlify Blobs one, & a read's error envelope reports `meta.source: "custom"` instead of `"blobs"`. The default path is unchanged.

## 0.1.0

### Minor Changes

- e255f78: First release of the Netlify data store plugin.
  
  Content lives in a Netlify Blobs store — written by whatever writes it, a scheduled function, a form handler, a webhook — & is read at build time through a local cache. Every value uses a `{ meta, ...content }` envelope, & every read returns the whole envelope so a template destructures metadata & content together.
  
  Reads are cache-first. An entry younger than `ttl` is served straight from disk without constructing the store; anything older is fetched from Blobs & written back to the cache, so the next build inside the window needs no network & no credentials. `ttl` defaults to one hour & takes the same duration strings as `eleventy-fetch` — `"30m"`, `"1h"`, `"7d"` — plus `"*"` to never expire & `0` to refetch every time. This applies to every build, CI & production included, not just local development; nothing keys off `NODE_ENV`.
  
  Reads & writes never throw. When the store cannot be reached & an expired entry exists, that entry is served with `meta.stale` & `meta.cacheAge` added & the original `meta.generatedAt` intact — turn it off with `staleIfError: false`. Past that, a failed read resolves to an envelope carrying `meta.error` & a failed write to `{ statusCode, body }`, so a template renders a fallback instead of failing the build.
  
  `writeBlob` writes to the store & refreshes the cached copy. Configure the store name, cache directory, TTL, stale behaviour, credentials, & logging through plugin options; `readBlob`, `writeBlob`, `listData`, & a `generatedAt` filter come back for use from your config, data files, & functions.
