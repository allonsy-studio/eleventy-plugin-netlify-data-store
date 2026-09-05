/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import { writeCacheEntry } from "./cache.js";
import { getStore } from "./store.js";

/**
 * Writes a `{meta, ...content}` envelope to the Netlify Blobs store &
 * refreshes the local cache so a following read sees it immediately.
 * Like reads, writes never throw — the response shape carries the outcome.
 * @param {string} name
 * @param {object} data
 * @param {string} [storeName]
 * @param {import("./index.js").DataStoreContext} context
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export async function writeBlob(name, data, storeName, context) {
	storeName = storeName || context.storeName;

	if (data === undefined || data === null) {
		return {
			statusCode: 400,
			body: `Refusing to write "${name}": no data supplied.`,
		};
	}

	try {
		let store = getStore(storeName, context);
		await store.setJSON(name, data);
		context.log.log(`wrote "${name}" to Netlify Blobs store "${storeName}"`);
		await writeCacheEntry(name, storeName, data, context);
		return { statusCode: 200, body: `Wrote "${name}" to store "${storeName}".` };
	} catch (error) {
		context.log.error(`Could not write "${name}" to store "${storeName}": ${error.message}`);
		return { statusCode: 500, body: error.message };
	}
}
