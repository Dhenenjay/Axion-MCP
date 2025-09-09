"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../registry");
(0, registry_1.register)({
    name: 'search_gee_catalog',
    description: 'Search GEE datasets by a free-text query (id/title/provider)',
    input: registry_1.z.object({ query: registry_1.z.string().min(2) }),
    output: registry_1.z.object({ hits: registry_1.z.array(registry_1.z.object({ id: registry_1.z.string(), title: registry_1.z.string().optional(), provider: registry_1.z.string().optional(), bands: registry_1.z.array(registry_1.z.string()).optional() })) }),
    handler: async ({ query }) => {
        // Placeholder: return curated ids matching the query; replace with real catalog endpoint in your repo
        const curated = [{ id: 'COPERNICUS/S2_SR', title: 'Sentinel-2 SR', provider: 'ESA' }, { id: 'LANDSAT/LC09/C02/T1_L2', title: 'Landsat 9 L2', provider: 'USGS' }];
        const hits = curated.filter(x => (x.id + x.title + x.provider).toLowerCase().includes(query.toLowerCase()));
        return { hits };
    },
});
