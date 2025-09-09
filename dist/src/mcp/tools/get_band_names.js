"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
(0, registry_1.register)({
    name: 'get_dataset_band_names',
    description: 'Return band names for first image in a collection or an image asset',
    input: registry_1.z.object({ datasetId: registry_1.z.string() }),
    output: registry_1.z.object({ bands: registry_1.z.array(registry_1.z.string()) }),
    handler: async ({ datasetId }) => {
        const col = new earthengine_1.default.ImageCollection(datasetId);
        const first = new earthengine_1.default.Image(col.first());
        const bands = await first.bandNames().getInfo();
        return { bands };
    },
});
