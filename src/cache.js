/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import fs from "node:fs/promises";
import path from "node:path";

/** Milliseconds per duration suffix. */
const UNITS = {
	s: 1000,
	m: 60 * 1000,
	h: 60 * 60 * 1000,
	d: 24 * 60 * 60 * 1000,
	w: 7 * 24 * 60 * 60 * 1000,
	y: 365 * 24 * 60 * 60 * 1000,
};

/**
 * Parses an `eleventy-fetch`-style duration into milliseconds.
 * `"*"` never expires; `0` always does.
 * @param {string|number} value
 * @returns {number}
 */
export function parseDuration(value) {
	if (value === "*") {
		return Infinity;
	}

	if (typeof value === "number") {
		if (!Number.isFinite(value) || value < 0) {
			throw new Error(`Invalid ttl: ${value}. Use a non-negative number of milliseconds, a duration like "1h", or "*".`);
		}
		return value;
	}

	let match = /^(\d+(?:\.\d+)?)([smhdwy])$/i.exec(String(value).trim());
	if (!match) {
		throw new Error(`Invalid ttl: ${JSON.stringify(value)}. Use a duration like "30m", "1h", "7d", or "*" to never expire.`);
	}

	return Number(match[1]) * UNITS[match[2].toLowerCase()];
}

/**
 * Directory holding one store's files in the local, uncommitted cache.
 * @param {string} storeName
 * @param {import("./index.js").DataStoreContext} context
 * @returns {string}
 */
export function getCacheDir(storeName, context) {
	return path.resolve(process.cwd(), context.cacheDir, storeName);
}

/**
 * Path to a single blob's file in the local cache.
 * @param {string} name
 * @param {string} storeName
 * @param {import("./index.js").DataStoreContext} context
 * @returns {string}
 */
export function getCachePath(name, storeName, context) {
	return path.join(getCacheDir(storeName, context), `${name}.json`);
}

/**
 * Reads a cache entry. Returns `undefined` on a miss or an unreadable file,
 * so the caller falls through to the store.
 * @param {string} name
 * @param {string} storeName
 * @param {import("./index.js").DataStoreContext} context
 * @returns {Promise<{value: object, cachedAt: string, age: number, expired: boolean}|undefined>}
 */
export async function readCacheEntry(name, storeName, context) {
	let file = getCachePath(name, storeName, context);

	let contents;
	try {
		contents = await fs.readFile(file, "utf8");
	} catch {
		return undefined;
	}

	let entry;
	try {
		entry = JSON.parse(contents);
	} catch {
		context.log.error(`Cached blob "${name}" is not valid JSON (${file}); refetching.`);
		return undefined;
	}

	if (!entry || typeof entry !== "object" || !("value" in entry)) {
		context.log.error(`Cached blob "${name}" is not in the expected format (${file}); refetching.`);
		return undefined;
	}

	let cachedAt = Date.parse(entry.cachedAt);
	let age = Number.isNaN(cachedAt) ? Infinity : Math.max(0, Date.now() - cachedAt);

	return { value: entry.value, cachedAt: entry.cachedAt, age, expired: age >= context.ttlMs };
}

/**
 * Records a freshly fetched value in the cache. Cache failures are
 * non-fatal — the value is already in hand.
 * @param {string} name
 * @param {string} storeName
 * @param {object} value
 * @param {import("./index.js").DataStoreContext} context
 * @returns {Promise<void>}
 */
export async function writeCacheEntry(name, storeName, value, context) {
	let file = getCachePath(name, storeName, context);
	let entry = { cachedAt: new Date().toISOString(), value };

	try {
		await fs.mkdir(path.dirname(file), { recursive: true });
		await fs.writeFile(file, `${JSON.stringify(entry, null, 2)}\n`, "utf8");
		context.log.log(`cached "${name}" to ${path.relative(process.cwd(), file)}`);
	} catch (error) {
		context.log.error(`Could not cache "${name}" to ${file}: ${error.message}`);
	}
}
