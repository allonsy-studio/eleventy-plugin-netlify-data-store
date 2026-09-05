/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

import test from "ava";
import Eleventy from "@11ty/eleventy";
import netlifyDataStore from "../src/index.js";
import { clearCredentials, quiet } from "./_helpers.js";

/** Minimal stand-in for the parts of `eleventyConfig` the plugin touches. */
function fakeEleventyConfig() {
	return {
		directories: { data: "./site/_data/" },
		logger: { log() {}, error() {} },
		filters: {},
		watchIgnores: new Set(),
		versionCheck() {},
		addFilter(name, callback) {
			this.filters[name] = callback;
		},
	};
}

test("exposes a data store on eleventyConfig & returns it", (t) => {
	let eleventyConfig = fakeEleventyConfig();
	let returned = netlifyDataStore(eleventyConfig, quiet);

	t.is(typeof returned.readBlob, "function");
	t.is(typeof returned.writeBlob, "function");
	t.is(typeof returned.listData, "function");
	t.is(eleventyConfig.netlifyDataStore, returned);
});

test("defaults to a one hour ttl & serving stale on error", (t) => {
	let { options } = netlifyDataStore(fakeEleventyConfig(), quiet);

	t.is(options.ttl, "1h");
	t.is(options.ttlMs, 60 * 60 * 1000);
	t.true(options.staleIfError);
	t.is(options.cacheDir, ".netlify/blobs-cache");
});

test("accepts a ttl & staleIfError override", (t) => {
	let { options } = netlifyDataStore(fakeEleventyConfig(), { ...quiet, ttl: "15m", staleIfError: false });

	t.is(options.ttlMs, 15 * 60 * 1000);
	t.false(options.staleIfError);
});

test("rejects an unparseable ttl at registration", (t) => {
	t.throws(() => netlifyDataStore(fakeEleventyConfig(), { ...quiet, ttl: "soon" }), { message: /Invalid ttl/ });
});

test("has no data-directory coupling at all", (t) => {
	let eleventyConfig = fakeEleventyConfig();
	let added = [];
	eleventyConfig.addGlobalData = (name) => added.push(name);

	let { options } = netlifyDataStore(eleventyConfig, quiet);

	t.is(options.dataDir, undefined, "the plugin never resolves a data directory");
	t.is(options.localContent, undefined, "there is no repo-managed content layer");
	t.deepEqual(added, [], "nothing is registered as global data");
});

test("registers the generatedAt filter & ignores the cache directory", (t) => {
	let eleventyConfig = fakeEleventyConfig();
	netlifyDataStore(eleventyConfig, quiet);

	t.is(typeof eleventyConfig.filters.generatedAt, "function");
	t.is(eleventyConfig.filters.generatedAt("2026-09-05T14:32:00Z"), "5 September 2026 at 14:32");
	t.true(eleventyConfig.watchIgnores.has(".netlify/blobs-cache/**"));
});

test("filterName renames the filter & false skips it", (t) => {
	let renamed = fakeEleventyConfig();
	netlifyDataStore(renamed, { ...quiet, filterName: "lastUpdated" });
	t.is(typeof renamed.filters.lastUpdated, "function");
	t.is(renamed.filters.generatedAt, undefined);

	let skipped = fakeEleventyConfig();
	netlifyDataStore(skipped, { ...quiet, filterName: false });
	t.deepEqual(skipped.filters, {});
});

test.serial("builds the sample site from the local cache alone", async (t) => {
	// No credentials & no network: the sample pins ttl "*", so its committed
	// fixture answers every read.
	clearCredentials(t);

	let elev = new Eleventy("sample", "sample/_site", {
		configPath: "sample/eleventy.config.js",
		quietMode: true,
	});
	let [page] = await elev.toJSON();

	t.regex(page.content, /Ada Lovelace/, "cached team content renders");
	t.regex(page.content, /Nightly content sync/, "cached activity content renders");
	t.regex(page.content, /14 August 2026 at 09:00/, "the generatedAt filter renders");
	t.notRegex(page.content, /Activity unavailable/);
	t.notRegex(page.content, /stale cache/, "an unexpired entry is not marked stale");
});
