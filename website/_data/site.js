// Site facts, read from the root package.json. Docs-only copy lives in project.json.

import { readFileSync } from "node:fs";
import Fetch from "@11ty/eleventy-fetch";
import pkg from "../../package.json" with { type: "json" };
import project from "./project.json" with { type: "json" };

/**
 * Reduce a semver range such as `>=22.12.0` to a "22+" label.
 *
 * @param {string} range
 * @returns {string}
 */
const minimum = (range) => `${parseInt(range.replace(/^\D+/, ""), 10)}+`;

/**
 * Whether the package has a release on npm, so the footer badges have something to show.
 * A missing package, or no network, counts as no release.
 *
 * @param {string} name package name
 * @returns {Promise<boolean>}
 */
async function hasNpmRelease(name) {
	try {
		const info = await Fetch(`https://registry.npmjs.org/${name}`, { duration: "1h", type: "json" });
		return Boolean(info["dist-tags"]?.latest);
	} catch {
		return false;
	}
}

/**
 * The project accent as a bare hex for badge URLs, read from project.css.
 *
 * @returns {string}
 */
function accentHex() {
	const css = readFileSync(new URL("../content/assets/styles/project.css", import.meta.url), "utf8");
	return css.match(/--accent:\s*#([0-9a-f]{6})\b/i)?.[1] ?? "2346d4";
}

const repo = pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
const repoName = repo.split("/").pop();

const site = {
	name: repoName,
	packageName: pkg.name,
	tagline: project.tagline ?? pkg.description.replace(/\.$/, ""),
	description: pkg.description,
	studio: pkg["oss-docs"]?.studio !== false,
	license: pkg.license,
	licenseUrl: `${repo}/blob/main/LICENSE`,
	repo,
	repoName,
	npm: pkg.private ? null : `https://www.npmjs.com/package/${pkg.name}`,
	node: minimum(pkg.engines.node),
	url: (project.url ?? `https://projects.allons-y.studio/${repoName}/`).replace(/\/?$/, "/"),
	issuesUrl: pkg.bugs?.url ?? pkg.bugs,
	contributingUrl: `${repo}/blob/main/.github/CONTRIBUTING.md`,
	changelogUrl: `${repo}/blob/main/CHANGELOG.md`,
};

export default async function () {
	return { ...site, npmRelease: await hasNpmRelease(site.packageName), badgeColor: accentHex() };
}
