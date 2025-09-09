"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const Op = registry_1.z.enum(['filterDate', 'filterBounds', 'select', 'clip', 'addBands', 'expression']);
(0, registry_1.register)({
    name: 'gee_sdk_call',
    description: 'Allow-listed generic EE ops sequence (fallback)',
    input: registry_1.z.object({ datasetId: registry_1.z.string(), ops: registry_1.z.array(registry_1.z.object({ op: Op, params: registry_1.z.record(registry_1.z.any()) })) }),
    output: registry_1.z.object({ ok: registry_1.z.boolean() }),
    handler: async ({ datasetId, ops }) => {
        let obj = new earthengine_1.default.ImageCollection(datasetId);
        for (const step of ops) {
            if (step.op === 'filterDate')
                obj = obj.filterDate(step.params.start, step.params.end);
            else if (step.op === 'filterBounds')
                obj = obj.filterBounds(step.params.aoi);
            else if (step.op === 'select')
                obj = obj.select(step.params.bands);
        }
        obj.size(); // touch
        return { ok: true };
    },
});
