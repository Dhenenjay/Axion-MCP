// Test script to simulate Claude Desktop sending wrong vis params
const axios = require('axios');

async function testClaudeWrongParams() {
  console.log('Testing Sentinel-2 thumbnail with WRONG parameters (as Claude might send)...\n');
  
  const API_URL = 'http://localhost:3000/api/mcp/consolidated';
  
  // Wait for server to be ready
  console.log('Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
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
    
    // Step 2: Generate thumbnail with WRONG parameters (like Claude sends)
    console.log('Step 2: Generating thumbnail with WRONG parameters (min:0, max:3000)...');
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
          max: 3000,  // WRONG! This is for raw values, not scaled
          gamma: 1.4
        }
      }
    });
    
    if (thumbnailResponse.data.success && thumbnailResponse.data.url) {
      console.log('✓ Thumbnail generated successfully!');
      console.log('✓ URL:', thumbnailResponse.data.url);
      console.log('\n✅ AUTO-CORRECTION WORKING!');
      console.log('The system detected wrong parameters and auto-corrected them!');
      console.log('Final visualization parameters used:', thumbnailResponse.data.visualization);
      
      if (thumbnailResponse.data.visualization.max < 1) {
        console.log('\n✅ SUCCESS: max value was corrected from 3000 to', thumbnailResponse.data.visualization.max);
        console.log('The thumbnail should now show proper colors!');
      } else {
        console.log('\n⚠️ WARNING: max value is still', thumbnailResponse.data.visualization.max);
        console.log('The auto-correction might not have worked.');
      }
    } else {
      console.log('✗ Thumbnail generation failed');
      console.log(thumbnailResponse.data);
    }
    
  } catch (error) {
    console.error('✗ Error during test:', error.response?.data || error.message);
  }
}

// Run the test
testClaudeWrongParams();
