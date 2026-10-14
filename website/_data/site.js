// Site facts, read from the root package.json. Docs-only copy lives in project.json.

import pkg from "../../package.json" with { type: "json" };
import project from "./project.json" with { type: "json" };

/**
 * Reduce a semver range such as `>=22.12.0` to a "22+" label.
 *
 * @param {string} range
 * @returns {string}
 */
const minimum = (range) => `${parseInt(range.replace(/^\D+/, ""), 10)}+`;

const repo = pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
const repoName = repo.split("/").pop();

export default {
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
