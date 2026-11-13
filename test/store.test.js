/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import test from "ava";
import { normalizeOptions } from "../src/index.js";
import { getStore, storeLabel, storeSource } from "../src/store.js";
import { clearCredentials, fakeBlobs, quiet, setEnv } from "./_helpers.js";

test.serial("throws when NETLIFY_SITE_ID is unset", (t) => {
	clearCredentials(t);
	const context = normalizeOptions({ ...quiet, token: "token" });

	t.throws(() => getStore("content", context), { message: /NETLIFY_SITE_ID/ });
});

test.serial("throws when NETLIFY_TOKEN is unset", (t) => {
	clearCredentials(t);
	const context = normalizeOptions({ ...quiet, siteID: "site-id" });

	t.throws(() => getStore("content", context), { message: /NETLIFY_TOKEN/ });
});

test.serial("a custom factory needs no credentials", (t) => {
	clearCredentials(t);
	const calls = [];
	const context = normalizeOptions({
		...quiet,
		getStore(config) {
			calls.push(config);
			return {};
		},
	});

	t.notThrows(() => getStore("content", context));
	t.deepEqual(calls, [{ name: "content", siteID: undefined, token: undefined }]);
});

test("storeSource & storeLabel name the factory in use", (t) => {
	const custom = normalizeOptions({ ...quiet, getStore: fakeBlobs().factory });
	const netlify = normalizeOptions({ ...quiet });

	t.is(storeSource(custom), "custom");
	t.is(storeLabel(custom), "custom");
	t.is(storeSource(netlify), "blobs");
	t.is(storeLabel(netlify), "Netlify Blobs");
});

test.serial("falls back to the Netlify environment variables", (t) => {
	setEnv(t, "NETLIFY_SITE_ID", "from-env");
	setEnv(t, "NETLIFY_TOKEN", "from-env");
	const calls = [];
	const context = normalizeOptions({
		...quiet,
		getStore(config) {
			calls.push(config);
			return {};
		},
	});

	getStore("content", context);
	t.deepEqual(calls, [{ name: "content", siteID: "from-env", token: "from-env" }]);
});

test.serial("prefers explicit credentials over the environment", (t) => {
	setEnv(t, "NETLIFY_SITE_ID", "from-env");
	setEnv(t, "NETLIFY_TOKEN", "from-env");
	const calls = [];
	const context = normalizeOptions({
		...quiet,
		siteID: "explicit",
		token: "explicit",
		getStore(config) {
			calls.push(config);
			return {};
		},
	});

	getStore("content", context);
	t.is(calls[0].siteID, "explicit");
});

test("returns a cached instance on a second call with the same store name", (t) => {
	const store = fakeBlobs();
	const context = normalizeOptions({ ...quiet, siteID: "site-id", token: "token", getStore: store.factory });

	const first = getStore("content", context);
	const second = getStore("content", context);

	t.is(first, second);
	t.deepEqual(store.created, ["content"], "the factory runs once per store name");
});

test("caches each store name separately", (t) => {
	const store = fakeBlobs();
	const context = normalizeOptions({ ...quiet, siteID: "site-id", token: "token", getStore: store.factory });

	const content = getStore("content", context);
	const archive = getStore("archive", context);

	t.not(content, archive);
	t.deepEqual(store.created, ["content", "archive"]);
	t.is(getStore("archive", context), archive);
});
