#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🖼️ Testing Thumbnail Generation');
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
          if (result.thumbnailUrl) {
            console.log('\n✅ Thumbnail URL Generated!');
            console.log('📸 View your image here:');
            console.log(result.thumbnailUrl);
            console.log('\n💡 Copy and paste this URL in your browser to see the image');
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

async function runTest() {
  console.log('🌍 Creating San Francisco composite thumbnail...\n');
  
  await sleep(3000);
  
  // Initialize
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {} },
    id: 1
  }) + '\n');
  
  await sleep(2000);
  
  // Generate thumbnail
  console.log('📤 Requesting thumbnail for San Francisco Sentinel-2 composite...');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'get_thumbnail',
      arguments: {
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        region: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        dimensions: '1024x768',
        format: 'png',
        visParams: {
          bands: ['B8', 'B4', 'B3'],  // False color: NIR-Red-Green
          min: 0,
          max: 0.3
        }
      }
    },
    id: 2
  }) + '\n');
  
  await sleep(5000);
  
  console.log('\n✨ Test complete! Check the URL above.');
  process.exit(0);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

setTimeout(runTest, 1000);
