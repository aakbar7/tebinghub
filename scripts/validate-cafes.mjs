import { readFile } from "node:fs/promises";

const file = new URL("../public/data/cafes.geojson", import.meta.url);
const data = JSON.parse(await readFile(file, "utf8"));

if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
	throw new Error("cafes.geojson must be a GeoJSON FeatureCollection");
}

if (data.features.length !== 54 || data.summary?.total !== 54) {
	throw new Error(`Expected 54 cafe clusters, found ${data.features.length}`);
}

if (data.summary.verified !== 52 || data.summary.reviewNeeded !== 2) {
	throw new Error("Expected 52 verified cafes and 2 records marked for review");
}

const allowedPropertyKeys = [
	"address",
	"category",
	"hours",
	"id",
	"mapsUrl",
	"name",
	"rating",
	"reviewsCount",
	"scope",
	"status",
].sort();

for (const [index, feature] of data.features.entries()) {
	const coordinates = feature.geometry?.coordinates;
	const name = feature.properties?.name;
	const propertyKeys = Object.keys(feature.properties ?? {}).sort();

	if (feature.type !== "Feature" || feature.geometry?.type !== "Point") {
		throw new Error(`Feature ${index} must be a Point feature`);
	}

	if (!Array.isArray(coordinates) || coordinates.length !== 2 || coordinates.some((value) => !Number.isFinite(value))) {
		throw new Error(`Feature ${index} has invalid coordinates`);
	}

	if (typeof name !== "string" || name.trim().length === 0) {
		throw new Error(`Feature ${index} is missing properties.name`);
	}

	if (JSON.stringify(propertyKeys) !== JSON.stringify(allowedPropertyKeys)) {
		throw new Error(`Feature ${index} exposes unsupported visitor properties`);
	}
}

const reviewNeeded = data.features
	.filter((feature) => feature.properties.status === "review-needed")
	.map((feature) => feature.properties.name)
	.sort();

if (JSON.stringify(reviewNeeded) !== JSON.stringify(["COFFEINE COFFEE", "Vnine Coffee House"])) {
	throw new Error(`Unexpected review-needed records: ${reviewNeeded.join(", ")}`);
}

console.log(
	`Validated ${data.features.length} cafe clusters (${data.summary.verified} verified, ${data.summary.reviewNeeded} marked for review).`,
);
