#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('📦 Testing GeoTIFF Export Functionality');
console.log('========================================\n');

const server = spawn('node', ['mcp-earth-engine.js'], {
  cwd: __dirname,
  env: {
    ...process.env,
    EARTH_ENGINE_PRIVATE_KEY: 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json'
  }
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  try {
    const lines = responseBuffer.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i].trim()) {
        const response = JSON.parse(lines[i]);
        if (response.result && response.result.content) {
          const result = JSON.parse(response.result.content[0].text);
          
          // Check for download URL
          if (result.downloadUrl) {
            console.log('\n✅ GeoTIFF Download URL Generated!');
            console.log('📥 Download your file here:');
            console.log(result.downloadUrl);
            console.log('\n📊 File Information:');
            console.log(`   File name: ${result.fileName}`);
            console.log(`   Format: ${result.format}`);
            console.log(`   Resolution: ${result.scale} meters/pixel`);
            console.log(`   CRS: ${result.crs}`);
            if (result.fileInfo) {
              console.log(`   Bands: ${result.fileInfo.bands}`);
            }
            console.log('\n💡 Click the download URL to save the full GeoTIFF file');
            
            if (result.previewUrl) {
              console.log('\n👁️ Preview image:');
              console.log(result.previewUrl);
            }
          }
          
          // Check for Drive export
          if (result.taskId) {
            console.log('\n☁️ Google Drive Export Started!');
            console.log(`   Task ID: ${result.taskId}`);
            console.log(`   Status: ${result.status}`);
            console.log(`   File: ${result.fileName}`);
            console.log(`   Folder: ${result.folder}`);
            console.log('\n📁 Check your Google Drive for the file when complete');
          }
        }
      }
    }
    responseBuffer = lines[lines.length - 1];
  } catch (e) {
    // Buffer incomplete
  }
});

server.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg.includes('[MCP]')) {
    console.log('ℹ️', msg);
  }
});

async function runTests() {
  console.log('🌍 Testing GeoTIFF export capabilities...\n');
  
  await sleep(3000);
  
  // Initialize
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {} },
    id: 1
  }) + '\n');
  
  await sleep(2000);
  
  // Test 1: Export small area as GeoTIFF
  console.log('📤 Test 1: Export GeoTIFF of San Francisco (5km radius)...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'export_geotiff',
      arguments: {
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        startDate: '2024-06-01',
        endDate: '2024-06-30',
        region: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]  // San Francisco
        },
        bands: ['B4', 'B3', 'B2', 'B8'],  // RGB + NIR
        scale: 10,  // 10m resolution
        fileName: 'san_francisco_sentinel2_composite',
        crs: 'EPSG:4326'
      }
    },
    id: 2
  }) + '\n');
  
  await sleep(5000);
  
  // Test 2: Export specific bands for analysis
  console.log('\n📤 Test 2: Export vegetation bands for NDVI analysis...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'export_geotiff',
      arguments: {
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        startDate: '2024-06-01',
        endDate: '2024-06-30',
        region: {
          type: 'Polygon',
          coordinates: [[
            [-122.45, 37.75],
            [-122.40, 37.75],
            [-122.40, 37.80],
            [-122.45, 37.80],
            [-122.45, 37.75]
          ]]
        },
        bands: ['B8', 'B4'],  // NIR and Red for NDVI
        scale: 20,  // 20m resolution for larger area
        fileName: 'vegetation_analysis_bands'
      }
    },
    id: 3
  }) + '\n');
  
  await sleep(5000);
  
  // Test 3: Export all bands
  console.log('\n📤 Test 3: Export all spectral bands...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'export_geotiff',
      arguments: {
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        startDate: '2024-06-01',
        endDate: '2024-06-30',
        region: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        scale: 10,
        fileName: 'all_bands_composite'
        // No bands specified = export all bands
      }
    },
    id: 4
  }) + '\n');
  
  await sleep(5000);
  
  console.log('\n✨ Export tests complete!');
  console.log('\n📝 Instructions:');
  console.log('1. Click the download URLs above to save GeoTIFF files');
  console.log('2. Open files in QGIS, ArcGIS, or any GIS software');
  console.log('3. Files contain full georeferencing information');
  console.log('4. Use for analysis, machine learning, or further processing');
  
  process.exit(0);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

setTimeout(runTests, 1000);
