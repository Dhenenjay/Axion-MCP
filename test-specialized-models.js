/**
 * Test all specialized Earth Engine models
 * Run this after starting the Next.js server
 */

const testModels = async () => {
  const BASE_URL = 'http://localhost:3000/api/mcp/consolidated';
  
  const tests = [
    {
      name: 'Wildfire Risk Assessment - California',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'wildfire',
          region: 'California',
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          scale: 500
        }
      }
    },
    {
      name: 'Flood Risk Assessment - Houston',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'flood',
          region: 'Houston',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          floodType: 'urban',
          scale: 100
        }
      }
    },
    {
      name: 'Agricultural Monitoring - Iowa',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'agriculture',
          region: 'Iowa',
          startDate: '2024-04-01',
          endDate: '2024-09-30',
          cropType: 'corn',
          scale: 30
        }
      }
    },
    {
      name: 'Deforestation Detection - Amazon',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'deforestation',
          region: 'Amazon',
          baselineStart: '2020-01-01',
          baselineEnd: '2020-12-31',
          currentStart: '2024-01-01',
          currentEnd: '2024-12-31',
          scale: 30
        }
      }
    },
    {
      name: 'Water Quality Assessment - Lake Tahoe',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'water_quality',
          region: 'Lake Tahoe',
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          waterBody: 'lake',
          scale: 30
        }
      }
    }
  ];
  
  console.log('🚀 Testing all specialized Earth Engine models...\n');
  
  let successCount = 0;
  let failCount = 0;
  const results = [];
  
  for (const test of tests) {
    console.log(`\n📊 Testing: ${test.name}`);
    console.log('━'.repeat(50));
    
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.request)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ SUCCESS!');
        console.log(`   Model Type: ${result.modelType}`);
        console.log(`   Model Key: ${result.modelKey}`);
        console.log(`   Message: ${result.message}`);
        console.log(`   Region: ${result.region}`);
        
        if (result.riskLevels || result.healthLevels || result.qualityLevels || result.changeLevels) {
          console.log(`   Levels:`, result.riskLevels || result.healthLevels || result.qualityLevels || result.changeLevels);
        }
        
        if (result.visualization) {
          console.log(`   Visualization ready with palette:`, result.visualization.palette);
        }
        
        successCount++;
        results.push({ test: test.name, status: 'SUCCESS', modelKey: result.modelKey });
        
        // Test thumbnail generation for successful models
        if (result.modelKey) {
          console.log(`\n   🖼️  Testing thumbnail generation...`);
          const thumbRequest = {
            tool: 'earth_engine_export',
            arguments: {
              operation: 'thumbnail',
              input: result.modelKey,
              dimensions: 256,
              visParams: result.visualization
            }
          };
          
          const thumbResponse = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(thumbRequest)
          });
          
          const thumbResult = await thumbResponse.json();
          if (thumbResult.success && thumbResult.url) {
            console.log(`   ✅ Thumbnail generated successfully!`);
            console.log(`   📍 URL: ${thumbResult.url.substring(0, 80)}...`);
          } else {
            console.log(`   ⚠️  Thumbnail generation failed`);
          }
        }
      } else {
        console.log('❌ FAILED!');
        console.log(`   Error: ${result.error || result.message}`);
        failCount++;
        results.push({ test: test.name, status: 'FAILED', error: result.error });
      }
    } catch (error) {
      console.log('❌ ERROR!');
      console.log(`   ${error.message}`);
      failCount++;
      results.push({ test: test.name, status: 'ERROR', error: error.message });
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📈 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Success Rate: ${((successCount / tests.length) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  results.forEach((r, i) => {
    const icon = r.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${i + 1}. ${icon} ${r.test}`);
    if (r.modelKey) {
      console.log(`   └─ Model Key: ${r.modelKey}`);
    }
    if (r.error) {
      console.log(`   └─ Error: ${r.error}`);
    }
  });
  
  if (successCount === tests.length) {
    console.log('\n🎉 All specialized models are working perfectly!');
  } else {
    console.log('\n⚠️  Some models need attention. Check the errors above.');
  }
};

// Run tests
console.log('Earth Engine MCP - Specialized Models Test Suite');
console.log('================================================\n');
console.log('Make sure the Next.js server is running on http://localhost:3000\n');

testModels().catch(console.error);
