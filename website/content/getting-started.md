---
title: Getting started
description: Install the plugin, register it, & read a first blob.
icon: "fa-solid fa-rocket"
templateEngineOverride: md
order: 1
---
Content written long after the last deploy (by a scheduled function, a form handler, or a webhook) has to reach templates at build time. This plugin fetches it from Netlify Blobs & keeps a local copy, so builds are fast, work offline, & degrade gracefully when the store is down.

## Install

Install alongside Eleventy 3 or newer. Node 22.12+ is required, which is the floor set by `@netlify/blobs`.

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

## Credentials

Reads that reach Netlify Blobs need `NETLIFY_SITE_ID` & `NETLIFY_TOKEN`. A read served from a warm cache needs no credentials at all, which is what lets a build run offline.
