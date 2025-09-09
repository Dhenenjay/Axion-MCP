"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const IndexEnum = ['NDVI', 'EVI', 'NDWI'];
// Default band mappings for common datasets
const DEFAULT_MAPPINGS = {
    'COPERNICUS/S2': { nir: 'B8', red: 'B4', green: 'B3', blue: 'B2' },
    'COPERNICUS/S2_SR': { nir: 'B8', red: 'B4', green: 'B3', blue: 'B2' },
    'COPERNICUS/S2_SR_HARMONIZED': { nir: 'B8', red: 'B4', green: 'B3', blue: 'B2' },
    'LANDSAT/LC08': { nir: 'B5', red: 'B4', green: 'B3', blue: 'B2' },
    'LANDSAT/LC09': { nir: 'B5', red: 'B4', green: 'B3', blue: 'B2' },
    'LANDSAT/LE07': { nir: 'B4', red: 'B3', green: 'B2', blue: 'B1' },
    'MODIS': { nir: 'sur_refl_b02', red: 'sur_refl_b01', green: 'sur_refl_b04' }
};
function getDefaultMapping(imageId) {
    // Try to match the dataset from the image ID
    for (const [dataset, mapping] of Object.entries(DEFAULT_MAPPINGS)) {
        if (imageId.startsWith(dataset)) {
            return mapping;
        }
    }
    // Default Sentinel-2 mapping as fallback
    return DEFAULT_MAPPINGS['COPERNICUS/S2_SR_HARMONIZED'];
}
(0, registry_1.register)({
    name: 'calculate_spectral_index',
    description: 'Compute NDVI/EVI/NDWI',
    input: registry_1.z.object({
        imageId: registry_1.z.string(),
        index: registry_1.z.enum(IndexEnum),
        mapping: registry_1.z.object({
            nir: registry_1.z.string(),
            red: registry_1.z.string(),
            green: registry_1.z.string().optional(),
            blue: registry_1.z.string().optional()
        }).optional()
    }),
    output: registry_1.z.object({ ok: registry_1.z.boolean(), index: registry_1.z.string(), bands: registry_1.z.any() }),
    handler: async ({ imageId, index, mapping }) => {
        // Use provided mapping or get default based on image ID
        const bandMapping = mapping || getDefaultMapping(imageId);
        const img = new earthengine_1.default.Image(imageId);
        let out = img;
        if (index === 'NDVI') {
            out = img.expression('(NIR-RED)/(NIR+RED)', {
                NIR: img.select(bandMapping.nir),
                RED: img.select(bandMapping.red)
            }).rename('NDVI');
        }
        if (index === 'EVI') {
            const blue = bandMapping.blue || bandMapping.green || bandMapping.red;
            out = img.expression('2.5*((NIR-RED)/(NIR+6*RED-7.5*BLUE+1))', {
                NIR: img.select(bandMapping.nir),
                RED: img.select(bandMapping.red),
                BLUE: img.select(blue)
            }).rename('EVI');
        }
        if (index === 'NDWI') {
            out = img.expression('(GREEN-NIR)/(GREEN+NIR)', {
                GREEN: img.select(bandMapping.green || bandMapping.red),
                NIR: img.select(bandMapping.nir)
            }).rename('NDWI');
        }
        out.projection(); // touch
        return { ok: true, index, bands: bandMapping };
    },
});
