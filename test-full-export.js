const { exportToDownload } = require('./src/earth-engine/export');
const { initializeEarthEngine } = require('./src/earth-engine/init');
const https = require('https');

async function testFullExport() {
  try {
    console.log('Initializing Earth Engine...');
    const keyPath = 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json';
    await initializeEarthEngine(keyPath);
    
    console.log('\n=== Testing Full GeoTIFF Export with Thumbnail ===\n');
    
    // Test with a small region to avoid size limits
    const result = await exportToDownload({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-08-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749] // San Francisco
      },
      bands: ['B4', 'B3', 'B2'], // RGB bands
      scale: 10, // 10m resolution for Sentinel-2
      fileName: 'sf_sentinel2_rgb_fullres',
      maxPixels: 1e9
    });
    
    console.log('📊 Export Results:');
    console.log('=====================================\n');
    
    console.log('🖼️ THUMBNAIL (Quick Preview):');
    console.log('  URL:', result.thumbnail.url);
    console.log('  Format:', result.thumbnail.format);
    console.log('  Description:', result.thumbnail.description);
    console.log('  Dimensions:', result.thumbnail.dimensions);
    
    console.log('\n📦 FULL GEOTIFF DOWNLOAD:');
    console.log('  URL:', result.download.url);
    console.log('  Format:', result.download.format);
    console.log('  Description:', result.download.description);
    console.log('  File Name:', result.download.fileName);
    console.log('  Approximate Size:', result.download.approximateSizeMB, 'MB');
    
    console.log('\n📋 METADATA:');
    console.log('  Bands:', result.metadata.bands);
    console.log('  Band Count:', result.metadata.bandCount);
    console.log('  Scale:', result.metadata.scale, 'meters/pixel');
    console.log('  CRS:', result.metadata.crs);
    console.log('  Max Pixels:', result.metadata.maxPixels);
    
    console.log('\n📖 INSTRUCTIONS:');
    Object.entries(result.instructions).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // Test URL accessibility
    console.log('\n🔍 Testing URL Accessibility...\n');
    
    // Check thumbnail URL
    await checkUrl(result.thumbnail.url, 'Thumbnail');
    
    // Check download URL
    await checkUrl(result.download.url, 'Full GeoTIFF');
    
    console.log('\n✅ Export test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Open the thumbnail URL in a browser to see a quick preview');
    console.log('  2. Open the download URL to get the full GeoTIFF file');
    console.log('  3. Import the downloaded GeoTIFF into ArcGIS or QGIS');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

function checkUrl(url, type) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    https.get({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD'
    }, (res) => {
      if (res.statusCode === 200) {
        console.log(`  ✓ ${type} URL is accessible (Status: ${res.statusCode})`);
      } else if (res.statusCode === 302 || res.statusCode === 303) {
        console.log(`  ✓ ${type} URL redirects to download (Status: ${res.statusCode})`);
      } else {
        console.log(`  ⚠️ ${type} URL returned status: ${res.statusCode}`);
      }
      resolve();
    }).on('error', (err) => {
      console.log(`  ⚠️ ${type} URL check failed:`, err.message);
      resolve();
    });
  });
}

// Run the test
testFullExport();
