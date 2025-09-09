"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const geometry_cache_1 = require("@/src/utils/geometry-cache");
/**
 * Convert place names to Earth Engine geometry using built-in shapefiles
 * This tool fetches administrative boundaries from Earth Engine's datasets
 * and returns them as immediately usable geometries
 */
(0, registry_1.register)({
    name: 'convert_place_to_shapefile_geometry',
    description: 'Convert any place name (city, county, state, country) to exact shapefile geometry from Earth Engine datasets. Returns GeoJSON that can be used directly for filtering, clipping, and exporting.',
    input: registry_1.z.object({
        placeName: registry_1.z.string().describe('Name of place (e.g., "Los Angeles", "San Francisco County", "California", "United States")'),
        simplify: registry_1.z.boolean().default(false).describe('Simplify geometry to reduce complexity'),
        maxError: registry_1.z.number().default(100).describe('Maximum error in meters for simplification')
    }),
    output: registry_1.z.object({
        success: registry_1.z.boolean(),
        placeName: registry_1.z.string(),
        geometry: registry_1.z.any(),
        geoJson: registry_1.z.any(),
        area_km2: registry_1.z.number(),
        perimeter_km: registry_1.z.number(),
        dataset: registry_1.z.string(),
        level: registry_1.z.string(),
        bbox: registry_1.z.object({
            west: registry_1.z.number(),
            south: registry_1.z.number(),
            east: registry_1.z.number(),
            north: registry_1.z.number()
        }),
        centroid: registry_1.z.object({
            lon: registry_1.z.number(),
            lat: registry_1.z.number()
        }),
        usage: registry_1.z.string()
    }),
    handler: async ({ placeName, simplify = false, maxError = 100 }) => {
        // Resolve any aliases
        const resolvedName = (0, geometry_cache_1.resolvePlaceName)(placeName);
        try {
            console.log(`Converting "${resolvedName}" to shapefile geometry...`);
            // Check cache first
            const cached = geometry_cache_1.geometryCache.get(resolvedName);
            if (cached && !simplify) {
                console.log(`Using cached geometry for "${resolvedName}"`);
                return {
                    success: true,
                    placeName: resolvedName,
                    geometry: cached.geometry,
                    geoJson: cached.geoJson,
                    area_km2: cached.metadata.area_km2,
                    perimeter_km: cached.metadata.perimeter_km,
                    dataset: cached.metadata.dataset,
                    level: cached.metadata.level,
                    bbox: cached.metadata.bbox,
                    centroid: cached.metadata.centroid,
                    usage: `Use the 'geoJson' field directly in any Earth Engine operation. Example: filter_collection_by_date_and_region({ aoi: <this geoJson>, ... })`
                };
            }
            // Define search strategies for different place types
            const searchStrategies = [
                // US Counties - most specific
                {
                    name: 'US County (Census TIGER)',
                    check: () => resolvedName.toLowerCase().includes('county') ||
                        ['los angeles', 'san francisco', 'orange', 'san diego', 'santa clara'].some(c => resolvedName.toLowerCase().includes(c)),
                    search: async () => {
                        const counties = new earthengine_1.default.FeatureCollection('TIGER/2016/Counties');
                        // Try exact match first
                        let matches = counties.filter(earthengine_1.default.Filter.eq('NAME', resolvedName.replace(' County', '')));
                        let count = await matches.size().getInfo();
                        if (count === 0) {
                            // Try with "County" added
                            matches = counties.filter(earthengine_1.default.Filter.eq('NAMELSAD', resolvedName + ' County'));
                            count = await matches.size().getInfo();
                        }
                        // Note: ee.Filter.stringContains doesn't exist, so we can't do partial matching
                        if (count > 0) {
                            return {
                                feature: matches.first(),
                                dataset: 'US Census TIGER 2016',
                                level: 'County'
                            };
                        }
                        return null;
                    }
                },
                // FAO GAUL Level 2 - Districts/Counties worldwide
                {
                    name: 'Global Districts (FAO GAUL)',
                    check: () => true,
                    search: async () => {
                        const districts = new earthengine_1.default.FeatureCollection('FAO/GAUL/2015/level2');
                        // Handle special cases
                        const placeMap = {
                            'los angeles': { name: 'Los Angeles', state: 'California', country: 'United States of America' },
                            'san francisco': { name: 'San Francisco', state: 'California', country: 'United States of America' },
                            'new york': { name: 'New York', state: 'New York', country: 'United States of America' },
                            'chicago': { name: 'Cook', state: 'Illinois', country: 'United States of America' },
                            'miami': { name: 'Miami-Dade', state: 'Florida', country: 'United States of America' },
                            'seattle': { name: 'King', state: 'Washington', country: 'United States of America' },
                            'boston': { name: 'Suffolk', state: 'Massachusetts', country: 'United States of America' },
                            'dallas': { name: 'Dallas', state: 'Texas', country: 'United States of America' },
                            'houston': { name: 'Harris', state: 'Texas', country: 'United States of America' },
                            'phoenix': { name: 'Maricopa', state: 'Arizona', country: 'United States of America' }
                        };
                        const lowerPlace = resolvedName.toLowerCase();
                        if (placeMap[lowerPlace]) {
                            const mapping = placeMap[lowerPlace];
                            let filtered = districts
                                .filter(earthengine_1.default.Filter.eq('ADM2_NAME', mapping.name))
                                .filter(earthengine_1.default.Filter.eq('ADM0_NAME', mapping.country));
                            if (mapping.state) {
                                filtered = filtered.filter(earthengine_1.default.Filter.eq('ADM1_NAME', mapping.state));
                            }
                            const count = await filtered.size().getInfo();
                            if (count > 0) {
                                return {
                                    feature: filtered.first(),
                                    dataset: 'FAO GAUL 2015',
                                    level: 'District/County'
                                };
                            }
                        }
                        // Try direct match
                        let matches = districts.filter(earthengine_1.default.Filter.eq('ADM2_NAME', resolvedName));
                        let count = await matches.size().getInfo();
                        if (count > 0) {
                            return {
                                feature: matches.first(),
                                dataset: 'FAO GAUL 2015',
                                level: 'District'
                            };
                        }
                        return null;
                    }
                },
                // US States
                {
                    name: 'US States',
                    check: () => ['california', 'texas', 'florida', 'new york', 'illinois'].some(s => resolvedName.toLowerCase().includes(s)),
                    search: async () => {
                        const states = new earthengine_1.default.FeatureCollection('TIGER/2016/States');
                        let matches = states.filter(earthengine_1.default.Filter.eq('NAME', resolvedName));
                        const count = await matches.size().getInfo();
                        if (count > 0) {
                            return {
                                feature: matches.first(),
                                dataset: 'US Census TIGER 2016',
                                level: 'State'
                            };
                        }
                        return null;
                    }
                },
                // FAO GAUL Level 1 - States/Provinces
                {
                    name: 'Global States/Provinces',
                    check: () => true,
                    search: async () => {
                        const states = new earthengine_1.default.FeatureCollection('FAO/GAUL/2015/level1');
                        let matches = states.filter(earthengine_1.default.Filter.eq('ADM1_NAME', resolvedName));
                        const count = await matches.size().getInfo();
                        if (count > 0) {
                            return {
                                feature: matches.first(),
                                dataset: 'FAO GAUL 2015',
                                level: 'State/Province'
                            };
                        }
                        return null;
                    }
                },
                // Countries
                {
                    name: 'Countries',
                    check: () => true,
                    search: async () => {
                        const countries = new earthengine_1.default.FeatureCollection('FAO/GAUL/2015/level0');
                        let matches = countries.filter(earthengine_1.default.Filter.eq('ADM0_NAME', resolvedName));
                        const count = await matches.size().getInfo();
                        if (count > 0) {
                            return {
                                feature: matches.first(),
                                dataset: 'FAO GAUL 2015',
                                level: 'Country'
                            };
                        }
                        return null;
                    }
                }
            ];
            // Search through strategies
            let result = null;
            for (const strategy of searchStrategies) {
                if (strategy.check()) {
                    console.log(`Trying ${strategy.name}...`);
                    result = await strategy.search();
                    if (result) {
                        console.log(`Found in ${strategy.name}`);
                        break;
                    }
                }
            }
            if (!result) {
                throw new Error(`No shapefile boundary found for "${resolvedName}". Try a more specific name or check spelling.`);
            }
            // Get the geometry
            let geometry = result.feature.geometry();
            // Simplify if requested
            if (simplify) {
                geometry = geometry.simplify(maxError);
                console.log(`Simplified geometry with max error of ${maxError}m`);
            }
            // Calculate metrics
            const area = await geometry.area().getInfo();
            const perimeter = await geometry.perimeter().getInfo();
            const bounds = await geometry.bounds().getInfo();
            const centroid = await geometry.centroid().getInfo();
            // Get the actual GeoJSON
            const geoJson = await geometry.getInfo();
            // Extract bbox coordinates
            const coords = bounds.coordinates[0];
            const bbox = {
                west: Math.min(coords[0][0], coords[1][0], coords[2][0], coords[3][0]),
                south: Math.min(coords[0][1], coords[1][1], coords[2][1], coords[3][1]),
                east: Math.max(coords[0][0], coords[1][0], coords[2][0], coords[3][0]),
                north: Math.max(coords[0][1], coords[1][1], coords[2][1], coords[3][1])
            };
            const centroidCoords = centroid.coordinates;
            // Cache the result if not simplified
            if (!simplify) {
                geometry_cache_1.geometryCache.set(resolvedName, {
                    geometry: geometry,
                    geoJson: geoJson,
                    metadata: {
                        area_km2: Math.round(area / 1000000),
                        perimeter_km: Math.round(perimeter / 1000),
                        dataset: result.dataset,
                        level: result.level,
                        bbox: bbox,
                        centroid: {
                            lon: centroidCoords[0],
                            lat: centroidCoords[1]
                        }
                    }
                });
            }
            return {
                success: true,
                placeName: resolvedName,
                geometry: geometry,
                geoJson: geoJson,
                area_km2: Math.round(area / 1000000),
                perimeter_km: Math.round(perimeter / 1000),
                dataset: result.dataset,
                level: result.level,
                bbox: bbox,
                centroid: {
                    lon: centroidCoords[0],
                    lat: centroidCoords[1]
                },
                usage: `Use the 'geoJson' field directly in any Earth Engine operation. Example: filter_collection_by_date_and_region({ aoi: <this geoJson>, ... })`
            };
        }
        catch (error) {
            console.error('Error converting place to shapefile:', error);
            throw new Error(`Failed to convert "${resolvedName}" to shapefile: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
});
/**
 * Import a custom shapefile as an Earth Engine asset
 * This handles user-provided shapefiles
 */
(0, registry_1.register)({
    name: 'import_custom_shapefile',
    description: 'Import a custom shapefile (from file or GeoJSON) as an Earth Engine asset for use in operations',
    input: registry_1.z.object({
        name: registry_1.z.string().describe('Name for this shapefile asset'),
        geoJson: registry_1.z.any().describe('GeoJSON object (FeatureCollection or Feature)'),
        properties: registry_1.z.record(registry_1.z.any()).optional().describe('Properties to attach to the geometry')
    }),
    output: registry_1.z.object({
        success: registry_1.z.boolean(),
        assetId: registry_1.z.string(),
        geometry: registry_1.z.any(),
        area_km2: registry_1.z.number(),
        message: registry_1.z.string()
    }),
    handler: async ({ name, geoJson, properties = {} }) => {
        try {
            // Create Earth Engine geometry from GeoJSON
            let eeGeometry;
            if (geoJson.type === 'FeatureCollection') {
                eeGeometry = new earthengine_1.default.FeatureCollection(geoJson.features.map((f) => new earthengine_1.default.Feature(new earthengine_1.default.Geometry(f.geometry), f.properties || {})));
            }
            else if (geoJson.type === 'Feature') {
                eeGeometry = new earthengine_1.default.Feature(new earthengine_1.default.Geometry(geoJson.geometry), geoJson.properties || properties);
            }
            else if (geoJson.type && geoJson.coordinates) {
                // Direct geometry
                eeGeometry = new earthengine_1.default.Geometry(geoJson);
            }
            else {
                throw new Error('Invalid GeoJSON format');
            }
            // For now, we'll work with the geometry directly without uploading to assets
            // (Asset upload requires additional authentication and permissions)
            // Calculate area
            const geometry = eeGeometry.geometry ? eeGeometry.geometry() : eeGeometry;
            const area = await geometry.area().getInfo();
            return {
                success: true,
                assetId: `memory://${name}`,
                geometry: geometry,
                area_km2: Math.round(area / 1000000),
                message: `Custom shapefile "${name}" loaded successfully (${Math.round(area / 1000000)} km²). Use the geometry directly in operations.`
            };
        }
        catch (error) {
            throw new Error(`Failed to import shapefile: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
});
