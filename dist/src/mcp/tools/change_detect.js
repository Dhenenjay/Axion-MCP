"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
(0, registry_1.register)({
    name: 'detect_change_between_images',
    description: 'Image difference (A - B)',
    input: registry_1.z.object({ imageAId: registry_1.z.string(), imageBId: registry_1.z.string(), band: registry_1.z.string().optional() }),
    output: registry_1.z.object({ ok: registry_1.z.boolean() }),
    handler: async ({ imageAId, imageBId, band }) => {
        let a = new earthengine_1.default.Image(imageAId);
        let b = new earthengine_1.default.Image(imageBId);
        if (band) {
            a = a.select(band);
            b = b.select(band);
        }
        const diff = a.subtract(b).rename('change');
        diff.bandNames();
        return { ok: true };
    },
});
