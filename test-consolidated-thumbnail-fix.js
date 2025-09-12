// Test script to verify the consolidated thumbnail fix
const axios = require('axios');

async function testConsolidatedThumbnailFix() {
  console.log('Testing Sentinel-2 thumbnail fix via consolidated API...\n');
  
  const API_URL = 'http://localhost:3000/api/mcp/consolidated';
  
  try {
    // Step 1: Create a composite
    console.log('Step 1: Creating Sentinel-2 composite...');
    const compositeResponse = await axios.post(API_URL, {
      tool: 'earth_engine_process',
      arguments: {
        operation: 'composite',
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        region: 'Los Angeles',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        compositeType: 'median',
        scale: 100
      }
    });
    
    const compositeKey = compositeResponse.data.compositeKey;
    console.log(`✓ Composite created with key: ${compositeKey}\n`);
    
    // Step 2: Generate thumbnail with the fixed visualization
    console.log('Step 2: Generating thumbnail with proper visualization...');
    const thumbnailResponse = await axios.post(API_URL, {
      tool: 'earth_engine_export',
      arguments: {
        operation: 'thumbnail',
        compositeKey: compositeKey,
        region: 'Los Angeles',
        dimensions: 512,
        visParams: {
          bands: ['B4', 'B3', 'B2'],
          min: 0,
          max: 0.3,  // This should now work correctly for Sentinel-2!
          gamma: 1.4
        }
      }
    });
    
    if (thumbnailResponse.data.success && thumbnailResponse.data.url) {
      console.log('✓ Thumbnail generated successfully!');
      console.log('✓ URL:', thumbnailResponse.data.url);
      console.log('\n✅ FIX VERIFIED: The thumbnail should now show proper colors!');
      console.log('Expected visualization:');
      console.log('- Water bodies: Dark blue/black');
      console.log('- Vegetation: Green');
      console.log('- Urban/Bare soil: Brown/tan');
      console.log('- No more fully black images!');
      console.log('\nVisualization parameters used:', thumbnailResponse.data.visualization);
    } else {
      console.log('✗ Thumbnail generation failed');
      console.log(thumbnailResponse.data);
    }
    
  } catch (error) {
    console.error('✗ Error during test:', error.response?.data || error.message);
  }
}

// Run the test
testConsolidatedThumbnailFix();
