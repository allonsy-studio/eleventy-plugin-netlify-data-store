---
title: Compatibility
description: Supported Eleventy & Node versions, & use outside Eleventy.
icon: circle-check
templateEngineOverride: md
order: 8
---
- **Eleventy 3.0+**: declared as an optional peer dependency.
- **Node.js 22.12+**: the floor set by `@netlify/blobs`. Pure ESM, no build step.
- **Outside Eleventy**: `createDataStore()` works in any Netlify Function.
- **Any environment**: caching is governed by `ttl`, never by `NODE_ENV`.
