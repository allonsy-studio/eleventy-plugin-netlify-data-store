/**
 * SPDX-FileCopyrightText: Copyright Allons-y Studio
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Routes plugin output through Eleventy's logger when the plugin was
 * registered with `addPlugin`, & through the console otherwise.
 * Informational messages are suppressed by the `quiet` option; errors
 * are always surfaced.
 * @param {{quiet?: boolean, logger?: object}} options
 * @returns {{log: (message: string) => void, error: (message: string) => void}}
 */
export function createLogger({ quiet = false, logger } = {}) {
	return {
		log(message) {
			if (quiet) {
				return;
			}
			if (typeof logger?.log === "function") {
				logger.log(message);
			} else {
				console.log(`[netlify-data-store] ${message}`);
			}
		},
		error(message) {
			if (typeof logger?.error === "function") {
				logger.error(message);
			} else {
				console.error(`[netlify-data-store] ${message}`);
			}
		},
	};
}
