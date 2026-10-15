import js from "@eslint/js";
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";
import licenseHeader from "eslint-plugin-license-header";

const HEADER = [
	"/**",
	" * SPDX-FileCopyrightText: Copyright Allons-y Studio",
	" * SPDX-License-Identifier: MPL-2.0",
	" */",
];

export default defineConfig([
	{
		ignores: ["**/_site/**", ".yarn/**", "node_modules/**", "sample/blobs-cache/**", "CHANGELOG.md"],
	},
	{
		files: ["**/*.js"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				URL: "readonly",
				console: "readonly",
				process: "readonly",
			},
		},
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
		plugins: { markdown },
		language: "markdown/gfm",
		extends: ["markdown/recommended"],
	},
]);
