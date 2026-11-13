import { defineConfig } from "eslint/config";

import licenseHeader from "eslint-plugin-license-header";
import js from "@allons-y/opx-lint-js/eslint.config.js";
import json from "@allons-y/opx-lint-json/eslint.config.js";
import md from "@allons-y/opx-lint-md/eslint.config.js";

const HEADER = [
	"/**",
	" * SPDX-FileCopyrightText: Copyright Allons-y Studio",
	" * SPDX-License-Identifier: MPL-2.0",
	" */",
];

export default defineConfig([
	...js,
	...json,
	...md,
	{
		ignores: ["**/_site/**", "sample/blobs-cache/**"],
	},
	{
		files: ["docs/content/assets/scripts/**/*.js"],
		languageOptions: {
			globals: {
				CSS: "readonly",
				Highlight: "readonly",
				Range: "readonly",
				clearTimeout: "readonly",
				document: "readonly",
				navigator: "readonly",
				setTimeout: "readonly",
			},
		},
	},
	{
		files: ["docs/cypress/**/*.js"],
		languageOptions: {
			globals: {
				Cypress: "readonly",
				after: "readonly",
				before: "readonly",
				cy: "readonly",
				describe: "readonly",
				expect: "readonly",
				it: "readonly",
			},
		},
	},
	{
		files: ["src/**/*.js", "test/**/*.js"],
		plugins: { "license-header": licenseHeader },
		rules: {
			"license-header/header": ["error", HEADER],
		},
	},
	{
		files: ["**/*.md"],
		language: "markdown/gfm",
	},
]);
