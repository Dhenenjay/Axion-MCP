const { getEarthEngine } = require('./init');

/**
 * Generate a high-resolution GeoTIFF export URL with full quality
 * This uses Earth Engine's getDownloadURL with proper parameters for full resolution
 * @param {object} params - Export parameters
 * @returns {Promise<object>} Export URLs and metadata
 */
async function exportHighResolution(params) {
  const ee = getEarthEngine();
  const { 
    datasetId,
    imageId,
    startDate, 
    endDate, 
    region,
    scale = null, // null means native resolution
    crs = 'EPSG:4326',
    fileName = `earth_engine_export_${Date.now()}`,
    bands = null,
    maxPixels = 1e10, // Much higher limit for full res
    visualizationParams = null
  } = params;
  
  return new Promise((resolve, reject) => {
    try {
      let image;
      
      // Create composite if dataset info provided
      if (datasetId && startDate && endDate) {
        let collection = ee.ImageCollection(datasetId)
          .filterDate(startDate, endDate);
        
        if (region) {
          const geometry = region.type === 'Point' 
            ? ee.Geometry.Point(region.coordinates).buffer(region.buffer || 5000)
            : ee.Geometry.Polygon(region.coordinates);
          collection = collection.filterBounds(geometry);
        }
        
        // Apply cloud masking for Sentinel-2
        if (datasetId.includes('S2')) {
          // Determine native scale based on dataset
          if (!scale) {
            // Use native resolution for Sentinel-2
            scale = 10; // 10m for visible bands
          }
          
          collection = collection.map(function(img) {
            const qa = img.select('QA60');
            const cloudBitMask = 1 << 10;
            const cirrusBitMask = 1 << 11;
            const mask = qa.bitwiseAnd(cloudBitMask).eq(0)
              .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
            
            // Scale the values properly for Sentinel-2 SR
            // Sentinel-2 SR values are scaled by 10000
            return img.updateMask(mask)
              .select('B.*')
              .divide(10000) // Convert to reflectance values [0-1]
              .copyProperties(img, ['system:time_start']);
          });
        } else if (datasetId.includes('L8') || datasetId.includes('L9')) {
          // Landsat 8/9
          if (!scale) {
            scale = 30; // 30m native resolution
          }
        }
        
        // Create median composite
        image = collection.median();
        
        // Select specific bands if requested
        if (bands && bands.length > 0) {
          image = image.select(bands);
        }
        
      } else if (imageId) {
        image = ee.Image(imageId);
        if (bands && bands.length > 0) {
          image = image.select(bands);
        }
      } else {
        throw new Error('Either imageId or datasetId must be provided');
      }
      
      // Define export region
      let exportRegion;
      if (region) {
        exportRegion = region.type === 'Point' 
          ? ee.Geometry.Point(region.coordinates).buffer(region.buffer || 5000)
          : ee.Geometry.Polygon(region.coordinates);
      } else {
        exportRegion = image.geometry();
      }
      
      // Get band names if not specified
      let exportBands = bands;
      if (!exportBands) {
        const bandNames = image.bandNames();
        exportBands = bandNames.getInfo();
      }
      
      // Ensure we're using the best scale
      const finalScale = scale || 10; // Default to 10m if not specified
      
      // Prepare the image for export with proper scaling
      let exportImage = image.select(exportBands);
      
      // Apply visualization parameters if provided (for RGB exports)
      if (visualizationParams) {
        const { min = 0, max = 0.3, gamma = 1.4 } = visualizationParams;
        exportImage = exportImage.visualize({
          bands: exportBands.slice(0, 3),
          min: min,
          max: max,
          gamma: gamma
        });
      }
      
      // Convert to 16-bit for better quality (if not visualized)
      if (!visualizationParams) {
        exportImage = exportImage.multiply(10000).toInt16(); // Scale to 16-bit range
      }
      
      // Generate HIGH QUALITY download URL for full GeoTIFF
      // Using proper parameters for maximum quality
      const downloadUrl = exportImage.getDownloadURL({
        name: fileName,
        bands: visualizationParams ? null : exportBands, // All bands if not visualized
        region: exportRegion,
        scale: finalScale,
        crs: crs,
        crsTransform: null,
        dimensions: null, // Don't limit dimensions
        format: 'GEO_TIFF',
        filePerBand: false,
        maxPixels: maxPixels
      });
      
      // Generate thumbnail for preview (keep this small)
      let previewImage;
      if (exportBands.length >= 3) {
        previewImage = image.select(exportBands.slice(0, 3));
      } else if (exportBands.length === 2) {
        const band1 = image.select([exportBands[0]]).rename('vis_red');
        const band2 = image.select([exportBands[1]]).rename('vis_green');
        const zeros = ee.Image(0).rename('vis_blue');
        previewImage = ee.Image.cat([band1, band2, zeros]);
      } else {
        const band = image.select([exportBands[0]]).rename('vis_band');
        previewImage = ee.Image.cat([band, band, band]);
      }
      
      const previewUrl = previewImage
        .multiply(10000).toUint16() // Scale for visualization
        .getThumbURL({
          dimensions: '1024x1024',
          region: exportRegion,
          format: 'png',
          min: 0,
          max: 3000
        });
      
      // Calculate actual pixel dimensions
      const bounds = exportRegion.bounds();
      const coords = bounds.coordinates().getInfo()[0];
      const minLon = Math.min(...coords.map(c => c[0]));
      const maxLon = Math.max(...coords.map(c => c[0]));
      const minLat = Math.min(...coords.map(c => c[1]));
      const maxLat = Math.max(...coords.map(c => c[1]));
      
      const widthDegrees = maxLon - minLon;
      const heightDegrees = maxLat - minLat;
      const widthMeters = widthDegrees * 111320; // Approximate at equator
      const heightMeters = heightDegrees * 110540;
      const pixelWidth = Math.ceil(widthMeters / finalScale);
      const pixelHeight = Math.ceil(heightMeters / finalScale);
      const totalPixels = pixelWidth * pixelHeight;
      
      // Estimate file size (more accurate)
      const bitsPerSample = visualizationParams ? 8 : 16; // 8-bit for RGB, 16-bit for raw
      const bytesPerPixel = (bitsPerSample / 8) * exportBands.length;
      const estimatedSizeBytes = totalPixels * bytesPerPixel;
      const estimatedSizeMB = Math.round(estimatedSizeBytes / (1024 * 1024));
      
      resolve({
        // High-resolution GeoTIFF download
        highResDownload: {
          url: downloadUrl,
          format: 'GeoTIFF (16-bit)',
          description: 'Full resolution GeoTIFF with maximum quality for GIS analysis',
          fileName: `${fileName}.tif`,
          quality: 'Maximum',
          bitDepth: visualizationParams ? '8-bit RGB' : '16-bit',
          estimatedSizeMB: estimatedSizeMB
        },
        // Preview thumbnail
        thumbnail: {
          url: previewUrl,
          format: 'PNG',
          description: 'Quick preview (1024x1024 PNG)',
          dimensions: '1024x1024'
        },
        // Technical details
        exportDetails: {
          bands: exportBands,
          bandCount: exportBands.length,
          scale: finalScale,
          actualScale: `${finalScale} meters/pixel`,
          crs: crs,
          pixelDimensions: `${pixelWidth} x ${pixelHeight}`,
          totalPixels: totalPixels,
          maxPixelsLimit: maxPixels,
          dataType: visualizationParams ? 'Visualized RGB' : 'Raw sensor data (16-bit)'
        },
        // Quality information
        qualityInfo: {
          resolution: finalScale === 10 ? 'Native resolution (10m)' : `Resampled to ${finalScale}m`,
          processing: 'Median composite with cloud masking',
          dataRange: visualizationParams ? '0-255 (8-bit RGB)' : '0-10000 (scaled reflectance)',
          suitable: 'Suitable for detailed GIS analysis, classification, and high-quality mapping'
        },
        // Usage instructions
        instructions: {
          download: `Download the high-resolution GeoTIFF from highResDownload.url`,
          gis: 'Import into ArcGIS/QGIS with full zoom capability and detail preservation',
          processing: visualizationParams ? 
            'RGB visualization applied - ready for display' : 
            'Raw data - apply your own band combinations and enhancements in GIS software'
        }
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Create a batch export task for very large areas
 * This creates a task that runs on Google Earth Engine servers
 * @param {object} params - Export parameters
 * @returns {Promise<object>} Export task information
 */
async function createBatchExport(params) {
  const ee = getEarthEngine();
  const {
    datasetId,
    startDate,
    endDate,
    region,
    scale = 10,
    crs = 'EPSG:4326',
    bands = null,
    folder = 'EarthEngine_Exports',
    description = `export_${Date.now()}`,
    maxPixels = 1e10
  } = params;

  return new Promise((resolve, reject) => {
    try {
      // Create the image/composite
      let collection = ee.ImageCollection(datasetId)
        .filterDate(startDate, endDate);
      
      if (region) {
        const geometry = region.type === 'Point' 
          ? ee.Geometry.Point(region.coordinates).buffer(region.buffer || 5000)
          : ee.Geometry.Polygon(region.coordinates);
        collection = collection.filterBounds(geometry);
      }
      
      // Apply processing
      if (datasetId.includes('S2')) {
        collection = collection.map(function(img) {
          const qa = img.select('QA60');
          const cloudBitMask = 1 << 10;
          const cirrusBitMask = 1 << 11;
          const mask = qa.bitwiseAnd(cloudBitMask).eq(0)
            .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
          return img.updateMask(mask)
            .select('B.*')
            .divide(10000)
            .copyProperties(img, ['system:time_start']);
        });
      }
      
      let image = collection.median();
      if (bands) {
        image = image.select(bands);
      }
      
      // Scale to 16-bit for export
      image = image.multiply(10000).toInt16();
      
      // Define export region
      const exportRegion = region.type === 'Point' 
        ? ee.Geometry.Point(region.coordinates).buffer(region.buffer || 5000)
        : ee.Geometry.Polygon(region.coordinates);
      
      // Create export task
      const task = ee.batch.Export.image.toDrive({
        image: image,
        description: description,
        folder: folder,
        fileNamePrefix: description,
        region: exportRegion,
        scale: scale,
        crs: crs,
        maxPixels: maxPixels,
        fileFormat: 'GeoTIFF',
        formatOptions: {
          cloudOptimized: true,
          noData: -9999
        }
      });
      
      // Start the task
      task.start();
      
      resolve({
        status: 'Task submitted',
        taskId: task.id,
        description: description,
        folder: folder,
        message: 'Export task started. Check your Google Drive for the file.',
        estimatedTime: 'Processing time depends on area size (typically 5-30 minutes)',
        quality: 'Maximum quality Cloud-Optimized GeoTIFF (COG)',
        instructions: {
          monitor: 'Check https://code.earthengine.google.com/tasks for progress',
          download: `File will appear in Google Drive folder: ${folder}`,
          gis: 'Download from Drive and import into ArcGIS/QGIS for full resolution analysis'
        }
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  exportHighResolution,
  createBatchExport
};
