import type { Feature, FeatureCollection, Geometry } from 'geojson';
import ee from '@google/earthengine';

/**
 * Try to get administrative boundary for a place name
 * @param placeName - Name of the place (e.g., "San Francisco")
 * @returns Earth Engine geometry or null if not found
 */
function tryGetAdminBoundary(placeName: string): any {
  try {
    // Try different admin levels
    const datasets = [
      { collection: 'FAO/GAUL/2015/level2', property: 'ADM2_NAME', level: 'district' },
      { collection: 'FAO/GAUL/2015/level1', property: 'ADM1_NAME', level: 'state' },
      { collection: 'USDOS/LSIB_SIMPLE/2017', property: 'country_na', level: 'country' }
    ];
    
    for (const dataset of datasets) {
      const fc = ee.FeatureCollection(dataset.collection);
      const filtered = fc.filter(ee.Filter.eq(dataset.property, placeName));
      const count = filtered.size();
      
      // Check if we found a match (synchronously for now)
      if (count.getInfo() > 0) {
        console.log(`Found ${placeName} as ${dataset.level} in ${dataset.collection}`);
        return filtered.first().geometry();
      }
    }
    
    // Also try US-specific datasets for US places
    if (placeName.includes('San Francisco') || placeName.includes('New York') || placeName.includes('Los Angeles')) {
      const usCounties = ee.FeatureCollection('TIGER/2018/Counties');
      const filtered = usCounties.filter(ee.Filter.eq('NAME', placeName));
      if (filtered.size().getInfo() > 0) {
        console.log(`Found ${placeName} in US Census TIGER data`);
        return filtered.first().geometry();
      }
    }
    
    return null;
  } catch (error) {
    console.log(`Could not find boundary for ${placeName}:`, error);
    return null;
  }
}

export function parseAoi(aoi: any): any {
  if (!aoi) throw new Error('AOI required');
  
  // Check if aoi has a placeName field (for named locations)
  if (aoi.placeName) {
    console.log(`Looking for administrative boundary for: ${aoi.placeName}`);
    const boundary = tryGetAdminBoundary(aoi.placeName);
    if (boundary) {
      console.log(`Using administrative boundary for ${aoi.placeName}`);
      return boundary;
    }
    console.log(`No boundary found for ${aoi.placeName}, falling back to polygon`);
  }
  
  // Original logic for GeoJSON inputs
  if (aoi.type === 'FeatureCollection') return new ee.FeatureCollection(aoi as FeatureCollection).geometry();
  if (aoi.type === 'Feature') return new ee.Feature(new ee.Geometry(aoi.geometry)).geometry();
  if (aoi.type) return new ee.Geometry(aoi as Geometry);
  throw new Error('Unsupported AOI format');
}
export function clampScale(scale: number, min=10, max=10000) {
  return Math.max(min, Math.min(max, scale));
}
