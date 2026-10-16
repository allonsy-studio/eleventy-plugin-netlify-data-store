---
title: Configuration
description: Pass options to the plugin, & what the common ones do.
templateEngineOverride: md
order: 3
---
Pass options as the second argument to `addPlugin`, or to `createDataStore` outside Eleventy. Every option is optional; the defaults are:

```js
eleventyConfig.addPlugin(netlifyDataStore, {
	storeName: "content",             // default Netlify Blobs store
	cacheDir: ".netlify/blobs-cache", // local, uncommitted cache
	ttl: "1h",                        // how long a cached entry stays fresh
	staleIfError: true,               // serve an expired entry if the store is unreachable
	siteID: undefined,                // defaults to process.env.NETLIFY_SITE_ID
	token: undefined,                 // defaults to process.env.NETLIFY_TOKEN
	quiet: false,                     // suppress per-read logging (errors still log)
	locale: "en-GB",                  // for formatGeneratedAt
	dateFormat: undefined,            // Intl.DateTimeFormat options for formatGeneratedAt
	filterName: "generatedAt",        // filter to register; false to skip
	getStore: undefined,              // advanced: supply your own store factory
});
```

The [Reference](/reference/#options) lists every option with its type.

## ttl

Accepts the same duration strings as `eleventy-fetch`: `"30s"`, `"30m"`, `"1h"`, `"7d"`, `"2w"`, `"1y"`. Use `"*"` to never expire & `0` to refetch on every build. A raw number is milliseconds. An unparseable value throws at registration rather than mid-build.

## staleIfError

On by default. When the entry has expired & the store cannot be reached (an outage, a missing credential, a deleted blob), the expired copy is served rather than failing. It carries `meta.stale: true` & `meta.cacheAge` in milliseconds, so a template can say how old it is.

Set it to `false` to never serve data past its TTL. Reads then return the usual error envelope.

## getStore

Replaces the default `@netlify/blobs` factory. It is called once per store name with `{ name, siteID, token }` & must return an object with the methods the plugin uses: `get(key, { type: "json" })`, `setJSON(key, value)`, & `list()`. Use it to read from somewhere other than a Netlify Blobs store the build can reach directly, such as an HTTP endpoint:

```js
eleventyConfig.addPlugin(netlifyDataStore, {
	getStore: ({ name }) => ({
		async get(key) {
			let response = await fetch(`https://example.com/.netlify/functions/blobs/${name}/${key}`);
			return response.ok ? response.json() : null;
		},
	}),
});
```

With a custom factory, credentials are optional, log lines name a `custom` store, & a read's error envelope carries `meta.source: "custom"` instead of `"blobs"`.

## The date filter

The plugin registers a filter named by `filterName` that formats `meta.generatedAt`. `locale` & `dateFormat` shape the output, & `dateFormat` takes any `Intl.DateTimeFormat` options. Set `filterName` to `false` to skip registering the filter.
