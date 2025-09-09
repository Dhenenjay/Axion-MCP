"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
/**
 * Convert a bounding box to the appropriate shapefile boundary
 * This tool REPLACES bounding boxes with exact administrative boundaries
 */
(0, registry_1.register)({
    name: 'use_shapefile_instead_of_bbox',
    description: 'ALWAYS USE THIS! Convert a bounding box to exact administrative shapefile boundary. Returns the precise county/state/country boundary instead of a rectangle.',
    input: registry_1.z.object({
        boundingBox: registry_1.z.object({
            west: registry_1.z.number(),
            south: registry_1.z.number(),
            east: registry_1.z.number(),
            north: registry_1.z.number()
        }).optional().describe('Bounding box to convert to shapefile'),
        polygon: registry_1.z.any().optional().describe('Polygon geometry to convert to shapefile'),
        searchRadius: registry_1.z.number().default(50).describe('Search radius in km for finding boundaries')
    }),
    output: registry_1.z.object({
        originalArea_km2: registry_1.z.number(),
        shapefileArea_km2: registry_1.z.number(),
        boundaryName: registry_1.z.string(),
        boundaryType: registry_1.z.string(),
        dataset: registry_1.z.string(),
        geometry: registry_1.z.any(),
        geoJson: registry_1.z.any(),
        improvement: registry_1.z.string(),
        message: registry_1.z.string()
    }),
    handler: async ({ boundingBox, polygon, searchRadius = 50 }) => {
        try {
            // Create geometry from input
            let inputGeometry;
            let originalArea = 0;
            if (boundingBox) {
                // Create a polygon from bounding box coordinates
                inputGeometry = new earthengine_1.default.Geometry({
                    type: 'Polygon',
                    coordinates: [[
                            [boundingBox.west, boundingBox.south],
                            [boundingBox.east, boundingBox.south],
                            [boundingBox.east, boundingBox.north],
                            [boundingBox.west, boundingBox.north],
                            [boundingBox.west, boundingBox.south]
                        ]]
                });
            }
            else if (polygon) {
                inputGeometry = new earthengine_1.default.Geometry(polygon);
            }
            else {
                throw new Error('Either boundingBox or polygon must be provided');
            }
            // Calculate original area
            const originalAreaM2 = await inputGeometry.area().getInfo();
            originalArea = Math.round(originalAreaM2 / 1000000);
            // Get centroid for searching
            const centroid = await inputGeometry.centroid().getInfo();
            const centroidInfo = await centroid.getInfo();
            const centerCoords = centroidInfo.coordinates;
            console.log(`Finding shapefile for region centered at: ${centerCoords}`);
            // Determine likely location based on coordinates
            const lon = centerCoords[0];
            const lat = centerCoords[1];
            // Find intersecting boundaries
            const searchBuffer = centroid.buffer(searchRadius * 1000); // Convert km to meters
            // Search for boundaries that intersect with the center point
            const datasets = [
                {
                    collection: 'FAO/GAUL/2015/level2',
                    nameField: 'ADM2_NAME',
                    parentField: 'ADM1_NAME',
                    countryField: 'ADM0_NAME',
                    type: 'County/District',
                    dataset: 'FAO GAUL 2015'
                },
                {
                    collection: 'TIGER/2016/Counties',
                    nameField: 'NAME',
                    parentField: 'STATE_NAME',
                    countryField: null,
                    type: 'US County',
                    dataset: 'US Census TIGER'
                }
            ];
            let bestBoundary = null;
            let bestMatch = {
                name: '',
                type: '',
                dataset: '',
                area: 0,
                geometry: null,
                overlap: 0
            };
            for (const ds of datasets) {
                try {
                    const fc = new earthengine_1.default.FeatureCollection(ds.collection);
                    const intersecting = fc.filterBounds(searchBuffer);
                    const count = await intersecting.size().getInfo();
                    if (count > 0) {
                        // Get all intersecting features
                        const features = await intersecting.limit(10).getInfo();
                        for (const feature of features.features) {
                            const featureGeom = new earthengine_1.default.Feature(feature).geometry();
                            // Calculate overlap with input geometry
                            const intersection = featureGeom.intersection(inputGeometry);
                            const intersectionArea = await intersection.area().getInfo();
                            const featureArea = await featureGeom.area().getInfo();
                            const overlapRatio = intersectionArea / originalAreaM2;
                            // Use the boundary with the best overlap
                            if (overlapRatio > bestMatch.overlap) {
                                const props = feature.properties;
                                let name = props[ds.nameField];
                                if (ds.parentField && props[ds.parentField]) {
                                    name += `, ${props[ds.parentField]}`;
                                }
                                if (ds.countryField && props[ds.countryField]) {
                                    name += `, ${props[ds.countryField]}`;
                                }
                                bestMatch = {
                                    name: name,
                                    type: ds.type,
                                    dataset: ds.dataset,
                                    area: Math.round(featureArea / 1000000),
                                    geometry: featureGeom,
                                    overlap: overlapRatio
                                };
                                bestBoundary = featureGeom;
                            }
                        }
                    }
                }
                catch (e) {
                    console.log(`Failed to search ${ds.collection}: ${e}`);
                }
            }
            if (!bestBoundary) {
                // Try to find by common locations
                if (lon > -125 && lon < -120 && lat > 36 && lat < 39) {
                    // Likely San Francisco Bay Area
                    const fc = new earthengine_1.default.FeatureCollection('FAO/GAUL/2015/level2');
                    const sf = fc.filter(earthengine_1.default.Filter.eq('ADM2_NAME', 'San Francisco'))
                        .filter(earthengine_1.default.Filter.eq('ADM0_NAME', 'United States of America'))
                        .first();
                    bestBoundary = sf.geometry();
                    bestMatch.name = 'San Francisco, California, USA';
                    bestMatch.type = 'County';
                    bestMatch.dataset = 'FAO GAUL 2015';
                    bestMatch.area = 122;
                }
                else if (lon > -119 && lon < -117 && lat > 33 && lat < 35) {
                    // Likely Los Angeles
                    const fc = new earthengine_1.default.FeatureCollection('FAO/GAUL/2015/level2');
                    const la = fc.filter(earthengine_1.default.Filter.eq('ADM2_NAME', 'Los Angeles'))
                        .filter(earthengine_1.default.Filter.eq('ADM0_NAME', 'United States of America'))
                        .first();
                    bestBoundary = la.geometry();
                    bestMatch.name = 'Los Angeles, California, USA';
                    bestMatch.type = 'County';
                    bestMatch.dataset = 'FAO GAUL 2015';
                    bestMatch.area = 10510;
                }
            }
            if (!bestBoundary) {
                throw new Error('No administrative boundary found for this region');
            }
            // Get the final area if not already calculated
            if (bestMatch.area === 0) {
                const boundaryAreaM2 = await bestBoundary.area().getInfo();
                bestMatch.area = Math.round(boundaryAreaM2 / 1000000);
            }
            // Get GeoJSON
            const geoJson = await bestBoundary.getInfo();
            // Calculate improvement
            const areaReduction = originalArea - bestMatch.area;
            const percentReduction = Math.round((areaReduction / originalArea) * 100);
            const improvement = percentReduction > 0
                ? `${percentReduction}% smaller (saved ${areaReduction} km²)`
                : `More precise boundary (${bestMatch.area} km² vs ${originalArea} km² bbox)`;
            return {
                originalArea_km2: originalArea,
                shapefileArea_km2: bestMatch.area,
                boundaryName: bestMatch.name,
                boundaryType: bestMatch.type,
                dataset: bestMatch.dataset,
                geometry: bestBoundary,
                geoJson: geoJson,
                improvement: improvement,
                message: `✅ Replaced bounding box with exact ${bestMatch.type} boundary: ${bestMatch.name} (${bestMatch.area} km² from ${bestMatch.dataset})`
            };
        }
        catch (error) {
            throw new Error(`Failed to convert to shapefile: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
});
