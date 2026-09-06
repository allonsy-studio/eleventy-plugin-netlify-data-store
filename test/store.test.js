/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import test from "ava";
import { normalizeOptions } from "../src/index.js";
import { getStore } from "../src/store.js";
import { clearCredentials, fakeBlobs, quiet, setEnv } from "./_helpers.js";

test.serial("throws when NETLIFY_SITE_ID is unset", (t) => {
	clearCredentials(t);
	let context = normalizeOptions({ ...quiet, token: "token", getStore: fakeBlobs().factory });

	t.throws(() => getStore("content", context), { message: /NETLIFY_SITE_ID/ });
});

test.serial("throws when NETLIFY_TOKEN is unset", (t) => {
	clearCredentials(t);
	let context = normalizeOptions({ ...quiet, siteID: "site-id", getStore: fakeBlobs().factory });

	t.throws(() => getStore("content", context), { message: /NETLIFY_TOKEN/ });
});

test.serial("falls back to the Netlify environment variables", (t) => {
	setEnv(t, "NETLIFY_SITE_ID", "from-env");
	setEnv(t, "NETLIFY_TOKEN", "from-env");
	let calls = [];
	let context = normalizeOptions({
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
	let calls = [];
	let context = normalizeOptions({
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
	let store = fakeBlobs();
	let context = normalizeOptions({ ...quiet, siteID: "site-id", token: "token", getStore: store.factory });

	let first = getStore("content", context);
	let second = getStore("content", context);

	t.is(first, second);
	t.deepEqual(store.created, ["content"], "the factory runs once per store name");
});

test("caches each store name separately", (t) => {
	let store = fakeBlobs();
	let context = normalizeOptions({ ...quiet, siteID: "site-id", token: "token", getStore: store.factory });

	let content = getStore("content", context);
	let archive = getStore("archive", context);

	t.not(content, archive);
	t.deepEqual(store.created, ["content", "archive"]);
	t.is(getStore("archive", context), archive);
});
