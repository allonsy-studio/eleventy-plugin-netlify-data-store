/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import test from "ava";
import { createDataStore, formatGeneratedAt } from "../src/index.js";

test("formats an ISO timestamp in en-GB by default", (t) => {
	t.is(formatGeneratedAt("2026-09-05T14:32:00Z"), "5 September 2026 at 14:32");
});

test("accepts a Date & a numeric timestamp", (t) => {
	let expected = formatGeneratedAt("2026-09-05T14:32:00Z");
	t.is(formatGeneratedAt(new Date("2026-09-05T14:32:00Z")), expected);
	t.is(formatGeneratedAt(Date.parse("2026-09-05T14:32:00Z")), expected);
});

test("returns an empty string for missing or unparseable values", (t) => {
	t.is(formatGeneratedAt(undefined), "");
	t.is(formatGeneratedAt(null), "");
	t.is(formatGeneratedAt(""), "");
	t.is(formatGeneratedAt("not a date"), "");
});

test("honours the locale & dateFormat options", (t) => {
	t.is(formatGeneratedAt("2026-09-05T14:32:00Z", { locale: "en-US", dateFormat: { dateStyle: "short", timeZone: "UTC" } }), "9/5/26");
});

test("is reachable from a configured data store", (t) => {
	let store = createDataStore({ locale: "en-US", dateFormat: { dateStyle: "short", timeZone: "UTC" } });
	t.is(store.formatGeneratedAt("2026-09-05T14:32:00Z"), "9/5/26");
});
