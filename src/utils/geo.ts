import type { Feature, FeatureCollection, Geometry } from 'geojson';
import ee from '@google/earthengine';
import { findGlobalLocation } from './global-search';

/**
 * Try to get administrative boundary for a place name
 * @param placeName - Name of the place (e.g., "San Francisco")
 * @returns Earth Engine geometry or null if not found
 */
function tryGetAdminBoundary(placeName: string): any {
  try {
    // Normalize place name
    const normalized = placeName.toLowerCase().trim();
    
    // Use the actual Earth Engine datasets to get real boundaries
    if (normalized.includes('san francisco') || normalized === 'sf') {
      // Use TIGER census data for US counties - more reliable
      const sfCounty = (new ee.FeatureCollection('TIGER/2016/Counties') as any)
        .filter(ee.Filter.eq('NAME', 'San Francisco'))
        .first();
      
      console.log('Fetching exact San Francisco County boundary from TIGER dataset');
      return sfCounty.geometry();
    }
    
    if (normalized === 'new york' || normalized === 'nyc' || normalized === 'new york city') {
      // New York County (Manhattan)
      const nyCounty = (new ee.FeatureCollection('TIGER/2016/Counties') as any).filter(ee.Filter.eq('NAME', 'New York'))
        .filter(ee.Filter.eq('STATEFP', '36')) // NY state FIPS code
        .first();
        
      console.log('Using TIGER New York County (Manhattan) boundary');
      return nyCounty.geometry();
    }
    
    if (normalized === 'los angeles' || normalized === 'la') {
      // Los Angeles County
      const laCounty = (new ee.FeatureCollection('TIGER/2016/Counties') as any).filter(ee.Filter.eq('NAME', 'Los Angeles'))
        .filter(ee.Filter.eq('STATEFP', '06')) // CA state FIPS code
        .first();
        
      console.log('Using TIGER Los Angeles County boundary');
      return laCounty.geometry();
    }
    
    // Handle international cities with FAO GAUL dataset
    const internationalCities: { [key: string]: { name: string, state?: string, country: string } } = {
      // Indian cities
      'ludhiana': { name: 'Ludhiana', state: 'Punjab', country: 'India' },
      'delhi': { name: 'Delhi', country: 'India' },
      'new delhi': { name: 'Delhi', country: 'India' },
      'mumbai': { name: 'Mumbai Suburban', state: 'Maharashtra', country: 'India' },
      'bangalore': { name: 'Bangalore Urban', state: 'Karnataka', country: 'India' },
      'bengaluru': { name: 'Bangalore Urban', state: 'Karnataka', country: 'India' },
      'chennai': { name: 'Chennai', state: 'Tamil Nadu', country: 'India' },
      'kolkata': { name: 'Kolkata', state: 'West Bengal', country: 'India' },
      'hyderabad': { name: 'Hyderabad', state: 'Andhra Pradesh', country: 'India' },
      'pune': { name: 'Pune', state: 'Maharashtra', country: 'India' },
      'ahmedabad': { name: 'Ahmadabad', state: 'Gujarat', country: 'India' },
      'jaipur': { name: 'Jaipur', state: 'Rajasthan', country: 'India' },
      'lucknow': { name: 'Lucknow', state: 'Uttar Pradesh', country: 'India' },
      'chandigarh': { name: 'Chandigarh', country: 'India' },
      'amritsar': { name: 'Amritsar', state: 'Punjab', country: 'India' },
      // Other international cities
      'london': { name: 'London', state: 'England', country: 'United Kingdom' },
      'paris': { name: 'Paris', state: 'Ile-de-France', country: 'France' },
      'tokyo': { name: 'Tokyo-to', country: 'Japan' },
      'beijing': { name: 'Beijing', country: 'China' },
      'shanghai': { name: 'Shanghai', country: 'China' },
      'dubai': { name: 'Dubai', country: 'United Arab Emirates' },
      'singapore': { name: 'Singapore', country: 'Singapore' },
      'sydney': { name: 'Sydney', state: 'New South Wales', country: 'Australia' },
      'toronto': { name: 'Toronto', state: 'Ontario', country: 'Canada' }
    };
    
    if (internationalCities[normalized]) {
      const cityInfo = internationalCities[normalized];
      try {
        let districts = (new ee.FeatureCollection('FAO/GAUL/2015/level2') as any).filter(ee.Filter.eq('ADM2_NAME', cityInfo.name))
          .filter(ee.Filter.eq('ADM0_NAME', cityInfo.country));
        
        if (cityInfo.state) {
          districts = districts.filter(ee.Filter.eq('ADM1_NAME', cityInfo.state));
        }
        
        const firstDistrict = districts.first();
        const geometry = firstDistrict.geometry();
        console.log(`Found ${placeName} in FAO GAUL dataset (${cityInfo.country})`);
        return geometry;
      } catch (e) {
        // Try without state filter
        try {
          const districts = (new ee.FeatureCollection('FAO/GAUL/2015/level2') as any).filter(ee.Filter.eq('ADM2_NAME', cityInfo.name))
            .filter(ee.Filter.eq('ADM0_NAME', cityInfo.country));
          
          const firstDistrict = districts.first();
          const geometry = firstDistrict.geometry();
          console.log(`Found ${placeName} in FAO GAUL dataset without state filter (${cityInfo.country})`);
          return geometry;
        } catch (e2) {
          // Try Level 1 (state/province level)
          try {
            const states = (new ee.FeatureCollection('FAO/GAUL/2015/level1') as any).filter(ee.Filter.eq('ADM1_NAME', cityInfo.name))
              .filter(ee.Filter.eq('ADM0_NAME', cityInfo.country));
            
            const firstState = states.first();
            const geometry = firstState.geometry();
            console.log(`Found ${placeName} at state level in FAO GAUL (${cityInfo.country})`);
            return geometry;
          } catch (e3) {
            console.log(`Could not find ${placeName} in FAO GAUL, will try generic search`);
          }
        }
      }
    }
    
    // Try other common US cities using TIGER data
    const usCityMappings: { [key: string]: { county: string, state: string } } = {
      'miami': { county: 'Miami-Dade', state: '12' }, // FL
      'chicago': { county: 'Cook', state: '17' }, // IL
      'houston': { county: 'Harris', state: '48' }, // TX
      'phoenix': { county: 'Maricopa', state: '04' }, // AZ
      'philadelphia': { county: 'Philadelphia', state: '42' }, // PA
      'san antonio': { county: 'Bexar', state: '48' }, // TX
      'san diego': { county: 'San Diego', state: '06' }, // CA
      'dallas': { county: 'Dallas', state: '48' }, // TX
      'seattle': { county: 'King', state: '53' }, // WA
      'boston': { county: 'Suffolk', state: '25' } // MA
    };
    
    if (usCityMappings[normalized]) {
      const mapping = usCityMappings[normalized];
      try {
        const county = (new ee.FeatureCollection('TIGER/2016/Counties') as any).filter(ee.Filter.eq('NAME', mapping.county))
          .filter(ee.Filter.eq('STATEFP', mapping.state))
          .first();
        
        const geometry = county.geometry();
        console.log(`Using TIGER ${mapping.county} County boundary for ${placeName}`);
        return geometry;
      } catch (e) {
        console.log(`Could not find ${placeName} in TIGER dataset`);
      }
    }
    
    // Try US states
    const states = ['california', 'texas', 'florida', 'new york', 'illinois', 'pennsylvania', 
                   'ohio', 'georgia', 'north carolina', 'michigan'];
    if (states.includes(normalized)) {
      const state = (new ee.FeatureCollection('TIGER/2016/States') as any).filter(ee.Filter.eq('NAME', placeName))
        .first();
      console.log(`Using TIGER state boundary for ${placeName}`);
      return state.geometry();
    }
    
    // Try to search in TIGER counties by name (US only)
    try {
      const countySearch = (new ee.FeatureCollection('TIGER/2016/Counties') as any).filter(ee.Filter.eq('NAME', placeName));
      
      const firstCounty = countySearch.first();
      // This will throw if no matches found
      const testGeometry = firstCounty.geometry();
      console.log(`Found county match for ${placeName} in TIGER dataset`);
      return testGeometry;
    } catch (e) {
      // Not found in TIGER, continue to international datasets
    }
    
    // Try FAO GAUL for international locations
    // Level 2 - Districts/Cities
    try {
      const districts = (new ee.FeatureCollection('FAO/GAUL/2015/level2') as any).filter(ee.Filter.eq('ADM2_NAME', placeName));
      
      const firstDistrict = districts.first();
      const geometry = firstDistrict.geometry();
      console.log(`Found ${placeName} in FAO GAUL Level 2 (District)`);
      return geometry;
    } catch (e) {
      // Continue to next level
    }
    
    // Level 1 - States/Provinces
    try {
      const states = (new ee.FeatureCollection('FAO/GAUL/2015/level1') as any).filter(ee.Filter.eq('ADM1_NAME', placeName));
      
      const firstState = states.first();
      const geometry = firstState.geometry();
      console.log(`Found ${placeName} in FAO GAUL Level 1 (State/Province)`);
      return geometry;
    } catch (e) {
      // Continue to next level
    }
    
    // Level 0 - Countries
    try {
      const countries = (new ee.FeatureCollection('FAO/GAUL/2015/level0') as any).filter(ee.Filter.eq('ADM0_NAME', placeName));
      
      const firstCountry = countries.first();
      const geometry = firstCountry.geometry();
      console.log(`Found ${placeName} in FAO GAUL Level 0 (Country)`);
      return geometry;
    } catch (e) {
      // Not found
    }
    
    // Note: ee.Filter.stringContains doesn't exist, so we can't do fuzzy matching
    
    return null;
  } catch (error) {
    console.log(`Could not find boundary for ${placeName}:`, error);
    return null;
  }
}

export async function parseAoi(aoi: any): Promise<any> {
  if (!aoi) throw new Error('AOI required');
  
  // If aoi is a string, treat it as a place name, coordinates, or JSON geometry
  if (typeof aoi === 'string') {
    // First check if it's a JSON string (geometry)
    try {
      const parsed = JSON.parse(aoi);
      if (parsed.type && (parsed.type === 'Polygon' || parsed.type === 'Point' || 
          parsed.type === 'Feature' || parsed.type === 'FeatureCollection')) {
        console.log(`Parsed JSON geometry string: ${parsed.type}`);
        // Recursively call parseAoi with the parsed object
        return parseAoi(parsed);
      }
    } catch (e) {
      // Not valid JSON, continue with other checks
    }
    
    // Check if it looks like coordinates (e.g., "-118.2437, 34.0522")
    const coordMatch = aoi.match(/^\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\s*$/);
    if (coordMatch) {
      const lon = parseFloat(coordMatch[1]);
      const lat = parseFloat(coordMatch[2]);
      console.log(`Parsing coordinates: lon=${lon}, lat=${lat}`);
      // Create a point with a small buffer
      return ee.Geometry.Point([lon, lat]).buffer(10000); // 10km buffer
    }
    
    console.log(`String AOI detected as place name: ${aoi}`);
    
    // Try global search first
    try {
      const globalBoundary = await findGlobalLocation(aoi);
      if (globalBoundary) {
        console.log(`Using exact administrative boundary for ${aoi} (global search)`);
        return globalBoundary;
      }
    } catch (globalError) {
      console.log(`Global search failed for ${aoi}, trying legacy method`);
    }
    
    // Fallback to old method
    const boundary = tryGetAdminBoundary(aoi);
    if (boundary) {
      console.log(`Using exact administrative boundary for ${aoi} (legacy method)`);
      return boundary;
    }
    throw new Error(`Could not find boundary for place: ${aoi}`);
  }
  
  // ALWAYS try to get administrative boundary first if there's any indication of a place
  // Check coordinates to infer location
  let inferredPlace = null;
  if (aoi.type === 'Polygon' && aoi.coordinates) {
    const coords = aoi.coordinates[0];
    if (coords && coords.length > 0) {
      const lons = coords.map((c: number[]) => c[0]);
      const lats = coords.map((c: number[]) => c[1]);
      const avgLon = lons.reduce((a: number, b: number) => a + b, 0) / lons.length;
      const avgLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
      
      // San Francisco Bay Area
      if (avgLon > -123 && avgLon < -122 && avgLat > 37 && avgLat < 38.2) {
        inferredPlace = 'San Francisco';
        console.log('Coordinates indicate San Francisco Bay Area - fetching county boundary');
      }
    }
  }
  
  // Try to get boundary for explicit placeName or inferred place
  const placeName = aoi.placeName || inferredPlace;
  if (placeName) {
    console.log(`Fetching administrative boundary for: ${placeName}`);
    
    // Try global search first
    try {
      const globalBoundary = await findGlobalLocation(placeName);
      if (globalBoundary) {
        console.log(`Using exact administrative boundary for ${placeName} (global search)`);
        return globalBoundary;
      }
    } catch (globalError) {
      console.log(`Global search failed for ${placeName}, trying legacy method`);
    }
    
    // Fallback to old method
    const boundary = tryGetAdminBoundary(placeName);
    if (boundary) {
      console.log(`Using exact administrative boundary for ${placeName} (legacy method)`);
      return boundary;
    }
  }
  
  // Only use polygon if no boundary could be found
  if (aoi.type === 'FeatureCollection') return (new ee.FeatureCollection(aoi as FeatureCollection) as any).geometry();
  if (aoi.type === 'Feature') return new ee.Feature(new ee.Geometry(aoi.geometry)).geometry();
  if (aoi.type) return new ee.Geometry(aoi as Geometry);
  throw new Error('Unsupported AOI format');
}
export function clampScale(scale: number, min=10, max=10000) {
  return Math.max(min, Math.min(max, scale));
}
