"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
(0, registry_1.register)({
    name: 'create_clean_mosaic',
    description: 'Create a median composite',
    input: registry_1.z.object({ datasetId: registry_1.z.string(), start: registry_1.z.string(), end: registry_1.z.string() }),
    output: registry_1.z.object({ ok: registry_1.z.boolean() }),
    handler: async ({ datasetId, start, end }) => {
        const img = new earthengine_1.default.ImageCollection(datasetId).filterDate(start, end).median();
        img.bandNames();
        return { ok: true };
    },
});
