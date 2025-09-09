"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
/**
 * Get administrative boundary shapefile for any location
 * This tool explicitly returns shapefiles from Earth Engine datasets
 */
(0, registry_1.register)({
    name: 'get_shapefile_boundary',
    description: 'Get exact administrative boundary shapefile for any location (county, state, country) from Earth Engine datasets. Use this instead of bounding boxes!',
    input: registry_1.z.object({
        placeName: registry_1.z.string().describe('Name of place (e.g., "San Francisco", "Los Angeles County", "California", "United States")'),
        level: registry_1.z.enum(['county', 'state', 'country', 'auto']).default('auto').describe('Administrative level to search')
    }),
    output: registry_1.z.object({
        found: registry_1.z.boolean(),
        geometry: registry_1.z.any().optional(),
        geoJson: registry_1.z.any().optional(),
        area_km2: registry_1.z.number().optional(),
        dataset: registry_1.z.string().optional(),
        adminLevel: registry_1.z.string().optional(),
        fullName: registry_1.z.string().optional(),
        boundingBox: registry_1.z.object({
            west: registry_1.z.number(),
            south: registry_1.z.number(),
            east: registry_1.z.number(),
            north: registry_1.z.number()
        }).optional(),
        message: registry_1.z.string()
    }),
    handler: async ({ placeName, level = 'auto' }) => {
        console.log(`Getting shapefile boundary for: ${placeName} (level: ${level})`);
        try {
            let boundary = null;
            let dataset = '';
            let adminLevel = '';
            let fullName = placeName;
            // Try different datasets based on level
            const searches = [];
            if (level === 'county' || level === 'auto') {
                // Try FAO GAUL Level 2 (counties/districts)
                searches.push({
                    collection: 'FAO/GAUL/2015/level2',
                    filters: [
                        { property: 'ADM2_NAME', value: placeName },
                    ],
                    level: 'county/district',
                    dataset: 'FAO GAUL 2015 Level 2'
                });
                // Try US Census TIGER for US counties
                searches.push({
                    collection: 'TIGER/2016/Counties',
                    filters: [
                        { property: 'NAME', value: placeName },
                    ],
                    level: 'US county',
                    dataset: 'US Census TIGER 2016'
                });
            }
            if (level === 'state' || level === 'auto') {
                // Try FAO GAUL Level 1 (states/provinces)
                searches.push({
                    collection: 'FAO/GAUL/2015/level1',
                    filters: [
                        { property: 'ADM1_NAME', value: placeName },
                    ],
                    level: 'state/province',
                    dataset: 'FAO GAUL 2015 Level 1'
                });
                // Try US Census TIGER for US states
                searches.push({
                    collection: 'TIGER/2016/States',
                    filters: [
                        { property: 'NAME', value: placeName },
                    ],
                    level: 'US state',
                    dataset: 'US Census TIGER 2016'
                });
            }
            if (level === 'country' || level === 'auto') {
                // Try FAO GAUL Level 0 (countries)
                searches.push({
                    collection: 'FAO/GAUL/2015/level0',
                    filters: [
                        { property: 'ADM0_NAME', value: placeName },
                    ],
                    level: 'country',
                    dataset: 'FAO GAUL 2015 Level 0'
                });
                // Try USDOS LSIB for countries
                searches.push({
                    collection: 'USDOS/LSIB_SIMPLE/2017',
                    filters: [
                        { property: 'country_na', value: placeName },
                    ],
                    level: 'country',
                    dataset: 'USDOS LSIB 2017'
                });
            }
            // Search through datasets
            for (const search of searches) {
                try {
                    const fc = new earthengine_1.default.FeatureCollection(search.collection);
                    // Apply filters
                    let filtered = fc;
                    for (const filter of search.filters) {
                        // Apply exact match filter
                        filtered = filtered.filter(earthengine_1.default.Filter.eq(filter.property, filter.value));
                    }
                    const count = await filtered.size().getInfo();
                    if (count > 0) {
                        const feature = filtered.first();
                        boundary = feature.geometry();
                        dataset = search.dataset;
                        adminLevel = search.level;
                        // Try to get the actual name from the feature
                        try {
                            const props = await feature.getInfo();
                            if (props && props.properties) {
                                // Get the most relevant name
                                fullName = props.properties.ADM2_NAME ||
                                    props.properties.ADM1_NAME ||
                                    props.properties.ADM0_NAME ||
                                    props.properties.NAME ||
                                    props.properties.country_na ||
                                    placeName;
                            }
                        }
                        catch (e) {
                            // Keep original name if we can't get properties
                        }
                        console.log(`Found boundary in ${dataset} as ${adminLevel}`);
                        break;
                    }
                }
                catch (e) {
                    // Continue to next dataset
                    console.log(`Failed to search ${search.collection}: ${e}`);
                }
            }
            if (!boundary) {
                return {
                    found: false,
                    message: `No shapefile boundary found for "${placeName}". Try a different name or administrative level.`,
                    area_km2: undefined,
                    dataset: undefined,
                    adminLevel: undefined,
                    fullName: undefined,
                    boundingBox: undefined,
                    geometry: undefined,
                    geoJson: undefined
                };
            }
            // Calculate area
            const areaM2 = await boundary.area().getInfo();
            const areaKm2 = Math.round(areaM2 / 1000000);
            // Get bounding box
            const bounds = await boundary.bounds().getInfo();
            const coords = bounds.coordinates[0];
            const boundingBox = {
                west: coords[0][0],
                south: coords[0][1],
                east: coords[2][0],
                north: coords[2][1]
            };
            // Get GeoJSON representation
            const geoJson = await boundary.getInfo();
            return {
                found: true,
                geometry: boundary,
                geoJson: geoJson,
                area_km2: areaKm2,
                dataset: dataset,
                adminLevel: adminLevel,
                fullName: fullName,
                boundingBox: boundingBox,
                message: `✅ Found exact shapefile boundary for ${fullName} (${areaKm2} km²) from ${dataset}`
            };
        }
        catch (error) {
            console.error('Error getting shapefile boundary:', error);
            return {
                found: false,
                message: `Error retrieving shapefile: ${error instanceof Error ? error.message : String(error)}`,
                area_km2: undefined,
                dataset: undefined,
                adminLevel: undefined,
                fullName: undefined,
                boundingBox: undefined,
                geometry: undefined,
                geoJson: undefined
            };
        }
    }
});
// /**
//  * List available shapefile boundaries for a region
//  * NOTE: Commented out due to ee.Filter.stringContains and ee.Filter.or not being available
//  */
// register({
//   name: 'list_available_boundaries',
//   description: 'List all available administrative boundaries for a region or search term',
//   input: z.object({
//     searchTerm: z.string().describe('Search term for boundaries (e.g., "California", "United States")'),
//     limit: z.number().default(10).describe('Maximum number of results')
//   }),
//   output: z.object({
//     boundaries: z.array(z.object({
//       name: z.string(),
//       level: z.string(),
//       dataset: z.string(),
//       area_km2: z.number().optional()
//     })),
//     totalFound: z.number(),
//     message: z.string()
//   }),
//   handler: async ({ searchTerm, limit = 10 }) => {
//     // This functionality requires ee.Filter.stringContains which is not available
//     return {
//       boundaries: [],
//       totalFound: 0,
//       message: 'This function is currently disabled due to API limitations'
//     };
//   }
// });
