---
title: Usage
description: Write an envelope from a function, read it back in a template.
order: 2
---
Something writes an envelope: a scheduled function, a form handler, or a webhook. A template reads the whole envelope back & destructures metadata & content together.

## Write

```js
import { createDataStore } from "@allons-y/eleventy-plugin-netlify-data-store";

const { writeBlob } = createDataStore();

export default async () =>
	writeBlob("activity", {
		meta: { generatedAt: new Date().toISOString() },
		entries: await fetchEntries(),
	});
```

## Read

{% raw %}
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
{% endraw %}

## Resolution order

Reads resolve in order: the local cache answers while the entry is younger than `ttl`; otherwise Netlify Blobs does, & the result is written into the cache for the next build. If the store cannot be reached, an expired entry is served with `meta.stale` set rather than failing.
