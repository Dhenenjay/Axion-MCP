"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initEarthEngineWithSA = initEarthEngineWithSA;
exports.ensureEE = ensureEE;
exports.getTileService = getTileService;
const earthengine_1 = __importDefault(require("@google/earthengine"));
const google_auth_library_1 = require("google-auth-library");
const env_1 = require("@/src/utils/env");
let initialized = false;
async function initEarthEngineWithSA() {
    if (initialized)
        return;
    const sa = (0, env_1.decodeSaJson)();
    const jwt = new google_auth_library_1.JWT({ email: sa.client_email, key: sa.private_key, scopes: ['https://www.googleapis.com/auth/earthengine', 'https://www.googleapis.com/auth/devstorage.read_write'] });
    const creds = await jwt.authorize();
    await new Promise((resolve, reject) => earthengine_1.default.data.authenticateViaPrivateKey(sa, () => { earthengine_1.default.initialize(null, null, () => { initialized = true; resolve(); }, reject); }, reject));
}
function ensureEE() { if (!initialized)
    throw new Error('Earth Engine not initialized'); }
async function getTileService(image, vis) {
    ensureEE();
    // @ts-ignore
    const map = image.getMap(vis);
    return { mapId: map.mapid, tileUrlTemplate: map.urlFormat, ttlSeconds: 3600, visParams: vis };
}
