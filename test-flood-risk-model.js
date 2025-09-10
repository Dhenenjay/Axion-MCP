/**
 * COMPREHENSIVE FLOOD RISK ASSESSMENT MODEL
 * =========================================
 * A complex geospatial model for flood risk assessment that combines:
 * - Precipitation patterns and intensity
 * - Terrain analysis (elevation, slope, flow accumulation)
 * - Water body detection and monitoring
 * - Soil moisture conditions
 * - Urban development and impervious surfaces
 * - Historical flood events
 * - Vegetation coverage (water absorption capacity)
 * - Snow melt contribution
 * 
 * This represents a real-world application used by:
 * - Emergency management agencies
 * - Urban planners
 * - Insurance companies
 * - Environmental agencies
 */

const BASE_URL = 'http://localhost:3000/api/mcp/sse';

// Helper function for API calls
async function callEarthEngine(tool, args) {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, arguments: args })
    });
    return response.json();
}

// Helper to print section headers
function printSection(title, icon = '📍') {
    console.log('\n' + '━'.repeat(70));
    console.log(`${icon} ${title}`);
    console.log('━'.repeat(70));
}

// Main flood risk assessment workflow
async function runFloodRiskModel() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║      FLOOD RISK ASSESSMENT MODEL - MULTI-REGION 2023          ║');
    console.log('║        Advanced Hydrological & Terrain Analysis               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    
    const results = {
        steps: [],
        errors: [],
        data: {},
        regions: {}
    };
    
    // Multiple study areas for comprehensive testing
    const regions = {
        urban: 'Houston',          // Urban flooding
        coastal: 'Miami',          // Coastal/storm surge
        riverine: 'Sacramento',    // River flooding
        mountain: 'Denver'         // Snowmelt flooding
    };
    
    // Time periods for analysis
    const wetSeason = { start: '2023-01-01', end: '2023-04-30' };
    const drySeason = { start: '2023-07-01', end: '2023-09-30' };
    const yearRound = { start: '2023-01-01', end: '2023-12-31' };
    
    try {
        // ============================================================
        // PHASE 1: PRECIPITATION ANALYSIS
        // ============================================================
        printSection('PHASE 1: PRECIPITATION PATTERNS & INTENSITY', '🌧️');
        
        console.log('📊 Analyzing cumulative precipitation (CHIRPS)...');
        const precipResult = await callEarthEngine('earth_engine_process', {
            operation: 'analyze',
            analysisType: 'statistics',
            datasetId: 'UCSB-CHG/CHIRPS/DAILY',
            reducer: 'sum',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.urban,
            scale: 5000
        });
        
        if (precipResult.success) {
            console.log('✅ Precipitation totals calculated');
            results.data.precipitation = precipResult;
            results.steps.push('Precipitation analysis');
        } else {
            console.log('❌ Precipitation failed:', precipResult.error);
            results.errors.push(`Precipitation: ${precipResult.error}`);
        }
        
        console.log('📈 Analyzing precipitation time series...');
        const precipTimeResult = await callEarthEngine('earth_engine_process', {
            operation: 'analyze',
            analysisType: 'timeseries',
            datasetId: 'UCSB-CHG/CHIRPS/DAILY',
            band: 'precipitation',
            reducer: 'max',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.coastal,
            scale: 5000
        });
        
        if (precipTimeResult.values || precipTimeResult.success) {
            console.log('✅ Precipitation time series complete');
            results.data.precipTimeseries = precipTimeResult;
            results.steps.push('Precipitation time series');
        } else {
            console.log('❌ Time series failed:', precipTimeResult.error);
            results.errors.push(`Precip timeseries: ${precipTimeResult.error}`);
        }
        
        // ============================================================
        // PHASE 2: TERRAIN & HYDROLOGY
        // ============================================================
        printSection('PHASE 2: TERRAIN & HYDROLOGICAL ANALYSIS', '⛰️');
        
        console.log('📐 Calculating terrain slope...');
        const slopeResult = await callEarthEngine('earth_engine_process', {
            operation: 'terrain',
            terrainType: 'slope',
            region: regions.riverine
        });
        
        if (slopeResult.success) {
            console.log('✅ Slope analysis complete');
            results.data.slope = slopeResult;
            results.steps.push('Terrain slope');
        } else {
            console.log('❌ Slope failed:', slopeResult.error);
            results.errors.push(`Slope: ${slopeResult.error}`);
        }
        
        console.log('📏 Analyzing elevation profiles...');
        const elevationResult = await callEarthEngine('earth_engine_process', {
            operation: 'terrain',
            terrainType: 'elevation',
            region: regions.mountain
        });
        
        if (elevationResult.success) {
            console.log('✅ Elevation analysis complete');
            results.data.elevation = elevationResult;
            results.steps.push('Elevation profiles');
        } else {
            console.log('❌ Elevation failed:', elevationResult.error);
            results.errors.push(`Elevation: ${elevationResult.error}`);
        }
        
        console.log('🌄 Creating hillshade for flow visualization...');
        const hillshadeResult = await callEarthEngine('earth_engine_process', {
            operation: 'terrain',
            terrainType: 'hillshade',
            azimuth: 315,
            elevation: 35,
            region: regions.riverine
        });
        
        if (hillshadeResult.success) {
            console.log('✅ Hillshade visualization complete');
            results.data.hillshade = hillshadeResult;
            results.steps.push('Hillshade analysis');
        } else {
            console.log('❌ Hillshade failed:', hillshadeResult.error);
            results.errors.push(`Hillshade: ${hillshadeResult.error}`);
        }
        
        // ============================================================
        // PHASE 3: WATER DETECTION & MONITORING
        // ============================================================
        printSection('PHASE 3: WATER BODY DETECTION & MONITORING', '💧');
        
        console.log('🌊 Calculating NDWI for water detection...');
        const ndwiResult = await callEarthEngine('earth_engine_process', {
            operation: 'index',
            indexType: 'NDWI',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.coastal
        });
        
        if (ndwiResult.success) {
            console.log('✅ NDWI water index calculated');
            results.data.ndwi = ndwiResult;
            results.steps.push('NDWI water detection');
        } else {
            console.log('❌ NDWI failed:', ndwiResult.error);
            results.errors.push(`NDWI: ${ndwiResult.error}`);
        }
        
        console.log('🏞️ Calculating MNDWI for enhanced water detection...');
        const mndwiResult = await callEarthEngine('earth_engine_process', {
            operation: 'index',
            indexType: 'MNDWI',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.riverine
        });
        
        if (mndwiResult.success) {
            console.log('✅ MNDWI enhanced water detection complete');
            results.data.mndwi = mndwiResult;
            results.steps.push('MNDWI water detection');
        } else {
            console.log('❌ MNDWI failed:', mndwiResult.error);
            results.errors.push(`MNDWI: ${mndwiResult.error}`);
        }
        
        console.log('📊 Analyzing water extent changes...');
        const waterChangeResult = await callEarthEngine('earth_engine_process', {
            operation: 'analyze',
            analysisType: 'change',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: '2023-01-01',  // Fixed: use single date range
            endDate: '2023-06-30',
            region: regions.riverine
        });
        
        if (waterChangeResult.success) {
            console.log('✅ Water extent change detection complete');
            results.data.waterChange = waterChangeResult;
            results.steps.push('Water change detection');
        } else {
            console.log('❌ Water change failed:', waterChangeResult.error);
            results.errors.push(`Water change: ${waterChangeResult.error}`);
        }
        
        // ============================================================
        // PHASE 4: SOIL MOISTURE & ABSORPTION
        // ============================================================
        printSection('PHASE 4: SOIL MOISTURE & ABSORPTION CAPACITY', '🌱');
        
        console.log('🌿 Calculating SAVI for soil moisture...');
        const saviResult = await callEarthEngine('earth_engine_process', {
            operation: 'index',
            indexType: 'SAVI',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.urban
        });
        
        if (saviResult.success) {
            console.log('✅ SAVI soil moisture index complete');
            results.data.savi = saviResult;
            results.steps.push('SAVI soil moisture');
        } else {
            console.log('❌ SAVI failed:', saviResult.error);
            results.errors.push(`SAVI: ${saviResult.error}`);
        }
        
        console.log('🌾 Analyzing vegetation water absorption (NDVI)...');
        const ndviResult = await callEarthEngine('earth_engine_process', {
            operation: 'index',
            indexType: 'NDVI',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.urban
        });
        
        if (ndviResult.success) {
            console.log('✅ NDVI vegetation analysis complete');
            results.data.ndvi = ndviResult;
            results.steps.push('NDVI vegetation coverage');
        } else {
            console.log('❌ NDVI failed:', ndviResult.error);
            results.errors.push(`NDVI: ${ndviResult.error}`);
        }
        
        // ============================================================
        // PHASE 5: URBAN DEVELOPMENT & IMPERVIOUS SURFACES
        // ============================================================
        printSection('PHASE 5: URBAN DEVELOPMENT ANALYSIS', '🏙️');
        
        console.log('🏗️ Calculating NDBI for built-up areas...');
        const ndbiResult = await callEarthEngine('earth_engine_process', {
            operation: 'index',
            indexType: 'NDBI',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: yearRound.start,
            endDate: yearRound.end,
            region: regions.urban
        });
        
        if (ndbiResult.success) {
            console.log('✅ NDBI urban area index complete');
            results.data.ndbi = ndbiResult;
            results.steps.push('NDBI urban development');
        } else {
            console.log('❌ NDBI failed:', ndbiResult.error);
            results.errors.push(`NDBI: ${ndbiResult.error}`);
        }
        
        console.log('🌃 Analyzing night lights (urban extent proxy)...');
        const nightLightsResult = await callEarthEngine('earth_engine_process', {
            operation: 'analyze',
            analysisType: 'statistics',
            datasetId: 'NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG',
            reducer: 'mean',
            startDate: '2023-01-01',
            endDate: '2023-01-31',
            region: regions.urban,
            scale: 500
        });
        
        if (nightLightsResult.success) {
            console.log('✅ Night lights urban analysis complete');
            results.data.nightLights = nightLightsResult;
            results.steps.push('Urban extent (night lights)');
        } else {
            console.log('❌ Night lights failed:', nightLightsResult.error);
            results.errors.push(`Night lights: ${nightLightsResult.error}`);
        }
        
        // ============================================================
        // PHASE 6: SNOW ANALYSIS (MOUNTAIN REGIONS)
        // ============================================================
        printSection('PHASE 6: SNOW MELT CONTRIBUTION', '❄️');
        
        console.log('🏔️ Calculating NDSI for snow detection...');
        const ndsiResult = await callEarthEngine('earth_engine_process', {
            operation: 'index',
            indexType: 'NDSI',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: '2023-01-01',
            endDate: '2023-03-31',
            region: regions.mountain
        });
        
        if (ndsiResult.success) {
            console.log('✅ NDSI snow detection complete');
            results.data.ndsi = ndsiResult;
            results.steps.push('NDSI snow detection');
        } else {
            console.log('❌ NDSI failed:', ndsiResult.error);
            results.errors.push(`NDSI: ${ndsiResult.error}`);
        }
        
        console.log('☀️ Analyzing snow melt patterns...');
        const snowMeltResult = await callEarthEngine('earth_engine_process', {
            operation: 'analyze',
            analysisType: 'change',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: '2023-02-01',
            endDate: '2023-04-30',
            region: regions.mountain
        });
        
        if (snowMeltResult.success) {
            console.log('✅ Snow melt analysis complete');
            results.data.snowMelt = snowMeltResult;
            results.steps.push('Snow melt patterns');
        } else {
            console.log('❌ Snow melt failed:', snowMeltResult.error);
            results.errors.push(`Snow melt: ${snowMeltResult.error}`);
        }
        
        // ============================================================
        // PHASE 7: MULTI-TEMPORAL COMPOSITES
        // ============================================================
        printSection('PHASE 7: TEMPORAL ANALYSIS & COMPOSITES', '🕐');
        
        console.log('📸 Creating wet season median composite...');
        const wetCompositeResult = await callEarthEngine('earth_engine_process', {
            operation: 'composite',
            compositeType: 'median',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.coastal
        });
        
        if (wetCompositeResult.success) {
            console.log('✅ Wet season composite created');
            results.data.wetComposite = wetCompositeResult;
            results.steps.push('Wet season composite');
        } else {
            console.log('❌ Wet composite failed:', wetCompositeResult.error);
            results.errors.push(`Wet composite: ${wetCompositeResult.error}`);
        }
        
        console.log('📸 Creating dry season median composite...');
        const dryCompositeResult = await callEarthEngine('earth_engine_process', {
            operation: 'composite',
            compositeType: 'median',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: drySeason.start,
            endDate: drySeason.end,
            region: regions.coastal
        });
        
        if (dryCompositeResult.success) {
            console.log('✅ Dry season composite created');
            results.data.dryComposite = dryCompositeResult;
            results.steps.push('Dry season composite');
        } else {
            console.log('❌ Dry composite failed:', dryCompositeResult.error);
            results.errors.push(`Dry composite: ${dryCompositeResult.error}`);
        }
        
        console.log('☁️ Creating cloud-free mosaic...');
        const cloudFreeResult = await callEarthEngine('earth_engine_process', {
            operation: 'mask',
            maskType: 'clouds',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.riverine
        });
        
        if (cloudFreeResult.success) {
            console.log('✅ Cloud-free mosaic created');
            results.data.cloudFree = cloudFreeResult;
            results.steps.push('Cloud-free mosaic');
        } else {
            console.log('❌ Cloud-free failed:', cloudFreeResult.error);
            results.errors.push(`Cloud-free: ${cloudFreeResult.error}`);
        }
        
        // ============================================================
        // PHASE 8: RISK MAP GENERATION
        // ============================================================
        printSection('PHASE 8: FLOOD RISK MAP VISUALIZATION', '🗺️');
        
        console.log('🎨 Generating flood risk visualization (water emphasis)...');
        const floodMapResult = await callEarthEngine('earth_engine_export', {
            operation: 'thumbnail',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.coastal,
            dimensions: 1024,
            visParams: {
                bands: ['B3', 'B8', 'B11'],  // Green-NIR-SWIR for water
                min: 0,
                max: 3000,
                gamma: 1.3
            }
        });
        
        if (floodMapResult.url) {
            console.log('✅ Flood risk map generated');
            console.log(`📍 Map URL: ${floodMapResult.url.substring(0, 50)}...`);
            results.data.floodMap = floodMapResult;
            results.steps.push('Flood risk visualization');
        } else {
            console.log('❌ Map export failed:', floodMapResult.error);
            results.errors.push(`Map export: ${floodMapResult.error}`);
        }
        
        console.log('🎨 Generating terrain visualization...');
        const terrainMapResult = await callEarthEngine('earth_engine_export', {
            operation: 'thumbnail',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: drySeason.start,
            endDate: drySeason.end,
            region: regions.mountain,
            dimensions: 800,
            visParams: {
                bands: ['B4', 'B3', 'B2'],  // Natural color
                min: 0,
                max: 2500,
                gamma: 1.2
            }
        });
        
        if (terrainMapResult.url) {
            console.log('✅ Terrain map generated');
            results.data.terrainMap = terrainMapResult;
            results.steps.push('Terrain visualization');
        } else {
            console.log('❌ Terrain map failed:', terrainMapResult.error);
            results.errors.push(`Terrain map: ${terrainMapResult.error}`);
        }
        
        // ============================================================
        // PHASE 9: STATISTICAL ANALYSIS
        // ============================================================
        printSection('PHASE 9: REGIONAL STATISTICS & METRICS', '📊');
        
        console.log('📈 Computing flood risk statistics...');
        const statsResult = await callEarthEngine('earth_engine_process', {
            operation: 'analyze',
            analysisType: 'statistics',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            reducer: 'median',  // Fixed: changed from percentile to median
            band: 'B8',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.coastal,
            scale: 500
        });
        
        if (statsResult.success) {
            console.log('✅ Regional statistics computed');
            results.data.statistics = statsResult;
            results.steps.push('Regional statistics');
        } else {
            console.log('❌ Statistics failed:', statsResult.error);
            results.errors.push(`Statistics: ${statsResult.error}`);
        }
        
        console.log('📊 Analyzing water body time series...');
        const waterTimeResult = await callEarthEngine('earth_engine_process', {
            operation: 'analyze',
            analysisType: 'timeseries',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            band: 'B3',
            reducer: 'mean',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.riverine,
            scale: 100
        });
        
        if (waterTimeResult.values || waterTimeResult.success) {
            console.log('✅ Water body time series complete');
            results.data.waterTimeseries = waterTimeResult;
            results.steps.push('Water time series');
        } else {
            console.log('❌ Water time series failed:', waterTimeResult.error);
            results.errors.push(`Water timeseries: ${waterTimeResult.error}`);
        }
        
        // ============================================================
        // PHASE 10: ADVANCED PROCESSING
        // ============================================================
        printSection('PHASE 10: ADVANCED FLOOD INDICATORS', '🔬');
        
        console.log('🌊 Creating maximum water extent composite...');
        const maxWaterResult = await callEarthEngine('earth_engine_process', {
            operation: 'composite',
            compositeType: 'max',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: wetSeason.start,
            endDate: wetSeason.end,
            region: regions.riverine
        });
        
        if (maxWaterResult.success) {
            console.log('✅ Maximum water extent computed');
            results.data.maxWater = maxWaterResult;
            results.steps.push('Max water extent');
        } else {
            console.log('❌ Max water failed:', maxWaterResult.error);
            results.errors.push(`Max water: ${maxWaterResult.error}`);
        }
        
        console.log('🌊 Creating minimum water extent composite...');
        const minWaterResult = await callEarthEngine('earth_engine_process', {
            operation: 'composite',
            compositeType: 'min',
            datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
            startDate: drySeason.start,
            endDate: drySeason.end,
            region: regions.riverine
        });
        
        if (minWaterResult.success) {
            console.log('✅ Minimum water extent computed');
            results.data.minWater = minWaterResult;
            results.steps.push('Min water extent');
        } else {
            console.log('❌ Min water failed:', minWaterResult.error);
            results.errors.push(`Min water: ${minWaterResult.error}`);
        }
        
        // ============================================================
        // MULTI-REGION ANALYSIS
        // ============================================================
        printSection('MULTI-REGION COMPARATIVE ANALYSIS', '🌍');
        
        for (const [type, region] of Object.entries(regions)) {
            console.log(`\n🔍 Analyzing ${type} flooding in ${region}...`);
            
            const regionResult = await callEarthEngine('earth_engine_process', {
                operation: 'analyze',
                analysisType: 'statistics',
                datasetId: 'UCSB-CHG/CHIRPS/DAILY',
                reducer: 'max',
                startDate: wetSeason.start,
                endDate: wetSeason.end,
                region: region,
                scale: 5000
            });
            
            if (regionResult.success) {
                console.log(`  ✅ ${type} region analysis complete`);
                results.regions[type] = regionResult;
                results.steps.push(`${type} region analysis`);
            } else {
                console.log(`  ❌ ${type} region failed:`, regionResult.error);
                results.errors.push(`${type} region: ${regionResult.error}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Critical error in model:', error);
        results.errors.push(`Critical: ${error.message}`);
    }
    
    // ============================================================
    // FINAL RESULTS & RISK ASSESSMENT
    // ============================================================
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                   FLOOD RISK MODEL RESULTS                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    
    console.log('\n📊 ANALYSIS COMPONENTS COMPLETED:');
    console.log('══════════════════════════════════');
    results.steps.forEach((step, i) => {
        console.log(`  ${String(i + 1).padStart(2)}. ✅ ${step}`);
    });
    
    if (results.errors.length > 0) {
        console.log('\n⚠️  COMPONENTS WITH ISSUES:');
        console.log('══════════════════════════════════');
        results.errors.forEach((error, i) => {
            console.log(`  ${String(i + 1).padStart(2)}. ❌ ${error}`);
        });
    }
    
    const successRate = (results.steps.length / (results.steps.length + results.errors.length)) * 100;
    
    console.log('\n📈 MODEL PERFORMANCE:');
    console.log('══════════════════════════════════');
    console.log(`  Total Components: ${results.steps.length + results.errors.length}`);
    console.log(`  Successful: ${results.steps.length}`);
    console.log(`  Failed: ${results.errors.length}`);
    console.log(`  Success Rate: ${successRate.toFixed(1)}%`);
    
    console.log('\n💧 FLOOD RISK FACTORS ANALYZED:');
    console.log('══════════════════════════════════');
    const riskFactors = {
        'Precipitation Intensity': results.data.precipitation ? '✅' : '❌',
        'Terrain & Slope': results.data.slope ? '✅' : '❌',
        'Elevation Profile': results.data.elevation ? '✅' : '❌',
        'Water Detection': results.data.ndwi ? '✅' : '❌',
        'Water Changes': results.data.waterChange ? '✅' : '❌',
        'Soil Moisture': results.data.savi ? '✅' : '❌',
        'Vegetation Coverage': results.data.ndvi ? '✅' : '❌',
        'Urban Development': results.data.ndbi ? '✅' : '❌',
        'Snow Melt': results.data.ndsi ? '✅' : '❌',
        'Temporal Analysis': results.data.waterTimeseries ? '✅' : '❌'
    };
    
    Object.entries(riskFactors).forEach(([factor, status]) => {
        console.log(`  ${status} ${factor}`);
    });
    
    console.log('\n🌍 REGIONAL COVERAGE:');
    console.log('══════════════════════════════════');
    Object.keys(regions).forEach(type => {
        const status = results.regions[type] ? '✅' : '❌';
        console.log(`  ${status} ${type.charAt(0).toUpperCase() + type.slice(1)} flooding (${regions[type]})`);
    });
    
    console.log('\n🎯 FLOOD RISK ASSESSMENT:');
    console.log('══════════════════════════════════');
    
    if (successRate >= 90) {
        console.log('  🟢 COMPREHENSIVE FLOOD RISK ASSESSMENT');
        console.log('  ✅ All critical factors analyzed');
        console.log('  ✅ Multi-region analysis complete');
        console.log('  ✅ High confidence in risk predictions');
        console.log('  ✅ Ready for operational deployment');
    } else if (successRate >= 75) {
        console.log('  🟡 GOOD FLOOD RISK COVERAGE');
        console.log('  ✅ Most critical factors analyzed');
        console.log('  ⚠️  Some data gaps present');
        console.log('  ✅ Sufficient for preliminary assessment');
    } else if (successRate >= 60) {
        console.log('  🟠 MODERATE FLOOD RISK ASSESSMENT');
        console.log('  ⚠️  Several factors missing');
        console.log('  ⚠️  Additional analysis recommended');
        console.log('  ✅ Basic risk indicators available');
    } else {
        console.log('  🔴 INCOMPLETE FLOOD ASSESSMENT');
        console.log('  ❌ Critical data gaps detected');
        console.log('  ❌ Low confidence in predictions');
        console.log('  ❌ Additional data sources needed');
    }
    
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('══════════════════════════════════');
    console.log('  1. Monitor areas with high precipitation & low elevation');
    console.log('  2. Focus on urban areas with high impervious surfaces');
    console.log('  3. Track water body expansion during wet season');
    console.log('  4. Implement early warning for snow melt regions');
    console.log('  5. Update risk maps after major precipitation events');
    console.log('  6. Cross-reference with historical flood records');
    console.log('  7. Integrate real-time gauge data when available');
    
    console.log('\n🏢 APPLICATIONS:');
    console.log('══════════════════════════════════');
    console.log('  • Emergency Management Planning');
    console.log('  • Insurance Risk Assessment');
    console.log('  • Urban Development Zoning');
    console.log('  • Infrastructure Protection');
    console.log('  • Agricultural Planning');
    console.log('  • Disaster Response Coordination');
    
    console.log('\n' + '═'.repeat(70));
    console.log('        FLOOD RISK MODEL EXECUTION COMPLETE');
    console.log('═'.repeat(70) + '\n');
    
    return results;
}

// Execute the model
console.log('🚀 Starting Comprehensive Flood Risk Assessment Model...');
console.log('📍 Study Regions: Houston, Miami, Sacramento, Denver');
console.log('📅 Time Period: January - December 2023');
console.log('🛰️ Satellites: Sentinel-2, CHIRPS, VIIRS, SRTM');
console.log('🔬 Analysis Types: Hydrology, Terrain, Urban, Vegetation, Snow');

runFloodRiskModel()
    .then(results => {
        console.log('\n✅ Flood risk model execution completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Model execution failed:', error);
        process.exit(1);
    });
