// Test script simulating Claude Desktop's exact request pattern
const axios = require('axios');

async function testClaudeExactPattern() {
  console.log('Testing Claude Desktop exact pattern with composite key as input...\n');
  
  const API_URL = 'http://localhost:3000/api/mcp/consolidated';
  
  // Wait for server to be ready
  console.log('Waiting for server to compile (15 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  try {
    // Step 1: Create a composite (like Claude does)
    console.log('Step 1: Creating Sentinel-2 composite...');
    const compositeResponse = await axios.post(API_URL, {
      tool: 'earth_engine_process',
      arguments: {
        operation: 'composite',
        datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
        compositeType: 'median',
        region: 'Los Angeles',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        scale: 100
      }
    });
    
    const compositeKey = compositeResponse.data.compositeKey;
    console.log(`✓ Composite created with key: ${compositeKey}\n`);
    
    // Step 2: Generate thumbnail EXACTLY like Claude does (input as string, wrong vis params)
    console.log('Step 2: Testing with Claude\'s exact parameters...');
    console.log('Sending: input="' + compositeKey + '", max=3000 (WRONG!)');
    
    const thumbnailResponse = await axios.post(API_URL, {
      tool: 'earth_engine_export',
      arguments: {
        operation: 'thumbnail',
        input: compositeKey,  // Claude sends composite key as "input" string
        region: 'Los Angeles',
        dimensions: 512,
        visParams: {
          bands: ['B4', 'B3', 'B2'],
          min: 0,
          max: 3000,  // Claude sends this WRONG value
          gamma: 1.4
        }
      }
    });
    
    if (thumbnailResponse.data.success) {
      console.log('\n✅ THUMBNAIL GENERATED!');
      console.log('URL:', thumbnailResponse.data.url);
      console.log('\nFinal visualization used:', JSON.stringify(thumbnailResponse.data.visualization, null, 2));
      
      if (thumbnailResponse.data.visualization.max <= 1) {
        console.log('\n🎉 SUCCESS! Auto-correction worked!');
        console.log(`   max was corrected: 3000 → ${thumbnailResponse.data.visualization.max}`);
        console.log('   The thumbnail should now show proper colors!');
      } else {
        console.log('\n⚠️ WARNING: max value is still high:', thumbnailResponse.data.visualization.max);
        console.log('   The image might still appear grayscale.');
      }
    }
    
    // Test 3: Also test False Color Composite like in your logs
    console.log('\n\nStep 3: Testing False Color Composite (B8,B4,B3) with max=4000...');
    const fccResponse = await axios.post(API_URL, {
      tool: 'earth_engine_export',
      arguments: {
        dimensions: 512,
        input: compositeKey,
        operation: 'thumbnail',
        region: 'Los Angeles',
        visParams: {
          max: 4000,  // Even worse!
          min: 0,
          bands: ['B8', 'B4', 'B3'],
          gamma: 1.2
        }
      }
    });
    
    if (fccResponse.data.success) {
      console.log('✓ FCC thumbnail generated');
      console.log('Final max used:', fccResponse.data.visualization.max);
      if (fccResponse.data.visualization.max <= 1) {
        console.log('🎉 FCC auto-correction also worked!');
      }
    }
    
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
}

// Run the test
testClaudeExactPattern();
