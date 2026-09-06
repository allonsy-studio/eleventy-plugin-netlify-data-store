/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import { parseDuration } from "./cache.js";
import { createLogger } from "./logger.js";
import { formatGeneratedAt } from "./format.js";
import { listData } from "./list.js";
import { readBlob } from "./read.js";
import { writeBlob } from "./write.js";

export { formatGeneratedAt } from "./format.js";
export { parseDuration } from "./cache.js";

/**
 * @typedef {object} DataStoreOptions
 * @property {string} [storeName="content"] Default Netlify Blobs store.
 * @property {string} [cacheDir=".netlify/blobs-cache"] Local, uncommitted cache.
 * @property {string|number} [ttl="1h"] How long a cache entry stays fresh; `"*"` never expires, `0` always refetches.
 * @property {boolean} [staleIfError=true] Serve an expired entry when the store cannot be reached.
 * @property {string} [siteID] Defaults to `process.env.NETLIFY_SITE_ID`.
 * @property {string} [token] Defaults to `process.env.NETLIFY_TOKEN`.
 * @property {boolean} [quiet=false] Suppress per-read logging.
 * @property {string} [locale="en-GB"] Locale for `formatGeneratedAt`.
 * @property {Intl.DateTimeFormatOptions} [dateFormat] Options for `formatGeneratedAt`.
 * @property {string|false} [filterName="generatedAt"] Filter to register; `false` to skip.
 * @property {Function} [getStore] Store factory; defaults to `getStore` from `@netlify/blobs`.
 * @property {object} [logger] Eleventy's logger; supplied automatically by `addPlugin`.
 */

/**
 * @typedef {object} DataStoreContext
 * @property {string} storeName
 * @property {string} cacheDir
 * @property {number} ttlMs
 * @property {boolean} staleIfError
 * @property {Map<string, object>} stores
 * @property {ReturnType<typeof createLogger>} log
 */

/**
 * Applies defaults & normalizes the option shapes the runtime relies on.
 * An unparseable `ttl` throws here so it surfaces at registration rather
 * than mid-build.
 * @param {DataStoreOptions} [options]
 * @returns {DataStoreContext & DataStoreOptions}
 */
export function normalizeOptions(options = {}) {
	// `undefined` must not shadow a default: callers routinely spread
	// partially-filled option objects.
	let supplied = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));

	let normalized = Object.assign(
		{
			storeName: "content",
			cacheDir: ".netlify/blobs-cache",
			ttl: "1h",
			staleIfError: true,
			quiet: false,
			locale: "en-GB",
			filterName: "generatedAt",
		},
		supplied
	);

	normalized.ttlMs = parseDuration(normalized.ttl);
	normalized.stores = new Map();
	normalized.log = createLogger(normalized);

	return normalized;
}

/**
 * Creates a read/write API bound to one set of options. Use this directly
 * from a `_data/*.js` file or a Netlify Function; the Eleventy plugin below
 * is a thin wrapper around it.
 * @param {DataStoreOptions} [options]
 */
export function createDataStore(options = {}) {
	let context = normalizeOptions(options);

	return {
		/**
		 * @param {string} name
		 * @param {string} [storeName]
		 * @returns {Promise<object>}
		 */
		readBlob: (name, storeName) => readBlob(name, storeName, context),

		/**
		 * @param {string} name
		 * @param {object} data
		 * @param {string} [storeName]
		 * @returns {Promise<{statusCode: number, body: string}>}
		 */
		writeBlob: (name, data, storeName) => writeBlob(name, data, storeName, context),

		/**
		 * @param {string} [storeName]
		 * @returns {Promise<string[]>}
		 */
		listData: (storeName) => listData(storeName, context),

		/**
		 * @param {string|number|Date} value
		 * @returns {string}
		 */
		formatGeneratedAt: (value) => formatGeneratedAt(value, context),

		options: context,
	};
}

/**
 * Eleventy plugin. Hangs a configured data store on `eleventyConfig` &
 * returns it, & registers a date filter for `meta.generatedAt`.
 *
 * The plugin never reads Eleventy's data directory: content comes from
 * Netlify Blobs, cached locally between builds.
 * @param {object} eleventyConfig
 * @param {DataStoreOptions} [pluginOptions]
 * @returns {ReturnType<typeof createDataStore>}
 */
export default function netlifyDataStorePlugin(eleventyConfig, pluginOptions = {}) {
	if (typeof eleventyConfig.versionCheck === "function") {
		eleventyConfig.versionCheck(">=3.0.0-0");
	}

	let dataStore = createDataStore(Object.assign({ logger: eleventyConfig.logger }, pluginOptions));

	eleventyConfig.netlifyDataStore = dataStore;

	let { filterName } = dataStore.options;
	if (filterName) {
		eleventyConfig.addFilter(filterName, dataStore.formatGeneratedAt);
	}

	// The cache is build output, not source: watching it would loop the dev server.
	if (eleventyConfig.watchIgnores?.add) {
		eleventyConfig.watchIgnores.add(`${dataStore.options.cacheDir}/**`);
	}

	return dataStore;
}

Object.defineProperty(netlifyDataStorePlugin, "eleventyPackage", {
	value: "@allons-y/eleventy-plugin-netlify-data-store",
});
