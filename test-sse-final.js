// Final Comprehensive SSE Endpoint Test - High Stakes!
// This must pass 100% for production use

async function runComprehensiveSSETest() {
    const baseUrl = 'http://localhost:3000/api/mcp/sse';
    
    console.log('');
    console.log('================================================');
    console.log('  EARTH ENGINE SSE ENDPOINT - FINAL TEST');
    console.log('  High Stakes Production Verification');
    console.log('================================================');
    console.log('');
    
    const allTests = [
        // ============ DATA OPERATIONS ============
        {
            category: 'DATA',
            name: 'Search Sentinel-2 datasets',
            body: {
                tool: 'earth_engine_data',
                arguments: { operation: 'search', query: 'sentinel-2', limit: 5 }
            }
        },
        {
            category: 'DATA',
            name: 'Search Landsat datasets',
            body: {
                tool: 'earth_engine_data',
                arguments: { operation: 'search', query: 'landsat', limit: 3 }
            }
        },
        {
            category: 'DATA',
            name: 'Get Sentinel-2 dataset info',
            body: {
                tool: 'earth_engine_data',
                arguments: { operation: 'info', datasetId: 'COPERNICUS/S2_SR_HARMONIZED' }
            }
        },
        {
            category: 'DATA',
            name: 'Filter collection by date',
            body: {
                tool: 'earth_engine_data',
                arguments: {
                    operation: 'filter',
                    datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
                    startDate: '2024-06-01',
                    endDate: '2024-06-30'
                }
            }
        },
        {
            category: 'DATA',
            name: 'Filter with cloud cover',
            body: {
                tool: 'earth_engine_data',
                arguments: {
                    operation: 'filter',
                    datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
                    startDate: '2024-06-01',
                    endDate: '2024-06-30',
                    cloudCoverMax: 20
                }
            }
        },
        // ============ GEOMETRY OPERATIONS ============
        {
            category: 'GEOMETRY',
            name: 'Get San Francisco boundary',
            body: {
                tool: 'earth_engine_data',
                arguments: { operation: 'geometry', placeName: 'San Francisco' }
            }
        },
        {
            category: 'GEOMETRY',
            name: 'Get coordinates geometry',
            body: {
                tool: 'earth_engine_data',
                arguments: { operation: 'geometry', coordinates: [-122.4194, 37.7749] }
            }
        },
        // ============ GLOBAL LOCATIONS ============
        {
            category: 'GLOBAL',
            name: 'Find New York',
            body: {
                tool: 'earth_engine_data',
                arguments: { operation: 'geometry', placeName: 'New York' }
            }
        },
        {
            category: 'GLOBAL',
            name: 'Find London',
            body: {
                tool: 'earth_engine_data',
                arguments: { operation: 'geometry', placeName: 'London' }
            }
        },
        {
            category: 'GLOBAL',
            name: 'Find Tokyo',
            body: {
                tool: 'earth_engine_data',
                arguments: { operation: 'geometry', placeName: 'Tokyo' }
            }
        },
        {
            category: 'GLOBAL',
            name: 'Find Sydney',
            body: {
                tool: 'earth_engine_data',
                arguments: { operation: 'geometry', placeName: 'Sydney' }
            }
        },
        {
            category: 'GLOBAL',
            name: 'Find Mumbai',
            body: {
                tool: 'earth_engine_data',
                arguments: { operation: 'geometry', placeName: 'Mumbai' }
            }
        },
        {
            category: 'GLOBAL',
            name: 'Find Paris',
            body: {
                tool: 'earth_engine_data',
                arguments: { operation: 'geometry', placeName: 'Paris' }
            }
        },
        // ============ SYSTEM OPERATIONS ============
        {
            category: 'SYSTEM',
            name: 'Check authentication',
            body: {
                tool: 'earth_engine_system',
                arguments: { operation: 'auth' }
            }
        },
        {
            category: 'SYSTEM',
            name: 'Get help information',
            body: {
                tool: 'earth_engine_system',
                arguments: { operation: 'help' }
            }
        },
        {
            category: 'SYSTEM',
            name: 'Execute EE code',
            body: {
                tool: 'earth_engine_system',
                arguments: {
                    operation: 'execute',
                    code: 'const point = ee.Geometry.Point([0, 0]); return point.buffer(1000).area();'
                }
            }
        },
        // ============ PROCESSING OPERATIONS ============
        {
            category: 'PROCESS',
            name: 'Calculate NDVI',
            body: {
                tool: 'earth_engine_process',
                arguments: {
                    operation: 'index',
                    indexType: 'NDVI',
                    datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
                    startDate: '2024-06-01',
                    endDate: '2024-06-30',
                    region: 'San Francisco'
                }
            }
        },
        {
            category: 'PROCESS',
            name: 'Calculate NDWI',
            body: {
                tool: 'earth_engine_process',
                arguments: {
                    operation: 'index',
                    indexType: 'NDWI',
                    datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
                    startDate: '2024-06-01',
                    endDate: '2024-06-30'
                }
            }
        },
        {
            category: 'PROCESS',
            name: 'Cloud masking',
            body: {
                tool: 'earth_engine_process',
                arguments: {
                    operation: 'mask',
                    maskType: 'cloud',
                    datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
                    startDate: '2024-06-01',
                    endDate: '2024-06-30'
                }
            }
        },
        {
            category: 'PROCESS',
            name: 'Create composite',
            body: {
                tool: 'earth_engine_process',
                arguments: {
                    operation: 'composite',
                    datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
                    startDate: '2024-06-01',
                    endDate: '2024-06-30',
                    method: 'median'
                }
            }
        },
        // ============ EXPORT OPERATIONS ============
        {
            category: 'EXPORT',
            name: 'Generate thumbnail',
            body: {
                tool: 'earth_engine_export',
                arguments: {
                    operation: 'thumbnail',
                    datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
                    startDate: '2024-06-01',
                    endDate: '2024-06-30',
                    region: 'San Francisco',
                    dimensions: 512,
                    visParams: {
                        bands: ['B4', 'B3', 'B2'],
                        min: 0,
                        max: 3000
                    }
                }
            }
        },
        {
            category: 'EXPORT',
            name: 'Generate map tiles',
            body: {
                tool: 'earth_engine_export',
                arguments: {
                    operation: 'tiles',
                    datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
                    startDate: '2024-06-01',
                    endDate: '2024-06-30',
                    region: 'San Francisco',
                    zoomLevel: 10
                }
            }
        }
    ];
    
    const results = {
        passed: 0,
        failed: 0,
        byCategory: {}
    };
    
    // Run all tests
    for (const test of allTests) {
        if (!results.byCategory[test.category]) {
            results.byCategory[test.category] = { passed: 0, failed: 0 };
        }
        
        process.stdout.write(`[${test.category}] ${test.name}... `);
        
        try {
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(test.body)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (!result.error && result.success !== false) {
                    console.log('✓ PASS');
                    results.passed++;
                    results.byCategory[test.category].passed++;
                } else {
                    console.log(`✗ FAIL: ${result.error}`);
                    results.failed++;
                    results.byCategory[test.category].failed++;
                }
            } else {
                console.log(`✗ ERROR ${response.status}`);
                results.failed++;
                results.byCategory[test.category].failed++;
            }
        } catch (err) {
            console.log(`✗ EXCEPTION: ${err.message}`);
            results.failed++;
            results.byCategory[test.category].failed++;
        }
    }
    
    // Print detailed results
    console.log('');
    console.log('================================================');
    console.log('                CATEGORY BREAKDOWN');
    console.log('================================================');
    
    for (const [category, stats] of Object.entries(results.byCategory)) {
        const total = stats.passed + stats.failed;
        const rate = ((stats.passed / total) * 100).toFixed(0);
        console.log(`${category.padEnd(10)} : ${stats.passed}/${total} passed (${rate}%)`);
    }
    
    // Final verdict
    console.log('');
    console.log('================================================');
    console.log('                 FINAL RESULTS');
    console.log('================================================');
    
    const total = allTests.length;
    const passRate = ((results.passed / total) * 100).toFixed(1);
    
    console.log(`Total Tests : ${total}`);
    console.log(`Passed      : ${results.passed}`);
    console.log(`Failed      : ${results.failed}`);
    console.log(`Pass Rate   : ${passRate}%`);
    
    console.log('');
    if (passRate === '100.0') {
        console.log('✅ PERFECT! SSE endpoint is 100% functional!');
        console.log('✅ Ready for high-stakes production use!');
        console.log('✅ Users can confidently use this with their service account JSON!');
    } else if (passRate >= 95) {
        console.log('✅ EXCELLENT! SSE endpoint is production-ready!');
        console.log(`⚠️  Minor issues detected (${results.failed} failures)`);
    } else {
        console.log('❌ CRITICAL: SSE endpoint has issues!');
        console.log('❌ NOT ready for production use!');
    }
    
    console.log('');
    console.log('================================================');
    
    process.exit(results.failed > 0 ? 1 : 0);
}

// Run the test
runComprehensiveSSETest().catch(console.error);
