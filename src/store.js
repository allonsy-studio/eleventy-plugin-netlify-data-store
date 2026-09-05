/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import { getStore as getNetlifyStore } from "@netlify/blobs";

/**
 * Returns the cached `@netlify/blobs` store for `storeName`, creating it
 * on first use. Throws when credentials are missing: that is a
 * configuration error rather than a data error, so it is not swallowed
 * into an envelope here.
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

	if (!siteID || !token) {
		throw new Error(
			"Missing Netlify Blobs credentials: set NETLIFY_SITE_ID & NETLIFY_TOKEN, or pass `siteID` & `token` as plugin options."
		);
	}

	let factory = context.getStore ?? getNetlifyStore;
	let store = factory({ name: storeName, siteID, token });
	context.stores.set(storeName, store);
	return store;
}
