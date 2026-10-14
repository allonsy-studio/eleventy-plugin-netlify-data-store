---
title: Compatibility
description: Supported Eleventy & Node versions, & use outside Eleventy.
icon: "fa-solid fa-circle-check"
order: 4
---
- <span class="fa-solid fa-check" aria-hidden="true"></span> **Eleventy 3.0+**: declared as an optional peer dependency.
- <span class="fa-solid fa-check" aria-hidden="true"></span> **Node.js 22.12+**: the floor set by `@netlify/blobs`. Pure ESM, no build step.
- <span class="fa-solid fa-check" aria-hidden="true"></span> **Outside Eleventy**: `createDataStore()` works in any Netlify Function.
- <span class="fa-solid fa-check" aria-hidden="true"></span> **Any environment**: caching is governed by `ttl`, never by `NODE_ENV`.
