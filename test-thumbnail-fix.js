// Test script to verify thumbnail visualization fix
require('dotenv').config();

// Set environment variable if not set
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json';
}

const { initializeEarthEngine, getEarthEngine } = require('./src/earth-engine/init');
const { createComposite } = require('./src/earth-engine/tools-complete');

async function testThumbnailFix() {
  console.log('Testing Sentinel-2 thumbnail visualization fix...\n');
  console.log('Using key:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  
  try {
    // Initialize Earth Engine
    await initializeEarthEngine(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    console.log('✓ Earth Engine initialized\n');
    
    // Test parameters for Los Angeles area
    const params = {
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      region: 'los angeles',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      method: 'median',
      cloudMask: true,
      visualization: true
    };
    
    console.log('Creating composite with parameters:');
    console.log(JSON.stringify(params, null, 2));
    console.log('\n');
    
    // Create composite and get thumbnail
    const result = await createComposite(params);
    
    if (result.success && result.thumbnailUrl) {
      console.log('✓ Composite created successfully!');
      console.log('✓ Thumbnail URL generated:');
      console.log(result.thumbnailUrl);
      console.log('\nVisualization should now show proper colors:');
      console.log('- Water bodies: Dark blue/black');
      console.log('- Vegetation: Green');
      console.log('- Urban/Bare soil: Brown/tan');
      console.log('- No more fully black images!');
      console.log('\nOpen the URL above in your browser to verify the fix.');
    } else {
      console.log('✗ Failed to create composite');
      console.log(result);
    }
    
  } catch (error) {
    console.error('✗ Error during test:', error);
  }
}

// Run the test
testThumbnailFix();
