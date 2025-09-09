"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const geo_1 = require("@/src/utils/geo");
(0, registry_1.register)({
    name: 'get_thumbnail_image',
    description: 'Get high-resolution thumbnail URL clipped to exact shapefile boundaries',
    input: registry_1.z.object({
        imageId: registry_1.z.string().optional(),
        datasetId: registry_1.z.string().optional(),
        start: registry_1.z.string().optional(),
        end: registry_1.z.string().optional(),
        aoi: registry_1.z.any(),
        visParams: registry_1.z.record(registry_1.z.any()).default({}),
        size: registry_1.z.object({ width: registry_1.z.number().default(1024), height: registry_1.z.number().default(1024) }).default({ width: 1024, height: 1024 })
    }),
    output: registry_1.z.object({ url: registry_1.z.string(), ttlSeconds: registry_1.z.number(), width: registry_1.z.number(), height: registry_1.z.number() }),
    handler: async ({ imageId, datasetId, start, end, aoi, visParams, size }) => {
        const region = await (0, geo_1.parseAoi)(aoi);
        let image;
        if (imageId) {
            image = new earthengine_1.default.Image(imageId);
        }
        else if (datasetId && start && end) {
            // Create a median composite from the collection
            const collection = new earthengine_1.default.ImageCollection(datasetId)
                .filterDate(start, end)
                .filterBounds(region)
                .select(['B4', 'B3', 'B2']); // Select RGB bands for visualization
            // Use first image if collection is small, otherwise median
            const count = await collection.size().getInfo();
            image = count > 0 ? collection.median() : collection.first();
        }
        else {
            throw new Error('Either imageId or (datasetId, start, end) must be provided');
        }
        // Get the bounds of the region for proper scaling
        const bounds = region.bounds();
        const coords = await bounds.coordinates().getInfo();
        // Calculate aspect ratio to maintain shape
        const west = coords[0][0][0];
        const south = coords[0][0][1];
        const east = coords[0][2][0];
        const north = coords[0][2][1];
        const aspectRatio = Math.abs(east - west) / Math.abs(north - south);
        const targetWidth = size?.width || 1024;
        const targetHeight = Math.round(targetWidth / aspectRatio);
        // Clip the image to the exact shapefile boundary
        if (image) {
            image = image.clip(region);
        }
        // Enhanced visualization parameters for better quality
        const defaultVis = {
            min: visParams?.min || 0,
            max: visParams?.max || 3000,
            gamma: visParams?.gamma || 1.4,
            bands: visParams?.bands || (datasetId?.includes('LANDSAT') ? ['B4', 'B3', 'B2'] : ['B4', 'B3', 'B2'])
        };
        try {
            // Use bounds instead of complex polygon for URL generation
            const regionBounds = await bounds.getInfo();
            // Get high-resolution thumbnail with exact shapefile boundary
            // @ts-ignore
            const url = await image.getThumbURL({
                region: regionBounds, // Use bounds instead of full geometry
                dimensions: `${targetWidth}x${targetHeight}`,
                format: 'png',
                ...defaultVis
            });
            return {
                url,
                ttlSeconds: 3600,
                width: targetWidth,
                height: targetHeight
            };
        }
        catch (error) {
            console.log('Thumbnail generation error, trying fallback:', error.message);
            // Fallback to a slightly lower resolution if needed
            const fallbackWidth = Math.min(targetWidth, 512);
            const fallbackHeight = Math.round(fallbackWidth / aspectRatio);
            try {
                // Use bounds for fallback too
                const regionBounds = await bounds.getInfo();
                // @ts-ignore
                const url = await image.getThumbURL({
                    region: regionBounds,
                    dimensions: `${fallbackWidth}x${fallbackHeight}`,
                    format: 'png',
                    ...defaultVis
                });
                return {
                    url,
                    ttlSeconds: 3600,
                    width: fallbackWidth,
                    height: fallbackHeight
                };
            }
            catch (fallbackError) {
                // Last resort: use a point buffer
                const centroid = region.centroid();
                const buffer = centroid.buffer(10000); // 10km buffer
                const bufferBounds = await buffer.bounds().getInfo();
                // @ts-ignore
                const url = await image.getThumbURL({
                    region: bufferBounds,
                    dimensions: '256x256',
                    format: 'png',
                    ...defaultVis
                });
                return {
                    url,
                    ttlSeconds: 3600,
                    width: 256,
                    height: 256
                };
            }
        }
    },
});
