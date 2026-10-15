---
title: Getting started
description: Install the plugin, register it, & read a first blob.
templateEngineOverride: md
order: 1
---
Content written long after the last deploy (by a scheduled function, a form handler, or a webhook) has to reach templates at build time. This plugin fetches it from Netlify Blobs & keeps a local copy, so builds are fast, work offline, & degrade gracefully when the store is down.

## Requirements

- Node.js 22.12 or newer, the floor set by `@netlify/blobs`
- Eleventy 3 or newer

## Install

```sh
# yarn
yarn add @allons-y/eleventy-plugin-netlify-data-store

# npm
npm install @allons-y/eleventy-plugin-netlify-data-store
```

## Register the plugin

Register the plugin, then wire the reads wanted into global data. `immediate: true` runs the plugin during the config file rather than after it, which is what lets the store be destructured on the spot.

```js
import netlifyDataStore from "@allons-y/eleventy-plugin-netlify-data-store";

export default function (eleventyConfig) {
	let { readBlob } = eleventyConfig.addPlugin(netlifyDataStore, {
		immediate: true,
		storeName: "content",
		ttl: "1h",
	});

	eleventyConfig.addGlobalData("activity", () => readBlob("activity"));
}
```

## Set credentials

Reads that reach Netlify Blobs need `NETLIFY_SITE_ID` & `NETLIFY_TOKEN` in the environment. A read served from a warm cache needs neither, which is what lets a build run offline.

## Next steps

- [How it works](/how-it-works/): the envelope, the cache, & the order reads resolve in.
- [Configuration](/configuration/): every option & what it affects.
- [Guides](/guides/write-from-a-function/): write from a function, read in templates, & build offline.
