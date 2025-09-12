/**
 * Test Comprehensive Agricultural Model - All Use Cases
 */

const testAgriculture = async () => {
  const BASE_URL = 'http://localhost:3000/api/mcp/consolidated';
  
  const tests = [
    {
      name: 'Comprehensive Agricultural Analysis',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'agriculture',
          analysisType: 'comprehensive',
          region: 'Iowa',
          startDate: '2024-04-01',
          endDate: '2024-09-30',
          cropType: 'corn',
          scale: 30,
          includeWeather: true,
          includeSoil: true,
          yieldModel: true,
          irrigationAnalysis: true,
          diseaseRisk: true
        }
      }
    },
    {
      name: 'Yield Prediction Analysis',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'agriculture',
          analysisType: 'yield',
          region: 'Kansas',
          startDate: '2024-05-01',
          endDate: '2024-10-31',
          cropType: 'wheat',
          scale: 30
        }
      }
    },
    {
      name: 'Irrigation Management',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'agriculture',
          analysisType: 'irrigation',
          region: 'California',
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          cropType: 'vineyard',
          scale: 10
        }
      }
    },
    {
      name: 'Disease Risk Assessment',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'agriculture',
          analysisType: 'disease',
          region: 'Georgia',
          startDate: '2024-04-01',
          endDate: '2024-09-30',
          cropType: 'cotton',
          scale: 30
        }
      }
    },
    {
      name: 'Soil Properties Analysis',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'agriculture',
          analysisType: 'soil',
          region: 'North Dakota',
          startDate: '2024-04-01',
          endDate: '2024-05-31',
          cropType: 'soy',
          scale: 30
        }
      }
    },
    {
      name: 'Crop Phenology Tracking',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'agriculture',
          analysisType: 'phenology',
          region: 'Nebraska',
          startDate: '2024-03-01',
          endDate: '2024-10-31',
          cropType: 'corn',
          scale: 30
        }
      }
    },
    {
      name: 'Classification with Ground Truth',
      request: {
        tool: 'earth_engine_process',
        arguments: {
          operation: 'model',
          modelType: 'agriculture',
          analysisType: 'classification',
          region: 'Illinois',
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          classification: true,
          scale: 30
        }
      }
    }
  ];
  
  console.log('🌾 Testing Comprehensive Agricultural Model - All Use Cases\n');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  const results = [];
  
  for (const test of tests) {
    console.log(`\n📊 ${test.name}`);
    console.log('-'.repeat(50));
    
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.request)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ SUCCESS');
        console.log(`   Analysis Type: ${result.analysisType}`);
        console.log(`   Model Key: ${result.modelKey}`);
        console.log(`   Region: ${result.region}`);
        console.log(`   Date Range: ${result.dateRange.start} to ${result.dateRange.end}`);
        
        // Show specific analysis results
        if (result.yieldAnalysis) {
          console.log('   📈 Yield Features:', result.yieldAnalysis.features.join(', '));
        }
        if (result.irrigationAnalysis) {
          console.log('   💧 Irrigation Metrics:', result.irrigationAnalysis.metrics.join(', '));
        }
        if (result.diseaseAnalysis) {
          console.log('   🦠 Disease Risk Factors:', result.diseaseAnalysis.riskFactors.join(', '));
        }
        if (result.soilAnalysis) {
          console.log('   🌱 Soil Properties:', result.soilAnalysis.properties.join(', '));
        }
        if (result.phenologyAnalysis) {
          console.log('   📅 Phenology Stages:', result.phenologyAnalysis.stages.join(', '));
        }
        if (result.weatherAnalysis) {
          console.log('   ☁️ Weather Data: Precipitation and Temperature integrated');
        }
        if (result.classificationData) {
          console.log('   🤖 ML Features:', result.classificationData.features.length, 'features prepared');
        }
        
        // Show available indices
        if (result.availableIndices) {
          console.log('   📊 Indices:', result.availableIndices.length, 'vegetation indices calculated');
        }
        
        // Show insights
        if (result.insights) {
          const totalInsights = [
            ...result.insights.immediateActions,
            ...result.insights.monitoring,
            ...result.insights.planning
          ].length;
          if (totalInsights > 0) {
            console.log(`   💡 Insights: ${totalInsights} actionable recommendations`);
          }
        }
        
        // Show visualization options
        const visOptions = Object.keys(result.visualizations || {}).filter(k => result.visualizations[k]);
        if (visOptions.length > 0) {
          console.log('   🎨 Visualizations:', visOptions.join(', '));
        }
        
        successCount++;
        results.push({ 
          test: test.name, 
          status: 'SUCCESS',
          analysisType: result.analysisType,
          components: result.comprehensiveAnalysis?.componentsAnalyzed || []
        });
        
      } else {
        console.log('❌ FAILED');
        console.log(`   Error: ${result.error || result.message}`);
        results.push({ test: test.name, status: 'FAILED', error: result.error });
      }
    } catch (error) {
      console.log('❌ ERROR');
      console.log(`   ${error.message}`);
      results.push({ test: test.name, status: 'ERROR', error: error.message });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${tests.length - successCount}`);
  console.log(`Success Rate: ${((successCount / tests.length) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Test Results:');
  results.forEach((r, i) => {
    const icon = r.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${i + 1}. ${icon} ${r.test}`);
    if (r.analysisType) {
      console.log(`      Type: ${r.analysisType}`);
    }
    if (r.components && r.components.length > 0) {
      console.log(`      Components: ${r.components.join(', ')}`);
    }
    if (r.error) {
      console.log(`      Error: ${r.error}`);
    }
  });
  
  if (successCount === tests.length) {
    console.log('\n🎉 All agricultural use cases are working perfectly!');
    console.log('The model supports:');
    console.log('  • Comprehensive multi-component analysis');
    console.log('  • Yield prediction with growth indicators');
    console.log('  • Irrigation scheduling and water stress detection');
    console.log('  • Disease and pest risk assessment');
    console.log('  • Soil property estimation');
    console.log('  • Crop phenology tracking');
    console.log('  • Machine learning classification support');
  } else {
    console.log('\n⚠️ Some agricultural features need attention.');
  }
};

// Wait for server to be ready then run tests
console.log('Earth Engine MCP - Comprehensive Agricultural Model Test');
console.log('========================================================\n');
console.log('Waiting for server...\n');

setTimeout(() => {
  testAgriculture().catch(console.error);
}, 5000);
