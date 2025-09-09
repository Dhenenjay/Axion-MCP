"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const geo_1 = require("@/src/utils/geo");
(0, registry_1.register)({
    name: 'calculate_summary_statistics',
    description: 'reduceRegion over AOI',
    input: registry_1.z.object({ imageId: registry_1.z.string(), aoi: registry_1.z.any(), scale: registry_1.z.number().optional() }),
    output: registry_1.z.object({ stats: registry_1.z.record(registry_1.z.number()).nullable() }),
    handler: async ({ imageId, aoi, scale }) => {
        const img = new earthengine_1.default.Image(imageId);
        const region = await (0, geo_1.parseAoi)(aoi);
        const reducers = earthengine_1.default.Reducer.mean().combine({ reducer2: earthengine_1.default.Reducer.stdDev(), sharedInputs: true });
        const dict = await img.reduceRegion({ reducer: reducers, geometry: region, scale: scale ?? 30, maxPixels: 1e8 }).getInfo();
        return { stats: dict ?? null };
    },
});
