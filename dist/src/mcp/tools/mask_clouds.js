"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
function maskS2(img) { const qa = img.select('QA60'); const mask = qa.bitwiseAnd(1 << 10).eq(0).and(qa.bitwiseAnd(1 << 11).eq(0)); return img.updateMask(mask); }
function maskLandsat(img) { const qa = img.select('QA_PIXEL'); const cloud = qa.bitwiseAnd(1 << 3).neq(0); const shadow = qa.bitwiseAnd(1 << 4).neq(0); return img.updateMask(cloud.not().and(shadow.not())); }
(0, registry_1.register)({
    name: 'mask_clouds_from_image',
    description: 'Apply default cloud/shadow mask for Sentinel-2 or Landsat',
    input: registry_1.z.object({ dataset: registry_1.z.enum(['S2', 'L8', 'L9']), imageId: registry_1.z.string().optional(), datasetId: registry_1.z.string().optional() }),
    output: registry_1.z.object({ ok: registry_1.z.boolean() }),
    handler: async ({ dataset, imageId, datasetId }) => {
        const img = imageId ? new earthengine_1.default.Image(imageId) : new earthengine_1.default.Image(new earthengine_1.default.ImageCollection(datasetId).first());
        const masked = (dataset === 'S2') ? maskS2(img) : maskLandsat(img);
        masked.bandNames(); // touch to validate graph
        return { ok: true };
    },
});
