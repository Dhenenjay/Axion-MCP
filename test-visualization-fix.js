#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🖼️ Testing Fixed Visualization');
console.log('================================\n');

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
          
          // Check for thumbnail URL
          if (result.thumbnailUrl) {
            console.log('\n✅ Thumbnail URL Generated!');
            console.log('📸 Direct viewable image:');
            console.log(result.thumbnailUrl);
            console.log('\n💡 This URL should show a properly lit image');
            console.log('🌈 Visualization parameters used:');
            console.log(`   Bands: ${result.visParams.bands.join(', ')}`);
            console.log(`   Min: ${result.visParams.min}, Max: ${result.visParams.max}`);
            if (result.visParams.gamma) {
              console.log(`   Gamma: ${result.visParams.gamma}`);
            }
          }
          
          // Check for composite map URL
          if (result.viewInBrowser) {
            console.log('\n🗺️ Composite Map Generated!');
            console.log('📍 Direct viewable composite:');
            console.log(result.viewInBrowser);
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
  console.log('🌍 Testing visualization with proper parameters...\n');
  
  await sleep(3000);
  
  // Initialize
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {} },
    id: 1
  }) + '\n');
  
  await sleep(2000);
  
  // Test 1: Get thumbnail with proper visualization
  console.log('📤 Test 1: Direct thumbnail with proper brightness...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'get_thumbnail',
      arguments: {
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        startDate: '2024-06-01',
        endDate: '2024-06-30',
        region: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]  // San Francisco
        },
        dimensions: '1024x768',
        format: 'png',
        visParams: {
          bands: ['B4', 'B3', 'B2'],  // True color
          min: 0,
          max: 3000,
          gamma: 1.4
        }
      }
    },
    id: 2
  }) + '\n');
  
  await sleep(5000);
  
  // Test 2: Get composite map with false color
  console.log('\n📤 Test 2: False color composite for vegetation...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'get_composite_map',
      arguments: {
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        startDate: '2024-06-01',
        endDate: '2024-06-30',
        region: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        visParams: {
          bands: ['B8', 'B4', 'B3'],  // NIR-Red-Green for vegetation
          min: 0,
          max: 3000,
          gamma: 1.4
        }
      }
    },
    id: 3
  }) + '\n');
  
  await sleep(5000);
  
  // Test 3: Get thumbnail with SWIR composite
  console.log('\n📤 Test 3: SWIR composite for land/water boundaries...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'get_thumbnail',
      arguments: {
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        startDate: '2024-06-01',
        endDate: '2024-06-30',
        region: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        dimensions: '1024x768',
        format: 'png',
        visParams: {
          bands: ['B12', 'B8A', 'B4'],  // SWIR-NIR-Red
          min: 0,
          max: 3000,
          gamma: 1.4
        }
      }
    },
    id: 4
  }) + '\n');
  
  await sleep(5000);
  
  console.log('\n✨ All visualization tests complete!');
  console.log('📋 Check the URLs above - they should all show properly lit images');
  console.log('🎨 Different band combinations show different features:');
  console.log('   • True Color (B4-B3-B2): Natural appearance');
  console.log('   • False Color (B8-B4-B3): Vegetation in red');
  console.log('   • SWIR (B12-B8A-B4): Water/land boundaries');
  
  process.exit(0);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

setTimeout(runTests, 1000);
