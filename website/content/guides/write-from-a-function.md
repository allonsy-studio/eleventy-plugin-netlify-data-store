---
title: Write from a scheduled function
description: Produce an envelope outside Eleventy & store it in Netlify Blobs.
icon: "fa-solid fa-pen-to-square"
templateEngineOverride: md
order: 4
---
Something has to write the content a build reads: a scheduled function, a form handler, or a webhook. Outside Eleventy, build a store directly with `createDataStore`:

```js
import { createDataStore } from "@allons-y/eleventy-plugin-netlify-data-store";

const { writeBlob } = createDataStore({ storeName: "content" });

export default async () =>
	writeBlob("activity", {
		meta: { generatedAt: new Date().toISOString() },
		entries: await fetchEntries(),
	});
```

## Include `meta.generatedAt`

The `generatedAt` filter & the stale flag both build on `meta.generatedAt`, so set it to an ISO timestamp every time the content is produced. Everything else in the envelope is the writer's to define.

## Check the response

`writeBlob` never throws. It resolves to `{ statusCode, body }`: `200` on success, `400` when no data was supplied, & `500` with the error message when the store rejects the write. A function that should fail loudly on a bad write can check `statusCode` & throw.

## Credentials

Set `NETLIFY_SITE_ID` & `NETLIFY_TOKEN` in the function's environment, or pass `siteID` & `token` as options. See [How it works](/how-it-works/).

A successful write also refreshes the local cache, so a read that follows in the same process sees the new value immediately.
