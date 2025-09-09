"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
(0, registry_1.register)({
    name: 'auth_check',
    description: 'Verify Earth Engine initialization by fetching a trivial value',
    input: registry_1.z.object({}).strict(),
    output: registry_1.z.object({ initialized: registry_1.z.boolean() }),
    handler: async () => {
        try {
            await new Promise((resolve, reject) => new earthengine_1.default.Image(1).getInfo(() => resolve(), reject));
            return { initialized: true };
        }
        catch {
            return { initialized: false };
        }
    },
});
