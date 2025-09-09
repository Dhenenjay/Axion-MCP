"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
(0, registry_1.register)({
    name: 'load_cloud_optimized_geotiff',
    description: 'Load a public/service-readable COG from GCS into EE',
    input: registry_1.z.object({ gcsUrl: registry_1.z.string().url() }),
    output: registry_1.z.object({ ok: registry_1.z.boolean(), note: registry_1.z.string().optional() }),
    handler: async ({ gcsUrl }) => {
        // Basic presence check; EE throws on invalid
        earthengine_1.default.Image.loadGeoTIFF(gcsUrl);
        return { ok: true, note: 'Ensure bucket IAM/region compatible' };
    },
});
