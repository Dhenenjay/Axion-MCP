#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🌍 Testing All Earth Engine MCP Tools');
console.log('=====================================\n');

// Start the MCP server
const server = spawn('node', ['mcp-earth-engine.js'], {
  cwd: __dirname,
  env: {
    ...process.env,
    EARTH_ENGINE_PRIVATE_KEY: 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json'
  }
});

let responseBuffer = '';
let testResults = [];

// Handle server output
server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  try {
    const lines = responseBuffer.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i].trim()) {
        const response = JSON.parse(lines[i]);
        if (response.result && response.id) {
          console.log(`✅ Test ${response.id} passed`);
          if (response.result.content) {
            console.log('   Result:', response.result.content[0].text.substring(0, 100) + '...\n');
          }
          testResults.push({ id: response.id, success: true });
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

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Test sequence
async function runTests() {
  console.log('📝 Starting comprehensive test sequence...\n');
  
  await sleep(3000);
  
  // Test 1: Initialize
  console.log('Test 1: Initialize server');
  sendMessage({
    jsonrpc: '2.0',
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {} },
    id: 1
  });
  await sleep(2000);
  
  // Test 2: List tools
  console.log('Test 2: List all available tools');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: 2
  });
  await sleep(1000);
  
  // Test 3: Search catalog
  console.log('Test 3: Search for Sentinel-2 datasets');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'search_catalog',
      arguments: { query: 'sentinel-2' }
    },
    id: 3
  });
  await sleep(2000);
  
  // Test 4: Get band names
  console.log('Test 4: Get Sentinel-2 band names');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'get_band_names',
      arguments: { datasetId: 'COPERNICUS/S2_SR_HARMONIZED' }
    },
    id: 4
  });
  await sleep(3000);
  
  // Test 5: Filter collection
  console.log('Test 5: Filter Sentinel-2 for San Francisco');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'filter_collection',
      arguments: {
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        region: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        }
      }
    },
    id: 5
  });
  await sleep(3000);
  
  // Test 6: Create composite
  console.log('Test 6: Create cloud-free composite');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'create_composite',
      arguments: {
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        region: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        method: 'median',
        cloudMask: true
      }
    },
    id: 6
  });
  await sleep(4000);
  
  // Test 7: Get composite map URL
  console.log('Test 7: Get composite visualization URL');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'get_composite_map',
      arguments: {
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        region: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        visParams: {
          bands: ['B4', 'B3', 'B2'],
          min: 0,
          max: 0.3
        }
      }
    },
    id: 7
  });
  await sleep(4000);
  
  // Test 8: Calculate NDVI
  console.log('Test 8: Calculate NDVI');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'calculate_ndvi',
      arguments: {
        imageId: 'COPERNICUS/S2_SR_HARMONIZED',
        redBand: 'B4',
        nirBand: 'B8'
      }
    },
    id: 8
  });
  await sleep(3000);
  
  // Test 9: Get regular map URL
  console.log('Test 9: Get standard visualization URL');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'get_map_url',
      arguments: {
        imageId: 'COPERNICUS/S2_SR_HARMONIZED',
        visParams: {
          bands: ['B4', 'B3', 'B2'],
          min: 0,
          max: 3000
        }
      }
    },
    id: 9
  });
  await sleep(3000);
  
  // Test 10: Calculate statistics
  console.log('Test 10: Calculate image statistics');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'calculate_statistics',
      arguments: {
        imageId: 'COPERNICUS/S2_SR_HARMONIZED',
        region: {
          type: 'Polygon',
          coordinates: [[
            [-122.5, 37.7],
            [-122.4, 37.7],
            [-122.4, 37.8],
            [-122.5, 37.8],
            [-122.5, 37.7]
          ]]
        },
        scale: 30
      }
    },
    id: 10
  });
  await sleep(3000);
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Total tests: 10`);
  console.log(`Passed: ${testResults.filter(r => r.success).length}`);
  console.log(`Failed: ${testResults.filter(r => !r.success).length}`);
  
  console.log('\n✨ All tests complete!');
  console.log('Press Ctrl+C to exit.\n');
}

function sendMessage(message) {
  const msgStr = JSON.stringify(message);
  console.log(`\n📤 Sending: ${message.method || 'tools/call'} (ID: ${message.id})`);
  server.stdin.write(msgStr + '\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
setTimeout(runTests, 1000);
