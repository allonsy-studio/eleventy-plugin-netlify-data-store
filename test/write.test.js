/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import test from "ava";
import { createDataStore } from "../src/index.js";
import { CREDENTIALS, clearCredentials, fakeBlobs, failingBlobs, quiet, readCacheFile, tempDir } from "./_helpers.js";

test("writes to the Netlify Blobs store", async (t) => {
	let cacheDir = await tempDir(t);
	let store = fakeBlobs();
	let payload = { meta: { generatedAt: "2026-09-05T00:00:00Z" }, entries: ["one"] };

	let { writeBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: store.factory });
	let response = await writeBlob("activity", payload);

	t.is(response.statusCode, 200);
	t.deepEqual(store.created, ["content"]);
	t.deepEqual(store.blobs.activity, payload);
});

test("refreshes the local cache so a following read sees the write", async (t) => {
	let cacheDir = await tempDir(t);
	let store = fakeBlobs();
	let payload = { meta: {}, entries: ["one"] };

	let { writeBlob, readBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: store.factory });
	await writeBlob("activity", payload);

	t.deepEqual((await readCacheFile(cacheDir, "content", "activity")).value, payload);
	t.deepEqual(await readBlob("activity"), payload);
});

test("refuses to write nothing", async (t) => {
	let cacheDir = await tempDir(t);
	let store = fakeBlobs();
	let { writeBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: store.factory });

	t.is((await writeBlob("activity", undefined)).statusCode, 400);
	t.is((await writeBlob("activity", null)).statusCode, 400);
	t.deepEqual(store.created, [], "no store is constructed for a refused write");
});

test("honours an explicit store name argument", async (t) => {
	let cacheDir = await tempDir(t);
	let store = fakeBlobs();

	let { writeBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: store.factory });
	await writeBlob("activity", { meta: {} }, "archive");

	t.deepEqual(store.created, ["archive"]);
});

test("returns a 500 rather than throwing when the store fails", async (t) => {
	let cacheDir = await tempDir(t);
	let { writeBlob } = createDataStore({ ...quiet, ...CREDENTIALS, cacheDir, getStore: failingBlobs("write rejected") });

	let response = await writeBlob("activity", { meta: {} });
	t.is(response.statusCode, 500);
	t.is(response.body, "write rejected");
});

test.serial("returns a 500 rather than throwing when credentials are missing", async (t) => {
	clearCredentials(t);
	let cacheDir = await tempDir(t);
	let { writeBlob } = createDataStore({ ...quiet, cacheDir, getStore: fakeBlobs().factory });

	let response = await writeBlob("activity", { meta: {} });
	t.is(response.statusCode, 500);
	t.regex(response.body, /NETLIFY_TOKEN/);
});
