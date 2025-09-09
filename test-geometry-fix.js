// Test script for geometry parsing fix
const testGeometryParsing = async () => {
  const endpoint = 'http://localhost:3000/api/mcp/sse';
  
  // Test 1: Place name as string (should work)
  console.log('\n=== Test 1: Place name as string ===');
  try {
    const response1 = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'filter_collection_by_date_and_region',
        arguments: {
          datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
          start: '2025-01-01',
          end: '2025-01-31',
          aoi: 'Ludhiana'
        }
      })
    });
    const result1 = await response1.json();
    console.log('Result:', result1);
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Test 2: Geometry as JSON string (should work now)
  console.log('\n=== Test 2: Geometry as JSON string ===');
  const testPolygon = {
    type: 'Polygon',
    coordinates: [[
      [-122.5, 37.7],
      [-122.5, 37.8],
      [-122.4, 37.8],
      [-122.4, 37.7],
      [-122.5, 37.7]
    ]]
  };
  
  try {
    const response2 = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'filter_collection_by_date_and_region',
        arguments: {
          datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
          start: '2025-01-01',
          end: '2025-01-31',
          aoi: JSON.stringify(testPolygon)
        }
      })
    });
    const result2 = await response2.json();
    console.log('Result:', result2);
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Test 3: Coordinates as string (should work)
  console.log('\n=== Test 3: Coordinates as string ===');
  try {
    const response3 = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'filter_collection_by_date_and_region',
        arguments: {
          datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
          start: '2025-01-01',
          end: '2025-01-31',
          aoi: '-122.4194, 37.7749'  // San Francisco coordinates
        }
      })
    });
    const result3 = await response3.json();
    console.log('Result:', result3);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testGeometryParsing().catch(console.error);
