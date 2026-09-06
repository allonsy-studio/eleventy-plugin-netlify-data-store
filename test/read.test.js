/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import test from "ava";
import { createDataStore } from "../src/index.js";
import {
	CREDENTIALS,
	clearCredentials,
	fakeBlobs,
	failingBlobs,
	quiet,
	readCacheFile,
	seedCache,
	seedRawCache,
	tempDir,
} from "./_helpers.js";

const HOUR = 60 * 60 * 1000;

test("serves a fresh cache entry without touching the store", async (t) => {
	let cacheDir = await tempDir(t);
	let cached = { meta: { generatedAt: "2026-08-01T00:00:00Z" }, entries: ["cached"] };
	await seedCache(cacheDir, "content", "activity", cached, 10 * 60 * 1000);

	let store = fakeBlobs({ activity: { meta: {}, entries: ["remote"] } });
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, ttl: "1h", getStore: store.factory });

	t.deepEqual(await readBlob("activity"), cached);
	t.deepEqual(store.created, [], "a fresh entry never constructs the store");
});

test("refetches once the entry is past its ttl", async (t) => {
	let cacheDir = await tempDir(t);
	await seedCache(cacheDir, "content", "activity", { meta: {}, entries: ["cached"] }, 2 * HOUR);

	let remote = { meta: { generatedAt: "2026-09-05T00:00:00Z" }, entries: ["remote"] };
	let store = fakeBlobs({ activity: remote });
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, ttl: "1h", getStore: store.factory });

	t.deepEqual(await readBlob("activity"), remote);
	t.deepEqual(store.created, ["content"]);
});

test("caches what it fetches, so the next build can run offline", async (t) => {
	let cacheDir = await tempDir(t);
	let remote = { meta: { generatedAt: "2026-09-05T00:00:00Z" }, entries: ["remote"] };
	let store = fakeBlobs({ activity: remote });
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: store.factory });

	await readBlob("activity");

	let onDisk = await readCacheFile(cacheDir, "content", "activity");
	t.deepEqual(onDisk.value, remote);
	t.true(typeof onDisk.cachedAt === "string");
});

test("a ttl of 0 always refetches", async (t) => {
	let cacheDir = await tempDir(t);
	await seedCache(cacheDir, "content", "activity", { meta: {}, entries: ["cached"] }, 0);

	let store = fakeBlobs({ activity: { meta: {}, entries: ["remote"] } });
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, ttl: 0, getStore: store.factory });

	t.deepEqual((await readBlob("activity")).entries, ["remote"]);
});

test("a ttl of * never refetches", async (t) => {
	let cacheDir = await tempDir(t);
	await seedCache(cacheDir, "content", "activity", { meta: {}, entries: ["cached"] }, 10 * 365 * 24 * HOUR);

	let store = fakeBlobs({ activity: { meta: {}, entries: ["remote"] } });
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, ttl: "*", getStore: store.factory });

	t.deepEqual((await readBlob("activity")).entries, ["cached"]);
	t.deepEqual(store.created, []);
});

test("serves a stale entry when the store fails", async (t) => {
	let cacheDir = await tempDir(t);
	await seedCache(cacheDir, "content", "activity", { meta: { generatedAt: "2026-08-01T00:00:00Z" }, entries: ["cached"] }, 2 * HOUR);

	let { readBlob } = createDataStore({
		...quiet,
		...CREDENTIALS,
		cacheDir,
		ttl: "1h",
		getStore: failingBlobs("network down"),
	});

	let result = await readBlob("activity");
	t.deepEqual(result.entries, ["cached"]);
	t.true(result.meta.stale);
	t.is(result.meta.generatedAt, "2026-08-01T00:00:00Z", "the original generatedAt survives");
	t.true(result.meta.cacheAge >= HOUR);
});

test.serial("serves a stale entry when credentials are missing", async (t) => {
	clearCredentials(t);
	let cacheDir = await tempDir(t);
	await seedCache(cacheDir, "content", "activity", { meta: {}, entries: ["cached"] }, 2 * HOUR);

	let { readBlob } = createDataStore({ ...quiet, cacheDir, ttl: "1h", getStore: fakeBlobs().factory });

	let result = await readBlob("activity");
	t.deepEqual(result.entries, ["cached"]);
	t.true(result.meta.stale);
});

test("returns the error envelope when staleIfError is disabled", async (t) => {
	let cacheDir = await tempDir(t);
	await seedCache(cacheDir, "content", "activity", { meta: {}, entries: ["cached"] }, 2 * HOUR);

	let { readBlob } = createDataStore({
		...quiet,
		...CREDENTIALS,
		cacheDir,
		ttl: "1h",
		staleIfError: false,
		getStore: failingBlobs("network down"),
	});

	let result = await readBlob("activity");
	t.is(result.meta.error, "network down");
	t.is(result.entries, undefined, "no data is served past its ttl");
});

test("does not mark a fresh entry stale", async (t) => {
	let cacheDir = await tempDir(t);
	await seedCache(cacheDir, "content", "activity", { meta: { generatedAt: "x" }, entries: ["cached"] }, 60 * 1000);

	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, ttl: "1h", getStore: failingBlobs() });

	let result = await readBlob("activity");
	t.is(result.meta.stale, undefined);
});

test("serves the stale entry when the blob has been deleted from the store", async (t) => {
	let cacheDir = await tempDir(t);
	await seedCache(cacheDir, "content", "activity", { meta: {}, entries: ["cached"] }, 2 * HOUR);

	let store = fakeBlobs();
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, ttl: "1h", getStore: store.factory });

	let result = await readBlob("activity");
	t.deepEqual(result.entries, ["cached"]);
	t.true(result.meta.stale);
});

test("returns an error envelope when the blob does not exist & nothing is cached", async (t) => {
	let cacheDir = await tempDir(t);
	let store = fakeBlobs();
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: store.factory });

	let result = await readBlob("missing");
	t.is(result.meta.name, "missing");
	t.is(result.meta.store, "content");
	t.is(result.meta.source, "blobs");
	t.regex(result.meta.error, /No blob named "missing"/);
});

test("returns an error envelope rather than throwing when the store fails cold", async (t) => {
	let cacheDir = await tempDir(t);
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: failingBlobs("network down") });

	t.is((await readBlob("activity")).meta.error, "network down");
});

test.serial("returns an error envelope rather than throwing when credentials are missing", async (t) => {
	clearCredentials(t);
	let cacheDir = await tempDir(t);
	let { readBlob } = createDataStore({ ...quiet, cacheDir, getStore: fakeBlobs().factory });

	t.regex((await readBlob("activity")).meta.error, /NETLIFY_SITE_ID/);
});

test("refetches when a cached file is not valid JSON", async (t) => {
	let cacheDir = await tempDir(t);
	await seedRawCache(cacheDir, "content", "activity", "{ truncated");

	let remote = { meta: {}, entries: ["remote"] };
	let store = fakeBlobs({ activity: remote });
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: store.factory });

	t.deepEqual(await readBlob("activity"), remote);
});

test("never reads Eleventy's data directory", async (t) => {
	let cacheDir = await tempDir(t);
	let store = fakeBlobs({ team: { meta: {}, team: ["from blobs"] } });
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: store.factory });

	t.deepEqual((await readBlob("team")).team, ["from blobs"]);
	t.deepEqual(store.created, ["content"], "every name resolves through the store");
});

test("honours an explicit store name argument", async (t) => {
	let cacheDir = await tempDir(t);
	let store = fakeBlobs({ activity: { meta: {} } });
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: store.factory });

	await readBlob("activity", "archive");
	t.deepEqual(store.created, ["archive"]);
});

test("caches each store name separately", async (t) => {
	let cacheDir = await tempDir(t);
	let store = fakeBlobs({ activity: { meta: {}, entries: ["remote"] } });
	let { readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: store.factory });

	await readBlob("activity");
	await readBlob("activity", "archive");

	t.deepEqual((await readCacheFile(cacheDir, "content", "activity")).value.entries, ["remote"]);
	t.deepEqual((await readCacheFile(cacheDir, "archive", "activity")).value.entries, ["remote"]);
});
