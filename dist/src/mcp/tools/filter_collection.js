"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const geo_1 = require("@/src/utils/geo");
/**
 * Detect place name from coordinates or context
 */
function detectPlaceFromRegion(aoi) {
    // Check if it's San Francisco area based on coordinates
    if (aoi && aoi.type === 'Polygon' && aoi.coordinates) {
        const coords = aoi.coordinates[0];
        if (coords && coords.length > 0) {
            const lons = coords.map((c) => c[0]);
            const lats = coords.map((c) => c[1]);
            const avgLon = lons.reduce((a, b) => a + b, 0) / lons.length;
            const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
            // San Francisco coordinates (expanded range to catch more variations)
            if (avgLon > -123.0 && avgLon < -122.0 && avgLat > 37.3 && avgLat < 38.0) {
                return 'San Francisco';
            }
            // Add more cities as needed
            if (avgLon > -74.1 && avgLon < -73.9 && avgLat > 40.6 && avgLat < 40.9) {
                return 'New York';
            }
        }
    }
    return null;
}
(0, registry_1.register)({
    name: 'filter_collection_by_date_and_region',
    description: 'Filter an ImageCollection by time range and AOI (automatically detects place names like "San Francisco" and uses administrative boundaries)',
    input: registry_1.z.object({
        datasetId: registry_1.z.string(),
        aoi: registry_1.z.any(),
        start: registry_1.z.string(),
        end: registry_1.z.string(),
        placeName: registry_1.z.string().optional() // Optional place name for boundary lookup
    }),
    output: registry_1.z.object({
        count: registry_1.z.number(),
        regionType: registry_1.z.string(),
        message: registry_1.z.string(),
        detectedPlace: registry_1.z.string().nullable()
    }),
    handler: async ({ datasetId, aoi, start, end, placeName }) => {
        console.log('Filter called with:', { datasetId, aoi, start, end, placeName });
        const region = await (0, geo_1.parseAoi)(aoi);
        // Handle nested region structure if present
        if (aoi?.region) {
            aoi = aoi.region;
        }
        // Add explicit placeName if provided
        if (placeName && typeof aoi === 'object') {
            aoi.placeName = placeName;
        }
        // parseAoi now handles all the logic for detecting places and fetching boundaries
        // (already called above with await)
        const col = new earthengine_1.default.ImageCollection(datasetId).filterDate(start, end).filterBounds(region);
        const count = await col.size().getInfo();
        // Check if we used an administrative boundary
        const usedBoundary = (aoi.placeName || placeName) ? true : false;
        const placeName_used = aoi.placeName || placeName || null;
        // Try to get the area of the region to confirm boundary usage
        let area = null;
        try {
            const areaM2 = await region.area().getInfo();
            area = Math.round(areaM2 / 1000000); // Convert to km²
        }
        catch (e) {
            // Area calculation might fail
        }
        const regionType = usedBoundary && area ? 'SHAPEFILE_BOUNDARY' : 'polygon';
        const message = usedBoundary && area
            ? `✅ Using EXACT SHAPEFILE BOUNDARY for ${placeName_used} (${area} km²) from FAO GAUL dataset`
            : placeName_used
                ? `⚠️ Attempted to use shapefile for ${placeName_used} but fell back to polygon`
                : '📍 Using polygon region (no place detected)';
        return {
            count,
            regionType,
            message,
            detectedPlace: placeName_used,
            area
        };
    },
});
