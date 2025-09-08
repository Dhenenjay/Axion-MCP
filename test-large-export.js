const { exportLargeArea } = require('./src/earth-engine/export-large');
const { initializeEarthEngine } = require('./src/earth-engine/init');
const fs = require('fs');
const path = require('path');

async function testLargeExport() {
  try {
    console.log('Initializing Earth Engine...');
    const keyPath = 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json';
    await initializeEarthEngine(keyPath);
    
    console.log('\n' + '='.repeat(70));
    console.log('🌍 LARGE AREA EXPORT TEST - MULTIPLE OPTIONS');
    console.log('='.repeat(70) + '\n');
    
    // Test with a large area (San Francisco and surrounding area)
    const largeAreaResult = await exportLargeArea({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-08-01',
      endDate: '2024-09-01',
      region: {
        type: 'Polygon',
        coordinates: [[
          [-122.55, 37.65],   // Southwest corner
          [-122.30, 37.65],   // Southeast corner
          [-122.30, 37.90],   // Northeast corner
          [-122.55, 37.90],   // Northwest corner
          [-122.55, 37.65]    // Close polygon
        ]]
      },
      bands: ['B4', 'B3', 'B2', 'B8'], // RGB + NIR
      scale: 10, // Native resolution
      fileName: 'sf_bay_area_sentinel2_10m'
    });
    
    console.log('📊 AREA INFORMATION:');
    console.log('  📏 Dimensions:', largeAreaResult.areaInfo.widthKm, 'km x', largeAreaResult.areaInfo.heightKm, 'km');
    console.log('  🔢 Pixel Dimensions:', largeAreaResult.areaInfo.pixelDimensions);
    console.log('  📦 Total Pixels:', largeAreaResult.areaInfo.totalPixels);
    console.log('  💾 Estimated Size:', largeAreaResult.areaInfo.estimatedSizeMB, 'MB');
    console.log('  📍 Bounds:', largeAreaResult.areaInfo.bounds);
    
    console.log('\n💡 RECOMMENDATION:', largeAreaResult.recommendations);
    
    console.log('\n📤 EXPORT OPTIONS AVAILABLE:');
    console.log('='.repeat(50));
    
    largeAreaResult.exportMethods.forEach((method, index) => {
      console.log(`\n${index + 1}. ${method.method}`);
      console.log('   Description:', method.description);
      
      if (method.url) {
        console.log('   Download URL:', method.url.substring(0, 100) + '...');
        console.log('   Estimated Size:', method.estimatedSizeMB, 'MB');
      }
      
      if (method.totalTiles) {
        console.log('   Total Tiles:', method.totalTiles, `(${method.tilesX} x ${method.tilesY})`);
        console.log('   Merge Command:', method.mergeCommand);
        console.log('   Example tiles:');
        method.tiles.forEach(tile => {
          console.log(`     - Tile ${tile.tile}: ${tile.url.substring(0, 80)}...`);
        });
      }
      
      if (method.script && method.method === 'Earth Engine Code Editor') {
        // Save the Code Editor script to a file
        const scriptPath = path.join(__dirname, 'export_to_drive_script.js');
        fs.writeFileSync(scriptPath, method.script);
        console.log('   ✅ Script saved to:', scriptPath);
        console.log('   Instructions:');
        method.instructions.forEach(step => console.log('     ' + step));
      }
      
      if (method.script && method.method === 'Python API') {
        // Save the Python script to a file
        const scriptPath = path.join(__dirname, 'export_to_drive_script.py');
        fs.writeFileSync(scriptPath, method.script);
        console.log('   ✅ Script saved to:', scriptPath);
        console.log('   Instructions:');
        method.instructions.forEach(step => console.log('     ' + step));
      }
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 EXPORT PARAMETERS:');
    console.log('  Scale:', largeAreaResult.parameters.scale, 'meters/pixel');
    console.log('  CRS:', largeAreaResult.parameters.crs);
    console.log('  Bands:', largeAreaResult.parameters.bands);
    console.log('  Format:', largeAreaResult.parameters.format);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ LARGE AREA EXPORT TEST COMPLETED!');
    console.log('='.repeat(70));
    
    console.log('\n🎯 WHAT TO DO NEXT:');
    console.log('  For IMMEDIATE download (if available):');
    console.log('    → Open the Direct Download URL in your browser');
    console.log('');
    console.log('  For GOOGLE DRIVE export (recommended for large areas):');
    console.log('    → Option 1: Use the saved Code Editor script');
    console.log('      1. Open export_to_drive_script.js');
    console.log('      2. Copy content to https://code.earthengine.google.com/');
    console.log('      3. Run and export to YOUR Google Drive');
    console.log('');
    console.log('    → Option 2: Use the saved Python script');
    console.log('      1. Install earthengine-api: pip install earthengine-api');
    console.log('      2. Authenticate: earthengine authenticate');
    console.log('      3. Run: python export_to_drive_script.py');
    console.log('');
    console.log('  For TILED download (if available):');
    console.log('    → Download each tile URL separately');
    console.log('    → Merge using GDAL or QGIS');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testLargeExport();
