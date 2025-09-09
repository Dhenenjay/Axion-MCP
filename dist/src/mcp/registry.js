"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.z = void 0;
exports.register = register;
exports.list = list;
exports.get = get;
const zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
const tools = new Map();
function register(tool) { tools.set(tool.name, tool); }
function list() { return [...tools.values()].map(t => ({ name: t.name, description: t.description })); }
function get(name) { const t = tools.get(name); if (!t)
    throw new Error(`Tool not found: ${name}`); return t; }
