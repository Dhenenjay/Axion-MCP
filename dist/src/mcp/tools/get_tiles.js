"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const client_1 = require("@/src/gee/client");
(0, registry_1.register)({
    name: 'get_map_visualization_url',
    description: 'Get a TMS template for an image',
    input: registry_1.z.object({ imageId: registry_1.z.string(), visParams: registry_1.z.record(registry_1.z.any()).default({}) }),
    output: registry_1.z.object({ mapId: registry_1.z.string(), tileUrlTemplate: registry_1.z.string(), ttlSeconds: registry_1.z.number() }),
    handler: async ({ imageId, visParams }) => {
        const img = new earthengine_1.default.Image(imageId);
        return await (0, client_1.getTileService)(img, visParams);
    },
});
