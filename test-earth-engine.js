#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🌍 Testing Earth Engine MCP Server End-to-End');
console.log('===========================================\n');

// Start the MCP server
const server = spawn('node', ['mcp-earth-engine.js'], {
  cwd: __dirname,
  env: {
    ...process.env,
    EARTH_ENGINE_PRIVATE_KEY: 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json'
  }
});

let responseBuffer = '';

// Handle server output
server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  try {
    const lines = responseBuffer.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i].trim()) {
        const response = JSON.parse(lines[i]);
        console.log('✅ Response:', JSON.stringify(response, null, 2));
      }
    }
    responseBuffer = lines[lines.length - 1];
  } catch (e) {
    // Buffer incomplete
  }
});

server.stderr.on('data', (data) => {
  console.log('ℹ️ Server:', data.toString().trim());
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Test sequence
async function runTests() {
  console.log('📝 Starting test sequence...\n');
  
  // Wait for server to start
  await sleep(2000);
  
  // Test 1: Initialize
  console.log('Test 1: Initialize');
  sendMessage({
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {}
    },
    id: 1
  });
  await sleep(2000);
  
  // Test 2: List tools
  console.log('\nTest 2: List tools');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: 2
  });
  await sleep(1000);
  
  // Test 3: Search catalog
  console.log('\nTest 3: Search Earth Engine catalog for Sentinel-2');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'search_catalog',
      arguments: {
        query: 'sentinel-2'
      }
    },
    id: 3
  });
  await sleep(2000);
  
  // Test 4: Get band names
  console.log('\nTest 4: Get band names for Sentinel-2');
  sendMessage({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'get_band_names',
      arguments: {
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED'
      }
    },
    id: 4
  });
  await sleep(3000);
  
  // Test 5: Filter collection
  console.log('\nTest 5: Filter Sentinel-2 collection');
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
          coordinates: [-122.4194, 37.7749] // San Francisco
        }
      }
    },
    id: 5
  });
  await sleep(3000);
  
  console.log('\n✨ Tests complete!');
  console.log('Press Ctrl+C to exit.\n');
}

function sendMessage(message) {
  const msgStr = JSON.stringify(message);
  console.log('📤 Sending:', msgStr);
  server.stdin.write(msgStr + '\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
setTimeout(runTests, 1000);
