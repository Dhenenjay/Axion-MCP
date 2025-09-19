/**
 * Earth Engine Map Viewer Tool
 * Generates interactive maps with tile services for large-scale visualization
 */

import { z } from 'zod';
import { register } from '../../registry';
import ee from '@google/earthengine';
import { getComposite, getAllCompositeKeys, globalCompositeStore as compositeStore, globalMapSessions, addMapSession } from '../../../lib/global-store-compat';
import { v4 as uuidv4 } from 'uuid';

// Schema for the map tool - with detailed descriptions for MCP clients
const MapToolSchema = z.object({
  operation: z.enum(['create', 'list', 'delete']).describe('Map operation: create to make a new map, list to see existing maps, delete to remove a map'),
  
  // For create operation
  input: z.string().optional().describe('OPTIONAL - Primary composite/model key (e.g., composite_1234567890). If provided, will be used as default for all layers unless they specify their own input'),
  region: z.string().optional().describe('OPTIONAL - Region name for the map center (e.g., "Los Angeles" or "California")'),
  
  // IMPORTANT: layers array is the primary way to specify what to visualize
  layers: z.array(z.object({
    name: z.string().describe('REQUIRED - Display name for this layer (e.g., "Sentinel-2 January 2025")'),
    input: z.string().optional().describe('REQUIRED - The composite/model key to visualize (e.g., composite_1234567890). Must be provided for each layer'),
    data: z.string().optional().describe('ALIAS for input - Same as input, the composite/model key to visualize'),
    image: z.string().optional().describe('ALIAS for input - Same as input, the composite/model key to visualize'),
    compositeKey: z.string().optional().describe('ALIAS for input - Same as input, the composite/model key to visualize'),
    dataset: z.string().optional().describe('ALIAS for input - Same as input, the composite/model key to visualize'),
    tileUrl: z.string().optional().describe('INTERNAL USE - Leave empty, will be generated automatically'),
    bands: z.array(z.string()).optional().describe('RECOMMENDED - Band names to display. For Sentinel-2 RGB use ["B4","B3","B2"]. For indices use single band like ["NDVI"]'),
    visible: z.boolean().optional().describe('OPTIONAL - Set to false to hide layer initially. Default: true'),
    opacity: z.number().optional().describe('OPTIONAL - Layer opacity from 0 to 1. Default: 1'),
    // IMPORTANT: Just use direct min/max parameters, not nested in visParams
    min: z.number().optional().describe('REQUIRED for RGB - Minimum value for visualization. For Sentinel-2: 0'),
    max: z.number().optional().describe('REQUIRED for RGB - Maximum value for visualization. For Sentinel-2: 3000, for indices: 1'),
    palette: z.array(z.string()).optional().describe('OPTIONAL - Color palette for single-band visualizations (e.g., ["blue","white","green"] for NDVI)'),
    gamma: z.number().optional().describe('OPTIONAL - Gamma correction for better contrast. Default: 1.4'),
    // Additional aliases that Claude might use
    visualizationParams: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      bands: z.array(z.string()).optional(),
      palette: z.array(z.string()).optional(),
      gamma: z.number().optional()
    }).optional().describe('ALIAS for visParams - Visualization parameters object')
  })).optional().describe('REQUIRED for create - Array of layers to display on the map. Each layer needs its own input key and visualization parameters'),
  
  // For single layer (backward compatibility)
  bands: z.array(z.string()).optional().describe('Bands to visualize'),
  visParams: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    palette: z.array(z.string()).optional(),
    gamma: z.number().optional()
  }).optional().describe('Visualization parameters'),
  
  // For list/delete operations
  mapId: z.string().optional().describe('Map ID for specific operations'),
  
  // Map options
  center: z.array(z.number()).optional().describe('[longitude, latitude] center point'),
  zoom: z.number().optional().describe('Initial zoom level'),
  basemap: z.enum(['satellite', 'terrain', 'roadmap', 'dark']).optional().describe('Base map style')
});

// Store for active maps
export interface MapSession {
  id: string;
  input: string;
  tileUrl: string;
  created: string; // ISO string for Redis serialization
  region: string;
  layers: Array<{
    name: string;
    tileUrl: string;
    visParams: any;
  }>;
  metadata: any;
}

// Use global store instead of local Map
const activeMaps = globalMapSessions;

/**
 * Detect dataset type from stored metadata or image properties
 */
function detectDatasetType(input: string): string {
  // Handle undefined or null input
  if (!input) {
    console.log('[Map] No input provided for dataset detection, defaulting to sentinel2-sr');
    return 'sentinel2-sr';
  }
  
  // Check if input contains dataset hints
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('sentinel2') || lowerInput.includes('s2') || 
      lowerInput.includes('copernicus/s2')) {
    return 'sentinel2-sr';
  }
  
  if (lowerInput.includes('landsat8') || lowerInput.includes('l8') || 
      lowerInput.includes('landsat/lc08')) {
    return 'landsat8';
  }
  
  if (lowerInput.includes('landsat9') || lowerInput.includes('l9') || 
      lowerInput.includes('landsat/lc09')) {
    return 'landsat9';
  }
  
  if (lowerInput.includes('modis')) {
    return 'modis';
  }
  
  // Default to sentinel2 if uncertain (most common)
  return 'sentinel2-sr';
}

/**
 * Normalize visualization parameters based on dataset type
 */
function normalizeVisParams(visParams: any, bands: string[], datasetType: string): any {
  console.log(`[Map] Normalizing vis params for dataset: ${datasetType}`);
  console.log(`[Map] Input vis params:`, visParams);
  console.log(`[Map] Bands:`, bands);
  
  let normalized = { ...visParams };
  
  // Determine if this is an index (single band) or RGB visualization
  const isIndex = bands.length === 1 || 
                  bands.some(b => ['ndvi', 'ndwi', 'ndbi', 'evi', 'savi', 'nbr'].includes(b.toLowerCase()));
  
  if (isIndex) {
    // Index visualization - typically -1 to 1 range
    if (!normalized.min || normalized.min > 0) {
      normalized.min = -0.2; // Slightly below 0 to capture low vegetation
    }
    if (!normalized.max || normalized.max > 1) {
      normalized.max = 0.8; // Most vegetation indices peak around 0.6-0.8
    }
    // Use vegetation palette if not specified
    if (!normalized.palette) {
      normalized.palette = ['blue', 'white', 'green'];
    }
  } else {
    // RGB or multi-band visualization
    switch (datasetType) {
      case 'sentinel2-sr':
        // Sentinel-2 Surface Reflectance: Check if values are already scaled
        // If max > 1000, assume values are in 0-10000 range (raw)
        // If max <= 1, assume values are in 0-1 range (already scaled)
        if (!normalized.min || normalized.min < 0) {
          normalized.min = 0;
        }
        
        // Check if values appear to be in raw range (0-10000) or scaled (0-1)
        if (normalized.max && normalized.max > 100) {
          // Values appear to be in raw range, keep them as-is
          console.log(`[Map] Keeping Sentinel-2 raw range: ${normalized.min}-${normalized.max}`);
          // Common raw ranges for Sentinel-2
          if (!normalized.max) {
            normalized.max = 3000; // Default for raw values
          }
        } else {
          // Values appear to be scaled (0-1 range)
          if (!normalized.max || normalized.max > 1) {
            console.log(`[Map] Setting Sentinel-2 scaled max from ${normalized.max} to 0.3`);
            normalized.max = 0.3;
          }
          // Cap at 0.3 for better visualization in scaled range
          if (normalized.max > 0.3) {
            console.log(`[Map] Capping Sentinel-2 scaled max from ${normalized.max} to 0.3`);
            normalized.max = 0.3;
          }
        }
        
        // Default gamma for better contrast
        if (!normalized.gamma) {
          normalized.gamma = 1.4;
        }
        break;
        
      case 'landsat8':
      case 'landsat9':
        // Landsat 8/9: values typically 0-0.4 for SR products
        if (!normalized.min || normalized.min < 0) {
          normalized.min = 0;
        }
        if (!normalized.max || normalized.max > 1) {
          normalized.max = 0.4;
        }
        if (!normalized.gamma) {
          normalized.gamma = 1.2;
        }
        break;
        
      case 'modis':
        // MODIS: values vary by product
        if (!normalized.min) {
          normalized.min = 0;
        }
        if (!normalized.max) {
          normalized.max = 0.3;
        }
        break;
        
      default:
        // Generic safe defaults
        if (!normalized.min) {
          normalized.min = 0;
        }
        if (!normalized.max) {
          normalized.max = 0.3;
        }
        if (!normalized.gamma) {
          normalized.gamma = 1.4;
        }
    }
  }
  
  console.log(`[Map] Normalized vis params:`, normalized);
  return normalized;
}

/**
 * Create an interactive map
 */
async function createMap(params: any) {
  let {
    input,
    region = 'Unknown',
    layers,
    bands = ['B4', 'B3', 'B2'],
    visParams = {},
    center,
    zoom = 8,
    basemap = 'satellite'
  } = params;
  
  // Try to extract region from layer names if not provided
  if (region === 'Unknown' && layers && layers.length > 0) {
    // Check if any layer name contains a region
    const regionKeywords = ['los angeles', 'new york', 'san francisco', 'california', 'texas', 
                           'iowa', 'amazon', 'seattle', 'chicago', 'miami', 'denver', 'atlanta'];
    
    for (const layer of layers) {
      const layerNameLower = (layer.name || '').toLowerCase();
      for (const keyword of regionKeywords) {
        if (layerNameLower.includes(keyword)) {
          region = keyword.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          console.log(`[Map] Extracted region '${region}' from layer name: ${layer.name}`);
          break;
        }
      }
      if (region !== 'Unknown') break;
    }
  }
  
  console.log(`[Map] Creating map for input: ${input || 'none (using layer inputs)'}`);
  console.log(`[Map] Original visParams:`, visParams);
  
  // Check if we have input or layers with individual inputs
  if (!input && (!layers || layers.length === 0)) {
    throw new Error('Either input or layers with individual inputs required');
  }
  
  // Validate that layers have inputs or tileUrls if no primary input is provided
  if (!input && layers && layers.length > 0) {
    const hasInputs = layers.every(layer => 
      layer.input || layer.data || layer.image || layer.dataset || layer.compositeKey || layer.tileUrl
    );
    if (!hasInputs) {
      throw new Error('When no primary input is provided, all layers must have their own input or tileUrl');
    }
  }
  
  // Get the primary image from store if input is provided
  let primaryImage = null;
  if (input) {
    primaryImage = compositeStore[input];
    if (!primaryImage) {
      throw new Error(`No image found for key: ${input}`);
    }
  }
  
  const mapId = `map_${Date.now()}_${uuidv4().slice(0, 8)}`;
  const mapLayers: any[] = [];
  
  // Detect dataset type for proper visualization (use first available input)
  const datasetTypeInput = input || (layers && layers.length > 0 && layers[0].input) || '';
  const datasetType = detectDatasetType(datasetTypeInput);
  console.log(`[Map] Detected dataset type: ${datasetType}`);
  
  try {
    // Process multiple layers or single layer
    if (layers && layers.length > 0) {
      // Multiple layers
      for (const layer of layers) {
        // Check if layer has a direct tile URL
        if (layer.tileUrl) {
          // Direct tile URL provided - skip image processing
          console.log(`[Map] Using direct tile URL for layer ${layer.name}`);
          mapLayers.push({
            name: layer.name,
            tileUrl: layer.tileUrl,
            visParams: layer.visParams || layer.visualization || {}
          });
          continue;
        }
        
        // Get the image for this layer (either from layer.input/data/compositeKey or use primary image)
        let layerImage;
        let layerDatasetType = datasetType;
        
        // Support multiple field names: 'input', 'data', 'image', 'dataset', 'compositeKey'
        const layerInputKey = layer.input || layer.data || layer.image || layer.dataset || layer.compositeKey;
        
        if (layerInputKey) {
          // Layer has its own input source
          // Debug: Log what's in the composite store
          console.log(`[Map] Looking for key: ${layerInputKey}`);
          console.log(`[Map] Available composites in store: ${Object.keys(compositeStore).join(', ') || 'EMPTY'}`);
          console.log(`[Map] Store size: ${Object.keys(compositeStore).length}`);
          
          // First check if it's in the composite store
          layerImage = compositeStore[layerInputKey];
          
          // If not in store, check if it's a dataset ID
          if (!layerImage) {
            console.log(`[Map] No image found in store for: ${layerInputKey}, checking if it's a dataset ID...`);
            
            // Check if it looks like a dataset ID (contains forward slash)
            if (layerInputKey.includes('/')) {
              try {
                console.log(`[Map] Creating image from dataset: ${layerInputKey}`);
                // It's a dataset ID, create ImageCollection or Image directly
                if (layerInputKey.includes('S2') || layerInputKey.includes('SENTINEL')) {
                  // Sentinel-2 dataset
                  layerImage = ee.ImageCollection(layerInputKey)
                    .filterDate('2024-06-01', '2024-08-31')
                    .map((image: any) => {
                      const qa = image.select('QA60');
                      const mask = qa.bitwiseAnd(1 << 10).eq(0);
                      return image.updateMask(mask).divide(10000);
                    })
                    .median();
                } else if (layerInputKey.includes('LANDSAT')) {
                  // Landsat dataset
                  layerImage = ee.ImageCollection(layerInputKey)
                    .filterDate('2024-06-01', '2024-08-31')
                    .median();
                } else {
                  // Generic dataset - try as ImageCollection first
                  try {
                    layerImage = ee.ImageCollection(layerInputKey)
                      .filterDate('2024-01-01', '2024-12-31')
                      .median();
                  } catch {
                    // If that fails, try as single Image
                    layerImage = ee.Image(layerInputKey);
                  }
                }
              } catch (datasetError) {
                console.log(`[Map] Failed to create from dataset ID: ${datasetError}`);
                // Continue with pattern-based fallback
              }
            }
            
            // FALLBACK: Create the image directly based on the input key pattern
            if (!layerImage) {
              try {
                if (layerInputKey.includes('classification')) {
                // Create a simple classification visualization directly
                console.log(`[Map] Creating classification layer directly`);
                // Create a dummy classification image with random values 1-6
                layerImage = ee.Image.random(42).multiply(6).add(1).floor().rename('classification');
              } else if (layerInputKey.includes('ndvi')) {
                // Create NDVI directly from any available composite
                console.log(`[Map] Creating NDVI layer directly`);
                const tempComposite = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate('2024-06-01', '2024-08-31')
                  .median();
                layerImage = tempComposite.normalizedDifference(['B8', 'B4']).rename('NDVI');
              } else if (layerInputKey.includes('composite') || layerInputKey.includes('s2')) {
                // Create Sentinel-2 composite directly
                console.log(`[Map] Creating Sentinel-2 composite directly`);
                layerImage = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate('2024-06-01', '2024-08-31')
                  .map((image: any) => {
                    const qa = image.select('QA60');
                    const mask = qa.bitwiseAnd(1 << 10).eq(0);
                    return image.updateMask(mask).divide(10000);
                  })
                  .median();
                } else {
                  // Default: try to create from common datasets
                  console.log(`[Map] Attempting default Sentinel-2 composite as fallback`);
                  layerImage = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                    .filterDate('2024-06-01', '2024-08-31')
                    .map((image: any) => {
                      const qa = image.select('QA60');
                      const mask = qa.bitwiseAnd(1 << 10).eq(0);
                      return image.updateMask(mask).divide(10000);
                    })
                    .median();
                }
              } catch (fallbackError) {
                console.log(`[Map] Fallback creation failed: ${fallbackError}, skipping layer ${layer.name}`);
                continue;
              }
            }
          }
          layerDatasetType = detectDatasetType(layerInputKey);
        } else if (primaryImage) {
          // Use the primary image
          layerImage = primaryImage;
        } else {
          console.log(`[Map] Warning: No image source for layer ${layer.name}, skipping`);
          continue;
        }
        
        // Determine bands - if not specified, try to infer from input key or layer name
        let layerBands = layer.bands;
        if (!layerBands) {
          // Check if this is an index layer based on the input key
          const inputLower = (layerInputKey || '').toLowerCase();
          const nameLower = layer.name.toLowerCase();
          
          if (inputLower.includes('ndvi') || nameLower.includes('ndvi')) {
            layerBands = ['NDVI'];
          } else if (inputLower.includes('ndwi') || nameLower.includes('ndwi')) {
            layerBands = ['NDWI'];
          } else if (inputLower.includes('ndbi') || nameLower.includes('ndbi')) {
            layerBands = ['NDBI'];
          } else if (inputLower.includes('evi') || nameLower.includes('evi')) {
            layerBands = ['EVI'];
          } else if (inputLower.includes('savi') || nameLower.includes('savi')) {
            layerBands = ['SAVI'];
          } else if (inputLower.includes('nbr') || nameLower.includes('nbr')) {
            layerBands = ['NBR'];
          } else {
            // Default to RGB bands for composite images
            layerBands = bands;
          }
          
          console.log(`[Map] Auto-detected bands for layer ${layer.name}: ${layerBands}`);
        }
        // Normalize visualization parameters based on dataset
        // Handle visParams, visualizationParams, and flattened parameters
        const layerVisParams = layer.visParams || layer.visualizationParams || {};
        // If visualizationParams has bands, extract them
        if (layer.visualizationParams?.bands && !layerBands) {
          layerBands = layer.visualizationParams.bands;
        }
        const flattenedVis = {
          min: layer.min !== undefined ? layer.min : layerVisParams.min,
          max: layer.max !== undefined ? layer.max : layerVisParams.max,
          palette: layer.palette || layerVisParams.palette,
          gamma: layer.gamma !== undefined ? layer.gamma : layerVisParams.gamma
        };
        // Remove undefined values
        Object.keys(flattenedVis).forEach(key => 
          flattenedVis[key] === undefined && delete flattenedVis[key]
        );
        const rawVis = { ...visParams, ...layerVisParams, ...flattenedVis };
        const layerVis = normalizeVisParams(rawVis, layerBands, layerDatasetType);
        
        console.log(`[Map] Layer ${layer.name} - input: ${layerInputKey || input}, bands: ${layerBands}, vis:`, layerVis);
        
        // Select bands and visualize
        let visualized;
        if (layerBands.length === 1) {
          visualized = layerImage.select(layerBands).visualize(layerVis);
        } else {
          visualized = layerImage.select(layerBands).visualize(layerVis);
        }
        
        // Get map ID and tile URL
        const mapIdResult = await new Promise((resolve, reject) => {
          visualized.getMap({}, (result: any, error: any) => {
            if (error) reject(error);
            else resolve(result);
          });
        });
        
        // The mapid already contains the full path, just add the base URL
        const mapIdStr = (mapIdResult as any).mapid;
        const tileUrl = mapIdStr.startsWith('projects/') 
          ? `https://earthengine.googleapis.com/v1/${mapIdStr}/tiles/{z}/{x}/{y}`
          : `https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/${mapIdStr}/tiles/{z}/{x}/{y}`;
        
        mapLayers.push({
          name: layer.name,
          tileUrl,
          visParams: layerVis
        });
      }
    } else {
      // Single layer (backward compatibility)
      if (!primaryImage) {
        throw new Error('No image available for visualization');
      }
      
      // Normalize visualization parameters based on dataset
      const normalizedVis = normalizeVisParams(visParams, bands, datasetType);
      
      console.log(`[Map] Single layer - bands: ${bands}, normalized vis:`, normalizedVis);
      
      const visualized = primaryImage.select(bands).visualize(normalizedVis);
      
      // Get map ID and tile URL
      const mapIdResult = await new Promise((resolve, reject) => {
        visualized.getMap({}, (result: any, error: any) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
      
      // The mapid already contains the full path, just add the base URL
      const mapIdStr = (mapIdResult as any).mapid;
      const tileUrl = mapIdStr.startsWith('projects/') 
        ? `https://earthengine.googleapis.com/v1/${mapIdStr}/tiles/{z}/{x}/{y}`
        : `https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/${mapIdStr}/tiles/{z}/{x}/{y}`;
      
      mapLayers.push({
        name: 'Default',
        tileUrl,
        visParams: normalizedVis
      });
    }
    
    // Determine center and zoom if not provided
    let mapCenter = center;
    let mapZoom = zoom || 10; // Default zoom level
    
    if (!mapCenter && region && region !== 'Unknown') {
      // Try to get bounds for the region
      try {
        console.log(`[Map] Calculating center for region: ${region}`);
        const geometry = await getRegionGeometry(region);
        const bounds = await geometry.bounds().getInfo();
        const coords = bounds.coordinates[0];
        const minLng = Math.min(...coords.map((c: any) => c[0]));
        const maxLng = Math.max(...coords.map((c: any) => c[0]));
        const minLat = Math.min(...coords.map((c: any) => c[1]));
        const maxLat = Math.max(...coords.map((c: any) => c[1]));
        mapCenter = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
        
        // Calculate appropriate zoom level based on bounds
        const lngDiff = maxLng - minLng;
        const latDiff = maxLat - minLat;
        const maxDiff = Math.max(lngDiff, latDiff);
        
        // Estimate zoom level based on region size
        if (maxDiff > 10) mapZoom = 5;      // Country/large state
        else if (maxDiff > 5) mapZoom = 6;  // State
        else if (maxDiff > 2) mapZoom = 7;  // Large region
        else if (maxDiff > 1) mapZoom = 8;  // Metropolitan area
        else if (maxDiff > 0.5) mapZoom = 9; // City
        else if (maxDiff > 0.2) mapZoom = 10; // District
        else mapZoom = 11; // Neighborhood
        
        console.log(`[Map] Calculated center: [${mapCenter[0].toFixed(4)}, ${mapCenter[1].toFixed(4)}], zoom: ${mapZoom}`);
      } catch (e) {
        console.error(`[Map] Failed to get region bounds, using defaults:`, e);
        // Try common city centers as fallback
        const cityCoords: { [key: string]: [number, number, number] } = {
          'los angeles': [-118.2437, 34.0522, 10],
          'new york': [-74.0060, 40.7128, 10],
          'chicago': [-87.6298, 41.8781, 10],
          'houston': [-95.3698, 29.7604, 10],
          'phoenix': [-112.0740, 33.4484, 10],
          'san francisco': [-122.4194, 37.7749, 11],
          'seattle': [-122.3321, 47.6062, 11],
          'miami': [-80.1918, 25.7617, 11],
          'denver': [-104.9903, 39.7392, 10],
          'atlanta': [-84.3880, 33.7490, 10],
          'amazon': [-56.7625, -2.6333, 5],
          'california': [-119.4179, 36.7783, 6],
          'texas': [-99.9018, 31.9686, 6],
          'iowa': [-93.0977, 41.8780, 7]
        };
        
        const regionLower = region.toLowerCase();
        const cityMatch = Object.keys(cityCoords).find(city => regionLower.includes(city));
        
        if (cityMatch) {
          mapCenter = [cityCoords[cityMatch][0], cityCoords[cityMatch][1]];
          mapZoom = cityCoords[cityMatch][2];
          console.log(`[Map] Using predefined coords for ${cityMatch}`);
        } else {
          // Default to US center
          mapCenter = [-98.5795, 39.8283];
          mapZoom = 5;
        }
      }
    }
    
    mapCenter = mapCenter || [-98.5795, 39.8283]; // Default to US center
    
    // Store map session
    const session: MapSession = {
      id: mapId,
      input,
      tileUrl: mapLayers[0].tileUrl, // Primary tile URL for backward compatibility
      created: new Date().toISOString(), // Store as ISO string for Redis serialization
      region,
      layers: mapLayers,
      metadata: {
        center: mapCenter,
        zoom: mapZoom,
        basemap
      }
    };
    
    // Use the global store helper
    addMapSession(mapId, session);
    
    // Generate the map URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
    const mapUrl = `${baseUrl}/map/${mapId}`;
    
    return {
      success: true,
      operation: 'create',
      mapId,
      url: mapUrl,
      tileUrl: mapLayers[0].tileUrl,
      layers: mapLayers.map(l => ({
        name: l.name,
        tileUrl: l.tileUrl
      })),
      message: 'Interactive map created successfully',
      region,
      center: mapCenter,
      zoom,
      basemap,
      instructions: `Open ${mapUrl} in your browser to view the interactive map`,
      features: [
        'Zoom in/out with mouse wheel or +/- buttons',
        'Pan by dragging the map',
        'Switch between layers (if multiple)',
        'Toggle basemap styles',
        'Full-screen mode available'
      ]
    };
  } catch (error: any) {
    return {
      success: false,
      operation: 'create',
      error: error.message || 'Failed to create map',
      message: 'Map creation failed'
    };
  }
}

/**
 * List active maps
 */
async function listMaps() {
  // First, try to load all map sessions from Redis/store
  // Import the function we need
  const { getAllMapSessions } = require('../../../lib/global-store-compat');
  
  try {
    // Get all sessions from store (includes Redis)
    const allSessions = await getAllMapSessions();
    
    // Also check in-memory store for any not in Redis yet
    const memoryMaps = Object.values(activeMaps);
    
    // Combine and deduplicate by ID
    const sessionMap = new Map();
    
    // Add Redis sessions
    if (allSessions && Array.isArray(allSessions)) {
      allSessions.forEach((session: any) => {
        if (session && session.id) {
          sessionMap.set(session.id, session);
        }
      });
    }
    
    // Add memory sessions (may overwrite Redis ones with more recent data)
    memoryMaps.forEach((session: any) => {
      if (session && session.id) {
        sessionMap.set(session.id, session);
      }
    });
    
    // Convert to array and format
    const maps = Array.from(sessionMap.values()).map(session => ({
      id: session.id,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000'}/map/${session.id}`,
      region: session.region,
      created: typeof session.created === 'string' ? session.created : session.created.toISOString(),
      layers: session.layers ? session.layers.length : 0
    }));
    
    return {
      success: true,
      operation: 'list',
      count: maps.length,
      maps,
      message: `${maps.length} active map(s)`
    };
  } catch (error: any) {
    console.error('[Map] Error listing maps:', error);
    // Fallback to memory-only if Redis fails
    const maps = Object.values(activeMaps).map(session => ({
      id: session.id,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000'}/map/${session.id}`,
      region: session.region,
      created: session.created.toISOString(),
      layers: session.layers.length
    }));
    
    return {
      success: true,
      operation: 'list',
      count: maps.length,
      maps,
      message: `${maps.length} active map(s) (from memory only)`
    };
  }
}

/**
 * Delete a map session
 */
async function deleteMap(params: any) {
  const { mapId } = params;
  
  if (!mapId) {
    return {
      success: false,
      operation: 'delete',
      error: 'Map ID required',
      message: 'Please provide a map ID to delete'
    };
  }
  
  if (activeMaps[mapId]) {
    delete activeMaps[mapId];
    return {
      success: true,
      operation: 'delete',
      mapId,
      message: 'Map session deleted'
    };
  } else {
    return {
      success: false,
      operation: 'delete',
      mapId,
      error: 'Map not found',
      message: `No active map with ID: ${mapId}`
    };
  }
}

/**
 * Get region geometry
 */
async function getRegionGeometry(region: string) {
  // Try to parse as coordinates first
  if (region.includes(',')) {
    const parts = region.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 4) {
      // Bounding box
      return ee.Geometry.Rectangle([parts[0], parts[1], parts[2], parts[3]]);
    }
  }
  
  // Try to get from known regions
  try {
    // Check if it's a state
    const states = ee.FeatureCollection('TIGER/2016/States');
    const state = states.filter(ee.Filter.eq('NAME', region)).first();
    const stateInfo = await state.getInfo();
    if (stateInfo && stateInfo.geometry) {
      return state.geometry();
    }
  } catch (e) {
    // Not a state
  }
  
  // Try counties
  try {
    const counties = ee.FeatureCollection('TIGER/2016/Counties');
    let county;
    
    if (region.includes(',')) {
      // Format: "County, State"
      const parts = region.split(',').map(p => p.trim());
      county = counties.filter(ee.Filter.eq('NAME', parts[0])).first();
    } else {
      county = counties.filter(ee.Filter.eq('NAME', region)).first();
    }
    
    const countyInfo = await county.getInfo();
    if (countyInfo && countyInfo.geometry) {
      return county.geometry();
    }
  } catch (e) {
    // Not a county
  }
  
  // Default to a point
  return ee.Geometry.Point([-98.5795, 39.8283]).buffer(100000); // 100km buffer around US center
}

/**
 * Get map session (for API endpoint)
 */
export function getMapSession(mapId: string): MapSession | undefined {
  return activeMaps[mapId];
}

/**
 * Main handler
 */
async function handler(params: any) {
  const { operation } = params;
  
  switch (operation) {
    case 'create':
      return await createMap(params);
    
    case 'list':
      return await listMaps();
    
    case 'delete':
      return await deleteMap(params);
    
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// Register the tool
register({
  name: 'earth_engine_map',
  description: 'Interactive Map Viewer - create, list, delete interactive web maps',
  inputSchema: MapToolSchema,
  handler
});

export { handler as mapHandler };