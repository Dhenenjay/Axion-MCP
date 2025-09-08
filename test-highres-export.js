const { exportHighResolution, createBatchExport } = require('./src/earth-engine/export-highres');
const { initializeEarthEngine } = require('./src/earth-engine/init');

async function testHighResExport() {
  try {
    console.log('Initializing Earth Engine...');
    const keyPath = 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json';
    await initializeEarthEngine(keyPath);
    
    console.log('\n' + '='.repeat(70));
    console.log('🚀 HIGH-RESOLUTION GEOTIFF EXPORT TEST');
    console.log('='.repeat(70) + '\n');
    
    // Test 1: Small area with native resolution
    console.log('📍 Test 1: Small area (5km buffer) at NATIVE RESOLUTION');
    console.log('-'.repeat(50));
    
    const smallAreaResult = await exportHighResolution({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-08-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco
        buffer: 5000 // 5km buffer
      },
      bands: ['B4', 'B3', 'B2', 'B8'], // RGB + NIR for analysis
      scale: 10, // Native 10m resolution
      fileName: 'sf_sentinel2_native_res',
      maxPixels: 1e10 // High limit for quality
    });
    
    console.log('\n📊 HIGH-RESOLUTION EXPORT:');
    console.log('  🔗 Download URL:', smallAreaResult.highResDownload.url);
    console.log('  📁 Format:', smallAreaResult.highResDownload.format);
    console.log('  💾 Bit Depth:', smallAreaResult.highResDownload.bitDepth);
    console.log('  📏 Quality:', smallAreaResult.highResDownload.quality);
    console.log('  📦 Estimated Size:', smallAreaResult.highResDownload.estimatedSizeMB, 'MB');
    
    console.log('\n📐 TECHNICAL DETAILS:');
    console.log('  🎯 Scale:', smallAreaResult.exportDetails.actualScale);
    console.log('  📊 Pixel Dimensions:', smallAreaResult.exportDetails.pixelDimensions);
    console.log('  🔢 Total Pixels:', smallAreaResult.exportDetails.totalPixels.toLocaleString());
    console.log('  📡 Data Type:', smallAreaResult.exportDetails.dataType);
    console.log('  🌍 CRS:', smallAreaResult.exportDetails.crs);
    
    console.log('\n✨ QUALITY INFO:');
    console.log('  🎯 Resolution:', smallAreaResult.qualityInfo.resolution);
    console.log('  🔬 Data Range:', smallAreaResult.qualityInfo.dataRange);
    console.log('  ✅ Suitable for:', smallAreaResult.qualityInfo.suitable);
    
    console.log('\n🖼️ PREVIEW:');
    console.log('  URL:', smallAreaResult.thumbnail.url);
    console.log('  Format:', smallAreaResult.thumbnail.format);
    
    // Test 2: RGB visualization for display
    console.log('\n\n📍 Test 2: RGB Visualization (Ready for Display)');
    console.log('-'.repeat(50));
    
    const rgbResult = await exportHighResolution({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-08-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749],
        buffer: 3000 // 3km buffer
      },
      bands: ['B4', 'B3', 'B2'], // RGB
      scale: 10,
      fileName: 'sf_sentinel2_rgb_display',
      visualizationParams: {
        min: 0,
        max: 0.3,
        gamma: 1.4
      },
      maxPixels: 1e10
    });
    
    console.log('\n📊 RGB VISUALIZATION EXPORT:');
    console.log('  🔗 Download URL:', rgbResult.highResDownload.url);
    console.log('  💾 Bit Depth:', rgbResult.highResDownload.bitDepth);
    console.log('  📏 Processing:', rgbResult.instructions.processing);
    console.log('  📦 Estimated Size:', rgbResult.highResDownload.estimatedSizeMB, 'MB');
    
    // Test 3: Large area batch export
    console.log('\n\n📍 Test 3: Large Area Batch Export (to Google Drive)');
    console.log('-'.repeat(50));
    
    const largeAreaResult = await createBatchExport({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-08-01',
      endDate: '2024-09-01',
      region: {
        type: 'Polygon',
        coordinates: [[
          [-122.5, 37.7],
          [-122.3, 37.7],
          [-122.3, 37.85],
          [-122.5, 37.85],
          [-122.5, 37.7]
        ]] // Larger area of SF Bay
      },
      bands: ['B4', 'B3', 'B2', 'B8', 'B11'], // Multiple bands
      scale: 10,
      description: 'sf_bay_sentinel2_full_area',
      folder: 'EarthEngine_HighRes_Exports'
    });
    
    console.log('\n📤 BATCH EXPORT TO GOOGLE DRIVE:');
    console.log('  ✅ Status:', largeAreaResult.status);
    console.log('  📁 Folder:', largeAreaResult.folder);
    console.log('  ⏱️ Estimated Time:', largeAreaResult.estimatedTime);
    console.log('  💎 Quality:', largeAreaResult.quality);
    console.log('\n📖 INSTRUCTIONS:');
    Object.entries(largeAreaResult.instructions).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ HIGH-RESOLUTION EXPORT TESTS COMPLETED!');
    console.log('='.repeat(70));
    
    console.log('\n🎯 KEY DIFFERENCES FROM PREVIOUS EXPORTS:');
    console.log('  1. 16-bit data depth preserves full sensor information');
    console.log('  2. Native resolution (10m) maintained without downsampling');
    console.log('  3. Proper scaling applied (0-10000 range for reflectance)');
    console.log('  4. No pixel limits that would reduce quality');
    console.log('  5. Cloud-Optimized GeoTIFF format for efficient GIS loading');
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('  • Use highResDownload.url for full quality GIS analysis');
    console.log('  • Import into QGIS/ArcGIS - zoom will show full detail');
    console.log('  • For large areas, use batch export to Google Drive');
    console.log('  • Raw 16-bit data allows custom band math and indices');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testHighResExport();
