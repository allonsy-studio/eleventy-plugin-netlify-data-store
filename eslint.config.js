import js from "@eslint/js";
import licenseHeader from "eslint-plugin-license-header";

const HEADER = [
	"/**",
	" * SPDX-FileCopyrightText: Copyright Allons-y Studio",
	" * SPDX-License-Identifier: MPL-2.0",
	" */",
];

export default [
	{
		ignores: ["**/_site/**", "node_modules/**", "sample/blobs-cache/**"],
	},
	js.configs.recommended,
	{
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
];
