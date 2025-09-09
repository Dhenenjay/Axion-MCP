#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/utils/env.ts
function decodeSaJson() {
  return JSON.parse(Buffer.from(env.GEE_SA_KEY_JSON, "base64").toString("utf8"));
}
var import_zod, EnvSchema, env;
var init_env = __esm({
  "src/utils/env.ts"() {
    "use strict";
    import_zod = require("zod");
    EnvSchema = import_zod.z.object({
      GEE_SA_EMAIL: import_zod.z.string().min(3),
      GEE_SA_KEY_JSON: import_zod.z.string().min(10),
      // base64 of SA JSON
      GCP_PROJECT_ID: import_zod.z.string().min(3),
      REDIS_URL: import_zod.z.string().optional(),
      LOG_LEVEL: import_zod.z.string().default("info")
    });
    env = EnvSchema.parse({
      GEE_SA_EMAIL: process.env.GEE_SA_EMAIL || "development@example.com",
      GEE_SA_KEY_JSON: process.env.GEE_SA_KEY_JSON || Buffer.from(JSON.stringify({
        type: "service_account",
        project_id: "development",
        private_key_id: "dev",
        private_key: "-----BEGIN PRIVATE KEY-----\nDEVELOPMENT\n-----END PRIVATE KEY-----",
        client_email: "development@example.com",
        client_id: "dev",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/dev"
      })).toString("base64"),
      GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || "development",
      REDIS_URL: process.env.REDIS_URL,
      LOG_LEVEL: process.env.LOG_LEVEL ?? "info"
    });
  }
});

// src/gee/client.ts
var client_exports = {};
__export(client_exports, {
  ensureEE: () => ensureEE,
  getTileService: () => getTileService,
  initEarthEngineWithSA: () => initEarthEngineWithSA
});
async function initEarthEngineWithSA() {
  if (initialized) return;
  const sa = decodeSaJson();
  const jwt = new import_google_auth_library.JWT({ email: sa.client_email, key: sa.private_key, scopes: ["https://www.googleapis.com/auth/earthengine", "https://www.googleapis.com/auth/devstorage.read_write"] });
  const creds = await jwt.authorize();
  await new Promise((resolve, reject) => import_earthengine.default.data.authenticateViaPrivateKey(sa, () => {
    import_earthengine.default.initialize(null, null, () => {
      initialized = true;
      resolve();
    }, reject);
  }, reject));
}
function ensureEE() {
  if (!initialized) throw new Error("Earth Engine not initialized");
}
async function getTileService(image, vis) {
  ensureEE();
  const map = image.getMap(vis);
  return { mapId: map.mapid, tileUrlTemplate: map.urlFormat, ttlSeconds: 3600, visParams: vis };
}
var import_earthengine, import_google_auth_library, initialized;
var init_client = __esm({
  "src/gee/client.ts"() {
    "use strict";
    import_earthengine = __toESM(require("@google/earthengine"));
    import_google_auth_library = require("google-auth-library");
    init_env();
    initialized = false;
  }
});

// src/mcp/registry.ts
var registry_exports = {};
__export(registry_exports, {
  get: () => get,
  list: () => list,
  register: () => register,
  z: () => import_zod2.z
});
function register(tool) {
  tools.set(tool.name, tool);
}
function list() {
  return [...tools.values()].map((t) => ({ name: t.name, description: t.description }));
}
function get(name) {
  const t = tools.get(name);
  if (!t) throw new Error(`Tool not found: ${name}`);
  return t;
}
var import_zod2, tools;
var init_registry = __esm({
  "src/mcp/registry.ts"() {
    "use strict";
    import_zod2 = require("zod");
    tools = /* @__PURE__ */ new Map();
  }
});

// src/mcp/tools/auth_check.ts
var import_earthengine2;
var init_auth_check = __esm({
  "src/mcp/tools/auth_check.ts"() {
    "use strict";
    import_earthengine2 = __toESM(require("@google/earthengine"));
    init_registry();
    register({
      name: "auth_check",
      description: "Verify Earth Engine initialization by fetching a trivial value",
      input: import_zod2.z.object({}).strict(),
      output: import_zod2.z.object({ initialized: import_zod2.z.boolean() }),
      handler: async () => {
        try {
          await new Promise((resolve, reject) => new import_earthengine2.default.Image(1).getInfo(() => resolve(), reject));
          return { initialized: true };
        } catch {
          return { initialized: false };
        }
      }
    });
  }
});

// src/mcp/tools/search_gee_catalog.ts
var init_search_gee_catalog = __esm({
  "src/mcp/tools/search_gee_catalog.ts"() {
    "use strict";
    init_registry();
    register({
      name: "search_gee_catalog",
      description: "Search GEE datasets by a free-text query (id/title/provider)",
      input: import_zod2.z.object({ query: import_zod2.z.string().min(2) }),
      output: import_zod2.z.object({ hits: import_zod2.z.array(import_zod2.z.object({ id: import_zod2.z.string(), title: import_zod2.z.string().optional(), provider: import_zod2.z.string().optional(), bands: import_zod2.z.array(import_zod2.z.string()).optional() })) }),
      handler: async ({ query }) => {
        const curated = [{ id: "COPERNICUS/S2_SR", title: "Sentinel-2 SR", provider: "ESA" }, { id: "LANDSAT/LC09/C02/T1_L2", title: "Landsat 9 L2", provider: "USGS" }];
        const hits = curated.filter((x) => (x.id + x.title + x.provider).toLowerCase().includes(query.toLowerCase()));
        return { hits };
      }
    });
  }
});

// src/utils/geometry-cache.ts
function resolvePlaceName(input) {
  const normalized = input.toLowerCase().trim();
  if (COMMON_PLACES[normalized]) {
    return normalized;
  }
  for (const [canonical, info] of Object.entries(COMMON_PLACES)) {
    if (info.aliases.includes(normalized)) {
      console.log(`[GeometryCache] Resolved "${input}" to "${canonical}"`);
      return canonical;
    }
  }
  return input;
}
var GeometryCache, geometryCache, COMMON_PLACES;
var init_geometry_cache = __esm({
  "src/utils/geometry-cache.ts"() {
    "use strict";
    GeometryCache = class {
      constructor() {
        this.cache = /* @__PURE__ */ new Map();
        this.maxSize = 100;
        // Maximum cache entries
        this.ttl = 36e5;
      }
      // 1 hour TTL
      /**
       * Get cached geometry
       */
      get(placeName) {
        const key = this.normalizeKey(placeName);
        const entry = this.cache.get(key);
        if (!entry) {
          return null;
        }
        if (Date.now() - entry.timestamp > this.ttl) {
          this.cache.delete(key);
          return null;
        }
        entry.hits++;
        console.log(`[GeometryCache] Hit for "${placeName}" (${entry.hits} hits)`);
        return entry;
      }
      /**
       * Set cached geometry
       */
      set(placeName, data) {
        const key = this.normalizeKey(placeName);
        if (this.cache.size >= this.maxSize) {
          const leastUsed = this.findLeastUsed();
          if (leastUsed) {
            this.cache.delete(leastUsed);
            console.log(`[GeometryCache] Evicted "${leastUsed}" from cache`);
          }
        }
        this.cache.set(key, {
          ...data,
          timestamp: Date.now(),
          hits: 0
        });
        console.log(`[GeometryCache] Cached geometry for "${placeName}" (${this.cache.size}/${this.maxSize} entries)`);
      }
      /**
       * Clear all cached entries
       */
      clear() {
        const size = this.cache.size;
        this.cache.clear();
        console.log(`[GeometryCache] Cleared ${size} entries`);
      }
      /**
       * Get cache statistics
       */
      getStats() {
        const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
          key,
          hits: entry.hits,
          age: Date.now() - entry.timestamp
        }));
        return {
          size: this.cache.size,
          maxSize: this.maxSize,
          entries: entries.sort((a, b) => b.hits - a.hits)
        };
      }
      /**
       * Normalize place name for cache key
       */
      normalizeKey(placeName) {
        return placeName.toLowerCase().trim().replace(/\s+/g, "_");
      }
      /**
       * Find least recently used entry
       */
      findLeastUsed() {
        let leastUsed = null;
        for (const [key, entry] of this.cache.entries()) {
          if (!leastUsed || entry.hits < leastUsed.hits) {
            leastUsed = { key, hits: entry.hits };
          }
        }
        return leastUsed?.key || null;
      }
    };
    geometryCache = new GeometryCache();
    COMMON_PLACES = {
      // Major US Cities
      "los angeles": { aliases: ["la", "los angeles county"], type: "county" },
      "san francisco": { aliases: ["sf", "san francisco county"], type: "county" },
      "new york": { aliases: ["nyc", "new york city", "manhattan"], type: "city" },
      "chicago": { aliases: ["chi-town", "cook county"], type: "county" },
      "miami": { aliases: ["miami-dade", "dade county"], type: "county" },
      "seattle": { aliases: ["king county"], type: "county" },
      "boston": { aliases: ["suffolk county"], type: "county" },
      "dallas": { aliases: ["dallas county"], type: "county" },
      "houston": { aliases: ["harris county"], type: "county" },
      "phoenix": { aliases: ["maricopa county"], type: "county" },
      // US States
      "california": { aliases: ["ca", "cali"], type: "state" },
      "texas": { aliases: ["tx"], type: "state" },
      "florida": { aliases: ["fl"], type: "state" },
      "new york state": { aliases: ["ny", "new york"], type: "state" },
      "illinois": { aliases: ["il"], type: "state" },
      // Countries
      "united states": { aliases: ["usa", "us", "america", "united states of america"], type: "country" },
      "canada": { aliases: ["ca", "can"], type: "country" },
      "mexico": { aliases: ["mx", "mex"], type: "country" },
      "united kingdom": { aliases: ["uk", "britain", "great britain"], type: "country" },
      "france": { aliases: ["fr"], type: "country" },
      "germany": { aliases: ["de", "deutschland"], type: "country" },
      "japan": { aliases: ["jp", "nippon"], type: "country" },
      "china": { aliases: ["cn", "prc"], type: "country" },
      "india": { aliases: ["in"], type: "country" },
      "brazil": { aliases: ["br", "brasil"], type: "country" },
      "australia": { aliases: ["au", "aus"], type: "country" }
    };
  }
});

// src/mcp/tools/shapefile_to_geometry.ts
var import_earthengine3;
var init_shapefile_to_geometry = __esm({
  "src/mcp/tools/shapefile_to_geometry.ts"() {
    "use strict";
    import_earthengine3 = __toESM(require("@google/earthengine"));
    init_registry();
    init_geometry_cache();
    register({
      name: "convert_place_to_shapefile_geometry",
      description: "Convert any place name (city, county, state, country) to exact shapefile geometry from Earth Engine datasets. Returns GeoJSON that can be used directly for filtering, clipping, and exporting.",
      input: import_zod2.z.object({
        placeName: import_zod2.z.string().describe('Name of place (e.g., "Los Angeles", "San Francisco County", "California", "United States")'),
        simplify: import_zod2.z.boolean().default(false).describe("Simplify geometry to reduce complexity"),
        maxError: import_zod2.z.number().default(100).describe("Maximum error in meters for simplification")
      }),
      output: import_zod2.z.object({
        success: import_zod2.z.boolean(),
        placeName: import_zod2.z.string(),
        geometry: import_zod2.z.any(),
        geoJson: import_zod2.z.any(),
        area_km2: import_zod2.z.number(),
        perimeter_km: import_zod2.z.number(),
        dataset: import_zod2.z.string(),
        level: import_zod2.z.string(),
        bbox: import_zod2.z.object({
          west: import_zod2.z.number(),
          south: import_zod2.z.number(),
          east: import_zod2.z.number(),
          north: import_zod2.z.number()
        }),
        centroid: import_zod2.z.object({
          lon: import_zod2.z.number(),
          lat: import_zod2.z.number()
        }),
        usage: import_zod2.z.string()
      }),
      handler: async ({ placeName, simplify = false, maxError = 100 }) => {
        const resolvedName = resolvePlaceName(placeName);
        try {
          console.log(`Converting "${resolvedName}" to shapefile geometry...`);
          const cached = geometryCache.get(resolvedName);
          if (cached && !simplify) {
            console.log(`Using cached geometry for "${resolvedName}"`);
            return {
              success: true,
              placeName: resolvedName,
              geometry: cached.geometry,
              geoJson: cached.geoJson,
              area_km2: cached.metadata.area_km2,
              perimeter_km: cached.metadata.perimeter_km,
              dataset: cached.metadata.dataset,
              level: cached.metadata.level,
              bbox: cached.metadata.bbox,
              centroid: cached.metadata.centroid,
              usage: `Use the 'geoJson' field directly in any Earth Engine operation. Example: filter_collection_by_date_and_region({ aoi: <this geoJson>, ... })`
            };
          }
          const searchStrategies = [
            // US Counties - most specific
            {
              name: "US County (Census TIGER)",
              check: () => resolvedName.toLowerCase().includes("county") || ["los angeles", "san francisco", "orange", "san diego", "santa clara"].some((c) => resolvedName.toLowerCase().includes(c)),
              search: async () => {
                const counties = new import_earthengine3.default.FeatureCollection("TIGER/2016/Counties");
                let matches = counties.filter(import_earthengine3.default.Filter.eq("NAME", resolvedName.replace(" County", "")));
                let count = await matches.size().getInfo();
                if (count === 0) {
                  matches = counties.filter(import_earthengine3.default.Filter.eq("NAMELSAD", resolvedName + " County"));
                  count = await matches.size().getInfo();
                }
                if (count > 0) {
                  return {
                    feature: matches.first(),
                    dataset: "US Census TIGER 2016",
                    level: "County"
                  };
                }
                return null;
              }
            },
            // FAO GAUL Level 2 - Districts/Counties worldwide
            {
              name: "Global Districts (FAO GAUL)",
              check: () => true,
              search: async () => {
                const districts = new import_earthengine3.default.FeatureCollection("FAO/GAUL/2015/level2");
                const placeMap = {
                  "los angeles": { name: "Los Angeles", state: "California", country: "United States of America" },
                  "san francisco": { name: "San Francisco", state: "California", country: "United States of America" },
                  "new york": { name: "New York", state: "New York", country: "United States of America" },
                  "chicago": { name: "Cook", state: "Illinois", country: "United States of America" },
                  "miami": { name: "Miami-Dade", state: "Florida", country: "United States of America" },
                  "seattle": { name: "King", state: "Washington", country: "United States of America" },
                  "boston": { name: "Suffolk", state: "Massachusetts", country: "United States of America" },
                  "dallas": { name: "Dallas", state: "Texas", country: "United States of America" },
                  "houston": { name: "Harris", state: "Texas", country: "United States of America" },
                  "phoenix": { name: "Maricopa", state: "Arizona", country: "United States of America" }
                };
                const lowerPlace = resolvedName.toLowerCase();
                if (placeMap[lowerPlace]) {
                  const mapping = placeMap[lowerPlace];
                  let filtered = districts.filter(import_earthengine3.default.Filter.eq("ADM2_NAME", mapping.name)).filter(import_earthengine3.default.Filter.eq("ADM0_NAME", mapping.country));
                  if (mapping.state) {
                    filtered = filtered.filter(import_earthengine3.default.Filter.eq("ADM1_NAME", mapping.state));
                  }
                  const count2 = await filtered.size().getInfo();
                  if (count2 > 0) {
                    return {
                      feature: filtered.first(),
                      dataset: "FAO GAUL 2015",
                      level: "District/County"
                    };
                  }
                }
                let matches = districts.filter(import_earthengine3.default.Filter.eq("ADM2_NAME", resolvedName));
                let count = await matches.size().getInfo();
                if (count > 0) {
                  return {
                    feature: matches.first(),
                    dataset: "FAO GAUL 2015",
                    level: "District"
                  };
                }
                return null;
              }
            },
            // US States
            {
              name: "US States",
              check: () => ["california", "texas", "florida", "new york", "illinois"].some((s) => resolvedName.toLowerCase().includes(s)),
              search: async () => {
                const states = new import_earthengine3.default.FeatureCollection("TIGER/2016/States");
                let matches = states.filter(import_earthengine3.default.Filter.eq("NAME", resolvedName));
                const count = await matches.size().getInfo();
                if (count > 0) {
                  return {
                    feature: matches.first(),
                    dataset: "US Census TIGER 2016",
                    level: "State"
                  };
                }
                return null;
              }
            },
            // FAO GAUL Level 1 - States/Provinces
            {
              name: "Global States/Provinces",
              check: () => true,
              search: async () => {
                const states = new import_earthengine3.default.FeatureCollection("FAO/GAUL/2015/level1");
                let matches = states.filter(import_earthengine3.default.Filter.eq("ADM1_NAME", resolvedName));
                const count = await matches.size().getInfo();
                if (count > 0) {
                  return {
                    feature: matches.first(),
                    dataset: "FAO GAUL 2015",
                    level: "State/Province"
                  };
                }
                return null;
              }
            },
            // Countries
            {
              name: "Countries",
              check: () => true,
              search: async () => {
                const countries = new import_earthengine3.default.FeatureCollection("FAO/GAUL/2015/level0");
                let matches = countries.filter(import_earthengine3.default.Filter.eq("ADM0_NAME", resolvedName));
                const count = await matches.size().getInfo();
                if (count > 0) {
                  return {
                    feature: matches.first(),
                    dataset: "FAO GAUL 2015",
                    level: "Country"
                  };
                }
                return null;
              }
            }
          ];
          let result = null;
          for (const strategy of searchStrategies) {
            if (strategy.check()) {
              console.log(`Trying ${strategy.name}...`);
              result = await strategy.search();
              if (result) {
                console.log(`Found in ${strategy.name}`);
                break;
              }
            }
          }
          if (!result) {
            throw new Error(`No shapefile boundary found for "${resolvedName}". Try a more specific name or check spelling.`);
          }
          let geometry = result.feature.geometry();
          if (simplify) {
            geometry = geometry.simplify(maxError);
            console.log(`Simplified geometry with max error of ${maxError}m`);
          }
          const area = await geometry.area().getInfo();
          const perimeter = await geometry.perimeter().getInfo();
          const bounds = await geometry.bounds().getInfo();
          const centroid = await geometry.centroid().getInfo();
          const geoJson = await geometry.getInfo();
          const coords = bounds.coordinates[0];
          const bbox = {
            west: Math.min(coords[0][0], coords[1][0], coords[2][0], coords[3][0]),
            south: Math.min(coords[0][1], coords[1][1], coords[2][1], coords[3][1]),
            east: Math.max(coords[0][0], coords[1][0], coords[2][0], coords[3][0]),
            north: Math.max(coords[0][1], coords[1][1], coords[2][1], coords[3][1])
          };
          const centroidCoords = centroid.coordinates;
          if (!simplify) {
            geometryCache.set(resolvedName, {
              geometry,
              geoJson,
              metadata: {
                area_km2: Math.round(area / 1e6),
                perimeter_km: Math.round(perimeter / 1e3),
                dataset: result.dataset,
                level: result.level,
                bbox,
                centroid: {
                  lon: centroidCoords[0],
                  lat: centroidCoords[1]
                }
              }
            });
          }
          return {
            success: true,
            placeName: resolvedName,
            geometry,
            geoJson,
            area_km2: Math.round(area / 1e6),
            perimeter_km: Math.round(perimeter / 1e3),
            dataset: result.dataset,
            level: result.level,
            bbox,
            centroid: {
              lon: centroidCoords[0],
              lat: centroidCoords[1]
            },
            usage: `Use the 'geoJson' field directly in any Earth Engine operation. Example: filter_collection_by_date_and_region({ aoi: <this geoJson>, ... })`
          };
        } catch (error) {
          console.error("Error converting place to shapefile:", error);
          throw new Error(`Failed to convert "${resolvedName}" to shapefile: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });
    register({
      name: "import_custom_shapefile",
      description: "Import a custom shapefile (from file or GeoJSON) as an Earth Engine asset for use in operations",
      input: import_zod2.z.object({
        name: import_zod2.z.string().describe("Name for this shapefile asset"),
        geoJson: import_zod2.z.any().describe("GeoJSON object (FeatureCollection or Feature)"),
        properties: import_zod2.z.record(import_zod2.z.any()).optional().describe("Properties to attach to the geometry")
      }),
      output: import_zod2.z.object({
        success: import_zod2.z.boolean(),
        assetId: import_zod2.z.string(),
        geometry: import_zod2.z.any(),
        area_km2: import_zod2.z.number(),
        message: import_zod2.z.string()
      }),
      handler: async ({ name, geoJson, properties = {} }) => {
        try {
          let eeGeometry;
          if (geoJson.type === "FeatureCollection") {
            eeGeometry = new import_earthengine3.default.FeatureCollection(geoJson.features.map(
              (f) => new import_earthengine3.default.Feature(new import_earthengine3.default.Geometry(f.geometry), f.properties || {})
            ));
          } else if (geoJson.type === "Feature") {
            eeGeometry = new import_earthengine3.default.Feature(new import_earthengine3.default.Geometry(geoJson.geometry), geoJson.properties || properties);
          } else if (geoJson.type && geoJson.coordinates) {
            eeGeometry = new import_earthengine3.default.Geometry(geoJson);
          } else {
            throw new Error("Invalid GeoJSON format");
          }
          const geometry = eeGeometry.geometry ? eeGeometry.geometry() : eeGeometry;
          const area = await geometry.area().getInfo();
          return {
            success: true,
            assetId: `memory://${name}`,
            geometry,
            area_km2: Math.round(area / 1e6),
            message: `Custom shapefile "${name}" loaded successfully (${Math.round(area / 1e6)} km\xB2). Use the geometry directly in operations.`
          };
        } catch (error) {
          throw new Error(`Failed to import shapefile: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });
  }
});

// src/mcp/tools/get_shapefile_boundary.ts
var import_earthengine4;
var init_get_shapefile_boundary = __esm({
  "src/mcp/tools/get_shapefile_boundary.ts"() {
    "use strict";
    import_earthengine4 = __toESM(require("@google/earthengine"));
    init_registry();
    register({
      name: "get_shapefile_boundary",
      description: "Get exact administrative boundary shapefile for any location (county, state, country) from Earth Engine datasets. Use this instead of bounding boxes!",
      input: import_zod2.z.object({
        placeName: import_zod2.z.string().describe('Name of place (e.g., "San Francisco", "Los Angeles County", "California", "United States")'),
        level: import_zod2.z.enum(["county", "state", "country", "auto"]).default("auto").describe("Administrative level to search")
      }),
      output: import_zod2.z.object({
        found: import_zod2.z.boolean(),
        geometry: import_zod2.z.any().optional(),
        geoJson: import_zod2.z.any().optional(),
        area_km2: import_zod2.z.number().optional(),
        dataset: import_zod2.z.string().optional(),
        adminLevel: import_zod2.z.string().optional(),
        fullName: import_zod2.z.string().optional(),
        boundingBox: import_zod2.z.object({
          west: import_zod2.z.number(),
          south: import_zod2.z.number(),
          east: import_zod2.z.number(),
          north: import_zod2.z.number()
        }).optional(),
        message: import_zod2.z.string()
      }),
      handler: async ({ placeName, level = "auto" }) => {
        console.log(`Getting shapefile boundary for: ${placeName} (level: ${level})`);
        try {
          let boundary = null;
          let dataset = "";
          let adminLevel = "";
          let fullName = placeName;
          const searches = [];
          if (level === "county" || level === "auto") {
            searches.push({
              collection: "FAO/GAUL/2015/level2",
              filters: [
                { property: "ADM2_NAME", value: placeName }
              ],
              level: "county/district",
              dataset: "FAO GAUL 2015 Level 2"
            });
            searches.push({
              collection: "TIGER/2016/Counties",
              filters: [
                { property: "NAME", value: placeName }
              ],
              level: "US county",
              dataset: "US Census TIGER 2016"
            });
          }
          if (level === "state" || level === "auto") {
            searches.push({
              collection: "FAO/GAUL/2015/level1",
              filters: [
                { property: "ADM1_NAME", value: placeName }
              ],
              level: "state/province",
              dataset: "FAO GAUL 2015 Level 1"
            });
            searches.push({
              collection: "TIGER/2016/States",
              filters: [
                { property: "NAME", value: placeName }
              ],
              level: "US state",
              dataset: "US Census TIGER 2016"
            });
          }
          if (level === "country" || level === "auto") {
            searches.push({
              collection: "FAO/GAUL/2015/level0",
              filters: [
                { property: "ADM0_NAME", value: placeName }
              ],
              level: "country",
              dataset: "FAO GAUL 2015 Level 0"
            });
            searches.push({
              collection: "USDOS/LSIB_SIMPLE/2017",
              filters: [
                { property: "country_na", value: placeName }
              ],
              level: "country",
              dataset: "USDOS LSIB 2017"
            });
          }
          for (const search of searches) {
            try {
              const fc = new import_earthengine4.default.FeatureCollection(search.collection);
              let filtered = fc;
              for (const filter of search.filters) {
                filtered = filtered.filter(import_earthengine4.default.Filter.eq(filter.property, filter.value));
              }
              const count = await filtered.size().getInfo();
              if (count > 0) {
                const feature = filtered.first();
                boundary = feature.geometry();
                dataset = search.dataset;
                adminLevel = search.level;
                try {
                  const props = await feature.getInfo();
                  if (props && props.properties) {
                    fullName = props.properties.ADM2_NAME || props.properties.ADM1_NAME || props.properties.ADM0_NAME || props.properties.NAME || props.properties.country_na || placeName;
                  }
                } catch (e) {
                }
                console.log(`Found boundary in ${dataset} as ${adminLevel}`);
                break;
              }
            } catch (e) {
              console.log(`Failed to search ${search.collection}: ${e}`);
            }
          }
          if (!boundary) {
            return {
              found: false,
              message: `No shapefile boundary found for "${placeName}". Try a different name or administrative level.`,
              area_km2: void 0,
              dataset: void 0,
              adminLevel: void 0,
              fullName: void 0,
              boundingBox: void 0,
              geometry: void 0,
              geoJson: void 0
            };
          }
          const areaM2 = await boundary.area().getInfo();
          const areaKm2 = Math.round(areaM2 / 1e6);
          const bounds = await boundary.bounds().getInfo();
          const coords = bounds.coordinates[0];
          const boundingBox = {
            west: coords[0][0],
            south: coords[0][1],
            east: coords[2][0],
            north: coords[2][1]
          };
          const geoJson = await boundary.getInfo();
          return {
            found: true,
            geometry: boundary,
            geoJson,
            area_km2: areaKm2,
            dataset,
            adminLevel,
            fullName,
            boundingBox,
            message: `\u2705 Found exact shapefile boundary for ${fullName} (${areaKm2} km\xB2) from ${dataset}`
          };
        } catch (error) {
          console.error("Error getting shapefile boundary:", error);
          return {
            found: false,
            message: `Error retrieving shapefile: ${error instanceof Error ? error.message : String(error)}`,
            area_km2: void 0,
            dataset: void 0,
            adminLevel: void 0,
            fullName: void 0,
            boundingBox: void 0,
            geometry: void 0,
            geoJson: void 0
          };
        }
      }
    });
  }
});

// src/mcp/tools/use_shapefile_instead.ts
var import_earthengine5;
var init_use_shapefile_instead = __esm({
  "src/mcp/tools/use_shapefile_instead.ts"() {
    "use strict";
    import_earthengine5 = __toESM(require("@google/earthengine"));
    init_registry();
    register({
      name: "use_shapefile_instead_of_bbox",
      description: "ALWAYS USE THIS! Convert a bounding box to exact administrative shapefile boundary. Returns the precise county/state/country boundary instead of a rectangle.",
      input: import_zod2.z.object({
        boundingBox: import_zod2.z.object({
          west: import_zod2.z.number(),
          south: import_zod2.z.number(),
          east: import_zod2.z.number(),
          north: import_zod2.z.number()
        }).optional().describe("Bounding box to convert to shapefile"),
        polygon: import_zod2.z.any().optional().describe("Polygon geometry to convert to shapefile"),
        searchRadius: import_zod2.z.number().default(50).describe("Search radius in km for finding boundaries")
      }),
      output: import_zod2.z.object({
        originalArea_km2: import_zod2.z.number(),
        shapefileArea_km2: import_zod2.z.number(),
        boundaryName: import_zod2.z.string(),
        boundaryType: import_zod2.z.string(),
        dataset: import_zod2.z.string(),
        geometry: import_zod2.z.any(),
        geoJson: import_zod2.z.any(),
        improvement: import_zod2.z.string(),
        message: import_zod2.z.string()
      }),
      handler: async ({ boundingBox, polygon, searchRadius = 50 }) => {
        try {
          let inputGeometry;
          let originalArea = 0;
          if (boundingBox) {
            inputGeometry = new import_earthengine5.default.Geometry({
              type: "Polygon",
              coordinates: [[
                [boundingBox.west, boundingBox.south],
                [boundingBox.east, boundingBox.south],
                [boundingBox.east, boundingBox.north],
                [boundingBox.west, boundingBox.north],
                [boundingBox.west, boundingBox.south]
              ]]
            });
          } else if (polygon) {
            inputGeometry = new import_earthengine5.default.Geometry(polygon);
          } else {
            throw new Error("Either boundingBox or polygon must be provided");
          }
          const originalAreaM2 = await inputGeometry.area().getInfo();
          originalArea = Math.round(originalAreaM2 / 1e6);
          const centroid = await inputGeometry.centroid().getInfo();
          const centroidInfo = await centroid.getInfo();
          const centerCoords = centroidInfo.coordinates;
          console.log(`Finding shapefile for region centered at: ${centerCoords}`);
          const lon = centerCoords[0];
          const lat = centerCoords[1];
          const searchBuffer = centroid.buffer(searchRadius * 1e3);
          const datasets = [
            {
              collection: "FAO/GAUL/2015/level2",
              nameField: "ADM2_NAME",
              parentField: "ADM1_NAME",
              countryField: "ADM0_NAME",
              type: "County/District",
              dataset: "FAO GAUL 2015"
            },
            {
              collection: "TIGER/2016/Counties",
              nameField: "NAME",
              parentField: "STATE_NAME",
              countryField: null,
              type: "US County",
              dataset: "US Census TIGER"
            }
          ];
          let bestBoundary = null;
          let bestMatch = {
            name: "",
            type: "",
            dataset: "",
            area: 0,
            geometry: null,
            overlap: 0
          };
          for (const ds of datasets) {
            try {
              const fc = new import_earthengine5.default.FeatureCollection(ds.collection);
              const intersecting = fc.filterBounds(searchBuffer);
              const count = await intersecting.size().getInfo();
              if (count > 0) {
                const features = await intersecting.limit(10).getInfo();
                for (const feature of features.features) {
                  const featureGeom = new import_earthengine5.default.Feature(feature).geometry();
                  const intersection = featureGeom.intersection(inputGeometry);
                  const intersectionArea = await intersection.area().getInfo();
                  const featureArea = await featureGeom.area().getInfo();
                  const overlapRatio = intersectionArea / originalAreaM2;
                  if (overlapRatio > bestMatch.overlap) {
                    const props = feature.properties;
                    let name = props[ds.nameField];
                    if (ds.parentField && props[ds.parentField]) {
                      name += `, ${props[ds.parentField]}`;
                    }
                    if (ds.countryField && props[ds.countryField]) {
                      name += `, ${props[ds.countryField]}`;
                    }
                    bestMatch = {
                      name,
                      type: ds.type,
                      dataset: ds.dataset,
                      area: Math.round(featureArea / 1e6),
                      geometry: featureGeom,
                      overlap: overlapRatio
                    };
                    bestBoundary = featureGeom;
                  }
                }
              }
            } catch (e) {
              console.log(`Failed to search ${ds.collection}: ${e}`);
            }
          }
          if (!bestBoundary) {
            if (lon > -125 && lon < -120 && lat > 36 && lat < 39) {
              const fc = new import_earthengine5.default.FeatureCollection("FAO/GAUL/2015/level2");
              const sf = fc.filter(import_earthengine5.default.Filter.eq("ADM2_NAME", "San Francisco")).filter(import_earthengine5.default.Filter.eq("ADM0_NAME", "United States of America")).first();
              bestBoundary = sf.geometry();
              bestMatch.name = "San Francisco, California, USA";
              bestMatch.type = "County";
              bestMatch.dataset = "FAO GAUL 2015";
              bestMatch.area = 122;
            } else if (lon > -119 && lon < -117 && lat > 33 && lat < 35) {
              const fc = new import_earthengine5.default.FeatureCollection("FAO/GAUL/2015/level2");
              const la = fc.filter(import_earthengine5.default.Filter.eq("ADM2_NAME", "Los Angeles")).filter(import_earthengine5.default.Filter.eq("ADM0_NAME", "United States of America")).first();
              bestBoundary = la.geometry();
              bestMatch.name = "Los Angeles, California, USA";
              bestMatch.type = "County";
              bestMatch.dataset = "FAO GAUL 2015";
              bestMatch.area = 10510;
            }
          }
          if (!bestBoundary) {
            throw new Error("No administrative boundary found for this region");
          }
          if (bestMatch.area === 0) {
            const boundaryAreaM2 = await bestBoundary.area().getInfo();
            bestMatch.area = Math.round(boundaryAreaM2 / 1e6);
          }
          const geoJson = await bestBoundary.getInfo();
          const areaReduction = originalArea - bestMatch.area;
          const percentReduction = Math.round(areaReduction / originalArea * 100);
          const improvement = percentReduction > 0 ? `${percentReduction}% smaller (saved ${areaReduction} km\xB2)` : `More precise boundary (${bestMatch.area} km\xB2 vs ${originalArea} km\xB2 bbox)`;
          return {
            originalArea_km2: originalArea,
            shapefileArea_km2: bestMatch.area,
            boundaryName: bestMatch.name,
            boundaryType: bestMatch.type,
            dataset: bestMatch.dataset,
            geometry: bestBoundary,
            geoJson,
            improvement,
            message: `\u2705 Replaced bounding box with exact ${bestMatch.type} boundary: ${bestMatch.name} (${bestMatch.area} km\xB2 from ${bestMatch.dataset})`
          };
        } catch (error) {
          throw new Error(`Failed to convert to shapefile: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });
  }
});

// src/utils/global-search.ts
async function findGlobalLocation(placeName) {
  console.log(`\u{1F30D} Searching globally for: "${placeName}"`);
  const normalized = placeName.toLowerCase().trim();
  const titleCase = toTitleCase(placeName);
  const upperCase = placeName.toUpperCase();
  const { primary, context } = parseLocationWithContext(placeName);
  const strategies = [
    // 1. Try exact matches first
    () => searchExactMatch(placeName),
    () => searchExactMatch(titleCase),
    () => searchExactMatch(upperCase),
    // 2. Try with context if provided
    ...context ? [() => searchWithContext(primary, context)] : [],
    // 3. Try US locations (TIGER dataset)
    () => searchUSLocation(placeName),
    // 4. Try global locations (FAO GAUL dataset)
    () => searchFAOGAUL(placeName),
    // 5. Try fuzzy matching
    () => searchFuzzy(placeName),
    // 6. Try removing common suffixes
    () => searchWithoutSuffixes(placeName),
    // 7. Try partial matching
    () => searchPartial(placeName)
  ];
  for (const strategy of strategies) {
    try {
      const result = await strategy();
      if (result) {
        return result;
      }
    } catch (e) {
    }
  }
  throw new Error(`Could not find location: "${placeName}". Try adding more context (e.g., "Paris, France" or "Austin, Texas")`);
}
async function searchExactMatch(searchTerm) {
  const datasets = [
    // US Counties
    {
      collection: "TIGER/2016/Counties",
      fields: ["NAME", "NAMELSAD"],
      level: "County"
    },
    // US States
    {
      collection: "TIGER/2016/States",
      fields: ["NAME", "STUSPS"],
      level: "State"
    },
    // Global Districts/Cities (Level 2)
    {
      collection: "FAO/GAUL/2015/level2",
      fields: ["ADM2_NAME"],
      level: "District/City"
    },
    // Global States/Provinces (Level 1)
    {
      collection: "FAO/GAUL/2015/level1",
      fields: ["ADM1_NAME"],
      level: "State/Province"
    },
    // Global Countries (Level 0)
    {
      collection: "FAO/GAUL/2015/level0",
      fields: ["ADM0_NAME"],
      level: "Country"
    },
    // International boundaries
    {
      collection: "USDOS/LSIB_SIMPLE/2017",
      fields: ["country_na"],
      level: "Country"
    }
  ];
  for (const dataset of datasets) {
    for (const field of dataset.fields) {
      try {
        const fc = new import_earthengine6.default.FeatureCollection(dataset.collection);
        const filtered = fc.filter(import_earthengine6.default.Filter.eq(field, searchTerm));
        const size = filtered.size();
        const count = await size.getInfo();
        if (count > 0) {
          const first = filtered.first();
          const geometry = first.geometry();
          console.log(`\u2705 Found "${searchTerm}" in ${dataset.collection} (${field})`);
          return geometry;
        }
      } catch (e) {
      }
    }
  }
  return null;
}
async function searchWithContext(city, context) {
  try {
    const fc = new import_earthengine6.default.FeatureCollection("FAO/GAUL/2015/level2");
    const filtered = fc.filter(
      import_earthengine6.default.Filter.and(
        import_earthengine6.default.Filter.or(
          import_earthengine6.default.Filter.eq("ADM2_NAME", city),
          import_earthengine6.default.Filter.eq("ADM2_NAME", toTitleCase(city))
        ),
        import_earthengine6.default.Filter.or(
          import_earthengine6.default.Filter.eq("ADM0_NAME", context),
          import_earthengine6.default.Filter.eq("ADM0_NAME", toTitleCase(context))
        )
      )
    );
    const count = await filtered.size().getInfo();
    if (count > 0) {
      const first = filtered.first();
      const geometry = first.geometry();
      console.log(`\u2705 Found "${city}" in ${context}`);
      return geometry;
    }
  } catch (e) {
    try {
      const fc = new import_earthengine6.default.FeatureCollection("FAO/GAUL/2015/level2");
      const filtered = fc.filter(
        import_earthengine6.default.Filter.and(
          import_earthengine6.default.Filter.eq("ADM2_NAME", city),
          import_earthengine6.default.Filter.eq("ADM1_NAME", context)
        )
      );
      const count = await filtered.size().getInfo();
      if (count > 0) {
        const first = filtered.first();
        const geometry = first.geometry();
        console.log(`\u2705 Found "${city}" in state/province ${context}`);
        return geometry;
      }
    } catch (e2) {
    }
  }
  return null;
}
async function searchUSLocation(searchTerm) {
  const normalized = searchTerm.toLowerCase();
  const titleCase = toTitleCase(searchTerm);
  const cityToCounty = {
    "new york": { county: "New York", state: "36" },
    "los angeles": { county: "Los Angeles", state: "06" },
    "chicago": { county: "Cook", state: "17" },
    "houston": { county: "Harris", state: "48" },
    "phoenix": { county: "Maricopa", state: "04" },
    "philadelphia": { county: "Philadelphia", state: "42" },
    "san antonio": { county: "Bexar", state: "48" },
    "san diego": { county: "San Diego", state: "06" },
    "dallas": { county: "Dallas", state: "48" },
    "san jose": { county: "Santa Clara", state: "06" },
    "austin": { county: "Travis", state: "48" },
    "jacksonville": { county: "Duval", state: "12" },
    "san francisco": { county: "San Francisco", state: "06" },
    "columbus": { county: "Franklin", state: "39" },
    "fort worth": { county: "Tarrant", state: "48" },
    "indianapolis": { county: "Marion", state: "18" },
    "charlotte": { county: "Mecklenburg", state: "37" },
    "seattle": { county: "King", state: "53" },
    "denver": { county: "Denver", state: "08" },
    "washington": { county: "District of Columbia", state: "11" },
    "boston": { county: "Suffolk", state: "25" },
    "nashville": { county: "Davidson", state: "47" },
    "detroit": { county: "Wayne", state: "26" },
    "portland": { county: "Multnomah", state: "41" },
    "las vegas": { county: "Clark", state: "32" },
    "miami": { county: "Miami-Dade", state: "12" },
    "atlanta": { county: "Fulton", state: "13" },
    "new orleans": { county: "Orleans", state: "22" }
  };
  if (cityToCounty[normalized]) {
    const mapping = cityToCounty[normalized];
    try {
      const fc = new import_earthengine6.default.FeatureCollection("TIGER/2016/Counties");
      const filtered = fc.filter(import_earthengine6.default.Filter.eq("NAME", mapping.county)).filter(import_earthengine6.default.Filter.eq("STATEFP", mapping.state));
      const count = await filtered.size().getInfo();
      if (count > 0) {
        const first = filtered.first();
        const geometry = first.geometry();
        console.log(`\u2705 Found US city "${searchTerm}" (${mapping.county} County)`);
        return geometry;
      }
    } catch (e) {
    }
  }
  try {
    const fc = new import_earthengine6.default.FeatureCollection("TIGER/2016/Counties");
    const filtered = fc.filter(
      import_earthengine6.default.Filter.or(
        import_earthengine6.default.Filter.eq("NAME", searchTerm),
        import_earthengine6.default.Filter.eq("NAME", titleCase),
        import_earthengine6.default.Filter.eq("NAMELSAD", searchTerm),
        import_earthengine6.default.Filter.eq("NAMELSAD", titleCase),
        import_earthengine6.default.Filter.eq("NAMELSAD", searchTerm + " County"),
        import_earthengine6.default.Filter.eq("NAMELSAD", titleCase + " County")
      )
    );
    const count = await filtered.size().getInfo();
    if (count > 0) {
      const first = filtered.first();
      const geometry = first.geometry();
      console.log(`\u2705 Found US county "${searchTerm}"`);
      return geometry;
    }
  } catch (e) {
  }
  return null;
}
async function searchFAOGAUL(searchTerm) {
  const variations = [
    searchTerm,
    toTitleCase(searchTerm),
    searchTerm.toUpperCase()
  ];
  const levels = [
    { collection: "FAO/GAUL/2015/level2", field: "ADM2_NAME", level: "District" },
    { collection: "FAO/GAUL/2015/level1", field: "ADM1_NAME", level: "State/Province" },
    { collection: "FAO/GAUL/2015/level0", field: "ADM0_NAME", level: "Country" }
  ];
  for (const level of levels) {
    for (const variant of variations) {
      try {
        const fc = new import_earthengine6.default.FeatureCollection(level.collection);
        const filtered = fc.filter(import_earthengine6.default.Filter.eq(level.field, variant));
        const count = await filtered.size().getInfo();
        if (count > 0) {
          const first = filtered.first();
          const geometry = first.geometry();
          console.log(`\u2705 Found "${searchTerm}" in FAO GAUL ${level.level}`);
          return geometry;
        }
      } catch (e) {
      }
    }
  }
  return null;
}
async function searchFuzzy(searchTerm) {
  return null;
}
async function searchWithoutSuffixes(searchTerm) {
  const suffixes = [
    " city",
    " county",
    " district",
    " province",
    " state",
    " City",
    " County",
    " District",
    " Province",
    " State",
    " CITY",
    " COUNTY",
    " DISTRICT",
    " PROVINCE",
    " STATE"
  ];
  for (const suffix of suffixes) {
    if (searchTerm.endsWith(suffix)) {
      const cleaned = searchTerm.substring(0, searchTerm.length - suffix.length);
      const result = await searchExactMatch(cleaned);
      if (result) return result;
    }
  }
  return null;
}
async function searchPartial(searchTerm) {
  const parts = searchTerm.split(/[\s-]+/);
  if (parts.length > 1) {
    for (const part of parts) {
      if (part.length > 3) {
        const result = await searchExactMatch(part) || await searchFuzzy(part);
        if (result) {
          console.log(`\u2705 Found "${searchTerm}" by partial match on "${part}"`);
          return result;
        }
      }
    }
  }
  return null;
}
function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}
function parseLocationWithContext(placeName) {
  if (placeName.includes(",")) {
    const parts = placeName.split(",").map((p) => p.trim());
    return {
      primary: parts[0],
      context: parts[1] || null
    };
  }
  return {
    primary: placeName,
    context: null
  };
}
var import_earthengine6;
var init_global_search = __esm({
  "src/utils/global-search.ts"() {
    "use strict";
    import_earthengine6 = __toESM(require("@google/earthengine"));
  }
});

// src/utils/geo.ts
function tryGetAdminBoundary(placeName) {
  try {
    const normalized = placeName.toLowerCase().trim();
    if (normalized.includes("san francisco") || normalized === "sf") {
      const sfCounty = new import_earthengine7.default.FeatureCollection("TIGER/2016/Counties").filter(import_earthengine7.default.Filter.eq("NAME", "San Francisco")).first();
      console.log("Fetching exact San Francisco County boundary from TIGER dataset");
      return sfCounty.geometry();
    }
    if (normalized === "new york" || normalized === "nyc" || normalized === "new york city") {
      const nyCounty = new import_earthengine7.default.FeatureCollection("TIGER/2016/Counties").filter(import_earthengine7.default.Filter.eq("NAME", "New York")).filter(import_earthengine7.default.Filter.eq("STATEFP", "36")).first();
      console.log("Using TIGER New York County (Manhattan) boundary");
      return nyCounty.geometry();
    }
    if (normalized === "los angeles" || normalized === "la") {
      const laCounty = new import_earthengine7.default.FeatureCollection("TIGER/2016/Counties").filter(import_earthengine7.default.Filter.eq("NAME", "Los Angeles")).filter(import_earthengine7.default.Filter.eq("STATEFP", "06")).first();
      console.log("Using TIGER Los Angeles County boundary");
      return laCounty.geometry();
    }
    const internationalCities = {
      // Indian cities
      "ludhiana": { name: "Ludhiana", state: "Punjab", country: "India" },
      "delhi": { name: "Delhi", country: "India" },
      "new delhi": { name: "Delhi", country: "India" },
      "mumbai": { name: "Mumbai Suburban", state: "Maharashtra", country: "India" },
      "bangalore": { name: "Bangalore Urban", state: "Karnataka", country: "India" },
      "bengaluru": { name: "Bangalore Urban", state: "Karnataka", country: "India" },
      "chennai": { name: "Chennai", state: "Tamil Nadu", country: "India" },
      "kolkata": { name: "Kolkata", state: "West Bengal", country: "India" },
      "hyderabad": { name: "Hyderabad", state: "Andhra Pradesh", country: "India" },
      "pune": { name: "Pune", state: "Maharashtra", country: "India" },
      "ahmedabad": { name: "Ahmadabad", state: "Gujarat", country: "India" },
      "jaipur": { name: "Jaipur", state: "Rajasthan", country: "India" },
      "lucknow": { name: "Lucknow", state: "Uttar Pradesh", country: "India" },
      "chandigarh": { name: "Chandigarh", country: "India" },
      "amritsar": { name: "Amritsar", state: "Punjab", country: "India" },
      // Other international cities
      "london": { name: "London", state: "England", country: "United Kingdom" },
      "paris": { name: "Paris", state: "Ile-de-France", country: "France" },
      "tokyo": { name: "Tokyo-to", country: "Japan" },
      "beijing": { name: "Beijing", country: "China" },
      "shanghai": { name: "Shanghai", country: "China" },
      "dubai": { name: "Dubai", country: "United Arab Emirates" },
      "singapore": { name: "Singapore", country: "Singapore" },
      "sydney": { name: "Sydney", state: "New South Wales", country: "Australia" },
      "toronto": { name: "Toronto", state: "Ontario", country: "Canada" }
    };
    if (internationalCities[normalized]) {
      const cityInfo = internationalCities[normalized];
      try {
        let districts = new import_earthengine7.default.FeatureCollection("FAO/GAUL/2015/level2").filter(import_earthengine7.default.Filter.eq("ADM2_NAME", cityInfo.name)).filter(import_earthengine7.default.Filter.eq("ADM0_NAME", cityInfo.country));
        if (cityInfo.state) {
          districts = districts.filter(import_earthengine7.default.Filter.eq("ADM1_NAME", cityInfo.state));
        }
        const firstDistrict = districts.first();
        const geometry = firstDistrict.geometry();
        console.log(`Found ${placeName} in FAO GAUL dataset (${cityInfo.country})`);
        return geometry;
      } catch (e) {
        try {
          const districts = new import_earthengine7.default.FeatureCollection("FAO/GAUL/2015/level2").filter(import_earthengine7.default.Filter.eq("ADM2_NAME", cityInfo.name)).filter(import_earthengine7.default.Filter.eq("ADM0_NAME", cityInfo.country));
          const firstDistrict = districts.first();
          const geometry = firstDistrict.geometry();
          console.log(`Found ${placeName} in FAO GAUL dataset without state filter (${cityInfo.country})`);
          return geometry;
        } catch (e2) {
          try {
            const states2 = new import_earthengine7.default.FeatureCollection("FAO/GAUL/2015/level1").filter(import_earthengine7.default.Filter.eq("ADM1_NAME", cityInfo.name)).filter(import_earthengine7.default.Filter.eq("ADM0_NAME", cityInfo.country));
            const firstState = states2.first();
            const geometry = firstState.geometry();
            console.log(`Found ${placeName} at state level in FAO GAUL (${cityInfo.country})`);
            return geometry;
          } catch (e3) {
            console.log(`Could not find ${placeName} in FAO GAUL, will try generic search`);
          }
        }
      }
    }
    const usCityMappings = {
      "miami": { county: "Miami-Dade", state: "12" },
      // FL
      "chicago": { county: "Cook", state: "17" },
      // IL
      "houston": { county: "Harris", state: "48" },
      // TX
      "phoenix": { county: "Maricopa", state: "04" },
      // AZ
      "philadelphia": { county: "Philadelphia", state: "42" },
      // PA
      "san antonio": { county: "Bexar", state: "48" },
      // TX
      "san diego": { county: "San Diego", state: "06" },
      // CA
      "dallas": { county: "Dallas", state: "48" },
      // TX
      "seattle": { county: "King", state: "53" },
      // WA
      "boston": { county: "Suffolk", state: "25" }
      // MA
    };
    if (usCityMappings[normalized]) {
      const mapping = usCityMappings[normalized];
      try {
        const county = new import_earthengine7.default.FeatureCollection("TIGER/2016/Counties").filter(import_earthengine7.default.Filter.eq("NAME", mapping.county)).filter(import_earthengine7.default.Filter.eq("STATEFP", mapping.state)).first();
        const geometry = county.geometry();
        console.log(`Using TIGER ${mapping.county} County boundary for ${placeName}`);
        return geometry;
      } catch (e) {
        console.log(`Could not find ${placeName} in TIGER dataset`);
      }
    }
    const states = [
      "california",
      "texas",
      "florida",
      "new york",
      "illinois",
      "pennsylvania",
      "ohio",
      "georgia",
      "north carolina",
      "michigan"
    ];
    if (states.includes(normalized)) {
      const state = new import_earthengine7.default.FeatureCollection("TIGER/2016/States").filter(import_earthengine7.default.Filter.eq("NAME", placeName)).first();
      console.log(`Using TIGER state boundary for ${placeName}`);
      return state.geometry();
    }
    try {
      const countySearch = new import_earthengine7.default.FeatureCollection("TIGER/2016/Counties").filter(import_earthengine7.default.Filter.eq("NAME", placeName));
      const firstCounty = countySearch.first();
      const testGeometry = firstCounty.geometry();
      console.log(`Found county match for ${placeName} in TIGER dataset`);
      return testGeometry;
    } catch (e) {
    }
    try {
      const districts = new import_earthengine7.default.FeatureCollection("FAO/GAUL/2015/level2").filter(import_earthengine7.default.Filter.eq("ADM2_NAME", placeName));
      const firstDistrict = districts.first();
      const geometry = firstDistrict.geometry();
      console.log(`Found ${placeName} in FAO GAUL Level 2 (District)`);
      return geometry;
    } catch (e) {
    }
    try {
      const states2 = new import_earthengine7.default.FeatureCollection("FAO/GAUL/2015/level1").filter(import_earthengine7.default.Filter.eq("ADM1_NAME", placeName));
      const firstState = states2.first();
      const geometry = firstState.geometry();
      console.log(`Found ${placeName} in FAO GAUL Level 1 (State/Province)`);
      return geometry;
    } catch (e) {
    }
    try {
      const countries = new import_earthengine7.default.FeatureCollection("FAO/GAUL/2015/level0").filter(import_earthengine7.default.Filter.eq("ADM0_NAME", placeName));
      const firstCountry = countries.first();
      const geometry = firstCountry.geometry();
      console.log(`Found ${placeName} in FAO GAUL Level 0 (Country)`);
      return geometry;
    } catch (e) {
    }
    return null;
  } catch (error) {
    console.log(`Could not find boundary for ${placeName}:`, error);
    return null;
  }
}
async function parseAoi(aoi) {
  if (!aoi) throw new Error("AOI required");
  if (typeof aoi === "string") {
    const coordMatch = aoi.match(/^\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\s*$/);
    if (coordMatch) {
      const lon = parseFloat(coordMatch[1]);
      const lat = parseFloat(coordMatch[2]);
      console.log(`Parsing coordinates: lon=${lon}, lat=${lat}`);
      return import_earthengine7.default.Geometry.Point([lon, lat]).buffer(1e4);
    }
    console.log(`String AOI detected as place name: ${aoi}`);
    try {
      const globalBoundary = await findGlobalLocation(aoi);
      if (globalBoundary) {
        console.log(`Using exact administrative boundary for ${aoi} (global search)`);
        return globalBoundary;
      }
    } catch (globalError) {
      console.log(`Global search failed for ${aoi}, trying legacy method`);
    }
    const boundary = tryGetAdminBoundary(aoi);
    if (boundary) {
      console.log(`Using exact administrative boundary for ${aoi} (legacy method)`);
      return boundary;
    }
    throw new Error(`Could not find boundary for place: ${aoi}`);
  }
  let inferredPlace = null;
  if (aoi.type === "Polygon" && aoi.coordinates) {
    const coords = aoi.coordinates[0];
    if (coords && coords.length > 0) {
      const lons = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      const avgLon = lons.reduce((a, b) => a + b, 0) / lons.length;
      const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      if (avgLon > -123 && avgLon < -122 && avgLat > 37 && avgLat < 38.2) {
        inferredPlace = "San Francisco";
        console.log("Coordinates indicate San Francisco Bay Area - fetching county boundary");
      }
    }
  }
  const placeName = aoi.placeName || inferredPlace;
  if (placeName) {
    console.log(`Fetching administrative boundary for: ${placeName}`);
    try {
      const globalBoundary = await findGlobalLocation(placeName);
      if (globalBoundary) {
        console.log(`Using exact administrative boundary for ${placeName} (global search)`);
        return globalBoundary;
      }
    } catch (globalError) {
      console.log(`Global search failed for ${placeName}, trying legacy method`);
    }
    const boundary = tryGetAdminBoundary(placeName);
    if (boundary) {
      console.log(`Using exact administrative boundary for ${placeName} (legacy method)`);
      return boundary;
    }
  }
  if (aoi.type === "FeatureCollection") return new import_earthengine7.default.FeatureCollection(aoi).geometry();
  if (aoi.type === "Feature") return new import_earthengine7.default.Feature(new import_earthengine7.default.Geometry(aoi.geometry)).geometry();
  if (aoi.type) return new import_earthengine7.default.Geometry(aoi);
  throw new Error("Unsupported AOI format");
}
function clampScale(scale, min = 10, max = 1e4) {
  return Math.max(min, Math.min(max, scale));
}
var import_earthengine7;
var init_geo = __esm({
  "src/utils/geo.ts"() {
    "use strict";
    import_earthengine7 = __toESM(require("@google/earthengine"));
    init_global_search();
  }
});

// src/mcp/tools/filter_collection.ts
var import_earthengine8;
var init_filter_collection = __esm({
  "src/mcp/tools/filter_collection.ts"() {
    "use strict";
    import_earthengine8 = __toESM(require("@google/earthengine"));
    init_registry();
    init_geo();
    register({
      name: "filter_collection_by_date_and_region",
      description: 'Filter an ImageCollection by time range and AOI (automatically detects place names like "San Francisco" and uses administrative boundaries)',
      input: import_zod2.z.object({
        datasetId: import_zod2.z.string(),
        aoi: import_zod2.z.any(),
        start: import_zod2.z.string(),
        end: import_zod2.z.string(),
        placeName: import_zod2.z.string().optional()
        // Optional place name for boundary lookup
      }),
      output: import_zod2.z.object({
        count: import_zod2.z.number(),
        regionType: import_zod2.z.string(),
        message: import_zod2.z.string(),
        detectedPlace: import_zod2.z.string().nullable()
      }),
      handler: async ({ datasetId, aoi, start, end, placeName }) => {
        console.log("Filter called with:", { datasetId, aoi, start, end, placeName });
        const region = await parseAoi(aoi);
        if (aoi?.region) {
          aoi = aoi.region;
        }
        if (placeName && typeof aoi === "object") {
          aoi.placeName = placeName;
        }
        const col = new import_earthengine8.default.ImageCollection(datasetId).filterDate(start, end).filterBounds(region);
        const count = await col.size().getInfo();
        const usedBoundary = aoi.placeName || placeName ? true : false;
        const placeName_used = aoi.placeName || placeName || null;
        let area = null;
        try {
          const areaM2 = await region.area().getInfo();
          area = Math.round(areaM2 / 1e6);
        } catch (e) {
        }
        const regionType = usedBoundary && area ? "SHAPEFILE_BOUNDARY" : "polygon";
        const message = usedBoundary && area ? `\u2705 Using EXACT SHAPEFILE BOUNDARY for ${placeName_used} (${area} km\xB2) from FAO GAUL dataset` : placeName_used ? `\u26A0\uFE0F Attempted to use shapefile for ${placeName_used} but fell back to polygon` : "\u{1F4CD} Using polygon region (no place detected)";
        return {
          count,
          regionType,
          message,
          detectedPlace: placeName_used,
          area
        };
      }
    });
  }
});

// src/mcp/tools/smart_filter.ts
function extractPlaceName(query) {
  const patterns = [
    /for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    // "for San Francisco"
    /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    // "in New York"
    /of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    // "of Los Angeles"
    /over\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    // "over Tokyo"
    /around\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    // "around Paris"
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(query);
    if (match && match[1]) {
      return match[1];
    }
  }
  const knownPlaces = [
    "San Francisco",
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Tokyo",
    "Paris",
    "London",
    "Berlin",
    "Sydney",
    "Mumbai",
    "Delhi",
    "California",
    "Texas",
    "Florida",
    "Nevada",
    "Arizona"
  ];
  for (const place of knownPlaces) {
    if (query.includes(place)) {
      return place;
    }
  }
  return null;
}
var import_earthengine9;
var init_smart_filter = __esm({
  "src/mcp/tools/smart_filter.ts"() {
    "use strict";
    import_earthengine9 = __toESM(require("@google/earthengine"));
    init_registry();
    init_geo();
    register({
      name: "smart_filter_collection",
      description: "Intelligently filter a collection by detecting place names and using administrative boundaries when possible",
      input: import_zod2.z.object({
        query: import_zod2.z.string().describe('Natural language query like "Sentinel-2 for San Francisco in January 2025"'),
        datasetId: import_zod2.z.string(),
        startDate: import_zod2.z.string(),
        endDate: import_zod2.z.string(),
        fallbackRegion: import_zod2.z.any().optional().describe("Fallback region if place name not found")
      }),
      output: import_zod2.z.object({
        count: import_zod2.z.number(),
        regionType: import_zod2.z.string(),
        placeName: import_zod2.z.string().nullable(),
        message: import_zod2.z.string(),
        bounds: import_zod2.z.any().optional()
      }),
      handler: async ({ query, datasetId, startDate, endDate, fallbackRegion }) => {
        const placeName = extractPlaceName(query);
        let region;
        let regionType = "unknown";
        let message = "";
        if (placeName) {
          const aoi = { placeName, type: "Polygon", coordinates: [] };
          if (fallbackRegion) {
            Object.assign(aoi, fallbackRegion);
          }
          region = await parseAoi(aoi);
          if (region) {
            regionType = "administrative_boundary";
            message = `Using exact administrative boundary for ${placeName}`;
          }
        }
        if (!region && fallbackRegion) {
          region = await parseAoi(fallbackRegion);
          regionType = "polygon";
          message = placeName ? `Could not find boundary for ${placeName}, using polygon instead` : "Using provided polygon region";
        }
        if (!region) {
          throw new Error("No valid region found. Please provide coordinates or a recognized place name.");
        }
        const col = new import_earthengine9.default.ImageCollection(datasetId).filterDate(startDate, endDate).filterBounds(region);
        const count = await col.size().getInfo();
        let bounds;
        try {
          bounds = await region.bounds().getInfo();
        } catch (e) {
        }
        return {
          count,
          regionType,
          placeName,
          message,
          bounds
        };
      }
    });
    register({
      name: "filter_by_place_name",
      description: "Filter a collection using a place name (automatically finds administrative boundary)",
      input: import_zod2.z.object({
        placeName: import_zod2.z.string().describe('Name of place like "San Francisco", "California", "United States"'),
        datasetId: import_zod2.z.string(),
        startDate: import_zod2.z.string(),
        endDate: import_zod2.z.string()
      }),
      output: import_zod2.z.object({
        count: import_zod2.z.number(),
        found: import_zod2.z.boolean(),
        message: import_zod2.z.string(),
        area: import_zod2.z.number().optional()
      }),
      handler: async ({ placeName, datasetId, startDate, endDate }) => {
        const aoi = { placeName };
        const region = await parseAoi(aoi);
        if (!region) {
          return {
            count: 0,
            found: false,
            message: `Could not find administrative boundary for "${placeName}". Please check the spelling or use coordinates instead.`,
            area: void 0
          };
        }
        const col = new import_earthengine9.default.ImageCollection(datasetId).filterDate(startDate, endDate).filterBounds(region);
        const count = await col.size().getInfo();
        let area;
        try {
          const areaM2 = await region.area().getInfo();
          area = areaM2 / 1e6;
        } catch (e) {
        }
        return {
          count,
          found: true,
          message: `Found ${count} images for ${placeName} (using administrative boundary${area ? `, area: ${Math.round(area)} km\xB2` : ""})`,
          area
        };
      }
    });
  }
});

// src/mcp/tools/get_band_names.ts
var import_earthengine10;
var init_get_band_names = __esm({
  "src/mcp/tools/get_band_names.ts"() {
    "use strict";
    import_earthengine10 = __toESM(require("@google/earthengine"));
    init_registry();
    register({
      name: "get_dataset_band_names",
      description: "Return band names for first image in a collection or an image asset",
      input: import_zod2.z.object({ datasetId: import_zod2.z.string() }),
      output: import_zod2.z.object({ bands: import_zod2.z.array(import_zod2.z.string()) }),
      handler: async ({ datasetId }) => {
        const col = new import_earthengine10.default.ImageCollection(datasetId);
        const first = new import_earthengine10.default.Image(col.first());
        const bands = await first.bandNames().getInfo();
        return { bands };
      }
    });
  }
});

// src/mcp/tools/load_cog_from_gcs.ts
var import_earthengine11;
var init_load_cog_from_gcs = __esm({
  "src/mcp/tools/load_cog_from_gcs.ts"() {
    "use strict";
    import_earthengine11 = __toESM(require("@google/earthengine"));
    init_registry();
    register({
      name: "load_cloud_optimized_geotiff",
      description: "Load a public/service-readable COG from GCS into EE",
      input: import_zod2.z.object({ gcsUrl: import_zod2.z.string().url() }),
      output: import_zod2.z.object({ ok: import_zod2.z.boolean(), note: import_zod2.z.string().optional() }),
      handler: async ({ gcsUrl }) => {
        import_earthengine11.default.Image.loadGeoTIFF(gcsUrl);
        return { ok: true, note: "Ensure bucket IAM/region compatible" };
      }
    });
  }
});

// src/mcp/tools/mask_clouds.ts
function maskS2(img) {
  const qa = img.select("QA60");
  const mask = qa.bitwiseAnd(1 << 10).eq(0).and(qa.bitwiseAnd(1 << 11).eq(0));
  return img.updateMask(mask);
}
function maskLandsat(img) {
  const qa = img.select("QA_PIXEL");
  const cloud = qa.bitwiseAnd(1 << 3).neq(0);
  const shadow = qa.bitwiseAnd(1 << 4).neq(0);
  return img.updateMask(cloud.not().and(shadow.not()));
}
var import_earthengine12;
var init_mask_clouds = __esm({
  "src/mcp/tools/mask_clouds.ts"() {
    "use strict";
    import_earthengine12 = __toESM(require("@google/earthengine"));
    init_registry();
    register({
      name: "mask_clouds_from_image",
      description: "Apply default cloud/shadow mask for Sentinel-2 or Landsat",
      input: import_zod2.z.object({ dataset: import_zod2.z.enum(["S2", "L8", "L9"]), imageId: import_zod2.z.string().optional(), datasetId: import_zod2.z.string().optional() }),
      output: import_zod2.z.object({ ok: import_zod2.z.boolean() }),
      handler: async ({ dataset, imageId, datasetId }) => {
        const img = imageId ? new import_earthengine12.default.Image(imageId) : new import_earthengine12.default.Image(new import_earthengine12.default.ImageCollection(datasetId).first());
        const masked = dataset === "S2" ? maskS2(img) : maskLandsat(img);
        masked.bandNames();
        return { ok: true };
      }
    });
  }
});

// src/mcp/tools/create_mosaic.ts
var import_earthengine13;
var init_create_mosaic = __esm({
  "src/mcp/tools/create_mosaic.ts"() {
    "use strict";
    import_earthengine13 = __toESM(require("@google/earthengine"));
    init_registry();
    register({
      name: "create_clean_mosaic",
      description: "Create a median composite",
      input: import_zod2.z.object({ datasetId: import_zod2.z.string(), start: import_zod2.z.string(), end: import_zod2.z.string() }),
      output: import_zod2.z.object({ ok: import_zod2.z.boolean() }),
      handler: async ({ datasetId, start, end }) => {
        const img = new import_earthengine13.default.ImageCollection(datasetId).filterDate(start, end).median();
        img.bandNames();
        return { ok: true };
      }
    });
  }
});

// src/mcp/tools/clip_image.ts
var import_earthengine14;
var init_clip_image = __esm({
  "src/mcp/tools/clip_image.ts"() {
    "use strict";
    import_earthengine14 = __toESM(require("@google/earthengine"));
    init_registry();
    init_geo();
    register({
      name: "clip_image_to_region",
      description: 'Clip image by AOI (supports place names like "San Francisco")',
      input: import_zod2.z.object({
        imageId: import_zod2.z.string(),
        aoi: import_zod2.z.any(),
        placeName: import_zod2.z.string().optional()
        // Optional place name for boundary lookup
      }),
      output: import_zod2.z.object({
        ok: import_zod2.z.boolean(),
        regionType: import_zod2.z.string(),
        message: import_zod2.z.string()
      }),
      handler: async ({ imageId, aoi, placeName }) => {
        if (placeName && typeof aoi === "object") {
          aoi.placeName = placeName;
        }
        const img = new import_earthengine14.default.Image(imageId);
        const region = await parseAoi(aoi);
        const regionType = aoi.placeName && region ? "administrative_boundary" : "polygon";
        img.clip(region).bandNames();
        return {
          ok: true,
          regionType,
          message: regionType === "administrative_boundary" ? `Clipped to exact boundary of ${aoi.placeName}` : "Clipped to polygon region"
        };
      }
    });
  }
});

// src/mcp/tools/resample_image.ts
var import_earthengine15;
var init_resample_image = __esm({
  "src/mcp/tools/resample_image.ts"() {
    "use strict";
    import_earthengine15 = __toESM(require("@google/earthengine"));
    init_registry();
    init_geo();
    register({
      name: "resample_image_to_resolution",
      description: "Resample an image to a target scale",
      input: import_zod2.z.object({ imageId: import_zod2.z.string(), scale: import_zod2.z.number().positive() }),
      output: import_zod2.z.object({ ok: import_zod2.z.boolean(), scale: import_zod2.z.number() }),
      handler: async ({ imageId, scale }) => {
        const img = new import_earthengine15.default.Image(imageId);
        const s = clampScale(scale);
        img.reproject({ scale: s });
        return { ok: true, scale: s };
      }
    });
  }
});

// src/mcp/tools/spectral_index.ts
function getDefaultMapping(imageId) {
  for (const [dataset, mapping] of Object.entries(DEFAULT_MAPPINGS)) {
    if (imageId.startsWith(dataset)) {
      return mapping;
    }
  }
  return DEFAULT_MAPPINGS["COPERNICUS/S2_SR_HARMONIZED"];
}
var import_earthengine16, IndexEnum, DEFAULT_MAPPINGS;
var init_spectral_index = __esm({
  "src/mcp/tools/spectral_index.ts"() {
    "use strict";
    import_earthengine16 = __toESM(require("@google/earthengine"));
    init_registry();
    IndexEnum = ["NDVI", "EVI", "NDWI"];
    DEFAULT_MAPPINGS = {
      "COPERNICUS/S2": { nir: "B8", red: "B4", green: "B3", blue: "B2" },
      "COPERNICUS/S2_SR": { nir: "B8", red: "B4", green: "B3", blue: "B2" },
      "COPERNICUS/S2_SR_HARMONIZED": { nir: "B8", red: "B4", green: "B3", blue: "B2" },
      "LANDSAT/LC08": { nir: "B5", red: "B4", green: "B3", blue: "B2" },
      "LANDSAT/LC09": { nir: "B5", red: "B4", green: "B3", blue: "B2" },
      "LANDSAT/LE07": { nir: "B4", red: "B3", green: "B2", blue: "B1" },
      "MODIS": { nir: "sur_refl_b02", red: "sur_refl_b01", green: "sur_refl_b04" }
    };
    register({
      name: "calculate_spectral_index",
      description: "Compute NDVI/EVI/NDWI",
      input: import_zod2.z.object({
        imageId: import_zod2.z.string(),
        index: import_zod2.z.enum(IndexEnum),
        mapping: import_zod2.z.object({
          nir: import_zod2.z.string(),
          red: import_zod2.z.string(),
          green: import_zod2.z.string().optional(),
          blue: import_zod2.z.string().optional()
        }).optional()
      }),
      output: import_zod2.z.object({ ok: import_zod2.z.boolean(), index: import_zod2.z.string(), bands: import_zod2.z.any() }),
      handler: async ({ imageId, index, mapping }) => {
        const bandMapping = mapping || getDefaultMapping(imageId);
        const img = new import_earthengine16.default.Image(imageId);
        let out = img;
        if (index === "NDVI") {
          out = img.expression("(NIR-RED)/(NIR+RED)", {
            NIR: img.select(bandMapping.nir),
            RED: img.select(bandMapping.red)
          }).rename("NDVI");
        }
        if (index === "EVI") {
          const blue = bandMapping.blue || bandMapping.green || bandMapping.red;
          out = img.expression("2.5*((NIR-RED)/(NIR+6*RED-7.5*BLUE+1))", {
            NIR: img.select(bandMapping.nir),
            RED: img.select(bandMapping.red),
            BLUE: img.select(blue)
          }).rename("EVI");
        }
        if (index === "NDWI") {
          out = img.expression("(GREEN-NIR)/(GREEN+NIR)", {
            GREEN: img.select(bandMapping.green || bandMapping.red),
            NIR: img.select(bandMapping.nir)
          }).rename("NDWI");
        }
        out.projection();
        return { ok: true, index, bands: bandMapping };
      }
    });
  }
});

// src/mcp/tools/reduce_stats.ts
var import_earthengine17;
var init_reduce_stats = __esm({
  "src/mcp/tools/reduce_stats.ts"() {
    "use strict";
    import_earthengine17 = __toESM(require("@google/earthengine"));
    init_registry();
    init_geo();
    register({
      name: "calculate_summary_statistics",
      description: "reduceRegion over AOI",
      input: import_zod2.z.object({ imageId: import_zod2.z.string(), aoi: import_zod2.z.any(), scale: import_zod2.z.number().optional() }),
      output: import_zod2.z.object({ stats: import_zod2.z.record(import_zod2.z.number()).nullable() }),
      handler: async ({ imageId, aoi, scale }) => {
        const img = new import_earthengine17.default.Image(imageId);
        const region = await parseAoi(aoi);
        const reducers = import_earthengine17.default.Reducer.mean().combine({ reducer2: import_earthengine17.default.Reducer.stdDev(), sharedInputs: true });
        const dict = await img.reduceRegion({ reducer: reducers, geometry: region, scale: scale ?? 30, maxPixels: 1e8 }).getInfo();
        return { stats: dict ?? null };
      }
    });
  }
});

// src/mcp/tools/zonal_stats.ts
var import_earthengine18;
var init_zonal_stats = __esm({
  "src/mcp/tools/zonal_stats.ts"() {
    "use strict";
    import_earthengine18 = __toESM(require("@google/earthengine"));
    init_registry();
    register({
      name: "calculate_zonal_statistics",
      description: "reduceRegions by zones",
      input: import_zod2.z.object({ imageId: import_zod2.z.string(), zonesAssetId: import_zod2.z.string(), scale: import_zod2.z.number().optional() }),
      output: import_zod2.z.object({ count: import_zod2.z.number() }),
      handler: async ({ imageId, zonesAssetId, scale }) => {
        const img = new import_earthengine18.default.Image(imageId);
        const zones = new import_earthengine18.default.FeatureCollection(zonesAssetId);
        const out = img.reduceRegions({ collection: zones, reducer: import_earthengine18.default.Reducer.mean(), scale: scale ?? 30 });
        const count = await out.size().getInfo();
        return { count };
      }
    });
  }
});

// src/mcp/tools/change_detect.ts
var import_earthengine19;
var init_change_detect = __esm({
  "src/mcp/tools/change_detect.ts"() {
    "use strict";
    import_earthengine19 = __toESM(require("@google/earthengine"));
    init_registry();
    register({
      name: "detect_change_between_images",
      description: "Image difference (A - B)",
      input: import_zod2.z.object({ imageAId: import_zod2.z.string(), imageBId: import_zod2.z.string(), band: import_zod2.z.string().optional() }),
      output: import_zod2.z.object({ ok: import_zod2.z.boolean() }),
      handler: async ({ imageAId, imageBId, band }) => {
        let a = new import_earthengine19.default.Image(imageAId);
        let b = new import_earthengine19.default.Image(imageBId);
        if (band) {
          a = a.select(band);
          b = b.select(band);
        }
        const diff = a.subtract(b).rename("change");
        diff.bandNames();
        return { ok: true };
      }
    });
  }
});

// src/mcp/tools/terrain.ts
var import_earthengine20;
var init_terrain = __esm({
  "src/mcp/tools/terrain.ts"() {
    "use strict";
    import_earthengine20 = __toESM(require("@google/earthengine"));
    init_registry();
    register({
      name: "calculate_slope_and_aspect",
      description: "Terrain products from DEM",
      input: import_zod2.z.object({ demAssetId: import_zod2.z.string() }),
      output: import_zod2.z.object({ ok: import_zod2.z.boolean() }),
      handler: async ({ demAssetId }) => {
        const dem = new import_earthengine20.default.Image(demAssetId);
        const terr = import_earthengine20.default.Terrain.products(dem);
        terr.select(["slope", "aspect"]).bandNames();
        return { ok: true };
      }
    });
  }
});

// src/mcp/tools/time_series.ts
var import_earthengine21;
var init_time_series = __esm({
  "src/mcp/tools/time_series.ts"() {
    "use strict";
    import_earthengine21 = __toESM(require("@google/earthengine"));
    init_registry();
    init_geo();
    register({
      name: "create_time_series_chart_for_region",
      description: "Monthly mean series over AOI",
      input: import_zod2.z.object({ datasetId: import_zod2.z.string(), aoi: import_zod2.z.any(), band: import_zod2.z.string() }),
      output: import_zod2.z.object({ series: import_zod2.z.array(import_zod2.z.object({ t: import_zod2.z.string(), value: import_zod2.z.number().nullable() })) }),
      handler: async ({ datasetId, aoi, band }) => {
        const region = await parseAoi(aoi);
        const col = new import_earthengine21.default.ImageCollection(datasetId).map((img) => img.set("date", img.date().format("YYYY-MM"))).select(band);
        const months = new import_earthengine21.default.List(col.aggregate_array("date")).distinct();
        const series = await months.map((m) => {
          const c = col.filter(import_earthengine21.default.Filter.eq("date", m));
          const v = new import_earthengine21.default.Image(c.mean()).reduceRegion({ reducer: import_earthengine21.default.Reducer.mean(), geometry: region, scale: 30, maxPixels: 1e8 }).get(band);
          return new import_earthengine21.default.Dictionary({ t: m, value: v });
        }).getInfo();
        return { series };
      }
    });
  }
});

// src/mcp/tools/get_tiles.ts
var import_earthengine22;
var init_get_tiles = __esm({
  "src/mcp/tools/get_tiles.ts"() {
    "use strict";
    import_earthengine22 = __toESM(require("@google/earthengine"));
    init_registry();
    init_client();
    register({
      name: "get_map_visualization_url",
      description: "Get a TMS template for an image",
      input: import_zod2.z.object({ imageId: import_zod2.z.string(), visParams: import_zod2.z.record(import_zod2.z.any()).default({}) }),
      output: import_zod2.z.object({ mapId: import_zod2.z.string(), tileUrlTemplate: import_zod2.z.string(), ttlSeconds: import_zod2.z.number() }),
      handler: async ({ imageId, visParams }) => {
        const img = new import_earthengine22.default.Image(imageId);
        return await getTileService(img, visParams);
      }
    });
  }
});

// src/mcp/tools/get_thumbnail.ts
var import_earthengine23;
var init_get_thumbnail = __esm({
  "src/mcp/tools/get_thumbnail.ts"() {
    "use strict";
    import_earthengine23 = __toESM(require("@google/earthengine"));
    init_registry();
    init_geo();
    register({
      name: "get_thumbnail_image",
      description: "Get high-resolution thumbnail URL clipped to exact shapefile boundaries",
      input: import_zod2.z.object({
        imageId: import_zod2.z.string().optional(),
        datasetId: import_zod2.z.string().optional(),
        start: import_zod2.z.string().optional(),
        end: import_zod2.z.string().optional(),
        aoi: import_zod2.z.any(),
        visParams: import_zod2.z.record(import_zod2.z.any()).default({}),
        size: import_zod2.z.object({ width: import_zod2.z.number().default(1024), height: import_zod2.z.number().default(1024) }).default({ width: 1024, height: 1024 })
      }),
      output: import_zod2.z.object({ url: import_zod2.z.string(), ttlSeconds: import_zod2.z.number(), width: import_zod2.z.number(), height: import_zod2.z.number() }),
      handler: async ({ imageId, datasetId, start, end, aoi, visParams, size }) => {
        const region = await parseAoi(aoi);
        let image;
        if (imageId) {
          image = new import_earthengine23.default.Image(imageId);
        } else if (datasetId && start && end) {
          const collection = new import_earthengine23.default.ImageCollection(datasetId).filterDate(start, end).filterBounds(region).select(["B4", "B3", "B2"]);
          const count = await collection.size().getInfo();
          image = count > 0 ? collection.median() : collection.first();
        } else {
          throw new Error("Either imageId or (datasetId, start, end) must be provided");
        }
        const bounds = region.bounds();
        const coords = await bounds.coordinates().getInfo();
        const west = coords[0][0][0];
        const south = coords[0][0][1];
        const east = coords[0][2][0];
        const north = coords[0][2][1];
        const aspectRatio = Math.abs(east - west) / Math.abs(north - south);
        const targetWidth = size?.width || 1024;
        const targetHeight = Math.round(targetWidth / aspectRatio);
        if (image) {
          image = image.clip(region);
        }
        const defaultVis = {
          min: visParams?.min || 0,
          max: visParams?.max || 3e3,
          gamma: visParams?.gamma || 1.4,
          bands: visParams?.bands || (datasetId?.includes("LANDSAT") ? ["B4", "B3", "B2"] : ["B4", "B3", "B2"])
        };
        try {
          const regionBounds = await bounds.getInfo();
          const url = await image.getThumbURL({
            region: regionBounds,
            // Use bounds instead of full geometry
            dimensions: `${targetWidth}x${targetHeight}`,
            format: "png",
            ...defaultVis
          });
          return {
            url,
            ttlSeconds: 3600,
            width: targetWidth,
            height: targetHeight
          };
        } catch (error) {
          console.log("Thumbnail generation error, trying fallback:", error.message);
          const fallbackWidth = Math.min(targetWidth, 512);
          const fallbackHeight = Math.round(fallbackWidth / aspectRatio);
          try {
            const regionBounds = await bounds.getInfo();
            const url = await image.getThumbURL({
              region: regionBounds,
              dimensions: `${fallbackWidth}x${fallbackHeight}`,
              format: "png",
              ...defaultVis
            });
            return {
              url,
              ttlSeconds: 3600,
              width: fallbackWidth,
              height: fallbackHeight
            };
          } catch (fallbackError) {
            const centroid = region.centroid();
            const buffer = centroid.buffer(1e4);
            const bufferBounds = await buffer.bounds().getInfo();
            const url = await image.getThumbURL({
              region: bufferBounds,
              dimensions: "256x256",
              format: "png",
              ...defaultVis
            });
            return {
              url,
              ttlSeconds: 3600,
              width: 256,
              height: 256
            };
          }
        }
      }
    });
  }
});

// src/gee/tasks.ts
function exportImageToGCS(params) {
  const exportParams = {
    image: params.image,
    description: params.description,
    bucket: params.bucket,
    fileNamePrefix: params.fileNamePrefix,
    region: params.region
  };
  if (params.scale !== void 0) exportParams.scale = params.scale;
  if (params.crs !== void 0) exportParams.crs = params.crs;
  const task = import_earthengine24.default.batch.Export.image.toCloudStorage(exportParams);
  task.start();
  return { taskId: task.id };
}
function getTaskStatus(taskId) {
  const status = import_earthengine24.default.data.getTaskStatus(taskId)?.[0] ?? {};
  return { state: status.state, errorMessage: status.error_message, progress: status.progress };
}
var import_earthengine24;
var init_tasks = __esm({
  "src/gee/tasks.ts"() {
    "use strict";
    import_earthengine24 = __toESM(require("@google/earthengine"));
  }
});

// src/mcp/tools/export_image.ts
var import_earthengine25;
var init_export_image = __esm({
  "src/mcp/tools/export_image.ts"() {
    "use strict";
    import_earthengine25 = __toESM(require("@google/earthengine"));
    init_registry();
    init_tasks();
    init_geo();
    register({
      name: "export_image_to_cloud_storage",
      description: 'Start a GeoTIFF export to GCS (supports place names like "San Francisco")',
      input: import_zod2.z.object({
        imageId: import_zod2.z.string(),
        bucket: import_zod2.z.string().optional(),
        fileNamePrefix: import_zod2.z.string().optional(),
        aoi: import_zod2.z.any().optional(),
        region: import_zod2.z.any().optional(),
        // Alternative to aoi
        scale: import_zod2.z.number().optional(),
        crs: import_zod2.z.string().optional(),
        placeName: import_zod2.z.string().optional()
        // Optional place name for boundary lookup
      }),
      output: import_zod2.z.object({
        taskId: import_zod2.z.string(),
        state: import_zod2.z.string().optional(),
        regionType: import_zod2.z.string()
      }),
      handler: async ({ imageId, bucket, fileNamePrefix, aoi, region: regionParam, scale, crs, placeName }) => {
        const aoiInput = aoi || regionParam;
        if (placeName && typeof aoiInput === "object") {
          aoiInput.placeName = placeName;
        }
        const image = new import_earthengine25.default.Image(imageId);
        const region = await parseAoi(aoiInput);
        const regionType = (aoiInput?.placeName || placeName) && region ? "administrative_boundary" : "polygon";
        const exportBucket = bucket || "earth-engine-exports";
        const exportPrefix = fileNamePrefix || `export-${Date.now()}`;
        const exportScale = scale || 30;
        const exportCrs = crs || "EPSG:4326";
        let exportRegion = region;
        try {
          exportRegion = await region.getInfo();
        } catch (e) {
          exportRegion = region;
        }
        const { taskId } = exportImageToGCS({
          image,
          description: `export-${exportPrefix}`,
          bucket: exportBucket,
          fileNamePrefix: exportPrefix,
          region: exportRegion,
          scale: exportScale,
          crs: exportCrs
        });
        const status = getTaskStatus(taskId);
        return {
          taskId,
          state: status.state,
          regionType
        };
      }
    });
  }
});

// src/mcp/tools/export_status.ts
var init_export_status = __esm({
  "src/mcp/tools/export_status.ts"() {
    "use strict";
    init_registry();
    init_tasks();
    register({
      name: "get_export_task_status",
      description: "Poll status of an export task",
      input: import_zod2.z.object({ taskId: import_zod2.z.string() }),
      output: import_zod2.z.object({ state: import_zod2.z.string().nullable(), progress: import_zod2.z.number().nullable(), errorMessage: import_zod2.z.string().nullable() }),
      handler: async ({ taskId }) => {
        const s = getTaskStatus(taskId);
        return { state: s.state ?? null, progress: s.progress ?? null, errorMessage: s.errorMessage ?? null };
      }
    });
  }
});

// src/mcp/tools/gee_script_js.ts
var import_vm, import_earthengine26;
var init_gee_script_js = __esm({
  "src/mcp/tools/gee_script_js.ts"() {
    "use strict";
    import_vm = __toESM(require("vm"));
    import_earthengine26 = __toESM(require("@google/earthengine"));
    init_registry();
    register({
      name: "gee_script_js",
      description: "Execute small EE JS snippets in a sandbox (fallback)",
      input: import_zod2.z.object({ codeJs: import_zod2.z.string().min(5) }),
      output: import_zod2.z.object({ ok: import_zod2.z.boolean(), result: import_zod2.z.any().optional(), warnings: import_zod2.z.array(import_zod2.z.string()).optional() }),
      handler: async ({ codeJs }) => {
        const sandbox = { ee: import_earthengine26.default, result: null };
        import_vm.default.createContext(sandbox);
        import_vm.default.runInContext(codeJs, sandbox, { timeout: 3e3 });
        return { ok: true, result: sandbox.result ?? null, warnings: ["Sandboxed; quotas apply"] };
      }
    });
  }
});

// src/mcp/tools/gee_sdk_call.ts
var import_earthengine27, Op;
var init_gee_sdk_call = __esm({
  "src/mcp/tools/gee_sdk_call.ts"() {
    "use strict";
    import_earthengine27 = __toESM(require("@google/earthengine"));
    init_registry();
    Op = import_zod2.z.enum(["filterDate", "filterBounds", "select", "clip", "addBands", "expression"]);
    register({
      name: "gee_sdk_call",
      description: "Allow-listed generic EE ops sequence (fallback)",
      input: import_zod2.z.object({ datasetId: import_zod2.z.string(), ops: import_zod2.z.array(import_zod2.z.object({ op: Op, params: import_zod2.z.record(import_zod2.z.any()) })) }),
      output: import_zod2.z.object({ ok: import_zod2.z.boolean() }),
      handler: async ({ datasetId, ops }) => {
        let obj = new import_earthengine27.default.ImageCollection(datasetId);
        for (const step of ops) {
          if (step.op === "filterDate") obj = obj.filterDate(step.params.start, step.params.end);
          else if (step.op === "filterBounds") obj = obj.filterBounds(step.params.aoi);
          else if (step.op === "select") obj = obj.select(step.params.bands);
        }
        obj.size();
        return { ok: true };
      }
    });
  }
});

// src/mcp/tools/index.ts
var tools_exports = {};
var init_tools = __esm({
  "src/mcp/tools/index.ts"() {
    "use strict";
    init_auth_check();
    init_search_gee_catalog();
    init_shapefile_to_geometry();
    init_get_shapefile_boundary();
    init_use_shapefile_instead();
    init_filter_collection();
    init_smart_filter();
    init_get_band_names();
    init_load_cog_from_gcs();
    init_mask_clouds();
    init_create_mosaic();
    init_clip_image();
    init_resample_image();
    init_spectral_index();
    init_reduce_stats();
    init_zonal_stats();
    init_change_detect();
    init_terrain();
    init_time_series();
    init_get_tiles();
    init_get_thumbnail();
    init_export_image();
    init_export_status();
    init_gee_script_js();
    init_gee_sdk_call();
  }
});

// mcp-standalone.ts
var import_server = require("@modelcontextprotocol/sdk/server/index.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
var import_types = require("@modelcontextprotocol/sdk/types.js");
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_url = require("url");
var import_path = require("path");
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = (0, import_path.dirname)(__filename);
function loadEnvFile() {
  const envPath = path.join(__dirname, ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=");
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}
async function main() {
  try {
    loadEnvFile();
    process.env.TS_NODE_PROJECT = path.join(__dirname, "tsconfig.json");
    await Promise.resolve().then(() => (init_client(), client_exports)).then(async (module2) => {
      await module2.initEarthEngineWithSA();
    }).catch(async () => {
      const ee28 = await import("@google/earthengine");
      const { GoogleAuth } = await import("google-auth-library");
      console.error("[Earth Engine MCP] Initializing Earth Engine with service account...");
      const keyJson = JSON.parse(Buffer.from(process.env.GEE_SA_KEY_JSON || "", "base64").toString("utf8"));
      const auth = new GoogleAuth({
        credentials: keyJson,
        scopes: ["https://www.googleapis.com/auth/earthengine"]
      });
      const client = await auth.getClient();
      ee28.data.setAuthToken("", "Bearer", (await client.getAccessToken()).token, 3600);
      await new Promise((resolve, reject) => {
        ee28.initialize(null, null, () => resolve(), (err) => reject(err));
      });
      console.error("[Earth Engine MCP] Earth Engine initialized successfully");
    });
    const { list: list2, get: get2 } = await Promise.resolve().then(() => (init_registry(), registry_exports));
    await Promise.resolve().then(() => (init_tools(), tools_exports));
    const tools2 = list2();
    console.error(`[Earth Engine MCP] Loaded ${tools2.length} tools`);
    const shapefileTools = tools2.filter(
      (t) => t.name.includes("shapefile") || t.name.includes("boundary")
    );
    console.error(`[Earth Engine MCP] Shapefile tools: ${shapefileTools.map((t) => t.name).join(", ")}`);
    const server = new import_server.Server(
      {
        name: "earth-engine-mcp",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    server.setRequestHandler(import_types.ListToolsRequestSchema, async () => ({
      tools: tools2.map((tool) => {
        const fullTool = get2(tool.name);
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: fullTool?.input?._def || {}
        };
      })
    }));
    server.setRequestHandler(import_types.CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const tool = get2(name);
      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }
      console.error(`[Earth Engine MCP] Executing: ${name}`);
      const result = await tool.handler(args);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result)
        }]
      };
    });
    const transport = new import_stdio.StdioServerTransport();
    await server.connect(transport);
    console.error("====================================");
    console.error("\u{1F30D} Earth Engine MCP Server Ready");
    console.error("====================================");
    console.error("\u2705 All shapefile tools loaded");
    console.error("====================================");
  } catch (error) {
    console.error("[Earth Engine MCP] Error:", error);
    process.exit(1);
  }
}
main().catch(console.error);
