// Site facts, resolved from package.json when the scaffold ran: edit them here.

import project from "./project.json" with { type: "json" };

export default {
	name: "eleventy-plugin-netlify-data-store",
	packageName: "@allons-y/eleventy-plugin-netlify-data-store",
	tagline: project.tagline ?? "Read & write build-time content for Eleventy from Netlify Blobs, with a TTL-based local cache for fast, offline-tolerant builds",
	description: "Read & write build-time content for Eleventy from Netlify Blobs, with a TTL-based local cache for fast, offline-tolerant builds.",
	studio: true,
	license: "MPL-2.0",
	licenseUrl: "https://github.com/allonsy-studio/eleventy-plugin-netlify-data-store/blob/main/LICENSE",
	repo: "https://github.com/allonsy-studio/eleventy-plugin-netlify-data-store",
	repoName: "eleventy-plugin-netlify-data-store",
	npm: "https://www.npmjs.com/package/@allons-y/eleventy-plugin-netlify-data-store",
	node: "22+",
	url: (project.url ?? "https://projects.allons-y.studio/eleventy-plugin-netlify-data-store/").replace(/\/?$/, "/"),
	issuesUrl: "https://github.com/allonsy-studio/eleventy-plugin-netlify-data-store/issues",
	contributingUrl: "https://github.com/allonsy-studio/eleventy-plugin-netlify-data-store/blob/main/.github/CONTRIBUTING.md",
	changelogUrl: "https://github.com/allonsy-studio/eleventy-plugin-netlify-data-store/blob/main/CHANGELOG.md",
};
