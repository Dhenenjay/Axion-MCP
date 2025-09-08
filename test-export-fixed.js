const { exportToDownload } = require('./src/earth-engine/export');
const { initializeEarthEngine } = require('./src/earth-engine/init');
const path = require('path');

async function testExport() {
  try {
    console.log('Initializing Earth Engine...');
    const keyPath = 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json';
    await initializeEarthEngine(keyPath);
    
    console.log('\n=== Test 1: RGB bands (B4, B3, B2) ===');
    const rgbResult = await exportToDownload({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-06-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749] // San Francisco
      },
      bands: ['B4', 'B3', 'B2'], // RGB
      scale: 30,
      fileName: 'sentinel2_sf_rgb'
    });
    console.log('RGB Export result:');
    console.log('- Download URL:', rgbResult.downloadUrl);
    console.log('- Preview URL:', rgbResult.previewUrl);
    console.log('- Bands:', rgbResult.fileInfo.bands);
    console.log('- Band count:', rgbResult.fileInfo.bandCount);
    
    console.log('\n=== Test 2: Four bands (B4, B3, B2, B8) ===');
    const fourBandResult = await exportToDownload({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-06-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      },
      bands: ['B4', 'B3', 'B2', 'B8'], // RGB + NIR
      scale: 30,
      fileName: 'sentinel2_sf_rgbnir'
    });
    console.log('4-band Export result:');
    console.log('- Download URL:', fourBandResult.downloadUrl);
    console.log('- Preview URL:', fourBandResult.previewUrl);
    console.log('- Bands:', fourBandResult.fileInfo.bands);
    console.log('- Band count:', fourBandResult.fileInfo.bandCount);
    
    console.log('\n=== Test 3: Two bands (B8, B4) for NDVI ===');
    const ndviBandResult = await exportToDownload({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-06-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      },
      bands: ['B8', 'B4'], // NIR and Red for NDVI
      scale: 30,
      fileName: 'sentinel2_sf_ndvi_bands'
    });
    console.log('2-band Export result:');
    console.log('- Download URL:', ndviBandResult.downloadUrl);
    console.log('- Preview URL:', ndviBandResult.previewUrl);
    console.log('- Bands:', ndviBandResult.fileInfo.bands);
    console.log('- Band count:', ndviBandResult.fileInfo.bandCount);
    
    console.log('\n=== Test 4: Single band (B8) ===');
    const singleBandResult = await exportToDownload({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-06-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      },
      bands: ['B8'], // Just NIR
      scale: 30,
      fileName: 'sentinel2_sf_nir'
    });
    console.log('Single-band Export result:');
    console.log('- Download URL:', singleBandResult.downloadUrl);
    console.log('- Preview URL:', singleBandResult.previewUrl);
    console.log('- Bands:', singleBandResult.fileInfo.bands);
    console.log('- Band count:', singleBandResult.fileInfo.bandCount);
    
    console.log('\n=== Test 5: All bands (no band selection) ===');
    const allBandsResult = await exportToDownload({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-06-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      },
      scale: 30,
      fileName: 'sentinel2_sf_all_bands',
      maxPixels: 1e7 // Smaller limit for all bands
    });
    console.log('All-bands Export result:');
    console.log('- Download URL:', allBandsResult.downloadUrl);
    console.log('- Preview URL:', allBandsResult.previewUrl);
    console.log('- Bands:', allBandsResult.fileInfo.bands);
    console.log('- Band count:', allBandsResult.fileInfo.bandCount);
    
    console.log('\n✅ All export tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testExport();
