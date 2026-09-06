/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * A `@netlify/blobs`-shaped store factory backed by a plain object.
 * Records every store it hands out so tests can assert on caching.
 * @param {Record<string, object>} [blobs]
 */
export function fakeBlobs(blobs = {}) {
	let created = [];

	function factory({ name }) {
		created.push(name);
		return {
			async get(key) {
				return Object.hasOwn(blobs, key) ? blobs[key] : null;
			},
			async setJSON(key, value) {
				blobs[key] = value;
			},
			async list() {
				return { blobs: Object.keys(blobs).map((key) => ({ key, etag: `etag-${key}` })), directories: [] };
			},
		};
	}

	return { blobs, created, factory };
}

/** A store factory whose every call rejects, standing in for a network or auth failure. */
export function failingBlobs(message = "kaboom") {
	return function factory() {
		return {
			async get() {
				throw new Error(message);
			},
			async setJSON() {
				throw new Error(message);
			},
			async list() {
				throw new Error(message);
			},
		};
	};
}

/** Creates a scratch directory removed when the test finishes. */
export async function tempDir(t, prefix = "nds-") {
	let dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
	t.teardown(() => fs.rm(dir, { recursive: true, force: true }));
	return dir;
}

/**
 * Seeds a cache entry in the on-disk format, aged by `ageMs`.
 * @returns {Promise<string>} the file written
 */
export async function seedCache(cacheDir, storeName, name, value, ageMs = 0) {
	let dir = path.join(cacheDir, storeName);
	await fs.mkdir(dir, { recursive: true });
	let file = path.join(dir, `${name}.json`);
	let entry = { cachedAt: new Date(Date.now() - ageMs).toISOString(), value };
	await fs.writeFile(file, JSON.stringify(entry, null, 2), "utf8");
	return file;
}

/** Writes raw text to a cache path, for malformed-file tests. */
export async function seedRawCache(cacheDir, storeName, name, contents) {
	let dir = path.join(cacheDir, storeName);
	await fs.mkdir(dir, { recursive: true });
	let file = path.join(dir, `${name}.json`);
	await fs.writeFile(file, contents, "utf8");
	return file;
}

/** Reads a cache entry back off disk. */
export async function readCacheFile(cacheDir, storeName, name) {
	return JSON.parse(await fs.readFile(path.join(cacheDir, storeName, `${name}.json`), "utf8"));
}

/**
 * Pins an environment variable for one test & restores it afterwards.
 * Tests using this must be serial: `process.env` is process-global.
 * @param {import("ava").ExecutionContext} t
 * @param {string} key
 * @param {string|undefined} value
 */
export function setEnv(t, key, value) {
	let previous = process.env[key];
	t.teardown(() => {
		if (previous === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = previous;
		}
	});

	if (value === undefined) {
		delete process.env[key];
	} else {
		process.env[key] = value;
	}
}

/** Clears both Netlify credential variables for the duration of a test. */
export function clearCredentials(t) {
	setEnv(t, "NETLIFY_SITE_ID", undefined);
	setEnv(t, "NETLIFY_TOKEN", undefined);
}

/** Silences the plugin's own logging while keeping the interface intact. */
export const quiet = { quiet: true, logger: { log() {}, error() {} } };

/** Credentials that satisfy getStore without reaching the network. */
export const CREDENTIALS = { siteID: "site-id", token: "token" };
