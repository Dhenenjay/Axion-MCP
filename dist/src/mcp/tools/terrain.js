"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
(0, registry_1.register)({
    name: 'calculate_slope_and_aspect',
    description: 'Terrain products from DEM',
    input: registry_1.z.object({ demAssetId: registry_1.z.string() }),
    output: registry_1.z.object({ ok: registry_1.z.boolean() }),
    handler: async ({ demAssetId }) => {
        const dem = new earthengine_1.default.Image(demAssetId);
        const terr = earthengine_1.default.Terrain.products(dem);
        terr.select(['slope', 'aspect']).bandNames();
        return { ok: true };
    },
});
