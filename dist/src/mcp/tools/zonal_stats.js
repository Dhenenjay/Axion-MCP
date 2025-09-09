"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
(0, registry_1.register)({
    name: 'calculate_zonal_statistics',
    description: 'reduceRegions by zones',
    input: registry_1.z.object({ imageId: registry_1.z.string(), zonesAssetId: registry_1.z.string(), scale: registry_1.z.number().optional() }),
    output: registry_1.z.object({ count: registry_1.z.number() }),
    handler: async ({ imageId, zonesAssetId, scale }) => {
        const img = new earthengine_1.default.Image(imageId);
        const zones = new earthengine_1.default.FeatureCollection(zonesAssetId);
        const out = img.reduceRegions({ collection: zones, reducer: earthengine_1.default.Reducer.mean(), scale: scale ?? 30 });
        const count = await out.size().getInfo();
        return { count };
    },
});
