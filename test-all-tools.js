const http = require('http');

// Test helper function
async function testTool(toolName, args, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${description}`);
  console.log(`Tool: ${toolName}`);
  console.log(`Args:`, JSON.stringify(args, null, 2));
  console.log('-'.repeat(60));
  
  return new Promise((resolve) => {
    const data = JSON.stringify({
      tool: toolName,
      arguments: args
    });
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/mcp/sse',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log(`✅ SUCCESS`);
          try {
            const result = JSON.parse(body);
            // Show abbreviated response
            const responseStr = JSON.stringify(result);
            if (responseStr.length > 500) {
              console.log(`Response: ${responseStr.substring(0, 500)}...`);
            } else {
              console.log(`Response:`, result);
            }
          } catch (e) {
            console.log(`Response: ${body.substring(0, 500)}...`);
          }
        } else {
          console.log(`❌ FAILED`);
          console.log(`Error: ${body}`);
        }
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Connection error: ${err.message}`);
      resolve();
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      console.log(`❌ Request timeout`);
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Earth Engine MCP Tools Test Suite\n');
  
  // Test 1: Convert place to shapefile geometry
  await testTool(
    'convert_place_to_shapefile_geometry',
    { placeName: 'Los Angeles' },
    'Convert Los Angeles to shapefile geometry'
  );
  
  // Test 2: Filter collection by date and region with place name
  await testTool(
    'filter_collection_by_date_and_region',
    {
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      start: '2024-01-01',
      end: '2024-01-31',
      aoi: 'San Francisco',
      placeName: 'San Francisco'
    },
    'Filter Sentinel-2 collection for San Francisco in January 2024'
  );
  
  // Test 3: Search GEE catalog
  await testTool(
    'search_gee_catalog',
    { query: 'Sentinel-2' },
    'Search for Sentinel-2 datasets'
  );
  
  // Test 4: Create clean mosaic
  await testTool(
    'create_clean_mosaic',
    {
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      start: '2024-01-01',
      end: '2024-01-31'
    },
    'Create median composite for Sentinel-2'
  );
  
  // Test 5: Calculate spectral index
  await testTool(
    'calculate_spectral_index',
    {
      imageId: 'COPERNICUS/S2_SR_HARMONIZED/20240115T183921_20240115T184507_T10SEG',
      index: 'NDVI'
    },
    'Calculate NDVI for a Sentinel-2 image'
  );
  
  // Test 6: Get thumbnail with coordinates
  await testTool(
    'get_thumbnail_image',
    {
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      start: '2024-01-01',
      end: '2024-01-31',
      aoi: '-122.4194, 37.7749'  // San Francisco coordinates
    },
    'Get thumbnail for San Francisco area (using coordinates)'
  );
  
  // Test 7: Export image (this will just validate, not actually export)
  await testTool(
    'export_image_to_cloud_storage',
    {
      imageId: 'COPERNICUS/S2_SR_HARMONIZED/20240115T183921_20240115T184507_T10SEG',
      region: 'Los Angeles'
    },
    'Export Sentinel-2 image for Los Angeles region'
  );
  
  // Test 8: Filter with coordinates instead of place name
  await testTool(
    'filter_collection_by_date_and_region',
    {
      datasetId: 'LANDSAT/LC08/C02/T1_L2',
      start: '2024-06-01',
      end: '2024-06-30',
      aoi: '-118.2437, 34.0522',  // LA coordinates
      placeName: '-118.2437, 34.0522'
    },
    'Filter Landsat 8 collection using coordinates'
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test Suite Completed!');
  console.log('='.repeat(60) + '\n');
}

// Run tests
runAllTests().catch(console.error);
