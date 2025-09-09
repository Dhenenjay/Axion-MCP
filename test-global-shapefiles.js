#!/usr/bin/env node

// Test script for global shapefile functionality
const { spawn } = require('child_process');
const readline = require('readline');

console.log('🌍 Testing Global Shapefile Functionality');
console.log('==========================================\n');

// Start the MCP server
const server = spawn('node', ['mcp-global.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let requestId = 1;

// Create readline interface for server output
const rl = readline.createInterface({
  input: server.stdout,
  output: process.stdout,
  terminal: false
});

// Capture stderr for debugging
server.stderr.on('data', (data) => {
  console.error(`[Server]: ${data.toString().trim()}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Send request to server
function sendRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = requestId++;
    const request = {
      jsonrpc: '2.0',
      id: id,
      method: method,
      params: params
    };
    
    console.log(`\n📤 Sending: ${method}`);
    if (params.name) console.log(`   Tool: ${params.name}`);
    if (params.arguments) console.log(`   Args:`, params.arguments);
    
    server.stdin.write(JSON.stringify(request) + '\n');
    
    // Set up one-time listener for this specific response
    const handleLine = (line) => {
      try {
        const response = JSON.parse(line);
        if (response.id === id) {
          rl.removeListener('line', handleLine);
          if (response.error) {
            console.log(`❌ Error: ${response.error.message}`);
            reject(response.error);
          } else {
            console.log(`✅ Success`);
            resolve(response.result);
          }
        }
      } catch (e) {
        // Not JSON, ignore
      }
    };
    
    rl.on('line', handleLine);
    
    // Timeout after 30 seconds
    setTimeout(() => {
      rl.removeListener('line', handleLine);
      reject(new Error('Request timeout'));
    }, 30000);
  });
}

// Test locations
const testLocations = [
  // International Cities
  { name: 'Paris', description: 'Capital of France' },
  { name: 'Paris, France', description: 'City with country context' },
  { name: 'Tokyo', description: 'Capital of Japan' },
  { name: 'Tokyo, Japan', description: 'City with country context' },
  { name: 'Mumbai', description: 'Major city in India' },
  { name: 'São Paulo', description: 'Largest city in Brazil' },
  { name: 'London', description: 'Capital of UK' },
  { name: 'Berlin', description: 'Capital of Germany' },
  { name: 'Sydney', description: 'Major city in Australia' },
  { name: 'Cairo', description: 'Capital of Egypt' },
  { name: 'Mexico City', description: 'Capital of Mexico' },
  { name: 'Singapore', description: 'City-state' },
  
  // Countries
  { name: 'France', description: 'European country' },
  { name: 'Japan', description: 'Asian country' },
  { name: 'Brazil', description: 'South American country' },
  { name: 'India', description: 'South Asian country' },
  { name: 'Australia', description: 'Oceanian country' },
  { name: 'Kenya', description: 'African country' },
  
  // US Cities (should still work)
  { name: 'New York', description: 'US city' },
  { name: 'Los Angeles', description: 'US city' },
  { name: 'Chicago', description: 'US city' }
];

async function runTests() {
  try {
    // Wait for server to initialize
    console.log('⏳ Waiting for server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Initialize connection
    console.log('\n📡 Initializing connection...');
    await sendRequest('initialize');
    
    // Get tool list
    console.log('\n📋 Getting tool list...');
    const toolsResponse = await sendRequest('tools/list');
    console.log(`   Found ${toolsResponse.tools.length} tools`);
    
    // Test shapefile conversion for each location
    console.log('\n🧪 Testing Shapefile Conversions:');
    console.log('===================================');
    
    const results = [];
    
    for (const location of testLocations) {
      console.log(`\n📍 Testing: ${location.name} (${location.description})`);
      
      try {
        const result = await sendRequest('tools/call', {
          name: 'convert_place_to_shapefile_geometry',
          arguments: {
            place_name: location.name
          }
        });
        
        // Parse the result
        const data = JSON.parse(result.content[0].text);
        
        if (data.success) {
          console.log(`   ✅ Found: ${data.level} from ${data.dataset}`);
          console.log(`   📏 Area: ${data.area_km2} km²`);
          console.log(`   📍 Centroid: ${data.centroid.lat.toFixed(2)}°, ${data.centroid.lon.toFixed(2)}°`);
          results.push({ location: location.name, success: true, data });
        } else {
          console.log(`   ❌ Failed: ${data.error}`);
          results.push({ location: location.name, success: false, error: data.error });
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({ location: location.name, success: false, error: error.message });
      }
    }
    
    // Test filtering with international location
    console.log('\n🧪 Testing Collection Filtering with International Location:');
    console.log('==========================================================');
    
    try {
      const filterResult = await sendRequest('tools/call', {
        name: 'filter_collection_by_date_and_region',
        arguments: {
          collection_id: 'COPERNICUS/S2_SR_HARMONIZED',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          region: 'Paris, France',
          cloud_cover_max: 20
        }
      });
      
      const data = JSON.parse(filterResult.content[0].text);
      if (data.success) {
        console.log(`   ✅ Found ${data.count} images for Paris, France`);
      } else {
        console.log(`   ❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test NDVI calculation with international location
    console.log('\n🧪 Testing NDVI Calculation for Tokyo:');
    console.log('=====================================');
    
    try {
      const ndviResult = await sendRequest('tools/call', {
        name: 'calculate_ndvi',
        arguments: {
          region: 'Tokyo, Japan',
          satellite: 'sentinel2'
        }
      });
      
      const data = JSON.parse(ndviResult.content[0].text);
      if (data.success) {
        console.log(`   ✅ NDVI Stats for Tokyo:`);
        console.log(`      Mean: ${data.ndvi_stats.mean?.toFixed(3) || 'N/A'}`);
        console.log(`      Min: ${data.ndvi_stats.min?.toFixed(3) || 'N/A'}`);
        console.log(`      Max: ${data.ndvi_stats.max?.toFixed(3) || 'N/A'}`);
      } else {
        console.log(`   ❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`   ✅ Successful: ${successful}/${results.length}`);
    console.log(`   ❌ Failed: ${failed}/${results.length}`);
    
    if (successful > 0) {
      console.log('\n🌍 Successfully tested locations:');
      results.filter(r => r.success).forEach(r => {
        console.log(`   • ${r.location}: ${r.data.level} (${r.data.area_km2} km²)`);
      });
    }
    
    if (failed > 0) {
      console.log('\n❌ Failed locations:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   • ${r.location}: ${r.error}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Clean up
    console.log('\n🛑 Shutting down server...');
    server.kill();
    process.exit(0);
  }
}

// Run tests
runTests();
