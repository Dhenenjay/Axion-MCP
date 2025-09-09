"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const geo_1 = require("@/src/utils/geo");
(0, registry_1.register)({
    name: 'resample_image_to_resolution',
    description: 'Resample an image to a target scale',
    input: registry_1.z.object({ imageId: registry_1.z.string(), scale: registry_1.z.number().positive() }),
    output: registry_1.z.object({ ok: registry_1.z.boolean(), scale: registry_1.z.number() }),
    handler: async ({ imageId, scale }) => {
        const img = new earthengine_1.default.Image(imageId);
        const s = (0, geo_1.clampScale)(scale);
        img.reproject({ scale: s });
        return { ok: true, scale: s };
    },
});
