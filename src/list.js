/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import { getStore } from "./store.js";

/**
 * Lists the blob keys held in a store. Always returns an array — failures
 * log & resolve to an empty list.
 * @param {string} [storeName]
 * @param {import("./index.js").DataStoreContext} context
 * @returns {Promise<string[]>}
 */
export async function listData(storeName, context) {
	storeName = storeName || context.storeName;

	try {
		let store = getStore(storeName, context);
		let { blobs = [] } = (await store.list()) ?? {};
		return blobs.map((blob) => blob.key);
	} catch (error) {
		context.log.error(`Could not list store "${storeName}": ${error.message}`);
		return [];
	}
}
