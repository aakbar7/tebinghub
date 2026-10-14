import type { Feature, Polygon } from "geojson";
import boundary from "./kota-tebing-tinggi.json";

export const kotaTebingTinggiBoundary = boundary as Feature<Polygon>;

// Padded bounding box of OSM relation 8484619; keeps the map focused on the city.
export const KOTA_TEBING_TINGGI_MAX_BOUNDS: [[number, number], [number, number]] = [
	[99.104, 3.264],
	[99.204, 3.388],
];
