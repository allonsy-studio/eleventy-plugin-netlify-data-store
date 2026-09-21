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
		ignores: ["**/_site/**", "node_modules/**", "sample/blobs-cache/**", "CHANGELOG.md"],
	},
	{
		files: ["**/*.js"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				console: "readonly",
				process: "readonly",
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
