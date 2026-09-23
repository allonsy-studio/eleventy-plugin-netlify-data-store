---
"@allons-y/eleventy-plugin-netlify-data-store": patch
---

A custom `getStore` factory no longer needs `siteID` & `token`. The plugin only checks for Netlify Blobs credentials when it uses its default `@netlify/blobs` factory; a custom factory owns its own configuration & receives `siteID`/`token` only when they are set. If you were passing placeholder credentials to get past the check, you can remove them.

Reads & writes through a custom factory now log a `custom` store rather than a Netlify Blobs one, & a read's error envelope reports `meta.source: "custom"` instead of `"blobs"`. The default path is unchanged.
