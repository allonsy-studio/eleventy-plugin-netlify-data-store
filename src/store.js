/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import { getStore as getNetlifyStore } from "@netlify/blobs";

/**
 * Names where a store's data comes from: `"custom"` for a supplied
 * `getStore` factory, `"blobs"` for `@netlify/blobs`.
 * @param {import("./index.js").DataStoreContext} context
 * @returns {"custom"|"blobs"}
 */
export function storeSource(context) {
	return context.getStore ? "custom" : "blobs";
}

/**
 * Human-readable store kind for log lines.
 * @param {import("./index.js").DataStoreContext} context
 * @returns {string}
 */
export function storeLabel(context) {
	return context.getStore ? "custom" : "Netlify Blobs";
}

/**
 * Returns the cached store for `storeName`, creating it on first use.
 * Throws when the default `@netlify/blobs` factory has no credentials:
 * that is a configuration error rather than a data error, so it is not
 * swallowed into an envelope here. A custom factory owns its own
 * configuration & is never blocked.
 * @param {string} storeName
 * @param {import("./index.js").DataStoreContext} context
 * @returns {object}
 */
export function getStore(storeName, context) {
	if (context.stores.has(storeName)) {
		return context.stores.get(storeName);
	}

	let siteID = context.siteID ?? process.env.NETLIFY_SITE_ID;
	let token = context.token ?? process.env.NETLIFY_TOKEN;

	if (!context.getStore && (!siteID || !token)) {
		throw new Error(
			"Missing Netlify Blobs credentials: set NETLIFY_SITE_ID & NETLIFY_TOKEN, or pass `siteID` & `token` as plugin options."
		);
	}

	let factory = context.getStore ?? getNetlifyStore;
	let store = factory({ name: storeName, siteID, token });
	context.stores.set(storeName, store);
	return store;
}
