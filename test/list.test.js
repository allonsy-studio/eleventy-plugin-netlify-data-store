/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import test from "ava";
import { createDataStore } from "../src/index.js";
import { CREDENTIALS, fakeBlobs, failingBlobs, quiet } from "./_helpers.js";

test("returns the keys reported by the store", async (t) => {
	let store = fakeBlobs({ activity: { meta: {} }, release_notes: { meta: {} } });
	let { listData } = createDataStore({ ...quiet, ...CREDENTIALS, getStore: store.factory });

	t.deepEqual(await listData(), ["activity", "release_notes"]);
});

test("honours an explicit store name argument", async (t) => {
	let store = fakeBlobs();
	let { listData } = createDataStore({ ...quiet, ...CREDENTIALS, getStore: store.factory });

	await listData("archive");
	t.deepEqual(store.created, ["archive"]);
});

test("returns an empty list rather than throwing when the store fails", async (t) => {
	let { listData } = createDataStore({ ...quiet, ...CREDENTIALS, getStore: failingBlobs() });
	t.deepEqual(await listData(), []);
});
