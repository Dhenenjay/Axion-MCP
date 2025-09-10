#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Earth Engine MCP Server
 * Tests all 4 user queries through the SSE endpoint
 */

const fetch = require('node-fetch');

const SSE_ENDPOINT = 'http://localhost:3000/api/mcp/sse';

// Test results storage
const testResults = [];

// Helper function to call SSE endpoint
async function callSSE(tool, args) {
  console.log(`\n📤 Calling ${tool}:`, JSON.stringify(args, null, 2));
  
  try {
    const response = await fetch(SSE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tool, arguments: args })
    });
    
    const result = await response.json();
    console.log(`✅ Response:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    throw error;
  }
}

// Test 1: Filter Sentinel-2 imagery for Los Angeles in January 2025
async function test1_filterImagery() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Filter Sentinel-2 imagery for Los Angeles in January 2025');
  console.log('='.repeat(60));
  
  try {
    const result = await callSSE('earth_engine_data', {
      operation: 'filter',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      region: 'Los Angeles',
      cloudCoverMax: 20
    });
    
    testResults.push({
      test: 'Filter Sentinel-2',
      status: result.success !== false ? 'PASSED' : 'FAILED',
      result
    });
    
    return result;
  } catch (error) {
    testResults.push({
      test: 'Filter Sentinel-2',
      status: 'FAILED',
      error: error.message
    });
    throw error;
  }
}

// Test 2: Create a composite and show as thumbnail
async function test2_createComposite() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Create a composite and show as thumbnail');
  console.log('='.repeat(60));
  
  try {
    // First create the composite
    const compositeResult = await callSSE('earth_engine_process', {
      operation: 'composite',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      region: 'Los Angeles',
      compositeType: 'median',
      cloudCoverMax: 20
    });
    
    if (!compositeResult.compositeKey) {
      throw new Error('No compositeKey returned from composite operation');
    }
    
    // Then generate thumbnail
    const thumbnailResult = await callSSE('earth_engine_export', {
      operation: 'thumbnail',
      compositeKey: compositeResult.compositeKey,
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      region: 'Los Angeles',
      dimensions: 512,
      visParams: {
        bands: ['B4', 'B3', 'B2'],
        min: 0,
        max: 0.3,
        gamma: 1.4
      }
    });
    
    testResults.push({
      test: 'Create Composite & Thumbnail',
      status: thumbnailResult.url ? 'PASSED' : 'FAILED',
      compositeKey: compositeResult.compositeKey,
      thumbnailUrl: thumbnailResult.url
    });
    
    console.log('\n🖼️ Thumbnail URL:', thumbnailResult.url);
    return { compositeResult, thumbnailResult };
    
  } catch (error) {
    testResults.push({
      test: 'Create Composite & Thumbnail',
      status: 'FAILED',
      error: error.message
    });
    throw error;
  }
}

// Test 3: Create FCC (False Color Composite) and show as thumbnail
async function test3_createFCC() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Create FCC and show as thumbnail');
  console.log('='.repeat(60));
  
  try {
    // Create FCC
    const fccResult = await callSSE('earth_engine_process', {
      operation: 'fcc',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      region: 'Los Angeles'
    });
    
    if (!fccResult.compositeKey) {
      throw new Error('No compositeKey returned from FCC operation');
    }
    
    // Generate thumbnail with FCC visualization
    const thumbnailResult = await callSSE('earth_engine_export', {
      operation: 'thumbnail',
      compositeKey: fccResult.compositeKey,
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      region: 'Los Angeles',
      dimensions: 512,
      visParams: fccResult.visualization || {
        bands: ['B8', 'B4', 'B3'],
        min: 0,
        max: 0.3,
        gamma: 1.4
      }
    });
    
    testResults.push({
      test: 'Create FCC & Thumbnail',
      status: thumbnailResult.url ? 'PASSED' : 'FAILED',
      fccBands: fccResult.fccBands,
      thumbnailUrl: thumbnailResult.url
    });
    
    console.log('\n🖼️ FCC Thumbnail URL:', thumbnailResult.url);
    return { fccResult, thumbnailResult };
    
  } catch (error) {
    testResults.push({
      test: 'Create FCC & Thumbnail',
      status: 'FAILED',
      error: error.message
    });
    throw error;
  }
}

// Test 4: Calculate NDVI and show as colored map
async function test4_calculateNDVI() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Calculate NDVI and show as colored map');
  console.log('='.repeat(60));
  
  try {
    // Calculate NDVI
    const ndviResult = await callSSE('earth_engine_process', {
      operation: 'index',
      indexType: 'NDVI',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      region: 'Los Angeles'
    });
    
    if (!ndviResult.ndviKey) {
      throw new Error('No ndviKey returned from NDVI operation');
    }
    
    // Generate NDVI visualization with color palette
    const thumbnailResult = await callSSE('earth_engine_export', {
      operation: 'thumbnail',
      ndviKey: ndviResult.ndviKey,
      region: 'Los Angeles',
      dimensions: 512,
      visParams: ndviResult.visualization || {
        bands: ['NDVI'],
        min: -1,
        max: 1,
        palette: ['blue', 'white', 'green']
      }
    });
    
    // Also get tile service for interactive map
    const tilesResult = await callSSE('earth_engine_export', {
      operation: 'tiles',
      ndviKey: ndviResult.ndviKey,
      region: 'Los Angeles',
      visParams: {
        bands: ['NDVI'],
        min: -1,
        max: 1,
        palette: ['#0000FF', '#8B4513', '#FFFF00', '#90EE90', '#006400']
      }
    });
    
    testResults.push({
      test: 'Calculate NDVI & Visualize',
      status: thumbnailResult.url ? 'PASSED' : 'FAILED',
      ndviKey: ndviResult.ndviKey,
      thumbnailUrl: thumbnailResult.url,
      tileUrl: tilesResult.tileUrl,
      interpretation: ndviResult.interpretation
    });
    
    console.log('\n🖼️ NDVI Thumbnail URL:', thumbnailResult.url);
    console.log('🗺️ NDVI Tile Service:', tilesResult.tileUrl);
    console.log('\n📊 NDVI Interpretation:', JSON.stringify(ndviResult.interpretation, null, 2));
    
    return { ndviResult, thumbnailResult, tilesResult };
    
  } catch (error) {
    testResults.push({
      test: 'Calculate NDVI & Visualize',
      status: 'FAILED',
      error: error.message
    });
    throw error;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Earth Engine MCP Server Test Suite');
  console.log('=====================================\n');
  console.log('Testing endpoint:', SSE_ENDPOINT);
  console.log('Date:', new Date().toISOString());
  
  // Check if server is running
  try {
    const health = await fetch('http://localhost:3000/api/health');
    const status = await health.json();
    console.log('✅ Server health:', status);
  } catch (error) {
    console.error('❌ Server is not running! Please start the server first.');
    console.log('Run: .\\start-nextjs-server.ps1');
    process.exit(1);
  }
  
  // Run all tests
  const tests = [
    { name: 'Filter Imagery', fn: test1_filterImagery },
    { name: 'Create Composite', fn: test2_createComposite },
    { name: 'Create FCC', fn: test3_createFCC },
    { name: 'Calculate NDVI', fn: test4_calculateNDVI }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n⏳ Running: ${test.name}...`);
      await test.fn();
      console.log(`✅ ${test.name} completed`);
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error.message);
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  let passedCount = 0;
  let failedCount = 0;
  
  testResults.forEach((result, index) => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${index + 1}. ${result.test}: ${status} ${result.status}`);
    
    if (result.status === 'PASSED') {
      passedCount++;
      if (result.thumbnailUrl) {
        console.log(`   🖼️ Thumbnail: ${result.thumbnailUrl}`);
      }
      if (result.tileUrl) {
        console.log(`   🗺️ Tiles: ${result.tileUrl}`);
      }
    } else {
      failedCount++;
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${testResults.length} tests`);
  console.log(`Passed: ${passedCount} ✅`);
  console.log(`Failed: ${failedCount} ❌`);
  console.log(`Success Rate: ${((passedCount / testResults.length) * 100).toFixed(1)}%`);
  
  if (failedCount === 0) {
    console.log('\n🎉 All tests passed! The server is working perfectly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
