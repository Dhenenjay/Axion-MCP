"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const geo_1 = require("@/src/utils/geo");
(0, registry_1.register)({
    name: 'create_time_series_chart_for_region',
    description: 'Monthly mean series over AOI',
    input: registry_1.z.object({ datasetId: registry_1.z.string(), aoi: registry_1.z.any(), band: registry_1.z.string() }),
    output: registry_1.z.object({ series: registry_1.z.array(registry_1.z.object({ t: registry_1.z.string(), value: registry_1.z.number().nullable() })) }),
    handler: async ({ datasetId, aoi, band }) => {
        const region = await (0, geo_1.parseAoi)(aoi);
        const col = new earthengine_1.default.ImageCollection(datasetId)
            .map((img) => img.set('date', img.date().format('YYYY-MM')))
            .select(band);
        const months = new earthengine_1.default.List(col.aggregate_array('date')).distinct();
        const series = await months.map((m) => {
            const c = col.filter(earthengine_1.default.Filter.eq('date', m));
            const v = new earthengine_1.default.Image(c.mean()).reduceRegion({ reducer: earthengine_1.default.Reducer.mean(), geometry: region, scale: 30, maxPixels: 1e8 }).get(band);
            return new earthengine_1.default.Dictionary({ t: m, value: v });
        }).getInfo();
        return { series };
    },
});
