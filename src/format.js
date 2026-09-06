/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

const formatterCache = new Map();

/** @type {Intl.DateTimeFormatOptions} */
const DEFAULT_FORMAT = {
	dateStyle: "long",
	timeStyle: "short",
	timeZone: "UTC",
};

/**
 * Shared `Intl.DateTimeFormat` instances, keyed by locale & options.
 * @param {string} locale
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {Intl.DateTimeFormat}
 */
function getFormatter(locale, options) {
	let key = `${locale}|${JSON.stringify(options)}`;
	if (!formatterCache.has(key)) {
		formatterCache.set(key, new Intl.DateTimeFormat(locale, options));
	}
	return formatterCache.get(key);
}

/**
 * Formats an envelope's `meta.generatedAt` timestamp for display.
 * Returns an empty string for missing or unparseable input so a template
 * can render it unconditionally.
 * @param {string|number|Date} value
 * @param {{locale?: string, dateFormat?: Intl.DateTimeFormatOptions}} [options]
 * @returns {string}
 */
export function formatGeneratedAt(value, options = {}) {
	if (value === undefined || value === null || value === "") {
		return "";
	}

	let date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	let { locale = "en-GB", dateFormat = DEFAULT_FORMAT } = options;
	return getFormatter(locale, dateFormat).format(date);
}

/** Test seam: drops the memoized formatters. */
export function resetFormatterCache() {
	formatterCache.clear();
}
