/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Builds the reference page from the JSDoc in `src/`, so the docs can't
 * drift from the code.
 *
 * @module website/reference
 */

import { readFileSync } from "node:fs";

import { parse, tokenizers } from "comment-parser";
import markdownIt from "markdown-it";

import { highlightFences } from "../utilities/highlight.js";

const SRC = new URL("../../src/", import.meta.url);

const md = markdownIt({ html: true, linkify: true }).use(highlightFences);

/** The store functions bind `context` for the caller, so it is not part of their public signature. */
const INTERNAL_PARAMS = new Set(["context"]);

const EXPORT = /^export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)/;

/** `@returns` has no name: skip the name tokenizer so the description stays whole. */
const skipFor = (tags, tokenizer) => (spec) => (tags.includes(spec.tag) ? spec : tokenizer(spec));

const parserOptions = {
	spacing: "preserve",
	tokenizers: [tokenizers.tag(), tokenizers.type(), skipFor(["return", "returns"], tokenizers.name()), tokenizers.description("preserve")],
};

/** @param {string} text */
const tidy = (text) => text.replace(/^\s*-\s*/, "").replace(/\s*\n\s*/g, " ").trim();

/**
 * @param {import("comment-parser").Tag} tag
 */
const toParam = (tag) => ({
	name: tag.name,
	type: tag.type,
	optional: tag.optional,
	default: tag.default,
	description: tidy(tag.description),
	descriptionHtml: md.renderInline(tidy(tag.description)),
});

/**
 * Every function a source file documents & exports, keyed by name.
 *
 * @param {string} file Path under `src/`.
 * @returns {Map<string, object>}
 */
function documentedFunctions(file) {
	const text = readFileSync(new URL(file, SRC), "utf8");
	const lines = text.split("\n");
	const found = new Map();

	for (const block of parse(text, parserOptions)) {
		const name = lines[block.source.at(-1).number + 1]?.match(EXPORT)?.[1];
		if (!name) continue;

		const params = block.tags
			.filter(({ tag }) => tag === "param")
			.map(toParam)
			.filter((param) => !INTERNAL_PARAMS.has(param.name));
		const returns = block.tags.find(({ tag }) => tag === "returns" || tag === "return");

		found.set(name, {
			name,
			signature: `${name}(${params.map((param) => (param.optional ? `${param.name}?` : param.name)).join(", ")})`,
			descriptionHtml: md.render(block.description.trim()),
			params,
			hasDescriptions: params.some((param) => param.description),
			returns: returns && {
				type: returns.type,
				descriptionHtml: md.renderInline(tidy(returns.description)),
			},
		});
	}
	return found;
}

/**
 * The `@property` tags of a `@typedef`.
 *
 * @param {string} file Path under `src/`.
 * @param {string} typedef
 * @returns {object[]}
 */
function typedefProperties(file, typedef) {
	const block = parse(readFileSync(new URL(file, SRC), "utf8"), parserOptions).find((candidate) =>
		candidate.tags.some(({ tag, name }) => tag === "typedef" && name === typedef),
	);
	if (!block) throw new Error(`No @typedef ${typedef} found in src/${file}.`);
	return block.tags.filter(({ tag }) => tag === "property").map(toParam);
}

/**
 * @param {string} file Path under `src/`.
 * @param {string} name
 * @param {Map<string, object>} [from] Already-parsed functions for the file.
 * @returns {object}
 */
function documented(file, name, from = documentedFunctions(file)) {
	const entry = from.get(name);
	if (!entry) throw new Error(`${name} has no JSDoc block in src/${file}.`);
	return entry;
}

export default function () {
	const index = documentedFunctions("index.js");

	return {
		plugin: [documented("index.js", "netlifyDataStorePlugin", index), documented("index.js", "createDataStore", index)],
		store: [documented("read.js", "readBlob"), documented("write.js", "writeBlob"), documented("list.js", "listData")],
		utilities: [documented("format.js", "formatGeneratedAt"), documented("cache.js", "parseDuration")],
		options: typedefProperties("index.js", "DataStoreOptions"),
	};
}
