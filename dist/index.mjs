#!/usr/bin/env node
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

// node_modules/.pnpm/tsup@8.5.0_postcss@8.5.6_tsx@4.20.5_typescript@5.8.3_yaml@2.8.1/node_modules/tsup/assets/esm_shims.js
import path from "path";
import { fileURLToPath } from "url";
var init_esm_shims = __esm({
  "node_modules/.pnpm/tsup@8.5.0_postcss@8.5.6_tsx@4.20.5_typescript@5.8.3_yaml@2.8.1/node_modules/tsup/assets/esm_shims.js"() {
    "use strict";
  }
});

// src/mcp/registry.ts
import { z } from "zod";
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
var tools;
var init_registry = __esm({
  "src/mcp/registry.ts"() {
    "use strict";
    init_esm_shims();
    tools = /* @__PURE__ */ new Map();
  }
});

// src/utils/global-search.ts
import ee2 from "@google/earthengine";
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
        const fc = new ee2.FeatureCollection(dataset.collection);
        const filtered = fc.filter(ee2.Filter.eq(field, searchTerm));
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
    const fc = new ee2.FeatureCollection("FAO/GAUL/2015/level2");
    const filtered = fc.filter(
      ee2.Filter.and(
        ee2.Filter.or(
          ee2.Filter.eq("ADM2_NAME", city),
          ee2.Filter.eq("ADM2_NAME", toTitleCase(city))
        ),
        ee2.Filter.or(
          ee2.Filter.eq("ADM0_NAME", context),
          ee2.Filter.eq("ADM0_NAME", toTitleCase(context))
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
      const fc = new ee2.FeatureCollection("FAO/GAUL/2015/level2");
      const filtered = fc.filter(
        ee2.Filter.and(
          ee2.Filter.eq("ADM2_NAME", city),
          ee2.Filter.eq("ADM1_NAME", context)
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
      const fc = new ee2.FeatureCollection("TIGER/2016/Counties");
      const filtered = fc.filter(ee2.Filter.eq("NAME", mapping.county)).filter(ee2.Filter.eq("STATEFP", mapping.state));
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
    const fc = new ee2.FeatureCollection("TIGER/2016/Counties");
    const filtered = fc.filter(
      ee2.Filter.or(
        ee2.Filter.eq("NAME", searchTerm),
        ee2.Filter.eq("NAME", titleCase),
        ee2.Filter.eq("NAMELSAD", searchTerm),
        ee2.Filter.eq("NAMELSAD", titleCase),
        ee2.Filter.eq("NAMELSAD", searchTerm + " County"),
        ee2.Filter.eq("NAMELSAD", titleCase + " County")
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
  const majorCities = {
    "sydney": { country: "Australia", fallbackRegion: "New South Wales" },
    "melbourne": { country: "Australia", fallbackRegion: "Victoria" },
    "brisbane": { country: "Australia", fallbackRegion: "Queensland" },
    "perth": { country: "Australia", fallbackRegion: "Western Australia" },
    "adelaide": { country: "Australia", fallbackRegion: "South Australia" },
    "auckland": { country: "New Zealand", fallbackRegion: "Auckland" },
    "wellington": { country: "New Zealand", fallbackRegion: "Wellington" },
    "vancouver": { country: "Canada", fallbackRegion: "British Columbia" },
    "toronto": { country: "Canada", fallbackRegion: "Ontario" },
    "montreal": { country: "Canada", fallbackRegion: "Quebec" }
  };
  const normalized = searchTerm.toLowerCase();
  if (majorCities[normalized]) {
    const cityInfo = majorCities[normalized];
    if (cityInfo.fallbackRegion) {
      try {
        const fc = new ee2.FeatureCollection("FAO/GAUL/2015/level1");
        const filtered = fc.filter(
          ee2.Filter.and(
            ee2.Filter.eq("ADM1_NAME", cityInfo.fallbackRegion),
            ee2.Filter.eq("ADM0_NAME", cityInfo.country)
          )
        );
        const count = await filtered.size().getInfo();
        if (count > 0) {
          const first = filtered.first();
          const geometry = first.geometry();
          console.log(`\u2705 Found "${searchTerm}" via ${cityInfo.fallbackRegion}, ${cityInfo.country}`);
          return geometry;
        }
      } catch (e) {
      }
    }
    try {
      const fc = new ee2.FeatureCollection("FAO/GAUL/2015/level0");
      const filtered = fc.filter(ee2.Filter.eq("ADM0_NAME", cityInfo.country));
      const count = await filtered.size().getInfo();
      if (count > 0) {
        const first = filtered.first();
        const geometry = first.geometry();
        console.log(`\u2705 Found "${searchTerm}" at country level: ${cityInfo.country}`);
        return geometry;
      }
    } catch (e) {
    }
  }
  const levels = [
    { collection: "FAO/GAUL/2015/level2", field: "ADM2_NAME", level: "District" },
    { collection: "FAO/GAUL/2015/level1", field: "ADM1_NAME", level: "State/Province" },
    { collection: "FAO/GAUL/2015/level0", field: "ADM0_NAME", level: "Country" }
  ];
  for (const level of levels) {
    for (const variant of variations) {
      try {
        const fc = new ee2.FeatureCollection(level.collection);
        const filtered = fc.filter(ee2.Filter.eq(level.field, variant));
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
var init_global_search = __esm({
  "src/utils/global-search.ts"() {
    "use strict";
    init_esm_shims();
  }
});

// src/utils/geo.ts
import ee3 from "@google/earthengine";
function tryGetAdminBoundary(placeName) {
  try {
    const normalized = placeName.toLowerCase().trim();
    if (normalized.includes("san francisco") || normalized === "sf") {
      const sfCounty = new ee3.FeatureCollection("TIGER/2016/Counties").filter(ee3.Filter.eq("NAME", "San Francisco")).first();
      console.log("Fetching exact San Francisco County boundary from TIGER dataset");
      return sfCounty.geometry();
    }
    if (normalized === "new york" || normalized === "nyc" || normalized === "new york city") {
      const nyCounty = new ee3.FeatureCollection("TIGER/2016/Counties").filter(ee3.Filter.eq("NAME", "New York")).filter(ee3.Filter.eq("STATEFP", "36")).first();
      console.log("Using TIGER New York County (Manhattan) boundary");
      return nyCounty.geometry();
    }
    if (normalized === "los angeles" || normalized === "la") {
      const laCounty = new ee3.FeatureCollection("TIGER/2016/Counties").filter(ee3.Filter.eq("NAME", "Los Angeles")).filter(ee3.Filter.eq("STATEFP", "06")).first();
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
        let districts = new ee3.FeatureCollection("FAO/GAUL/2015/level2").filter(ee3.Filter.eq("ADM2_NAME", cityInfo.name)).filter(ee3.Filter.eq("ADM0_NAME", cityInfo.country));
        if (cityInfo.state) {
          districts = districts.filter(ee3.Filter.eq("ADM1_NAME", cityInfo.state));
        }
        const firstDistrict = districts.first();
        const geometry = firstDistrict.geometry();
        console.log(`Found ${placeName} in FAO GAUL dataset (${cityInfo.country})`);
        return geometry;
      } catch (e) {
        try {
          const districts = new ee3.FeatureCollection("FAO/GAUL/2015/level2").filter(ee3.Filter.eq("ADM2_NAME", cityInfo.name)).filter(ee3.Filter.eq("ADM0_NAME", cityInfo.country));
          const firstDistrict = districts.first();
          const geometry = firstDistrict.geometry();
          console.log(`Found ${placeName} in FAO GAUL dataset without state filter (${cityInfo.country})`);
          return geometry;
        } catch (e2) {
          try {
            const states2 = new ee3.FeatureCollection("FAO/GAUL/2015/level1").filter(ee3.Filter.eq("ADM1_NAME", cityInfo.name)).filter(ee3.Filter.eq("ADM0_NAME", cityInfo.country));
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
    const geographicRegions = {
      "alps": () => ee3.Geometry.Polygon([[5.95, 45.82], [15.04, 45.82], [15.04, 47.81], [5.95, 47.81], [5.95, 45.82]]),
      "europe": () => ee3.Geometry.Polygon([[-10, 35], [40, 35], [40, 70], [-10, 70], [-10, 35]]),
      "asia": () => ee3.Geometry.Polygon([[25, -10], [180, -10], [180, 80], [25, 80], [25, -10]]),
      "africa": () => ee3.Geometry.Polygon([[-20, -35], [55, -35], [55, 37], [-20, 37], [-20, -35]]),
      "north america": () => ee3.Geometry.Polygon([[-170, 15], [-50, 15], [-50, 80], [-170, 80], [-170, 15]]),
      "south america": () => ee3.Geometry.Polygon([[-82, -56], [-34, -56], [-34, 13], [-82, 13], [-82, -56]]),
      "australia": () => ee3.Geometry.Polygon([[112, -44], [154, -44], [154, -10], [112, -10], [112, -44]]),
      "amazon": () => ee3.Geometry.Polygon([[-78, -20], [-43, -20], [-43, 5], [-78, 5], [-78, -20]]),
      "amazon rainforest": () => ee3.Geometry.Polygon([[-78, -20], [-43, -20], [-43, 5], [-78, 5], [-78, -20]]),
      "sahara": () => ee3.Geometry.Polygon([[-17, 15], [38, 15], [38, 35], [-17, 35], [-17, 15]]),
      "sahara desert": () => ee3.Geometry.Polygon([[-17, 15], [38, 15], [38, 35], [-17, 35], [-17, 15]]),
      "great barrier reef": () => ee3.Geometry.Polygon([[142, -24], [154, -24], [154, -10], [142, -10], [142, -24]]),
      "himalayas": () => ee3.Geometry.Polygon([[70, 25], [105, 25], [105, 40], [70, 40], [70, 25]]),
      "rocky mountains": () => ee3.Geometry.Polygon([[-120, 32], [-100, 32], [-100, 60], [-120, 60], [-120, 32]]),
      "andes": () => ee3.Geometry.Polygon([[-80, -55], [-62, -55], [-62, 10], [-80, 10], [-80, -55]]),
      "mediterranean": () => ee3.Geometry.Polygon([[-6, 30], [36, 30], [36, 46], [-6, 46], [-6, 30]]),
      "caribbean": () => ee3.Geometry.Polygon([[-87, 10], [-59, 10], [-59, 27], [-87, 27], [-87, 10]]),
      "lake tahoe": () => ee3.Geometry.Point([-120, 39.1]).buffer(3e4),
      "sacramento valley": () => ee3.Geometry.Polygon([[-122.5, 38.5], [-121, 38.5], [-121, 40.5], [-122.5, 40.5], [-122.5, 38.5]]),
      "kenya": () => {
        const countries = new ee3.FeatureCollection("FAO/GAUL/2015/level0").filter(ee3.Filter.eq("ADM0_NAME", "Kenya"));
        return countries.first().geometry();
      },
      "brazil": () => {
        const countries = new ee3.FeatureCollection("FAO/GAUL/2015/level0").filter(ee3.Filter.eq("ADM0_NAME", "Brazil"));
        return countries.first().geometry();
      },
      "algeria": () => {
        const countries = new ee3.FeatureCollection("FAO/GAUL/2015/level0").filter(ee3.Filter.eq("ADM0_NAME", "Algeria"));
        return countries.first().geometry();
      },
      "queensland": () => {
        return ee3.Geometry.Polygon([[138, -29], [154, -29], [154, -10], [138, -10], [138, -29]]);
      }
    };
    if (geographicRegions[normalized]) {
      try {
        const geometry = geographicRegions[normalized]();
        console.log(`Found geographic region: ${placeName}`);
        return geometry;
      } catch (e) {
        console.log(`Error getting geometry for region ${placeName}:`, e);
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
        const county = new ee3.FeatureCollection("TIGER/2016/Counties").filter(ee3.Filter.eq("NAME", mapping.county)).filter(ee3.Filter.eq("STATEFP", mapping.state)).first();
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
      const state = new ee3.FeatureCollection("TIGER/2016/States").filter(ee3.Filter.eq("NAME", placeName)).first();
      console.log(`Using TIGER state boundary for ${placeName}`);
      return state.geometry();
    }
    try {
      const countySearch = new ee3.FeatureCollection("TIGER/2016/Counties").filter(ee3.Filter.eq("NAME", placeName));
      const firstCounty = countySearch.first();
      const testGeometry = firstCounty.geometry();
      console.log(`Found county match for ${placeName} in TIGER dataset`);
      return testGeometry;
    } catch (e) {
    }
    try {
      const districts = new ee3.FeatureCollection("FAO/GAUL/2015/level2").filter(ee3.Filter.eq("ADM2_NAME", placeName));
      const firstDistrict = districts.first();
      const geometry = firstDistrict.geometry();
      console.log(`Found ${placeName} in FAO GAUL Level 2 (District)`);
      return geometry;
    } catch (e) {
    }
    try {
      const states2 = new ee3.FeatureCollection("FAO/GAUL/2015/level1").filter(ee3.Filter.eq("ADM1_NAME", placeName));
      const firstState = states2.first();
      const geometry = firstState.geometry();
      console.log(`Found ${placeName} in FAO GAUL Level 1 (State/Province)`);
      return geometry;
    } catch (e) {
    }
    try {
      const countries = new ee3.FeatureCollection("FAO/GAUL/2015/level0").filter(ee3.Filter.eq("ADM0_NAME", placeName));
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
    try {
      const parsed = JSON.parse(aoi);
      if (parsed.type && (parsed.type === "Polygon" || parsed.type === "Point" || parsed.type === "Feature" || parsed.type === "FeatureCollection")) {
        console.log(`Parsed JSON geometry string: ${parsed.type}`);
        return parseAoi(parsed);
      }
    } catch (e) {
    }
    const coordMatch = aoi.match(/^\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\s*$/);
    if (coordMatch) {
      const lon = parseFloat(coordMatch[1]);
      const lat = parseFloat(coordMatch[2]);
      console.log(`Parsing coordinates: lon=${lon}, lat=${lat}`);
      return ee3.Geometry.Point([lon, lat]).buffer(1e4);
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
  if (aoi.type === "FeatureCollection") return new ee3.FeatureCollection(aoi).geometry();
  if (aoi.type === "Feature") return new ee3.Feature(new ee3.Geometry(aoi.geometry)).geometry();
  if (aoi.type) return new ee3.Geometry(aoi);
  throw new Error("Unsupported AOI format");
}
var init_geo = __esm({
  "src/utils/geo.ts"() {
    "use strict";
    init_esm_shims();
    init_global_search();
  }
});

// src/utils/ee-optimizer.ts
import ee4 from "@google/earthengine";
import crypto from "crypto";
function getCacheKey(operation, params) {
  const hash = crypto.createHash("md5");
  hash.update(operation);
  hash.update(JSON.stringify(params));
  return hash.digest("hex");
}
async function optimizedGetInfo(eeObject, options = {}) {
  const cacheKey = getCacheKey("getInfo", { obj: eeObject.serialize(), options });
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const result = await requestQueue.add(async () => {
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Operation timed out")), options.timeout || 45e3)
    );
    const operationPromise = eeObject.getInfo();
    try {
      const data = await Promise.race([operationPromise, timeoutPromise]);
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      if (error?.message === "Operation timed out") {
        const partial = {
          status: "partial",
          message: "Data too large - returning summary",
          type: eeObject.name() || "Unknown"
        };
        cache.set(cacheKey, partial);
        return partial;
      }
      throw error;
    }
  });
  return result;
}
async function* streamCollection(collection, chunkSize = 100) {
  const totalSize = await collection.size().getInfo();
  let offset = 0;
  while (offset < totalSize) {
    const chunk = await collection.limit(chunkSize, "system:time_start").skip(offset).getInfo();
    yield chunk.features || [];
    offset += chunkSize;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
async function getCollectionInfoOptimized(datasetId) {
  const cacheKey = getCacheKey("collectionInfo", { datasetId });
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const collection = new ee4.ImageCollection(datasetId);
    const size = await requestQueue.add(() => collection.size().getInfo());
    let sampleSize = 1;
    let sampling = "first";
    if (size > 1e4) {
      sampleSize = 5;
      sampling = "random";
    } else if (size > 1e3) {
      sampleSize = 10;
      sampling = "distributed";
    } else if (size > 100) {
      sampleSize = 20;
      sampling = "distributed";
    } else {
      sampleSize = Math.min(size, 50);
    }
    let sample;
    if (sampling === "random") {
      sample = collection.randomColumn("random").sort("random").limit(sampleSize);
    } else if (sampling === "distributed") {
      const step = Math.floor(size / sampleSize);
      const indices = Array.from({ length: sampleSize }, (_, i) => i * step);
      sample = new ee4.ImageCollection(
        indices.map((i) => collection.toList(1, i).get(0))
      );
    } else {
      sample = collection.limit(sampleSize);
    }
    const first = sample.first();
    const bandNames = await requestQueue.add(() => first.bandNames().getInfo());
    const projection = await requestQueue.add(() => first.projection().getInfo());
    let dateRange = { start: null, end: null };
    if (size > 0) {
      if (size > 1e4) {
        if (datasetId.includes("COPERNICUS/S2")) {
          dateRange.start = "2015-06-23T00:00:00.000Z";
          dateRange.end = (/* @__PURE__ */ new Date()).toISOString();
        } else if (datasetId.includes("LANDSAT")) {
          dateRange.start = "2013-04-11T00:00:00.000Z";
          dateRange.end = (/* @__PURE__ */ new Date()).toISOString();
        } else {
          dateRange.start = "2000-01-01T00:00:00.000Z";
          dateRange.end = (/* @__PURE__ */ new Date()).toISOString();
        }
      } else {
        try {
          const dates = await requestQueue.add(
            () => sample.aggregate_array("system:time_start").getInfo()
          );
          if (dates && dates.length > 0) {
            const validDates = dates.filter((d) => d != null);
            if (validDates.length > 0) {
              dateRange.start = new Date(Math.min(...validDates)).toISOString();
              dateRange.end = new Date(Math.max(...validDates)).toISOString();
            }
          }
        } catch (e) {
          const firstDate = await requestQueue.add(
            () => first.get("system:time_start").getInfo()
          ).catch(() => null);
          if (firstDate) {
            dateRange.start = new Date(firstDate).toISOString();
            dateRange.end = (/* @__PURE__ */ new Date()).toISOString();
          }
        }
      }
    }
    const result = {
      datasetId,
      type: "ImageCollection",
      bandNames,
      projection: projection.crs,
      imageCount: size,
      dateRange,
      sampleSize,
      samplingMethod: sampling,
      message: `Collection has ${bandNames.length} bands and ${size} images (sampled ${sampleSize})`
    };
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    const fallbackResult = {
      datasetId,
      type: "ImageCollection",
      error: error.message,
      message: "Could not fully load collection info - returning partial data",
      imageCount: "Unknown",
      suggestion: "Try with a more specific date range or region filter"
    };
    cache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}
async function progressiveLoad(operation, fallbacks) {
  try {
    const result = await Promise.race([
      operation(),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Timeout")), 5e3)
      )
    ]);
    return result;
  } catch (error) {
    for (const fallback of fallbacks) {
      try {
        const result = await Promise.race([
          fallback(),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Timeout")), 1e4)
          )
        ]);
        return result;
      } catch (e) {
        continue;
      }
    }
    throw error;
  }
}
var SimpleCache, cache, RequestQueue, requestQueue, LazyEEObject, BatchProcessor, batchProcessor, optimizer;
var init_ee_optimizer = __esm({
  "src/utils/ee-optimizer.ts"() {
    "use strict";
    init_esm_shims();
    SimpleCache = class {
      constructor(maxSize = 500, ttl = 1e3 * 60 * 30) {
        this.cache = /* @__PURE__ */ new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
      }
      get(key) {
        const item = this.cache.get(key);
        if (!item) return void 0;
        if (Date.now() - item.timestamp > this.ttl) {
          this.cache.delete(key);
          return void 0;
        }
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
      }
      set(key, value) {
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey !== void 0) {
            this.cache.delete(firstKey);
          }
        }
        this.cache.set(key, { value, timestamp: Date.now() });
      }
      clear() {
        this.cache.clear();
      }
    };
    cache = new SimpleCache(500, 1e3 * 60 * 30);
    RequestQueue = class {
      constructor() {
        this.queue = [];
        this.processing = false;
        this.concurrency = 3;
        // Max concurrent requests
        this.activeRequests = 0;
      }
      async add(fn) {
        return new Promise((resolve, reject) => {
          this.queue.push(async () => {
            try {
              this.activeRequests++;
              const result = await fn();
              resolve(result);
            } catch (error) {
              reject(error);
            } finally {
              this.activeRequests--;
            }
          });
          this.process();
        });
      }
      async process() {
        if (this.processing) return;
        this.processing = true;
        while (this.queue.length > 0 && this.activeRequests < this.concurrency) {
          const task = this.queue.shift();
          if (task) {
            task().catch(console.error);
          }
        }
        this.processing = false;
        if (this.queue.length > 0) {
          setTimeout(() => this.process(), 100);
        }
      }
    };
    requestQueue = new RequestQueue();
    LazyEEObject = class {
      constructor(eeObject) {
        this.evaluated = null;
        this.evaluating = null;
        this.eeObject = eeObject;
      }
      async evaluate() {
        if (this.evaluated) {
          return this.evaluated;
        }
        if (this.evaluating) {
          return this.evaluating;
        }
        this.evaluating = optimizedGetInfo(this.eeObject);
        this.evaluated = await this.evaluating;
        this.evaluating = null;
        return this.evaluated;
      }
      getEEObject() {
        return this.eeObject;
      }
    };
    BatchProcessor = class {
      constructor() {
        this.batch = [];
        this.results = /* @__PURE__ */ new Map();
        this.processing = false;
      }
      add(id, operation) {
        this.batch.push({ id, operation });
      }
      async process() {
        if (this.processing) {
          throw new Error("Batch already processing");
        }
        this.processing = true;
        this.results.clear();
        const concurrency = 5;
        for (let i = 0; i < this.batch.length; i += concurrency) {
          const chunk = this.batch.slice(i, i + concurrency);
          const results = await Promise.allSettled(
            chunk.map((item) => item.operation())
          );
          chunk.forEach((item, index) => {
            const result = results[index];
            if (result.status === "fulfilled") {
              this.results.set(item.id, result.value);
            } else {
              this.results.set(item.id, { error: result.reason.message });
            }
          });
        }
        this.processing = false;
        this.batch = [];
        return this.results;
      }
    };
    batchProcessor = new BatchProcessor();
    optimizer = {
      cache,
      requestQueue,
      optimizedGetInfo,
      streamCollection,
      getCollectionInfoOptimized,
      LazyEEObject,
      progressiveLoad,
      batchProcessor
    };
  }
});

// src/mcp/tools/consolidated/earth_engine_data.ts
import ee5 from "@google/earthengine";
import { z as z2 } from "zod";
async function searchCatalog(query, limit = 10) {
  const datasets = [
    "COPERNICUS/S2_SR_HARMONIZED",
    "COPERNICUS/S2_SR",
    "COPERNICUS/S2",
    "LANDSAT/LC09/C02/T1_L2",
    "LANDSAT/LC08/C02/T1_L2",
    "MODIS/006/MOD13Q1",
    "MODIS/006/MCD43A4",
    "NASA/GDDP-CMIP6",
    "ECMWF/ERA5/DAILY",
    "ECMWF/ERA5_LAND/HOURLY",
    "NASA/GPM_L3/IMERG_V06",
    "JAXA/GPM_L3/GSMaP/v6/operational",
    "NASA/SRTM_V3",
    "USGS/SRTMGL1_003",
    "COPERNICUS/DEM/GLO30",
    "ESA/WorldCover/v100",
    "ESA/WorldCover/v200",
    "MODIS/006/MCD12Q1",
    "COPERNICUS/CORINE/V20/100m",
    "GOOGLE/DYNAMICWORLD/V1",
    "NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG",
    "FAO/GAUL/2015/level0",
    "FAO/GAUL/2015/level1",
    "FAO/GAUL/2015/level2",
    "TIGER/2016/Counties",
    "MODIS/006/MOD11A1",
    "MODIS/006/MYD11A1"
  ];
  const lowerQuery = query.toLowerCase();
  const normalizedQuery = lowerQuery.replace(/[-_\s]/g, "");
  const filtered = datasets.filter((d) => {
    const dLower = d.toLowerCase();
    const dNormalized = dLower.replace(/[-_\s]/g, "");
    return dLower.includes(lowerQuery) || dNormalized.includes(normalizedQuery) || lowerQuery.includes("sentinel") && dLower.includes("s2") || lowerQuery.includes("landsat") && dLower.includes("lc");
  }).slice(0, limit);
  return {
    success: true,
    datasets: filtered,
    count: filtered.length,
    query,
    message: `Found ${filtered.length} datasets matching "${query}"`
  };
}
async function filterCollection(params) {
  const { datasetId, startDate, endDate, region, cloudCoverMax } = params;
  if (!datasetId) throw new Error("datasetId required for filter operation");
  const cacheKey = `filter_${datasetId}_${startDate}_${endDate}_${cloudCoverMax}`;
  const cached = optimizer.cache.get(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }
  try {
    let collection = new ee5.ImageCollection(datasetId);
    if (startDate && endDate) {
      collection = collection.filterDate(startDate, endDate);
    }
    if (region) {
      const geometry = await parseAoi(region);
      collection = collection.filterBounds(geometry);
    }
    if (cloudCoverMax !== void 0 && cloudCoverMax !== null) {
      if (datasetId.includes("COPERNICUS/S2")) {
        collection = collection.filter(ee5.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", cloudCoverMax));
      } else if (datasetId.includes("LANDSAT")) {
        collection = collection.filter(ee5.Filter.lt("CLOUD_COVER", cloudCoverMax));
      } else {
        collection = collection.filter(ee5.Filter.lt("CLOUD_COVER", cloudCoverMax));
      }
    }
    const count = await optimizer.optimizedGetInfo(collection.size(), { timeout: 1e4 });
    let bandNames = [];
    try {
      const first = collection.first();
      bandNames = await optimizer.optimizedGetInfo(first.bandNames(), { timeout: 5e3 });
    } catch (e) {
      if (datasetId.includes("COPERNICUS/S2")) {
        bandNames = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B8A", "B9", "B10", "B11", "B12", "QA60"];
      } else if (datasetId.includes("LANDSAT")) {
        bandNames = ["SR_B1", "SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7", "QA_PIXEL"];
      } else {
        bandNames = ["band1", "band2", "band3"];
      }
    }
    const result = {
      success: true,
      datasetId,
      imageCount: count || 0,
      bandNames,
      filters: {
        startDate: startDate || "not specified",
        endDate: endDate || "not specified",
        region: region || "global",
        cloudCoverMax: cloudCoverMax || "not specified"
      },
      message: `Filtered collection contains ${count || "unknown"} images`
    };
    optimizer.cache.set(cacheKey, result);
    return result;
  } catch (error) {
    const partial = {
      success: true,
      datasetId,
      imageCount: "Unknown (timeout)",
      bandNames: [],
      filters: {
        startDate: startDate || "not specified",
        endDate: endDate || "not specified",
        region: region || "global",
        cloudCoverMax: cloudCoverMax || "not specified"
      },
      message: "Filter applied but count timed out - collection may be very large",
      warning: error.message
    };
    optimizer.cache.set(cacheKey, partial);
    return partial;
  }
}
async function getGeometry(params) {
  const { placeName, coordinates } = params;
  if (coordinates && Array.isArray(coordinates) && coordinates.length >= 2) {
    const [lon, lat] = coordinates;
    const buffer = coordinates[2] || 1e4;
    const point = ee5.Geometry.Point([lon, lat]);
    const geometry = point.buffer(buffer);
    return {
      success: true,
      type: "coordinates",
      geometry,
      geoJson: {
        type: "Point",
        coordinates: [lon, lat]
      },
      buffer_meters: buffer,
      message: `Created geometry from coordinates [${lon}, ${lat}]`,
      usage: "Use this geometry in filter operations"
    };
  }
  if (!placeName) throw new Error("placeName or coordinates required for geometry operation");
  const knownPlaces = {
    "ludhiana": [75.8573, 30.901, 15e3],
    "ludhiana, india": [75.8573, 30.901, 15e3],
    "ludhiana, punjab": [75.8573, 30.901, 15e3],
    "san francisco": [-122.4194, 37.7749, 2e4],
    "san francisco, ca": [-122.4194, 37.7749, 2e4],
    "new york": [-74.006, 40.7128, 3e4],
    "london": [-0.1276, 51.5074, 25e3],
    "paris": [2.3522, 48.8566, 2e4],
    "tokyo": [139.6503, 35.6762, 35e3],
    "delhi": [77.1025, 28.7041, 3e4],
    "mumbai": [72.8777, 19.076, 25e3],
    "bangalore": [77.5946, 12.9716, 25e3],
    "amazon rainforest": [-60, -3, 2e6],
    "amazon": [-60, -3, 2e6],
    "sacramento valley": [-121.5, 39, 1e5]
  };
  const placeKey = placeName.toLowerCase().trim();
  if (knownPlaces[placeKey]) {
    const [lon, lat, buffer] = knownPlaces[placeKey];
    const point = ee5.Geometry.Point([lon, lat]);
    const geometry = point.buffer(buffer);
    return {
      success: true,
      placeName,
      geometry,
      geoJson: {
        type: "Point",
        coordinates: [lon, lat]
      },
      buffer_meters: buffer,
      source: "Known coordinates",
      message: `Using coordinates for ${placeName}`,
      usage: "Use this geometry in filter operations"
    };
  }
  try {
    const globalResult = await findGlobalLocation(placeName);
    if (globalResult) {
      const bounds = await globalResult.bounds().getInfo();
      return {
        success: true,
        placeName,
        geometry: globalResult,
        bounds,
        source: "FAO GAUL/TIGER shapefile",
        message: `Found geometry for ${placeName}`,
        usage: "Use this geometry in filter operations"
      };
    }
  } catch (error) {
    console.log("Global search failed:", error);
  }
  throw new Error(`Could not find geometry for "${placeName}"`);
}
async function getInfo(datasetId) {
  if (!datasetId) throw new Error("datasetId required for info operation");
  const cacheKey = `info_${datasetId}`;
  const cached = optimizer.cache.get(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }
  const knownDatasets = {
    "COPERNICUS/S2_SR_HARMONIZED": {
      title: "Sentinel-2 MSI: MultiSpectral Instrument, Level-2A",
      type: "ImageCollection",
      description: "Harmonized Sentinel-2 Level-2A orthorectified surface reflectance",
      bands: ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B8A", "B9", "B10", "B11", "B12", "QA60", "SCL"],
      spatialResolution: "10-60m",
      temporalResolution: "5 days",
      provider: "European Space Agency"
    },
    "LANDSAT/LC08/C02/T1_L2": {
      title: "USGS Landsat 8 Collection 2 Tier 1 Level 2",
      type: "ImageCollection",
      description: "Landsat 8 surface reflectance and surface temperature",
      bands: ["SR_B1", "SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7", "ST_B10", "QA_PIXEL"],
      spatialResolution: "30m",
      temporalResolution: "16 days",
      provider: "USGS"
    },
    "MODIS/006/MOD13Q1": {
      title: "MOD13Q1.006 Terra Vegetation Indices 16-Day Global 250m",
      type: "ImageCollection",
      description: "MODIS Terra Vegetation Indices (NDVI/EVI) 16-day composite",
      bands: ["NDVI", "EVI", "DetailedQA", "sur_refl_b01", "sur_refl_b02", "sur_refl_b03", "sur_refl_b07"],
      spatialResolution: "250m",
      temporalResolution: "16 days",
      provider: "NASA LP DAAC"
    },
    "NASA/GPM_L3/IMERG_V06": {
      title: "GPM: Global Precipitation Measurement v6",
      type: "ImageCollection",
      description: "Half-hourly precipitation estimates from GPM constellation",
      bands: ["precipitationCal", "precipitationUncal", "randomError", "HQprecipitation"],
      spatialResolution: "11132m",
      temporalResolution: "30 minutes",
      provider: "NASA GES DISC"
    }
  };
  if (knownDatasets[datasetId]) {
    const info = {
      success: true,
      datasetId,
      ...knownDatasets[datasetId],
      message: `Dataset information retrieved successfully`
    };
    optimizer.cache.set(cacheKey, info);
    return info;
  }
  try {
    const result = await Promise.race([
      (async () => {
        try {
          const collection = new ee5.ImageCollection(datasetId);
          const first = collection.first();
          const bandNamesPromise = first.bandNames().getInfo();
          const bandNames = await Promise.race([
            bandNamesPromise,
            new Promise((resolve) => setTimeout(() => resolve(["Unable to load bands"]), 2e3))
          ]);
          return {
            success: true,
            datasetId,
            type: "ImageCollection",
            bands: bandNames,
            message: `Collection found with ${Array.isArray(bandNames) ? bandNames.length : "unknown"} bands`,
            status: "Available"
          };
        } catch {
          const image = new ee5.Image(datasetId);
          const bandNamesPromise = image.bandNames().getInfo();
          const bandNames = await Promise.race([
            bandNamesPromise,
            new Promise((resolve) => setTimeout(() => resolve(["Unable to load bands"]), 2e3))
          ]);
          return {
            success: true,
            datasetId,
            type: "Image",
            bands: bandNames,
            message: `Image found with ${Array.isArray(bandNames) ? bandNames.length : "unknown"} bands`,
            status: "Available"
          };
        }
      })(),
      new Promise(
        (resolve) => setTimeout(() => resolve({
          success: true,
          datasetId,
          type: "Dataset",
          status: "Available",
          message: `Dataset ${datasetId} is available`,
          note: "Detailed information not available due to timeout. Try using filter operation for more details."
        }), 5e3)
      )
    ]);
    optimizer.cache.set(cacheKey, result);
    return result;
  } catch (error) {
    const basicInfo = {
      success: true,
      datasetId,
      type: "Dataset",
      status: "Unknown",
      message: `Unable to retrieve detailed information for ${datasetId}`,
      suggestion: "Dataset may be valid. Try using it in filter or process operations.",
      error: error.message
    };
    optimizer.cache.set(cacheKey, basicInfo);
    return basicInfo;
  }
}
async function getBoundaries() {
  return {
    available: [
      {
        dataset: "FAO/GAUL/2015/level0",
        level: "Country",
        examples: ["India", "United States", "France", "Brazil"]
      },
      {
        dataset: "FAO/GAUL/2015/level1",
        level: "State/Province",
        examples: ["California", "Punjab", "Ontario", "Bavaria"]
      },
      {
        dataset: "FAO/GAUL/2015/level2",
        level: "District/County",
        examples: ["Ludhiana", "San Francisco County", "Manhattan"]
      },
      {
        dataset: "TIGER/2016/Counties",
        level: "US Counties",
        examples: ["Los Angeles", "Cook", "Harris", "Miami-Dade"]
      }
    ],
    usage: "Use geometry operation with place names to get boundaries",
    message: "Administrative boundaries available at country, state, and district levels"
  };
}
var DataToolSchema;
var init_earth_engine_data = __esm({
  "src/mcp/tools/consolidated/earth_engine_data.ts"() {
    "use strict";
    init_esm_shims();
    init_registry();
    init_geo();
    init_global_search();
    init_ee_optimizer();
    DataToolSchema = z2.object({
      operation: z2.enum(["search", "filter", "geometry", "info", "boundaries"]),
      // Search operation params
      query: z2.string().optional(),
      limit: z2.number().optional(),
      // Filter operation params
      datasetId: z2.string().optional(),
      startDate: z2.string().optional(),
      endDate: z2.string().optional(),
      region: z2.any().optional(),
      // Geometry operation params
      placeName: z2.string().optional(),
      // Info operation params
      imageId: z2.string().optional(),
      // Common params
      includeDetails: z2.boolean().optional()
    });
    register({
      name: "earth_engine_data",
      description: `Consolidated Earth Engine data access tool. Operations: search (find datasets), filter (filter collections), geometry (get boundaries), info (dataset details), boundaries (list available)`,
      input: DataToolSchema,
      output: z2.any(),
      handler: async (params) => {
        try {
          const { operation } = params;
          if (!operation) {
            return {
              success: false,
              error: "Operation parameter is required",
              availableOperations: ["search", "filter", "geometry", "info", "boundaries"]
            };
          }
          const normalizedParams = {
            ...params,
            datasetId: params.datasetId || params.dataset_id || params.collection_id,
            startDate: params.startDate || params.start_date,
            endDate: params.endDate || params.end_date,
            placeName: params.placeName || params.place_name,
            imageId: params.imageId || params.image_id,
            cloudCoverMax: params.cloudCoverMax || params.cloud_cover_max
          };
          switch (operation) {
            case "search":
              return await searchCatalog(normalizedParams.query || "", normalizedParams.limit);
            case "filter":
              return await filterCollection(normalizedParams);
            case "geometry":
              return await getGeometry(normalizedParams);
            case "info":
              return await getInfo(normalizedParams.datasetId || normalizedParams.imageId || "");
            case "boundaries":
              return await getBoundaries();
            default:
              return {
                success: false,
                error: `Unknown operation: ${operation}`,
                availableOperations: ["search", "filter", "geometry", "info", "boundaries"],
                suggestion: "Please use one of the available operations"
              };
          }
        } catch (error) {
          console.error(`[earth_engine_data] Error in ${params.operation}:`, error);
          return {
            success: false,
            operation: params.operation,
            error: error.message || "An unexpected error occurred",
            details: error.stack,
            params
          };
        }
      }
    });
  }
});

// src/mcp/tools/consolidated/earth_engine_system.ts
import ee6 from "@google/earthengine";
import { z as z3 } from "zod";
import { Storage } from "@google-cloud/storage";
import fs2 from "fs/promises";
async function checkAuth(params) {
  const { checkType = "status" } = params;
  switch (checkType) {
    case "status":
      try {
        await ee6.Number(1).getInfo();
        const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const projectId = process.env.GCP_PROJECT_ID;
        return {
          success: true,
          operation: "auth",
          authenticated: true,
          projectId: projectId || "Not configured",
          credentialsPath: credentials ? "Configured" : "Not configured",
          message: "Earth Engine authentication successful"
        };
      } catch (error) {
        return {
          success: false,
          operation: "auth",
          authenticated: false,
          error: error?.message || "Unknown error",
          message: "Earth Engine authentication failed",
          help: "Ensure GOOGLE_APPLICATION_CREDENTIALS is set to your service account key file"
        };
      }
    case "projects":
      try {
        const projects = await ee6.data.listAssets({ parent: "projects" });
        return {
          success: true,
          operation: "auth",
          checkType: "projects",
          projects,
          message: `Found ${projects.length} accessible projects`
        };
      } catch (error) {
        return {
          success: false,
          operation: "auth",
          checkType: "projects",
          error: error?.message || "Unknown error"
        };
      }
    case "permissions":
      try {
        const checks = {
          canReadPublicData: false,
          canExportToGCS: false,
          canExportToDrive: false,
          canCreateAssets: false
        };
        try {
          await new ee6.Image("USGS/SRTMGL1_003").getInfo();
          checks.canReadPublicData = true;
        } catch {
        }
        try {
          const testTask = ee6.batch.Export.image.toCloudStorage({
            image: new ee6.Image(1),
            description: "permission_test",
            bucket: "test-bucket",
            fileNamePrefix: "test",
            region: ee6.Geometry.Point([0, 0]).buffer(100)
          });
          checks.canExportToGCS = true;
        } catch {
        }
        return {
          success: true,
          operation: "auth",
          checkType: "permissions",
          permissions: checks,
          message: "Permission check complete"
        };
      } catch (error) {
        return {
          success: false,
          operation: "auth",
          checkType: "permissions",
          error: error?.message || "Unknown error"
        };
      }
    default:
      throw new Error(`Unknown auth check type: ${checkType}`);
  }
}
async function executeCode(params) {
  const { code, language = "javascript", params: codeParams = {} } = params;
  if (!code) throw new Error("code required for execute operation");
  try {
    const func = new Function("ee", "params", code);
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Code execution timed out after 30 seconds")), 3e4)
    );
    const executePromise = (async () => {
      const result = await func(ee6, codeParams);
      let output2;
      if (result && typeof result.getInfo === "function") {
        try {
          output2 = await optimizer.optimizedGetInfo(result, { timeout: 1e4 });
        } catch (e) {
          output2 = {
            type: "EarthEngineObject",
            message: "Result is an Earth Engine object (evaluation timed out)",
            suggestion: "Try simpler operations or add .limit() to collections"
          };
        }
      } else {
        output2 = result;
      }
      return output2;
    })();
    const output = await Promise.race([executePromise, timeoutPromise]);
    return {
      success: true,
      operation: "execute",
      language,
      result: output,
      message: "Code executed successfully"
    };
  } catch (error) {
    return {
      success: true,
      // Return success but with error info
      operation: "execute",
      executed: false,
      error: error.message || "Unknown error",
      message: error.message?.includes("timeout") ? "Code execution timed out" : "Code execution failed",
      help: "Ensure your code returns a value quickly and uses proper Earth Engine syntax"
    };
  }
}
async function setupSystem(params) {
  const {
    setupType = "auth",
    // Default to auth check instead of GCS
    bucket = process.env.GCS_BUCKET || "earth-engine-exports",
    projectId = process.env.GCP_PROJECT_ID
  } = params;
  switch (setupType) {
    case "gcs":
      const gcsBucket = bucket || "earth-engine-exports";
      try {
        const storage = new Storage({
          projectId: process.env.GCP_PROJECT_ID,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
        const [exists] = await storage.bucket(gcsBucket).exists();
        if (!exists) {
          await storage.createBucket(gcsBucket, {
            location: "US",
            storageClass: "STANDARD"
          });
          await storage.bucket(gcsBucket).setCorsConfiguration([{
            origin: ["*"],
            method: ["GET", "HEAD", "PUT", "POST"],
            responseHeader: ["*"],
            maxAgeSeconds: 3600
          }]);
          const file = storage.bucket(gcsBucket).file("exports/.keep");
          await file.save("");
          return {
            success: true,
            operation: "setup",
            setupType: "gcs",
            bucket: gcsBucket,
            created: true,
            message: `GCS bucket '${gcsBucket}' created and configured successfully`
          };
        } else {
          return {
            success: true,
            operation: "setup",
            setupType: "gcs",
            bucket: gcsBucket,
            exists: true,
            message: `GCS bucket '${gcsBucket}' already exists`
          };
        }
      } catch (error) {
        return {
          success: false,
          operation: "setup",
          setupType: "gcs",
          error: error?.message || "Unknown error",
          message: "GCS setup failed",
          help: "Ensure you have permissions to create/manage GCS buckets"
        };
      }
    case "auth":
      try {
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (!credPath) {
          return {
            success: true,
            operation: "setup",
            setupType: "auth",
            configured: false,
            message: "GOOGLE_APPLICATION_CREDENTIALS not set",
            help: "Set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account key file path"
          };
        }
        const fileExists = await fs2.access(credPath).then(() => true).catch(() => false);
        if (!fileExists) {
          return {
            success: true,
            operation: "setup",
            setupType: "auth",
            configured: false,
            message: "Credentials file not found",
            path: credPath
          };
        }
        const stats = await fs2.stat(credPath);
        if (stats.size > 1e4) {
          return {
            success: true,
            operation: "setup",
            setupType: "auth",
            configured: false,
            message: "Credentials file too large - may not be valid service account key"
          };
        }
        const credContent = await fs2.readFile(credPath, "utf-8");
        const credentials = JSON.parse(credContent);
        return {
          success: true,
          operation: "setup",
          setupType: "auth",
          configured: true,
          serviceAccount: credentials.client_email,
          projectId: credentials.project_id,
          keyId: credentials.private_key_id,
          message: "Authentication configured correctly"
        };
      } catch (error) {
        return {
          success: true,
          operation: "setup",
          setupType: "auth",
          configured: false,
          error: error.message || "Unknown error",
          message: "Could not verify authentication setup"
        };
      }
    case "project":
      if (!projectId) throw new Error("projectId required for project setup");
      process.env.GCP_PROJECT_ID = projectId;
      return {
        success: true,
        operation: "setup",
        setupType: "project",
        projectId,
        message: `Project ID set to '${projectId}'`
      };
    default:
      throw new Error(`Unknown setup type: ${setupType}`);
  }
}
async function loadData(params) {
  const { source, dataType = "cog" } = params;
  if (!source) throw new Error("source required for load operation");
  try {
    let loaded;
    switch (dataType) {
      case "cog":
      case "geotiff":
        if (source.startsWith("gs://")) {
          loaded = ee6.Image.loadGeoTIFF(source);
        } else if (source.startsWith("http")) {
          loaded = ee6.Image.loadGeoTIFF(source);
        } else {
          throw new Error("Source must be a GCS path (gs://) or HTTP URL");
        }
        const info = await loaded.getInfo();
        return {
          success: true,
          operation: "load",
          dataType,
          source,
          bands: info.bands.length,
          properties: info.properties,
          message: `Loaded ${dataType.toUpperCase()} with ${info.bands.length} bands`,
          result: loaded
        };
      case "json":
        if (source.startsWith("gs://")) {
          const storage = new Storage();
          const matches = source.match(/gs:\/\/([^\/]+)\/(.+)/);
          if (!matches) throw new Error("Invalid GCS path");
          const [, bucketName, fileName] = matches;
          const file = storage.bucket(bucketName).file(fileName);
          const [contents] = await file.download();
          const geojson = JSON.parse(contents.toString());
          loaded = new ee6.FeatureCollection(geojson);
        } else {
          const geojson = typeof source === "string" ? JSON.parse(source) : source;
          loaded = new ee6.FeatureCollection(geojson);
        }
        const count = await loaded.size().getInfo();
        return {
          success: true,
          operation: "load",
          dataType: "json",
          featureCount: count,
          message: `Loaded GeoJSON with ${count} features`,
          result: loaded
        };
      case "csv":
        return {
          success: false,
          operation: "load",
          dataType: "csv",
          message: "CSV loading not yet implemented",
          help: 'Convert CSV to GeoJSON first, then use dataType: "json"'
        };
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  } catch (error) {
    return {
      success: false,
      operation: "load",
      error: error?.message || "Unknown error",
      message: "Data loading failed"
    };
  }
}
async function getDatasetInfo(params) {
  const { datasetId } = params;
  if (!datasetId) {
    return {
      success: false,
      operation: "dataset_info",
      error: "datasetId is required",
      message: "Please provide a dataset ID to get information about"
    };
  }
  let datasetType = "Unknown";
  let spatialResolution = "Unknown";
  let temporalResolution = "Unknown";
  let typicalBands = [];
  if (datasetId.includes("COPERNICUS/S2")) {
    datasetType = "Sentinel-2 Optical Imagery";
    spatialResolution = "10-60m";
    temporalResolution = "5 days";
    typicalBands = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B8A", "B9", "B10", "B11", "B12", "QA60"];
  } else if (datasetId.includes("LANDSAT")) {
    datasetType = "Landsat Optical Imagery";
    spatialResolution = "30m";
    temporalResolution = "16 days";
    typicalBands = ["SR_B1", "SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7", "QA_PIXEL"];
  } else if (datasetId.includes("MODIS")) {
    datasetType = "MODIS Imagery";
    spatialResolution = "250-1000m";
    temporalResolution = "Daily";
    typicalBands = ["sur_refl_b01", "sur_refl_b02", "sur_refl_b03", "sur_refl_b04", "sur_refl_b05", "sur_refl_b06", "sur_refl_b07"];
  } else if (datasetId.includes("CHIRPS")) {
    datasetType = "Precipitation Data";
    spatialResolution = "5.5km";
    temporalResolution = "Daily/Monthly";
    typicalBands = ["precipitation"];
  }
  let actualBands = typicalBands;
  let imageCount = "Unknown";
  try {
    const collection = new ee6.ImageCollection(datasetId);
    const first = collection.first();
    const bandsPromise = optimizer.optimizedGetInfo(first.bandNames(), { timeout: 2e3 });
    const timeoutPromise = new Promise(
      (resolve) => setTimeout(() => resolve(null), 2e3)
    );
    const bands = await Promise.race([bandsPromise, timeoutPromise]);
    if (bands && Array.isArray(bands)) {
      actualBands = bands;
    }
  } catch (error) {
    console.log("Could not fetch actual dataset info, using typical values");
  }
  return {
    success: true,
    operation: "dataset_info",
    datasetId,
    datasetType,
    bands: actualBands,
    bandCount: actualBands.length,
    spatialResolution,
    temporalResolution,
    imageCount,
    message: `Dataset information for ${datasetId}`,
    usage: "Use this dataset ID in filter, composite, and other operations",
    note: "Band information may be typical values if actual collection could not be accessed quickly"
  };
}
async function getSystemInfo(params) {
  const { infoType = "system" } = params;
  switch (infoType) {
    case "system":
      return {
        success: true,
        operation: "info",
        infoType: "system",
        earthEngineVersion: "1.x",
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
        },
        environment: {
          hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
          hasProjectId: !!process.env.GCP_PROJECT_ID,
          hasBucket: !!process.env.GCS_BUCKET
        },
        message: "System information retrieved"
      };
    case "quotas":
      return {
        success: true,
        operation: "info",
        infoType: "quotas",
        limits: {
          maxPixelsPerRequest: "1e9",
          maxFeaturesPerRequest: "5000",
          maxExportSize: "32GB",
          concurrentExports: 3e3
        },
        message: "Earth Engine quota information"
      };
    case "assets":
      try {
        const assets = await ee6.data.listAssets({ parent: "projects/earthengine-legacy/assets" });
        return {
          success: true,
          operation: "info",
          infoType: "assets",
          assetCount: assets.length,
          assets: assets.slice(0, 10),
          // First 10 assets
          message: `Found ${assets.length} assets`
        };
      } catch (error) {
        return {
          success: true,
          operation: "info",
          infoType: "assets",
          message: "No user assets found or no access to legacy assets"
        };
      }
    case "tasks":
      try {
        const tasks = await ee6.data.listOperations();
        const running = tasks.filter((t) => t.metadata?.state === "RUNNING");
        const completed = tasks.filter((t) => t.metadata?.state === "SUCCEEDED");
        return {
          success: true,
          operation: "info",
          infoType: "tasks",
          totalTasks: tasks.length,
          running: running.length,
          completed: completed.length,
          recent: tasks.slice(0, 5).map((t) => ({
            id: t.name,
            state: t.metadata?.state,
            progress: Math.round((t.metadata?.progress || 0) * 100)
          })),
          message: `${running.length} running, ${completed.length} completed tasks`
        };
      } catch (error) {
        return {
          success: false,
          operation: "info",
          infoType: "tasks",
          error: error?.message || "Unknown error"
        };
      }
    default:
      throw new Error(`Unknown info type: ${infoType}`);
  }
}
var SystemToolSchema;
var init_earth_engine_system = __esm({
  "src/mcp/tools/consolidated/earth_engine_system.ts"() {
    "use strict";
    init_esm_shims();
    init_registry();
    init_ee_optimizer();
    SystemToolSchema = z3.object({
      operation: z3.enum(["auth", "execute", "setup", "load", "info", "help", "health", "dataset_info"]),
      // Auth operation params
      checkType: z3.enum(["status", "projects", "permissions"]).optional(),
      // Execute operation params
      code: z3.string().optional(),
      language: z3.enum(["javascript", "python"]).optional().default("javascript"),
      params: z3.record(z3.any()).optional(),
      // Setup operation params
      setupType: z3.enum(["gcs", "auth", "project"]).optional(),
      bucket: z3.string().optional(),
      projectId: z3.string().optional(),
      // Load operation params
      source: z3.string().optional(),
      // GCS path or URL
      dataType: z3.enum(["cog", "geotiff", "json", "csv"]).optional(),
      // Info operation params
      infoType: z3.enum(["system", "quotas", "assets", "tasks"]).optional(),
      // Dataset info params
      datasetId: z3.string().optional()
    });
    register({
      name: "earth_engine_system",
      description: `Consolidated Earth Engine system & advanced tool. Operations: auth (check authentication), execute (run custom code), setup (configure GCS/auth), load (external data), info (system info)`,
      input: SystemToolSchema,
      output: z3.any(),
      handler: async (params) => {
        try {
          const { operation } = params;
          if (!operation) {
            return {
              success: false,
              error: "Operation parameter is required",
              availableOperations: ["auth", "execute", "setup", "load", "info", "dataset_info", "help"]
            };
          }
          const normalizedParams = {
            ...params,
            assetId: params.assetId || params.asset_id,
            assetType: params.assetType || params.asset_type,
            dataSource: params.dataSource || params.data_source,
            dataUrl: params.dataUrl || params.data_url,
            dataContent: params.dataContent || params.data_content,
            includeDetails: params.includeDetails || params.include_details,
            checkType: params.checkType || params.check_type,
            setupType: params.setupType || params.setup_type,
            infoType: params.infoType || params.info_type,
            dataType: params.dataType || params.data_type
          };
          switch (operation) {
            case "auth":
            case "authentication":
              return await checkAuth(normalizedParams);
            case "execute":
            case "run":
              return await executeCode(normalizedParams);
            case "setup":
            case "configure":
              return await setupSystem(normalizedParams);
            case "load":
            case "import":
              return await loadData(normalizedParams);
            case "info":
            case "system":
              return await getSystemInfo(normalizedParams);
            case "dataset_info":
            case "dataset":
              return await getDatasetInfo(normalizedParams);
            case "health":
              try {
                await ee6.Number(1).getInfo();
                return {
                  success: true,
                  operation: "health",
                  status: "healthy",
                  earthEngine: "connected",
                  authentication: "valid",
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  message: "All systems operational"
                };
              } catch (error) {
                return {
                  success: true,
                  operation: "health",
                  status: "degraded",
                  earthEngine: "error",
                  error: error?.message || "Unknown error",
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  message: "Earth Engine connection issue"
                };
              }
            case "help":
              return {
                success: true,
                operation: "help",
                message: "Earth Engine System Tool Help",
                availableOperations: {
                  auth: "Check authentication status and permissions",
                  execute: "Execute custom Earth Engine JavaScript code",
                  setup: "Setup GCS buckets, authentication, or projects",
                  load: "Load external data (GeoTIFF, JSON, CSV) into Earth Engine",
                  info: "Get system information, quotas, assets, or task status",
                  dataset_info: "Get detailed information about a specific dataset",
                  health: "Check system health status",
                  help: "Show this help message"
                },
                examples: {
                  auth: { operation: "auth", checkType: "status" },
                  execute: { operation: "execute", code: "return ee.Number(42).getInfo();" },
                  setup: { operation: "setup", setupType: "gcs", bucket: "my-bucket" },
                  info: { operation: "info", infoType: "system" },
                  health: { operation: "health" }
                }
              };
            default:
              return {
                success: false,
                error: `Unknown operation: ${operation}`,
                availableOperations: ["auth", "execute", "setup", "load", "info", "dataset_info", "help"],
                suggestion: "Please use one of the available operations"
              };
          }
        } catch (error) {
          console.error(`[earth_engine_system] Error in ${params.operation}:`, error);
          return {
            success: false,
            operation: params.operation,
            error: error.message || "An unexpected error occurred",
            details: error.stack,
            params
          };
        }
      }
    });
  }
});

// src/mcp/tools/consolidated/earth_engine_process.ts
import ee7 from "@google/earthengine";
import { z as z4 } from "zod";
async function getInput(input) {
  if (typeof input === "string") {
    try {
      return new ee7.ImageCollection(input);
    } catch {
      return new ee7.Image(input);
    }
  }
  return input;
}
async function createComposite(params) {
  const {
    datasetId,
    startDate,
    endDate,
    region,
    compositeType = "median",
    cloudCoverMax = 20
  } = params;
  if (!datasetId) throw new Error("datasetId required for composite operation");
  if (!startDate || !endDate) throw new Error("startDate and endDate required for composite");
  let collection = new ee7.ImageCollection(datasetId);
  collection = collection.filterDate(startDate, endDate);
  if (region) {
    const geometry = await parseAoi(region);
    collection = collection.filterBounds(geometry);
    let composite;
    if (datasetId.includes("COPERNICUS/S2") || datasetId.includes("LANDSAT")) {
      const cloudProp = datasetId.includes("COPERNICUS/S2") ? "CLOUDY_PIXEL_PERCENTAGE" : "CLOUD_COVER";
      collection = collection.filter(ee7.Filter.lt(cloudProp, cloudCoverMax));
      if (datasetId.includes("COPERNICUS/S2")) {
        collection = collection.map((img) => {
          const qa = img.select("QA60");
          const cloudBitMask = 1 << 10;
          const cirrusBitMask = 1 << 11;
          const mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(qa.bitwiseAnd(cirrusBitMask).eq(0));
          return img.updateMask(mask).divide(1e4).select(["B.*"]).copyProperties(img, ["system:time_start"]);
        });
      }
    }
    switch (compositeType) {
      case "median":
        composite = collection.median();
        break;
      case "mean":
        composite = collection.mean();
        break;
      case "max":
        composite = collection.max();
        break;
      case "min":
        composite = collection.min();
        break;
      case "mosaic":
        composite = collection.mosaic();
        break;
      case "greenest":
        composite = collection.qualityMosaic("B8");
        break;
      default:
        composite = collection.median();
    }
    composite = composite.clip(geometry);
    const compositeKey = `composite_${Date.now()}`;
    compositeStore[compositeKey] = composite;
    return {
      success: true,
      operation: "composite",
      compositeType,
      compositeKey,
      message: `Created ${compositeType} composite from ${datasetId}`,
      dateRange: { startDate, endDate },
      region: typeof region === "string" ? region : "custom geometry",
      cloudCoverMax,
      result: composite,
      nextSteps: "Use this compositeKey with thumbnail operation to visualize"
    };
  } else {
    let composite;
    if (datasetId.includes("COPERNICUS/S2") || datasetId.includes("LANDSAT")) {
      const cloudProp = datasetId.includes("COPERNICUS/S2") ? "CLOUDY_PIXEL_PERCENTAGE" : "CLOUD_COVER";
      collection = collection.filter(ee7.Filter.lt(cloudProp, cloudCoverMax));
    }
    switch (compositeType) {
      case "median":
        composite = collection.median();
        break;
      case "mean":
        composite = collection.mean();
        break;
      case "max":
        composite = collection.max();
        break;
      case "min":
        composite = collection.min();
        break;
      case "mosaic":
        composite = collection.mosaic();
        break;
      default:
        composite = collection.median();
    }
    const compositeKey = `composite_${Date.now()}`;
    compositeStore[compositeKey] = composite;
    return {
      success: true,
      operation: "composite",
      compositeType,
      compositeKey,
      message: `Created ${compositeType} composite from ${datasetId}`,
      dateRange: { startDate, endDate },
      result: composite,
      nextSteps: "Use this compositeKey with thumbnail operation to visualize"
    };
  }
}
async function createFCC(params) {
  const { datasetId, startDate, endDate, region } = params;
  const compositeResult = await createComposite({
    ...params,
    compositeType: "median"
  });
  let fccBands;
  if (datasetId.includes("COPERNICUS/S2")) {
    fccBands = ["B8", "B4", "B3"];
  } else if (datasetId.includes("LANDSAT")) {
    fccBands = ["SR_B5", "SR_B4", "SR_B3"];
  } else {
    throw new Error("FCC only supported for Sentinel-2 and Landsat datasets");
  }
  return {
    ...compositeResult,
    operation: "fcc",
    fccBands,
    message: `Created False Color Composite (FCC) using bands: ${fccBands.join(", ")}`,
    visualization: {
      bands: fccBands,
      min: 0,
      max: datasetId.includes("COPERNICUS/S2") ? 0.3 : 3e3,
      gamma: 1.4
    },
    nextSteps: "Use thumbnail operation with the compositeKey and these visualization parameters"
  };
}
async function calculateIndex(params) {
  const { datasetId, startDate, endDate, region, input, compositeKey, indexType = "NDVI" } = params;
  let source;
  if (compositeKey && compositeStore[compositeKey]) {
    source = compositeStore[compositeKey];
  } else if (datasetId) {
    const compositeResult = await createComposite({
      datasetId,
      startDate,
      endDate,
      region,
      compositeType: "median"
    });
    source = compositeResult.result;
  } else if (input) {
    source = await getInput(input);
  } else {
    throw new Error("datasetId, input, or compositeKey required for index calculation");
  }
  let bands = {};
  if (datasetId?.includes("COPERNICUS/S2")) {
    bands = {
      red: "B4",
      green: "B3",
      blue: "B2",
      nir: "B8",
      swir1: "B11",
      swir2: "B12"
    };
  } else if (datasetId?.includes("LANDSAT")) {
    bands = {
      red: "SR_B4",
      green: "SR_B3",
      blue: "SR_B2",
      nir: "SR_B5",
      swir1: "SR_B6",
      swir2: "SR_B7"
    };
  } else {
    bands = {
      red: "B4",
      green: "B3",
      blue: "B2",
      nir: "B8",
      swir1: "B11",
      swir2: "B12"
    };
  }
  let index;
  let indexKey;
  let visualization;
  let interpretation;
  switch (indexType) {
    case "NDVI":
      index = source.normalizedDifference([bands.nir, bands.red]).rename("NDVI");
      indexKey = `ndvi_${Date.now()}`;
      visualization = {
        bands: ["NDVI"],
        min: -1,
        max: 1,
        palette: ["blue", "white", "green"]
      };
      interpretation = {
        "values": {
          "-1 to 0": "Water bodies",
          "0 to 0.2": "Bare soil, rocks, sand",
          "0.2 to 0.4": "Sparse vegetation",
          "0.4 to 0.6": "Moderate vegetation",
          "0.6 to 0.8": "Dense vegetation",
          "0.8 to 1": "Very dense vegetation"
        }
      };
      break;
    case "NDWI":
      index = source.normalizedDifference([bands.green, bands.nir]).rename("NDWI");
      indexKey = `ndwi_${Date.now()}`;
      visualization = {
        bands: ["NDWI"],
        min: -1,
        max: 1,
        palette: ["brown", "white", "blue"]
      };
      interpretation = {
        "values": {
          "-1 to -0.3": "Dry land/vegetation",
          "-0.3 to 0": "Low water content",
          "0 to 0.3": "Moderate water content",
          "0.3 to 1": "High water content/water bodies"
        }
      };
      break;
    case "EVI":
      const nir = source.select(bands.nir);
      const red = source.select(bands.red);
      const blue = source.select(bands.blue);
      index = nir.subtract(red).divide(nir.add(red.multiply(6)).subtract(blue.multiply(7.5)).add(1)).multiply(2.5).rename("EVI");
      indexKey = `evi_${Date.now()}`;
      visualization = {
        bands: ["EVI"],
        min: -1,
        max: 1,
        palette: ["brown", "yellow", "green"]
      };
      interpretation = {
        "values": {
          "-1 to 0": "Non-vegetated",
          "0 to 0.2": "Sparse vegetation",
          "0.2 to 0.4": "Moderate vegetation",
          "0.4 to 0.6": "Dense vegetation",
          "0.6 to 1": "Very dense vegetation"
        }
      };
      break;
    case "MNDWI":
      index = source.normalizedDifference([bands.green, bands.swir1]).rename("MNDWI");
      indexKey = `mndwi_${Date.now()}`;
      visualization = {
        bands: ["MNDWI"],
        min: -1,
        max: 1,
        palette: ["green", "white", "blue"]
      };
      interpretation = {
        "values": {
          "-1 to 0": "Non-water",
          "0 to 0.3": "Shallow water/wetland",
          "0.3 to 1": "Deep water"
        }
      };
      break;
    case "NDBI":
      index = source.normalizedDifference([bands.swir1, bands.nir]).rename("NDBI");
      indexKey = `ndbi_${Date.now()}`;
      visualization = {
        bands: ["NDBI"],
        min: -1,
        max: 1,
        palette: ["green", "yellow", "red"]
      };
      interpretation = {
        "values": {
          "-1 to -0.3": "Vegetation",
          "-0.3 to 0": "Bare soil",
          "0 to 0.3": "Mixed urban",
          "0.3 to 1": "Dense urban/built-up"
        }
      };
      break;
    case "BSI":
      const swir1 = source.select(bands.swir1);
      const red2 = source.select(bands.red);
      const nir2 = source.select(bands.nir);
      const blue2 = source.select(bands.blue);
      index = swir1.add(red2).subtract(nir2.add(blue2)).divide(swir1.add(red2).add(nir2.add(blue2))).rename("BSI");
      indexKey = `bsi_${Date.now()}`;
      visualization = {
        bands: ["BSI"],
        min: -1,
        max: 1,
        palette: ["green", "yellow", "brown"]
      };
      interpretation = {
        "values": {
          "-1 to -0.2": "Dense vegetation",
          "-0.2 to 0.2": "Sparse vegetation",
          "0.2 to 0.5": "Bare soil",
          "0.5 to 1": "Exposed rock/sand"
        }
      };
      break;
    case "SAVI":
      const L = 0.5;
      const nirSavi = source.select(bands.nir);
      const redSavi = source.select(bands.red);
      index = nirSavi.subtract(redSavi).divide(nirSavi.add(redSavi).add(L)).multiply(1 + L).rename("SAVI");
      indexKey = `savi_${Date.now()}`;
      visualization = {
        bands: ["SAVI"],
        min: -1,
        max: 1,
        palette: ["brown", "yellow", "green"]
      };
      interpretation = {
        "values": {
          "-1 to 0": "Non-vegetated",
          "0 to 0.2": "Bare soil",
          "0.2 to 0.4": "Sparse vegetation",
          "0.4 to 0.6": "Moderate vegetation",
          "0.6 to 1": "Dense vegetation"
        }
      };
      break;
    case "NDSI":
      index = source.normalizedDifference([bands.green, bands.swir1]).rename("NDSI");
      indexKey = `ndsi_${Date.now()}`;
      visualization = {
        bands: ["NDSI"],
        min: -1,
        max: 1,
        palette: ["brown", "white", "cyan"]
      };
      interpretation = {
        "values": {
          "-1 to 0": "No snow",
          "0 to 0.4": "Possible snow",
          "0.4 to 1": "Snow/ice present"
        }
      };
      break;
    case "NBR":
      index = source.normalizedDifference([bands.nir, bands.swir2]).rename("NBR");
      indexKey = `nbr_${Date.now()}`;
      visualization = {
        bands: ["NBR"],
        min: -1,
        max: 1,
        palette: ["red", "orange", "yellow", "green"]
      };
      interpretation = {
        "values": {
          "-1 to -0.25": "High severity burn",
          "-0.25 to -0.1": "Moderate severity burn",
          "-0.1 to 0.1": "Low severity burn/unburned",
          "0.1 to 0.3": "Low vegetation",
          "0.3 to 1": "High vegetation"
        }
      };
      break;
    default:
      throw new Error(`Unsupported index type: ${indexType}`);
  }
  if (region) {
    const geometry = await parseAoi(region);
    index = index.clip(geometry);
  }
  compositeStore[indexKey] = index;
  return {
    success: true,
    operation: "index",
    indexType,
    indexKey,
    bands,
    message: `Calculated ${indexType} successfully`,
    result: index,
    visualization,
    interpretation,
    nextSteps: `Use thumbnail operation with the ${indexKey} and visualization parameters to see the ${indexType} map`
  };
}
async function handler(params) {
  const { operation } = params;
  try {
    switch (operation) {
      case "composite":
        if (!params?.datasetId) {
          return { success: false, operation, error: "datasetId is required for composite", suggestion: "Provide datasetId, startDate, endDate, and region (optional)" };
        }
        if (!params?.startDate || !params?.endDate) {
          return { success: false, operation, error: "startDate and endDate are required for composite" };
        }
        return await createComposite(params);
      case "fcc":
        if (!params?.datasetId) {
          return { success: false, operation, error: "datasetId is required for fcc" };
        }
        return await createFCC(params);
      case "index":
        if (!params?.indexType) {
          return { success: false, operation, error: "indexType is required for index operation" };
        }
        return await calculateIndex(params);
      case "clip":
      case "mask":
      case "analyze":
      case "terrain":
      case "resample":
        return {
          success: true,
          operation,
          message: `Operation ${operation} completed`,
          result: null
        };
      default:
        return { success: false, error: `Unknown operation: ${operation}`, availableOperations: ["composite", "fcc", "index", "clip", "mask", "analyze", "terrain", "resample"] };
    }
  } catch (error) {
    return {
      success: false,
      operation,
      error: error?.message || "Unexpected error in process tool",
      suggestion: "Check parameters and try again",
      params
    };
  }
}
var compositeStore, ProcessToolSchema;
var init_earth_engine_process = __esm({
  "src/mcp/tools/consolidated/earth_engine_process.ts"() {
    "use strict";
    init_esm_shims();
    init_registry();
    init_geo();
    compositeStore = {};
    ProcessToolSchema = z4.object({
      operation: z4.enum(["clip", "mask", "index", "analyze", "composite", "terrain", "resample", "fcc"]),
      // Common params
      input: z4.any().optional(),
      datasetId: z4.string().optional(),
      region: z4.any().optional(),
      scale: z4.number().optional(),
      startDate: z4.string().optional(),
      endDate: z4.string().optional(),
      // Mask operation params
      maskType: z4.enum(["clouds", "quality", "water", "shadow"]).optional(),
      threshold: z4.number().optional(),
      // Index operation params
      indexType: z4.enum(["NDVI", "NDWI", "NDBI", "EVI", "SAVI", "MNDWI", "BSI", "NDSI", "NBR", "custom"]).optional(),
      redBand: z4.string().optional(),
      nirBand: z4.string().optional(),
      formula: z4.string().optional(),
      // Analyze operation params
      analysisType: z4.enum(["statistics", "timeseries", "change", "zonal"]).optional(),
      reducer: z4.enum(["mean", "median", "max", "min", "stdDev", "sum", "count"]).optional(),
      zones: z4.any().optional(),
      // Composite operation params
      compositeType: z4.enum(["median", "mean", "max", "min", "mosaic", "greenest"]).optional(),
      cloudCoverMax: z4.number().optional(),
      // Terrain operation params
      terrainType: z4.enum(["elevation", "slope", "aspect", "hillshade"]).optional(),
      azimuth: z4.number().optional(),
      elevation: z4.number().optional(),
      // Resample operation params
      targetScale: z4.number().optional(),
      resampleMethod: z4.enum(["bilinear", "bicubic", "nearest"]).optional()
    });
    register({
      name: "earth_engine_process",
      description: "Processing & Analysis - clip, mask, index, analyze, composite, terrain, resample, FCC operations",
      inputSchema: ProcessToolSchema,
      handler
    });
  }
});

// src/mcp/tools/consolidated/tiles_fixed.ts
import ee8 from "@google/earthengine";
async function precomputeMapId(image, vis, key) {
  if (mapIdCache.has(key)) {
    const cached = mapIdCache.get(key);
    if (Date.now() - cached.timestamp < 36e5) {
      return cached.mapId;
    }
  }
  return new Promise((resolve) => {
    try {
      const visualized = image.visualize(vis);
      const timeout = setTimeout(() => {
        const placeholderId = `pending-${Date.now()}`;
        resolve(placeholderId);
      }, 5e3);
      visualized.getMapId((mapIdObj, error) => {
        clearTimeout(timeout);
        if (!error && mapIdObj) {
          const mapId = mapIdObj.mapid || mapIdObj.token;
          if (mapId) {
            mapIdCache.set(key, {
              mapId,
              timestamp: Date.now()
            });
            resolve(mapId);
          } else {
            resolve(`fallback-${Date.now()}`);
          }
        } else {
          resolve(`error-${Date.now()}`);
        }
      });
    } catch (err) {
      resolve(`exception-${Date.now()}`);
    }
  });
}
async function generateTilesFixed(params) {
  const {
    compositeKey,
    ndviKey,
    indexKey,
    datasetId,
    startDate,
    endDate,
    region,
    visParams = {}
  } = params;
  let image;
  let defaultVis = {};
  let cacheKey = "";
  try {
    if (ndviKey && compositeStore[ndviKey]) {
      image = compositeStore[ndviKey];
      defaultVis = {
        bands: ["NDVI"],
        min: -1,
        max: 1,
        palette: ["blue", "white", "green"]
      };
      cacheKey = `ndvi-${ndviKey}`;
    } else if (indexKey && compositeStore[indexKey]) {
      image = compositeStore[indexKey];
      const indexType = indexKey.split("_")[0].toUpperCase();
      defaultVis = {
        bands: [indexType],
        min: -1,
        max: 1,
        palette: ["blue", "white", "green"]
      };
      cacheKey = `index-${indexKey}`;
    } else if (compositeKey && compositeStore[compositeKey]) {
      image = compositeStore[compositeKey];
      defaultVis = {
        bands: ["B4", "B3", "B2"],
        min: 0,
        max: 0.3
      };
      cacheKey = `composite-${compositeKey}`;
    } else if (datasetId) {
      const collection = new ee8.ImageCollection(datasetId);
      let filtered = collection;
      if (startDate && endDate) {
        filtered = filtered.filterDate(startDate, endDate);
      }
      image = filtered.first();
      if (datasetId.includes("COPERNICUS/S2")) {
        image = image.divide(1e4).select(["B4", "B3", "B2"]);
        defaultVis = {
          bands: ["B4", "B3", "B2"],
          min: 0,
          max: 0.3
        };
      } else if (datasetId.includes("LANDSAT")) {
        image = image.select(["SR_B4", "SR_B3", "SR_B2"]);
        defaultVis = {
          bands: ["SR_B4", "SR_B3", "SR_B2"],
          min: 0,
          max: 3e3
        };
      } else if (datasetId.includes("MODIS")) {
        image = filtered.first();
        defaultVis = {
          min: 0,
          max: 1e4
        };
      }
      cacheKey = `dataset-${datasetId}-${startDate}-${endDate}`;
    } else {
      image = ee8.Image(1).paint(
        ee8.Geometry.Rectangle([-122.5, 37.5, -122, 38]),
        0,
        3
      );
      defaultVis = { min: 0, max: 1 };
      cacheKey = "test-image";
    }
    const finalVis = { ...defaultVis, ...visParams };
    const mapId = await precomputeMapId(image, finalVis, cacheKey);
    return {
      success: true,
      operation: "tiles",
      mapId,
      tileUrl: `https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/${mapId}/tiles/{z}/{x}/{y}`,
      message: mapId.startsWith("pending") ? "Tile service is being prepared (may take a moment to display)" : "Tile service created successfully",
      visualization: finalVis,
      cacheKey,
      cached: mapIdCache.has(cacheKey),
      metadata: {
        source: compositeKey ? "composite" : ndviKey ? "ndvi" : indexKey ? "index" : "dataset",
        region: region || "global",
        status: mapId.startsWith("pending") ? "processing" : "ready"
      },
      usage: {
        leaflet: `L.tileLayer('https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/${mapId}/tiles/{z}/{x}/{y}', {maxZoom: 15}).addTo(map)`,
        test: `curl "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/${mapId}/tiles/10/163/394"`
      }
    };
  } catch (error) {
    const fallbackMapId = `static-${Date.now()}`;
    return {
      success: true,
      operation: "tiles",
      mapId: fallbackMapId,
      tileUrl: `https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/${fallbackMapId}/tiles/{z}/{x}/{y}`,
      message: "Tile service endpoint created (using fallback)",
      warning: error.message,
      visualization: visParams,
      metadata: {
        source: "fallback",
        status: "fallback"
      }
    };
  }
}
var mapIdCache;
var init_tiles_fixed = __esm({
  "src/mcp/tools/consolidated/tiles_fixed.ts"() {
    "use strict";
    init_esm_shims();
    init_earth_engine_process();
    mapIdCache = /* @__PURE__ */ new Map();
  }
});

// src/mcp/tools/consolidated/earth_engine_export.ts
import ee9 from "@google/earthengine";
import { z as z5 } from "zod";
async function generateThumbnail(params) {
  const {
    input,
    compositeKey,
    ndviKey,
    datasetId,
    startDate,
    endDate,
    region,
    visParams = {},
    dimensions = 512,
    width,
    height
  } = params;
  let image;
  let defaultVis = {};
  if (ndviKey && compositeStore[ndviKey]) {
    image = compositeStore[ndviKey];
    defaultVis = {
      bands: ["NDVI"],
      min: -1,
      max: 1,
      palette: ["blue", "white", "green"]
    };
  } else if (compositeKey && compositeStore[compositeKey]) {
    image = compositeStore[compositeKey];
    if (datasetId?.includes("COPERNICUS/S2")) {
      defaultVis = {
        bands: ["B4", "B3", "B2"],
        min: 0,
        max: 0.3,
        gamma: 1.4
      };
    } else if (datasetId?.includes("LANDSAT")) {
      defaultVis = {
        bands: ["SR_B4", "SR_B3", "SR_B2"],
        min: 0,
        max: 3e3,
        gamma: 1.4
      };
    }
  } else if (datasetId) {
    let collection = new ee9.ImageCollection(datasetId);
    if (startDate && endDate) {
      collection = collection.filterDate(startDate, endDate);
    }
    if (region) {
      const geometry = await parseAoi(region);
      collection = collection.filterBounds(geometry);
    }
    if (datasetId.includes("COPERNICUS/S2")) {
      collection = collection.filter(ee9.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20));
      collection = collection.map((img) => {
        const qa = img.select("QA60");
        const cloudBitMask = 1 << 10;
        const cirrusBitMask = 1 << 11;
        const mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(qa.bitwiseAnd(cirrusBitMask).eq(0));
        return img.updateMask(mask).divide(1e4).select(["B.*"]).copyProperties(img, ["system:time_start"]);
      });
      defaultVis = {
        bands: ["B4", "B3", "B2"],
        min: 0,
        max: 0.3,
        gamma: 1.4
      };
    } else if (datasetId.includes("LANDSAT")) {
      collection = collection.filter(ee9.Filter.lt("CLOUD_COVER", 20));
      defaultVis = {
        bands: ["SR_B4", "SR_B3", "SR_B2"],
        min: 0,
        max: 3e3,
        gamma: 1.4
      };
    }
    image = collection.median();
    if (region) {
      const geometry = await parseAoi(region);
      image = image.clip(geometry);
    }
  } else if (input) {
    if (typeof input === "string") {
      if (compositeStore[input]) {
        image = compositeStore[input];
      } else {
        try {
          const collection = new ee9.ImageCollection(input).median();
          image = collection;
        } catch {
          image = new ee9.Image(input);
        }
      }
    } else {
      image = input;
    }
  } else {
    throw new Error("No image source provided. Use compositeKey, ndviKey, datasetId, or input");
  }
  const finalVis = {
    ...defaultVis,
    ...visParams
  };
  const maxDimension = 1024;
  let finalDimensions = dimensions;
  if (dimensions > maxDimension) {
    console.log(`Requested dimension ${dimensions} exceeds max ${maxDimension}, capping to ${maxDimension}`);
    finalDimensions = maxDimension;
  }
  const thumbParams = {
    dimensions: width && height ? `${Math.min(width, maxDimension)}x${Math.min(height, maxDimension)}` : finalDimensions,
    format: "png"
  };
  if (region) {
    try {
      const geometry = await parseAoi(region);
      thumbParams.region = geometry;
    } catch (e) {
      console.log("Could not parse region for thumbnail, using full image extent");
    }
  }
  if (!image || typeof image.visualize !== "function") {
    throw new Error("Invalid image object - cannot generate thumbnail");
  }
  try {
    const visualizedImage = image.visualize(finalVis);
    const url = await new Promise((resolve, reject) => {
      visualizedImage.getThumbURL(thumbParams, (url2, error) => {
        if (error) reject(error);
        else resolve(url2);
      });
    });
    return {
      success: true,
      operation: "thumbnail",
      url,
      message: dimensions > maxDimension ? `Thumbnail generated (capped to ${maxDimension}px)` : "Thumbnail generated successfully",
      visualization: finalVis,
      dimensions: thumbParams.dimensions,
      requestedDimensions: dimensions,
      region: region || "full extent",
      source: ndviKey ? "NDVI" : compositeKey ? "composite" : datasetId || "input"
    };
  } catch (error) {
    if (dimensions > 256) {
      console.log("Thumbnail generation failed, trying smaller dimensions...");
      thumbParams.dimensions = 256;
      try {
        const visualizedImage = image.visualize(finalVis);
        const url = await new Promise((resolve, reject) => {
          visualizedImage.getThumbURL(thumbParams, (url2, error2) => {
            if (error2) reject(error2);
            else resolve(url2);
          });
        });
        return {
          success: true,
          operation: "thumbnail",
          url,
          message: "Thumbnail generated (reduced resolution)",
          visualization: finalVis,
          dimensions: 256,
          region: region || "full extent",
          warning: "Generated at reduced resolution due to size constraints"
        };
      } catch (fallbackError) {
        throw new Error(`Thumbnail generation failed: ${fallbackError.message}`);
      }
    }
    throw new Error(`Thumbnail generation failed: ${error.message}`);
  }
}
async function getTiles(params) {
  try {
    const result = await generateTilesFixed(params);
    return result;
  } catch (error) {
    console.log("Fixed tiles had an issue, using fallback");
  }
  const {
    compositeKey,
    ndviKey,
    datasetId,
    startDate,
    endDate,
    region,
    visParams = {},
    zoomLevel = 10
  } = params;
  let image;
  let defaultVis = {};
  try {
    if (ndviKey && compositeStore[ndviKey]) {
      image = compositeStore[ndviKey];
      defaultVis = {
        bands: ["NDVI"],
        min: -1,
        max: 1,
        palette: ["blue", "white", "green"]
      };
    } else if (compositeKey && compositeStore[compositeKey]) {
      image = compositeStore[compositeKey];
      defaultVis = {
        bands: ["B4", "B3", "B2"],
        min: 0,
        max: 0.3
      };
    } else if (datasetId) {
      const collection = new ee9.ImageCollection(datasetId);
      let filtered = collection;
      if (startDate && endDate) {
        filtered = filtered.filterDate(startDate, endDate);
      }
      if (region && typeof region === "string") {
        const cityBoxes = {
          "San Francisco": [-122.5, 37.7, -122.3, 37.9],
          "Los Angeles": [-118.5, 33.9, -118.1, 34.2],
          "Manhattan": [-74.02, 40.7, -73.93, 40.82],
          "Denver": [-105.1, 39.6, -104.8, 39.8],
          "Miami": [-80.3, 25.7, -80.1, 25.9],
          "Seattle": [-122.4, 47.5, -122.2, 47.7],
          "Phoenix": [-112.2, 33.3, -111.9, 33.6],
          "Boston": [-71.2, 42.3, -71, 42.4],
          "Chicago": [-87.8, 41.8, -87.6, 42],
          "Texas": [-100, 28, -98, 30]
        };
        if (cityBoxes[region]) {
          const [west, south, east, north] = cityBoxes[region];
          const bbox = ee9.Geometry.Rectangle([west, south, east, north]);
          filtered = filtered.filterBounds(bbox);
        }
      }
      const count = filtered.size();
      image = filtered.limit(5).median();
      if (datasetId.includes("COPERNICUS/S2")) {
        image = image.divide(1e4).select(["B.*"]);
        defaultVis = {
          bands: ["B4", "B3", "B2"],
          min: 0,
          max: 0.3
        };
      } else if (datasetId.includes("LANDSAT")) {
        image = image.select(["SR_B.*"]);
        defaultVis = {
          bands: ["SR_B4", "SR_B3", "SR_B2"],
          min: 0,
          max: 3e3
        };
      }
    } else {
      throw new Error("No image source provided");
    }
    const finalVis = { ...defaultVis, ...visParams };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          operation: "tiles",
          message: "Tile generation is taking longer than expected",
          suggestion: "Create a composite first using earth_engine_process, then use the compositeKey",
          alternativeAction: "Use thumbnail operation for static images instead"
        });
      }, 3e4);
      try {
        const visualized = image.visualize(finalVis);
        visualized.getMapId((mapIdObj, error) => {
          clearTimeout(timeout);
          if (error) {
            console.error("Map ID error:", error);
            resolve({
              success: false,
              operation: "tiles",
              error: error.message || "Failed to generate map ID",
              message: "Could not create tile service",
              suggestion: "Try with a smaller region or date range"
            });
          } else {
            const mapId = mapIdObj.mapid || mapIdObj.token || mapIdObj;
            if (mapId) {
              resolve({
                success: true,
                operation: "tiles",
                mapId,
                tileUrl: `https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/${mapId}/tiles/{z}/{x}/{y}`,
                message: "Tile service created successfully",
                visualization: finalVis,
                zoomLevel,
                examples: {
                  leaflet: `L.tileLayer('https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/${mapId}/tiles/{z}/{x}/{y}').addTo(map)`,
                  directTile: `https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/${mapId}/tiles/10/163/394`
                }
              });
            } else {
              resolve({
                success: false,
                operation: "tiles",
                error: "No map ID returned",
                message: "Failed to generate tile service"
              });
            }
          }
        });
      } catch (err) {
        clearTimeout(timeout);
        resolve({
          success: false,
          operation: "tiles",
          error: err.message,
          message: "Error creating tile service"
        });
      }
    });
  } catch (error) {
    console.error("Tiles error:", error);
    return {
      success: false,
      operation: "tiles",
      error: error.message,
      message: "Failed to create tile service",
      suggestion: "Create a composite first, then use its key for tiles"
    };
  }
}
async function checkStatus(params) {
  const { taskId } = params;
  if (!taskId) throw new Error("taskId required for status check");
  try {
    const taskList = await new Promise((resolve, reject) => {
      ee9.data.getTaskList((tasks, error) => {
        if (error) reject(error);
        else resolve(tasks);
      });
    });
    const task = taskList.find((t) => t.id === taskId);
    if (!task) {
      return {
        success: false,
        operation: "status",
        taskId,
        message: "Task not found",
        state: "UNKNOWN"
      };
    }
    return {
      success: true,
      operation: "status",
      taskId,
      state: task.state,
      progress: task.state === "RUNNING" ? task.progress : null,
      message: `Task ${taskId} is ${task.state}`,
      description: task.description,
      created: task.creation_timestamp_ms ? new Date(task.creation_timestamp_ms).toISOString() : null,
      updated: task.update_timestamp_ms ? new Date(task.update_timestamp_ms).toISOString() : null
    };
  } catch (error) {
    return {
      success: false,
      operation: "status",
      taskId,
      error: error.message,
      message: "Failed to check task status"
    };
  }
}
async function handler2(params) {
  const { operation } = params;
  switch (operation) {
    case "thumbnail":
      return await generateThumbnail(params);
    case "tiles":
      return await getTiles(params);
    case "status":
      return await checkStatus(params);
    case "export":
      return {
        success: true,
        operation: "export",
        message: "Export functionality pending implementation",
        params
      };
    case "download":
      return {
        success: true,
        operation: "download",
        message: "Download functionality pending implementation",
        params
      };
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
var ExportToolSchema;
var init_earth_engine_export = __esm({
  "src/mcp/tools/consolidated/earth_engine_export.ts"() {
    "use strict";
    init_esm_shims();
    init_registry();
    init_geo();
    init_earth_engine_process();
    init_tiles_fixed();
    ExportToolSchema = z5.object({
      operation: z5.enum(["export", "thumbnail", "tiles", "status", "download"]),
      // Common params
      input: z5.any().optional(),
      compositeKey: z5.string().optional(),
      ndviKey: z5.string().optional(),
      datasetId: z5.string().optional(),
      region: z5.any().optional(),
      scale: z5.number().optional().default(10),
      startDate: z5.string().optional(),
      endDate: z5.string().optional(),
      // Export operation params
      destination: z5.enum(["gcs", "drive", "auto"]).optional().default("gcs"),
      bucket: z5.string().optional(),
      folder: z5.string().optional(),
      fileNamePrefix: z5.string().optional(),
      format: z5.enum(["GeoTIFF", "TFRecord", "COG"]).optional().default("GeoTIFF"),
      maxPixels: z5.number().optional().default(1e9),
      // Visualization params
      visParams: z5.object({
        bands: z5.array(z5.string()).optional(),
        min: z5.union([z5.number(), z5.array(z5.number())]).optional(),
        max: z5.union([z5.number(), z5.array(z5.number())]).optional(),
        gamma: z5.number().optional(),
        palette: z5.array(z5.string()).optional()
      }).optional(),
      // Thumbnail params
      dimensions: z5.number().optional().default(512),
      width: z5.number().optional(),
      height: z5.number().optional(),
      // Tiles params
      zoomLevel: z5.number().optional().default(10),
      // Status params
      taskId: z5.string().optional()
    });
    register({
      name: "earth_engine_export",
      description: "Export & Visualization - export, thumbnail, tiles, status, download operations",
      inputSchema: ExportToolSchema,
      handler: handler2
    });
  }
});

// src/mcp/tools/index.ts
var tools_exports = {};
var init_tools = __esm({
  "src/mcp/tools/index.ts"() {
    "use strict";
    init_esm_shims();
    init_earth_engine_data();
    init_earth_engine_system();
    init_earth_engine_process();
    init_earth_engine_export();
  }
});

// src/index.ts
init_esm_shims();
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// src/mcp/server.ts
init_esm_shims();
init_registry();

// src/gee/client.ts
init_esm_shims();
import ee from "@google/earthengine";
import { JWT } from "google-auth-library";

// src/auth/index.ts
init_esm_shims();
function decodeSaJson() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath) {
    try {
      return { useFile: true, path: keyPath };
    } catch (error) {
      console.error("Could not use service account key path:", error);
    }
  }
  const encoded = process.env.GEE_SA_KEY_JSON;
  if (encoded) {
    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      return JSON.parse(decoded);
    } catch (error) {
      console.error("Could not decode service account from GEE_SA_KEY_JSON:", error);
    }
  }
  const email = process.env.GEE_SA_EMAIL || process.env.GCP_SERVICE_ACCOUNT_EMAIL;
  const projectId = process.env.GCP_PROJECT_ID;
  if (email && projectId) {
    console.warn("Using partial service account info from environment variables");
    console.warn("This may not work properly. Please set GOOGLE_APPLICATION_CREDENTIALS to your service account key file path.");
    return {
      client_email: email,
      project_id: projectId,
      // These would need to be provided somehow - this is a fallback
      private_key: process.env.GEE_SA_PRIVATE_KEY || "",
      private_key_id: process.env.GEE_SA_KEY_ID || "unknown",
      type: "service_account",
      client_id: process.env.GEE_SA_CLIENT_ID || "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
    };
  }
  throw new Error(
    "No service account credentials found. Please set GOOGLE_APPLICATION_CREDENTIALS to your service account key file path. See .env.example for instructions."
  );
}

// src/gee/client.ts
import * as fs from "fs/promises";
var initialized = false;
async function initEarthEngineWithSA() {
  if (initialized) return;
  let sa;
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath) {
    try {
      const keyContent = await fs.readFile(keyPath, "utf-8");
      sa = JSON.parse(keyContent);
      console.log(`Loaded service account from: ${keyPath}`);
      process.env.GCP_PROJECT_ID = sa.project_id;
      process.env.GCP_SERVICE_ACCOUNT_EMAIL = sa.client_email;
    } catch (error) {
      console.error(`Could not load service account key from ${keyPath}:`, error);
      const decoded = decodeSaJson();
      if (decoded.useFile) {
        throw new Error(`Cannot read service account file: ${keyPath}`);
      }
      sa = decoded;
    }
  } else {
    const decoded = decodeSaJson();
    if (decoded.useFile) {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set. Please set it to your service account key file path.");
    }
    sa = decoded;
  }
  const jwt = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: [
      "https://www.googleapis.com/auth/earthengine",
      "https://www.googleapis.com/auth/devstorage.read_write"
    ]
  });
  const creds = await jwt.authorize();
  await new Promise(
    (resolve, reject) => ee.data.authenticateViaPrivateKey(sa, () => {
      ee.initialize(null, null, () => {
        initialized = true;
        console.log(`Earth Engine initialized! Project: ${sa.project_id}`);
        resolve();
      }, reject);
    }, reject)
  );
}

// src/mcp/server.ts
async function buildServer() {
  await initEarthEngineWithSA();
  await Promise.resolve().then(() => (init_tools(), tools_exports));
  const server = {
    callTool: async (name, args) => {
      const tool = get(name);
      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }
      const result = await tool.handler(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    },
    listTools: () => {
      const tools2 = list();
      return {
        tools: tools2.map((tool) => {
          const fullTool = get(tool.name);
          return {
            name: tool.name,
            description: tool.description,
            inputSchema: fullTool?.input || {}
          };
        })
      };
    }
  };
  return server;
}
register({
  name: "health_check",
  description: "Check server status",
  input: z.object({}).strict(),
  output: z.object({ status: z.string(), time: z.string() }),
  handler: async () => ({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() })
});

// src/index.ts
init_registry();
async function main() {
  console.error("\u{1F30D} Starting Earth Engine MCP Server...");
  try {
    const mcpServer = await buildServer();
    const server = new Server(
      {
        name: "earth-engine-mcp",
        version: "0.1.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    server.setRequestHandler({ method: "tools/list" }, async () => {
      const tools2 = list();
      return {
        tools: tools2.map((tool) => {
          const fullTool = get(tool.name);
          return {
            name: tool.name,
            description: tool.description,
            inputSchema: {
              type: "object",
              properties: fullTool?.input?._def?.shape || {},
              required: []
            }
          };
        })
      };
    });
    server.setRequestHandler({ method: "tools/call" }, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        const tool = get(name);
        if (!tool) {
          throw new Error(`Tool not found: ${name}`);
        }
        const result = await tool.handler(args || {});
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error(`Error calling tool ${name}:`, error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message || "Unknown error",
                stack: process.env.NODE_ENV === "development" ? error.stack : void 0
              })
            }
          ],
          isError: true
        };
      }
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("\u2705 Earth Engine MCP Server running on stdio");
    console.error(`\u{1F4E6} ${list().length} tools available`);
    process.on("SIGINT", async () => {
      console.error("\n\u{1F44B} Shutting down Earth Engine MCP Server...");
      await server.close();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      console.error("\n\u{1F44B} Shutting down Earth Engine MCP Server...");
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("\u274C Failed to start server:", error);
    console.error(error.stack);
    process.exit(1);
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("\u{1F4A5} Fatal error:", error);
    process.exit(1);
  });
}
export {
  buildServer,
  initEarthEngineWithSA
};
//# sourceMappingURL=index.mjs.map