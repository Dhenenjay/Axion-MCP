"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vm_1 = __importDefault(require("vm"));
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
(0, registry_1.register)({
    name: 'gee_script_js',
    description: 'Execute small EE JS snippets in a sandbox (fallback)',
    input: registry_1.z.object({ codeJs: registry_1.z.string().min(5) }),
    output: registry_1.z.object({ ok: registry_1.z.boolean(), result: registry_1.z.any().optional(), warnings: registry_1.z.array(registry_1.z.string()).optional() }),
    handler: async ({ codeJs }) => {
        const sandbox = { ee: earthengine_1.default, result: null };
        vm_1.default.createContext(sandbox);
        vm_1.default.runInContext(codeJs, sandbox, { timeout: 3000 });
        return { ok: true, result: sandbox.result ?? null, warnings: ['Sandboxed; quotas apply'] };
    },
});
