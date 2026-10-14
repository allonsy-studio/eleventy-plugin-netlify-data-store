---
title: Read in templates
description: Load blobs into global data, & render the stale & error states.
icon: "fa-solid fa-code"
templateEngineOverride: md
order: 5
---
Wire each read into global data in the Eleventy config, & the whole envelope is available to every template.

```js
eleventyConfig.addGlobalData("activity", () => readBlob("activity"));
```

## Reach the store from a callback

`immediate: true` makes the store available while the config file runs, which is what makes destructuring work. Without it, reach for `eleventyConfig.netlifyDataStore` from inside a callback, where the plugin has already run:

```js
eleventyConfig.addPlugin(netlifyDataStore, { ttl: "1h" });

eleventyConfig.addGlobalData("activity", () =>
	eleventyConfig.netlifyDataStore.readBlob("activity")
);
```

## Render every state

A read resolves to the content, the content flagged stale, or an error envelope. Check `meta` first so a template renders a fallback instead of failing the build:

```html
{% if activity.meta.error %}
  <p>Activity unavailable.</p>
{% else %}
  <p>Updated {{ activity.meta.generatedAt | generatedAt }}</p>
  {%- if activity.meta.stale %}<p>Last cached copy.</p>{%- endif %}
  <ul>
  {%- for entry in activity.entries %}
    <li>{{ entry.title }}</li>
  {%- endfor %}
  </ul>
{% endif %}
```

`meta.cacheAge` is the stale entry's age in milliseconds, for a message such as "last updated 3 hours ago". See [How it works](/how-it-works/) for every `meta` key.

## Read from another store

Both `readBlob` & `listData` take an optional store name as their last argument, & fall back to the `storeName` option.

```js
let drafts = await listData("drafts");
let first = await readBlob(drafts[0], "drafts");
```
