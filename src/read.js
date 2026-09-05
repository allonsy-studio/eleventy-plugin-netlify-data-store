/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import { readCacheEntry, writeCacheEntry } from "./cache.js";
import { getStore } from "./store.js";

/**
 * Builds the failure envelope. Reads never throw: callers destructure
 * `meta` alongside the content keys, so an error has to arrive in the
 * same shape a success does.
 * @param {string} name
 * @param {string} storeName
 * @param {Error|string} error
 * @returns {{meta: {name: string, store: string, source: string, error: string}}}
 */
function errorEnvelope(name, storeName, error) {
	return {
		meta: {
			name,
			store: storeName,
			source: "blobs",
			error: error instanceof Error ? error.message : String(error),
		},
	};
}

/**
 * Marks an envelope served past its TTL, preserving the original `meta`
 * so a template can still show when the content was generated.
 * @param {object} value
 * @param {number} age
 * @returns {object}
 */
function markStale(value, age) {
	return { ...value, meta: { ...value?.meta, stale: true, cacheAge: age } };
}

/**
 * Reads a `{meta, ...content}` envelope by name.
 *
 * The local cache answers first while the entry is inside its TTL;
 * otherwise the Netlify Blobs store does, & the result is cached for the
 * next build. When the store cannot be reached & a stale entry exists,
 * it is served with `meta.stale` set unless `staleIfError` is disabled.
 * Every failure resolves to an envelope carrying `meta.error` rather than
 * throwing, so a template renders a fallback instead of failing the build.
 * @param {string} name
 * @param {string} [storeName]
 * @param {import("./index.js").DataStoreContext} context
 * @returns {Promise<object>}
 */
export async function readBlob(name, storeName, context) {
	storeName = storeName || context.storeName;

	let cached = await readCacheEntry(name, storeName, context);
	if (cached && !cached.expired) {
		context.log.log(`read "${name}" from cache (age ${Math.round(cached.age / 1000)}s)`);
		return cached.value;
	}

	try {
		let store = getStore(storeName, context);
		let value = await store.get(name, { type: "json" });

		if (value === null || value === undefined) {
			if (cached && context.staleIfError) {
				context.log.log(`"${name}" is gone from store "${storeName}"; serving the stale cache`);
				return markStale(cached.value, cached.age);
			}
			return errorEnvelope(name, storeName, `No blob named "${name}" in store "${storeName}".`);
		}

		context.log.log(`read "${name}" from Netlify Blobs store "${storeName}"`);
		await writeCacheEntry(name, storeName, value, context);
		return value;
	} catch (error) {
		context.log.error(`Could not read "${name}" from store "${storeName}": ${error.message}`);

		if (cached && context.staleIfError) {
			context.log.log(`serving the stale cache for "${name}" (age ${Math.round(cached.age / 1000)}s)`);
			return markStale(cached.value, cached.age);
		}

		return errorEnvelope(name, storeName, error);
	}
}
