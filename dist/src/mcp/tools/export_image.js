"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const tasks_1 = require("@/src/gee/tasks");
const geo_1 = require("@/src/utils/geo");
(0, registry_1.register)({
    name: 'export_image_to_cloud_storage',
    description: 'Start a GeoTIFF export to GCS (supports place names like "San Francisco")',
    input: registry_1.z.object({
        imageId: registry_1.z.string(),
        bucket: registry_1.z.string().optional(),
        fileNamePrefix: registry_1.z.string().optional(),
        aoi: registry_1.z.any().optional(),
        region: registry_1.z.any().optional(), // Alternative to aoi
        scale: registry_1.z.number().optional(),
        crs: registry_1.z.string().optional(),
        placeName: registry_1.z.string().optional() // Optional place name for boundary lookup
    }),
    output: registry_1.z.object({
        taskId: registry_1.z.string(),
        state: registry_1.z.string().optional(),
        regionType: registry_1.z.string()
    }),
    handler: async ({ imageId, bucket, fileNamePrefix, aoi, region: regionParam, scale, crs, placeName }) => {
        // Use aoi or region parameter
        const aoiInput = aoi || regionParam;
        // If placeName is provided, add it to aoi for boundary lookup
        if (placeName && typeof aoiInput === 'object') {
            aoiInput.placeName = placeName;
        }
        const image = new earthengine_1.default.Image(imageId);
        const region = await (0, geo_1.parseAoi)(aoiInput);
        const regionType = (aoiInput?.placeName || placeName) && region ? 'administrative_boundary' : 'polygon';
        // Use defaults if not provided
        const exportBucket = bucket || 'earth-engine-exports';
        const exportPrefix = fileNamePrefix || `export-${Date.now()}`;
        const exportScale = scale || 30;
        const exportCrs = crs || 'EPSG:4326';
        // Convert region to GeoJSON if it's a computed geometry
        let exportRegion = region;
        try {
            // Try to get the geometry info for export
            exportRegion = await region.getInfo();
        }
        catch (e) {
            // If that fails, use the original region
            exportRegion = region;
        }
        const { taskId } = (0, tasks_1.exportImageToGCS)({
            image,
            description: `export-${exportPrefix}`,
            bucket: exportBucket,
            fileNamePrefix: exportPrefix,
            region: exportRegion,
            scale: exportScale,
            crs: exportCrs
        });
        const status = (0, tasks_1.getTaskStatus)(taskId);
        return {
            taskId,
            state: status.state,
            regionType
        };
    },
});
