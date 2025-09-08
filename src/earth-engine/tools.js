const { getEarthEngine } = require('./init');

/**
 * Search the Earth Engine data catalog
 * @param {string} query - Search query
 * @returns {Promise<object>} Search results
 */
async function searchCatalog(query) {
  const ee = getEarthEngine();
  
  // Common dataset mappings
  const datasets = {
    'sentinel-2': 'COPERNICUS/S2_SR_HARMONIZED',
    'landsat-8': 'LANDSAT/LC08/C02/T1_L2',
    'landsat-9': 'LANDSAT/LC09/C02/T1_L2',
    'modis': 'MODIS/006/MOD13Q1',
    'dem': 'USGS/SRTMGL1_003',
    'precipitation': 'UCSB-CHG/CHIRPS/DAILY',
    'temperature': 'MODIS/006/MOD11A1',
    'ndvi': 'MODIS/006/MOD13Q1'
  };
  
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  for (const [key, id] of Object.entries(datasets)) {
    if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
      results.push({
        id: id,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' '),
        description: `Earth Engine dataset: ${id}`
      });
    }
  }
  
  return {
    query: query,
    count: results.length,
    datasets: results
  };
}

/**
 * Get band names for a dataset
 * @param {string} datasetId - Dataset ID
 * @returns {Promise<object>} Band information
 */
async function getBandNames(datasetId) {
  const ee = getEarthEngine();
  
  return new Promise((resolve, reject) => {
    try {
      const collection = ee.ImageCollection(datasetId);
      const first = collection.first();
      
      first.bandNames().evaluate((bandNames, error) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            datasetId: datasetId,
            bands: bandNames,
            count: bandNames.length
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Filter collection by date and region
 * @param {object} params - Filter parameters
 * @returns {Promise<object>} Filtered collection info
 */
async function filterCollection(params) {
  const ee = getEarthEngine();
  const { datasetId, startDate, endDate, region } = params;
  
  return new Promise((resolve, reject) => {
    try {
      let collection = ee.ImageCollection(datasetId)
        .filterDate(startDate, endDate);
      
      if (region) {
        const geometry = region.type === 'Point' 
          ? ee.Geometry.Point(region.coordinates)
          : ee.Geometry.Polygon(region.coordinates);
        collection = collection.filterBounds(geometry);
      }
      
      collection.size().evaluate((size, error) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            datasetId: datasetId,
            startDate: startDate,
            endDate: endDate,
            imageCount: size,
            collectionId: collection.getInfo().id || `${datasetId}_filtered`
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Calculate NDVI
 * @param {object} params - NDVI parameters
 * @returns {Promise<object>} NDVI calculation result
 */
async function calculateNDVI(params) {
  const ee = getEarthEngine();
  const { imageId, redBand = 'B4', nirBand = 'B8' } = params;
  
  return new Promise((resolve, reject) => {
    try {
      let image;
      
      // Handle both image IDs and collection IDs
      if (imageId.includes('ImageCollection')) {
        const collection = ee.ImageCollection(imageId);
        image = collection.median();
      } else {
        image = ee.Image(imageId);
      }
      
      // Calculate NDVI
      const ndvi = image.normalizedDifference([nirBand, redBand]).rename('NDVI');
      
      // Get basic statistics
      const stats = ndvi.reduceRegion({
        reducer: ee.Reducer.mean().combine({
          reducer2: ee.Reducer.minMax(),
          sharedInputs: true
        }).combine({
          reducer2: ee.Reducer.stdDev(),
          sharedInputs: true
        }),
        scale: 30,
        maxPixels: 1e9
      });
      
      stats.evaluate((result, error) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            imageId: imageId,
            index: 'NDVI',
            bands: { red: redBand, nir: nirBand },
            statistics: result,
            resultId: `NDVI_${Date.now()}`
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get visualization URL for an image
 * @param {object} params - Visualization parameters
 * @returns {Promise<object>} Map tile URL
 */
async function getMapUrl(params) {
  const ee = getEarthEngine();
  const { imageId, visParams = {} } = params;
  
  return new Promise((resolve, reject) => {
    try {
      let image;
      
      if (imageId.includes('ImageCollection')) {
        const collection = ee.ImageCollection(imageId);
        image = collection.median();
      } else {
        image = ee.Image(imageId);
      }
      
      // Default visualization parameters
      const defaultVis = {
        min: 0,
        max: 3000,
        bands: ['B4', 'B3', 'B2']
      };
      
      const finalVis = { ...defaultVis, ...visParams };
      
      image.getMap(finalVis, (mapId, error) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            imageId: imageId,
            mapId: mapId.mapid,
            urlTemplate: `https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/${mapId.mapid}-{id}/tiles/{z}/{x}/{y}`,
            token: mapId.token,
            visParams: finalVis
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Calculate summary statistics for an image
 * @param {object} params - Statistics parameters
 * @returns {Promise<object>} Statistics result
 */
async function calculateStatistics(params) {
  const ee = getEarthEngine();
  const { imageId, region, scale = 30 } = params;
  
  return new Promise((resolve, reject) => {
    try {
      let image;
      
      if (imageId.includes('ImageCollection')) {
        const collection = ee.ImageCollection(imageId);
        image = collection.median();
      } else {
        image = ee.Image(imageId);
      }
      
      let geometry;
      if (region) {
        geometry = region.type === 'Point'
          ? ee.Geometry.Point(region.coordinates)
          : ee.Geometry.Polygon(region.coordinates);
      }
      
      const stats = image.reduceRegion({
        reducer: ee.Reducer.mean().combine({
          reducer2: ee.Reducer.minMax(),
          sharedInputs: true
        }).combine({
          reducer2: ee.Reducer.stdDev(),
          sharedInputs: true
        }).combine({
          reducer2: ee.Reducer.count(),
          sharedInputs: true
        }),
        geometry: geometry,
        scale: scale,
        maxPixels: 1e9
      });
      
      stats.evaluate((result, error) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            imageId: imageId,
            statistics: result,
            scale: scale,
            region: region
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  searchCatalog,
  getBandNames,
  filterCollection,
  calculateNDVI,
  getMapUrl,
  calculateStatistics
};
