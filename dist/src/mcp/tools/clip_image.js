"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const geo_1 = require("@/src/utils/geo");
(0, registry_1.register)({
    name: 'clip_image_to_region',
    description: 'Clip image by AOI (supports place names like "San Francisco")',
    input: registry_1.z.object({
        imageId: registry_1.z.string(),
        aoi: registry_1.z.any(),
        placeName: registry_1.z.string().optional() // Optional place name for boundary lookup
    }),
    output: registry_1.z.object({
        ok: registry_1.z.boolean(),
        regionType: registry_1.z.string(),
        message: registry_1.z.string()
    }),
    handler: async ({ imageId, aoi, placeName }) => {
        // If placeName is provided, add it to aoi for boundary lookup
        if (placeName && typeof aoi === 'object') {
            aoi.placeName = placeName;
        }
        const img = new earthengine_1.default.Image(imageId);
        const region = await (0, geo_1.parseAoi)(aoi);
        const regionType = aoi.placeName && region ? 'administrative_boundary' : 'polygon';
        img.clip(region).bandNames();
        return {
            ok: true,
            regionType,
            message: regionType === 'administrative_boundary'
                ? `Clipped to exact boundary of ${aoi.placeName}`
                : 'Clipped to polygon region'
        };
    },
});
