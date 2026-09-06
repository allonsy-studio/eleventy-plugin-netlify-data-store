import netlifyDataStore from "../src/index.js";

/**
 * Minimal site reading two blobs entirely from the local cache.
 * Run with `yarn sample`.
 */
export default function (eleventyConfig) {
	// `immediate: true` runs the plugin now instead of after the config file,
	// so the store can be destructured here. Without it, reach for
	// `eleventyConfig.netlifyDataStore` inside a callback instead.
	let { readBlob } = eleventyConfig.addPlugin(netlifyDataStore, {
		immediate: true,
		storeName: "content",
		// A real project leaves cacheDir at the default `.netlify/blobs-cache`
		// & gitignores it. The sample points at a committed fixture, & pins
		// `ttl: "*"` so the fixture never expires — that is what lets the
		// sample build with no credentials & no network, forever.
		cacheDir: "sample/blobs-cache",
		ttl: "*",
	});

	eleventyConfig.addGlobalData("team", () => readBlob("team"));
	eleventyConfig.addGlobalData("activity", () => readBlob("activity"));
}
