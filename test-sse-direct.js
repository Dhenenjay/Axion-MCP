// Direct test of SSE endpoint

async function testSSE() {
    const baseUrl = 'http://localhost:3000/api/mcp/sse';
    
    console.log('Testing SSE Endpoint');
    console.log('====================\n');
    
    const tests = [
        {
            name: 'Check authentication',
            body: {
                tool: 'earth_engine_system',
                arguments: {
                    operation: 'auth'
                }
            }
        },
        {
            name: 'Search datasets',
            body: {
                tool: 'earth_engine_data',
                arguments: {
                    operation: 'search',
                    query: 'sentinel',
                    limit: 3
                }
            }
        },
        {
            name: 'Get San Francisco geometry',
            body: {
                tool: 'earth_engine_data',
                arguments: {
                    operation: 'geometry',
                    placeName: 'San Francisco'
                }
            }
        },
        {
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
            name: 'Generate thumbnail',
            body: {
                tool: 'earth_engine_export',
                arguments: {
                    operation: 'thumbnail',
                    datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
                    startDate: '2024-06-01',
                    endDate: '2024-06-30',
                    region: 'San Francisco',
                    dimensions: 256,
                    visParams: {
                        bands: ['B4', 'B3', 'B2'],
                        min: 0,
                        max: 3000
                    }
                }
            }
        },
        {
            name: 'Find Sydney',
            body: {
                tool: 'earth_engine_data',
                arguments: {
                    operation: 'geometry',
                    placeName: 'Sydney'
                }
            }
        },
        {
            name: 'Find Tokyo',
            body: {
                tool: 'earth_engine_data',
                arguments: {
                    operation: 'geometry',
                    placeName: 'Tokyo'
                }
            }
        },
        {
            name: 'Find London',
            body: {
                tool: 'earth_engine_data',
                arguments: {
                    operation: 'geometry',
                    placeName: 'London'
                }
            }
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        process.stdout.write(`Testing: ${test.name}... `);
        
        try {
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(test.body)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.error) {
                    console.log(`FAILED: ${result.error}`);
                    failed++;
                } else {
                    console.log('PASSED');
                    passed++;
                }
            } else {
                const error = await response.text();
                console.log(`ERROR (${response.status}): ${error.substring(0, 100)}`);
                failed++;
            }
        } catch (err) {
            console.log(`ERROR: ${err.message}`);
            failed++;
        }
    }
    
    console.log('\n====================');
    console.log('RESULTS');
    console.log('====================');
    console.log(`Total: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
    
    if (passed === tests.length) {
        console.log('\nAll tests passed! SSE endpoint is 100% functional!');
    } else if (passed / tests.length >= 0.8) {
        console.log('\nSSE endpoint is mostly functional.');
    } else {
        console.log('\nSSE endpoint needs attention.');
    }
}

testSSE().catch(console.error);
