/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import test from "ava";
import { parseDuration, readCacheEntry, writeCacheEntry } from "../src/cache.js";
import { normalizeOptions } from "../src/index.js";
import { quiet, readCacheFile, seedCache, seedRawCache, tempDir } from "./_helpers.js";

test("parses eleventy-fetch style durations", (t) => {
	t.is(parseDuration("30s"), 30 * 1000);
	t.is(parseDuration("30m"), 30 * 60 * 1000);
	t.is(parseDuration("1h"), 60 * 60 * 1000);
	t.is(parseDuration("7d"), 7 * 24 * 60 * 60 * 1000);
	t.is(parseDuration("2w"), 2 * 7 * 24 * 60 * 60 * 1000);
	t.is(parseDuration("1y"), 365 * 24 * 60 * 60 * 1000);
});

test("treats * as never expiring & 0 as always expired", (t) => {
	t.is(parseDuration("*"), Infinity);
	t.is(parseDuration(0), 0);
});

test("accepts a raw millisecond number", (t) => {
	t.is(parseDuration(5000), 5000);
});

test("rejects an unparseable duration", (t) => {
	t.throws(() => parseDuration("banana"), { message: /Invalid ttl/ });
	t.throws(() => parseDuration("1 fortnight"), { message: /Invalid ttl/ });
	t.throws(() => parseDuration(-1), { message: /Invalid ttl/ });
});

test("a bad ttl fails at construction, not mid-build", (t) => {
	t.throws(() => normalizeOptions({ ...quiet, ttl: "soon" }), { message: /Invalid ttl/ });
});

test("round-trips a value through the cache", async (t) => {
	let cacheDir = await tempDir(t);
	let context = normalizeOptions({ ...quiet, cacheDir });
	let value = { meta: { generatedAt: "2026-09-05T00:00:00Z" }, entries: [1, 2] };

	await writeCacheEntry("activity", "content", value, context);
	let entry = await readCacheEntry("activity", "content", context);

	t.deepEqual(entry.value, value);
	t.false(entry.expired);
	t.true(entry.age < 5000);
});

test("stores cachedAt alongside the value rather than replacing it", async (t) => {
	let cacheDir = await tempDir(t);
	let context = normalizeOptions({ ...quiet, cacheDir });
	await writeCacheEntry("activity", "content", { meta: {}, entries: [] }, context);

	let onDisk = await readCacheFile(cacheDir, "content", "activity");
	t.true(typeof onDisk.cachedAt === "string");
	t.false(Number.isNaN(Date.parse(onDisk.cachedAt)));
	t.deepEqual(onDisk.value, { meta: {}, entries: [] });
});

test("marks an entry expired once it is older than the ttl", async (t) => {
	let cacheDir = await tempDir(t);
	let context = normalizeOptions({ ...quiet, cacheDir, ttl: "1h" });
	await seedCache(cacheDir, "content", "activity", { meta: {} }, 2 * 60 * 60 * 1000);

	let entry = await readCacheEntry("activity", "content", context);
	t.true(entry.expired);
	t.true(entry.age >= 60 * 60 * 1000);
});

test("keeps an entry fresh inside the ttl", async (t) => {
	let cacheDir = await tempDir(t);
	let context = normalizeOptions({ ...quiet, cacheDir, ttl: "1h" });
	await seedCache(cacheDir, "content", "activity", { meta: {} }, 10 * 60 * 1000);

	t.false((await readCacheEntry("activity", "content", context)).expired);
});

test("never expires an entry when ttl is *", async (t) => {
	let cacheDir = await tempDir(t);
	let context = normalizeOptions({ ...quiet, cacheDir, ttl: "*" });
	await seedCache(cacheDir, "content", "activity", { meta: {} }, 10 * 365 * 24 * 60 * 60 * 1000);

	t.false((await readCacheEntry("activity", "content", context)).expired);
});

test("always expires an entry when ttl is 0", async (t) => {
	let cacheDir = await tempDir(t);
	let context = normalizeOptions({ ...quiet, cacheDir, ttl: 0 });
	await seedCache(cacheDir, "content", "activity", { meta: {} }, 0);

	t.true((await readCacheEntry("activity", "content", context)).expired);
});

test("returns undefined for a missing entry", async (t) => {
	let cacheDir = await tempDir(t);
	let context = normalizeOptions({ ...quiet, cacheDir });
	t.is(await readCacheEntry("nothing", "content", context), undefined);
});

test("returns undefined for a malformed or foreign-shaped entry", async (t) => {
	let cacheDir = await tempDir(t);
	let context = normalizeOptions({ ...quiet, cacheDir });

	await seedRawCache(cacheDir, "content", "truncated", "{ not json");
	t.is(await readCacheEntry("truncated", "content", context), undefined);

	await seedRawCache(cacheDir, "content", "bare", JSON.stringify({ meta: {}, entries: [] }));
	t.is(await readCacheEntry("bare", "content", context), undefined, "an unwrapped envelope is not a cache entry");
});

test("treats an unparseable cachedAt as infinitely old", async (t) => {
	let cacheDir = await tempDir(t);
	let context = normalizeOptions({ ...quiet, cacheDir, ttl: "*" });
	await seedRawCache(cacheDir, "content", "activity", JSON.stringify({ cachedAt: "not a date", value: { meta: {} } }));

	let entry = await readCacheEntry("activity", "content", context);
	t.is(entry.age, Infinity);
});
