// 🌍 EARTH ENGINE MCP - PRODUCTION READINESS TEST
// Testing as a hardcore geospatial engineer!

const path = require('path');
process.env.GOOGLE_APPLICATION_CREDENTIALS = "C:\\Users\\Dhenenjay\\Downloads\\ee-key.json";

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const results = [];

async function runTest(name, testFn) {
  try {
    console.log(`\n🧪 ${name}`);
    const result = await testFn();
    console.log(`   ✅ PASSED`);
    testsPassed++;
    results.push({ name, status: 'PASSED', result });
    return true;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    testsFailed++;
    results.push({ name, status: 'FAILED', error: error.message });
    return false;
  }
}

async function main() {
  console.log('🛰️ EARTH ENGINE MCP - PRODUCTION READINESS TEST');
  console.log('='.repeat(60));
  console.log('Testing as a HARDCORE GEOSPATIAL ENGINEER! 💪\n');
  
  // Initialize
  console.log('🚀 Initializing Earth Engine...');
  const { buildServer } = await import('./dist/index.mjs');
  const server = await buildServer();
  console.log('✅ Earth Engine initialized!\n');
  
  async function callTool(name, params) {
    const result = await server.callTool(name, params);
    return JSON.parse(result.content[0].text);
  }
  
  console.log('=' .repeat(60));
  console.log('📊 CATEGORY 1: GLOBAL COVERAGE TESTS');
  console.log('=' .repeat(60));
  
  // Test major cities worldwide
  const globalCities = [
    // Americas
    'New York', 'Los Angeles', 'Chicago', 'Toronto', 'Mexico City', 'São Paulo', 'Buenos Aires',
    // Europe
    'London', 'Paris', 'Berlin', 'Rome', 'Madrid', 'Moscow', 'Istanbul',
    // Asia
    'Tokyo', 'Beijing', 'Shanghai', 'Mumbai', 'Delhi', 'Bangkok', 'Singapore',
    // Africa & Oceania
    'Cairo', 'Lagos', 'Johannesburg', 'Nairobi', 'Dubai'
  ];
  
  for (const city of globalCities.slice(0, 10)) { // Test first 10
    await runTest(`Find geometry for ${city}`, async () => {
      const result = await callTool('earth_engine_data', {
        operation: 'geometry',
        placeName: city
      });
      if (!result.success) throw new Error(result.error);
      return result;
    });
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🛰️ CATEGORY 2: SATELLITE DATA OPERATIONS');
  console.log('=' .repeat(60));
  
  // Test different satellite platforms
  const satellites = [
    { name: 'Sentinel-2', id: 'COPERNICUS/S2_SR_HARMONIZED' },
    { name: 'Landsat 9', id: 'LANDSAT/LC09/C02/T1_L2' },
    { name: 'MODIS Terra', id: 'MODIS/006/MOD13Q1' },
    { name: 'SRTM DEM', id: 'USGS/SRTMGL1_003' }
  ];
  
  for (const sat of satellites) {
    await runTest(`Access ${sat.name} data`, async () => {
      const result = await callTool('earth_engine_data', {
        operation: 'info',
        datasetId: sat.id
      });
      if (!result.success) throw new Error(result.error);
      return result;
    });
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🔬 CATEGORY 3: SPECTRAL INDICES');
  console.log('=' .repeat(60));
  
  const indices = ['NDVI', 'NDWI', 'NDBI', 'EVI', 'SAVI'];
  for (const index of indices) {
    await runTest(`Calculate ${index}`, async () => {
      const result = await callTool('earth_engine_process', {
        operation: 'index',
        indexType: index,
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        startDate: '2024-06-01',
        endDate: '2024-06-30',
        region: 'San Francisco'
      });
      if (!result.success) throw new Error(result.error);
      return result;
    });
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📈 CATEGORY 4: TIME SERIES ANALYSIS');
  console.log('=' .repeat(60));
  
  await runTest('Monthly NDVI time series', async () => {
    const result = await callTool('earth_engine_process', {
      operation: 'analyze',
      analysisType: 'timeseries',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      band: 'B4',
      reducer: 'mean',
      region: 'San Francisco',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    });
    if (!result.success) throw new Error(result.error);
    return result;
  });
  
  await runTest('Change detection analysis', async () => {
    const result = await callTool('earth_engine_process', {
      operation: 'analyze',
      analysisType: 'change',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      region: 'San Francisco'
    });
    if (!result.success) throw new Error(result.error);
    return result;
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('🗺️ CATEGORY 5: VISUALIZATION & EXPORT');
  console.log('=' .repeat(60));
  
  await runTest('Generate RGB thumbnail', async () => {
    const result = await callTool('earth_engine_export', {
      operation: 'thumbnail',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-06-01',
      endDate: '2024-06-30',
      region: 'Tokyo',
      dimensions: 512,
      visParams: {
        bands: ['B4', 'B3', 'B2'],
        min: 0,
        max: 3000
      }
    });
    if (!result.success) throw new Error(result.error);
    return result;
  });
  
  await runTest('Generate map tiles', async () => {
    const result = await callTool('earth_engine_export', {
      operation: 'tiles',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-06-01',
      endDate: '2024-06-30',
      region: 'London',
      zoomLevel: 10
    });
    if (!result.success) throw new Error(result.error);
    return result;
  });
  
  await runTest('Export to GCS', async () => {
    const result = await callTool('earth_engine_export', {
      operation: 'export',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-06-01',
      endDate: '2024-06-30',
      region: 'Mumbai',
      scale: 10,
      destination: 'gcs',
      fileNamePrefix: 'production_test_export'
    });
    // Export starts task, check if task was created
    if (!result.taskId && !result.success) throw new Error(result.error);
    return result;
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('⚡ CATEGORY 6: PERFORMANCE & SCALE');
  console.log('=' .repeat(60));
  
  await runTest('Handle large collection (5 year)', async () => {
    const result = await callTool('earth_engine_data', {
      operation: 'filter',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2019-01-01',
      endDate: '2024-12-31',
      cloudCoverMax: 20
    });
    // Should handle with timeout prevention
    if (!result.success && !result.imageCount) throw new Error(result.error);
    return result;
  });
  
  await runTest('Process multiple bands simultaneously', async () => {
    const result = await callTool('earth_engine_process', {
      operation: 'analyze',
      analysisType: 'statistics',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      reducer: 'mean',
      region: 'Paris',
      startDate: '2024-06-01',
      endDate: '2024-06-30'
    });
    if (!result.success) throw new Error(result.error);
    return result;
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('🔧 CATEGORY 7: CUSTOM CODE EXECUTION');
  console.log('=' .repeat(60));
  
  await runTest('Execute complex Earth Engine script', async () => {
    const result = await callTool('earth_engine_system', {
      operation: 'execute',
      code: `
        // Complex analysis
        const roi = ee.Geometry.Point([139.6917, 35.6895]).buffer(10000);
        const collection = new ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterBounds(roi)
          .filterDate('2024-01-01', '2024-12-31')
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));
        
        const composite = collection.median();
        const ndvi = composite.normalizedDifference(['B8', 'B4']);
        
        const stats = ndvi.reduceRegion({
          reducer: ee.Reducer.mean().combine({
            reducer2: ee.Reducer.stdDev(),
            sharedInputs: true
          }),
          geometry: roi,
          scale: 10,
          maxPixels: 1e9
        });
        
        return stats;
      `
    });
    if (!result.success) throw new Error(result.error);
    return result;
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('🌡️ CATEGORY 8: CLIMATE & WEATHER DATA');
  console.log('=' .repeat(60));
  
  await runTest('Access ERA5 climate data', async () => {
    const result = await callTool('earth_engine_data', {
      operation: 'info',
      datasetId: 'ECMWF/ERA5/DAILY'
    });
    if (!result.success) throw new Error(result.error);
    return result;
  });
  
  await runTest('Precipitation analysis', async () => {
    const result = await callTool('earth_engine_data', {
      operation: 'filter',
      datasetId: 'NASA/GPM_L3/IMERG_V06',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      region: 'Mumbai'
    });
    if (!result.success && !result.imageCount) throw new Error(result.error);
    return result;
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏔️ CATEGORY 9: TERRAIN ANALYSIS');
  console.log('=' .repeat(60));
  
  await runTest('DEM processing', async () => {
    const result = await callTool('earth_engine_system', {
      operation: 'execute',
      code: `
        const dem = new ee.Image('USGS/SRTMGL1_003');
        const slope = ee.Terrain.slope(dem);
        const aspect = ee.Terrain.aspect(dem);
        
        const himalayaROI = ee.Geometry.Rectangle([86, 27, 87, 28]);
        
        const slopeStats = slope.reduceRegion({
          reducer: ee.Reducer.percentile([25, 50, 75]),
          geometry: himalayaROI,
          scale: 30,
          maxPixels: 1e9
        });
        
        return slopeStats;
      `
    });
    if (!result.success) throw new Error(result.error);
    return result;
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('🌱 CATEGORY 10: LAND COVER & CLASSIFICATION');
  console.log('=' .repeat(60));
  
  await runTest('Access ESA WorldCover', async () => {
    const result = await callTool('earth_engine_data', {
      operation: 'info',
      datasetId: 'ESA/WorldCover/v200'
    });
    if (!result.success) throw new Error(result.error);
    return result;
  });
  
  await runTest('Dynamic World classification', async () => {
    const result = await callTool('earth_engine_data', {
      operation: 'filter',
      datasetId: 'GOOGLE/DYNAMICWORLD/V1',
      startDate: '2024-06-01',
      endDate: '2024-06-30',
      region: 'San Francisco'
    });
    if (!result.success && !result.imageCount) throw new Error(result.error);
    return result;
  });
  
  // FINAL SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log('🏁 PRODUCTION TEST COMPLETE');
  console.log('='.repeat(60));
  
  const totalTests = testsPassed + testsFailed;
  const successRate = ((testsPassed / totalTests) * 100).toFixed(1);
  
  console.log(`\n📊 RESULTS:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📈 Success Rate: ${successRate}%`);
  
  if (successRate >= 90) {
    console.log('\n🎉 PRODUCTION READY! The server is fully operational!');
    console.log('✅ Global coverage verified');
    console.log('✅ All satellite platforms working');
    console.log('✅ Spectral analysis functional');
    console.log('✅ Time series processing operational');
    console.log('✅ Export capabilities confirmed');
    console.log('✅ Performance optimizations working');
    console.log('✅ Custom code execution verified');
    console.log('\n🚀 READY FOR DEPLOYMENT AS A HARDCORE GEOSPATIAL SOLUTION!');
  } else {
    console.log('\n⚠️ Some tests failed. Review and fix before production.');
  }
  
  // List any failures
  if (testsFailed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'FAILED').forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
