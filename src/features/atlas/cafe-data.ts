export type CafeStatus = "verified" | "review-needed";

export type CafeAtlasProperties = {
	id: string;
	name: string;
	category: "kafe";
	scope: "in-city";
	address: string | null;
	hours: string | null;
	rating: number | null;
	reviewsCount: number;
	status: CafeStatus;
	mapsUrl: string | null;
};

export type CafeAtlasFeature = {
	type: "Feature";
	geometry: { type: "Point"; coordinates: [number, number] };
	properties: CafeAtlasProperties;
};

export type CafeAtlasCollection = {
	type: "FeatureCollection";
	features: CafeAtlasFeature[];
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === "object" && value !== null;
}

function stringOrNull(value: unknown) {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown) {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function slugify(value: string) {
	return value
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export function normalizeCafeCollection(input: unknown): CafeAtlasCollection {
	if (!isRecord(input) || input.type !== "FeatureCollection" || !Array.isArray(input.features)) {
		throw new Error("Cafe data must be a GeoJSON FeatureCollection");
	}

	const features = input.features.map((feature, index): CafeAtlasFeature => {
		if (!isRecord(feature) || !isRecord(feature.geometry) || !isRecord(feature.properties)) {
			throw new Error(`Cafe feature ${index} is malformed`);
		}

		const coordinates = feature.geometry.coordinates;
		const name = stringOrNull(feature.properties.name);
		if (
			feature.geometry.type !== "Point" ||
			!Array.isArray(coordinates) ||
			coordinates.length !== 2 ||
			coordinates.some((coordinate) => typeof coordinate !== "number" || !Number.isFinite(coordinate)) ||
			!name
		) {
			throw new Error(`Cafe feature ${index} has invalid public geometry or name`);
		}

		const contact = isRecord(feature.properties.contact) ? feature.properties.contact : {};
		const hours = isRecord(feature.properties.operating_hours) ? feature.properties.operating_hours : {};
		const reputation = isRecord(feature.properties.reputation) ? feature.properties.reputation : {};
		const validation = isRecord(feature.properties._validation) ? feature.properties._validation : {};
		const isPublicProjection = feature.properties.category === "kafe" && typeof feature.properties.id === "string";

		return {
			type: "Feature",
			geometry: { type: "Point", coordinates: coordinates as [number, number] },
			properties: {
				id: isPublicProjection
					? String(feature.properties.id)
					: `cafe-${slugify(name)}-${String(index + 1).padStart(2, "0")}`,
				name,
				category: "kafe",
				scope: "in-city",
				address: stringOrNull(isPublicProjection ? feature.properties.address : contact.address),
				hours: stringOrNull(isPublicProjection ? feature.properties.hours : hours.workday_timing),
				rating: numberOrNull(isPublicProjection ? feature.properties.rating : reputation.rating),
				reviewsCount:
					numberOrNull(isPublicProjection ? feature.properties.reviewsCount : reputation.reviews_count) ?? 0,
				status:
					isPublicProjection && feature.properties.status === "review-needed"
						? "review-needed"
						: validation.is_valid === false
							? "review-needed"
							: "verified",
				mapsUrl: stringOrNull(isPublicProjection ? feature.properties.mapsUrl : feature.properties.link),
			},
		};
	});

	return { type: "FeatureCollection", features };
}
