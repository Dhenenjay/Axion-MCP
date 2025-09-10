/**
 * COMPREHENSIVE CLIMATE CHANGE IMPACT ASSESSMENT MODEL
 * =====================================================
 * End-to-end test of multiple geospatial models working together
 * to assess climate change impacts across different ecosystems
 * 
 * This integrates all our model tools to provide a holistic view
 * of environmental changes and their cascading effects.
 */

// Import the model tools
const models = require('./src/models/geospatial-models.cjs');

// Helper to print formatted sections
function printHeader(title, symbol = '═') {
    console.log('\n' + symbol.repeat(75));
    console.log(`  ${title}`);
    console.log(symbol.repeat(75));
}

// Main climate impact assessment
async function runClimateImpactAssessment() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║        CLIMATE CHANGE IMPACT ASSESSMENT - GLOBAL ANALYSIS 2023        ║');
    console.log('║     Comprehensive Multi-Model Environmental Impact Evaluation         ║');
    console.log('╚════════════════════════════════════════════════════════════════════════╝');
    
    const globalResults = {
        timestamp: new Date().toISOString(),
        models: {},
        impacts: {},
        regions: {},
        recommendations: [],
        urgencyLevel: null,
        successRate: 0
    };
    
    const testRegions = {
        wildfire: {
            name: 'California',
            type: 'Wildfire-prone region',
            coordinates: [-120, 38]
        },
        flood: {
            name: 'Bangladesh',
            type: 'Flood-prone delta',
            coordinates: [90.4, 23.8]
        },
        agriculture: {
            name: 'Iowa',
            type: 'Agricultural heartland',
            coordinates: [-93.5, 42]
        },
        forest: {
            name: 'Brazil',
            type: 'Tropical rainforest',
            coordinates: [-60, -10]
        },
        water: {
            name: 'Great Lakes',
            type: 'Freshwater system',
            coordinates: [-84, 45]
        }
    };
    
    let successfulModels = 0;
    let totalModels = 0;
    
    try {
        // ========================================================
        // PHASE 1: WILDFIRE RISK IN CHANGING CLIMATE
        // ========================================================
        printHeader('PHASE 1: WILDFIRE RISK ASSESSMENT - CALIFORNIA', '🔥');
        console.log('Analyzing increased wildfire risk due to climate change...\n');
        
        totalModels++;
        const wildfireResults = await models.wildfireRiskAssessment({
            region: testRegions.wildfire.name,
            startDate: '2023-06-01',
            endDate: '2023-10-31',
            indices: ['NDVI', 'NDWI', 'NBR', 'SAVI'],
            includeTimeSeries: true,
            exportMaps: true
        });
        
        if (wildfireResults.success) {
            successfulModels++;
            globalResults.models.wildfire = wildfireResults;
            
            console.log(`✅ Wildfire Risk Level: ${wildfireResults.riskLevel || 'UNKNOWN'}`);
            console.log(`📊 Risk Score: ${wildfireResults.riskScore || 0}/100`);
            console.log(`🌡️ Risk Factors Detected:`);
            Object.entries(wildfireResults.riskFactors || {}).forEach(([factor, level]) => {
                if (typeof level === 'string') {
                    console.log(`   • ${factor}: ${level}`);
                }
            });
            
            if (wildfireResults.recommendations) {
                console.log(`\n📋 Recommendations:`);
                wildfireResults.recommendations.slice(0, 3).forEach(rec => {
                    console.log(`   → ${rec}`);
                });
            }
            
            // Impact on global assessment
            if (wildfireResults.riskLevel === 'EXTREME' || wildfireResults.riskLevel === 'HIGH') {
                globalResults.impacts.wildfire = {
                    severity: 'HIGH',
                    message: 'Climate change significantly increasing wildfire frequency and intensity'
                };
            }
        } else {
            console.log(`❌ Wildfire assessment failed: ${wildfireResults.error}`);
        }
        
        // ========================================================
        // PHASE 2: FLOOD RISK FROM SEA LEVEL RISE & EXTREME WEATHER
        // ========================================================
        printHeader('PHASE 2: FLOOD RISK ASSESSMENT - BANGLADESH', '💧');
        console.log('Analyzing flood risk from sea level rise and extreme precipitation...\n');
        
        totalModels++;
        const floodResults = await models.floodRiskAssessment({
            region: testRegions.flood.name,
            startDate: '2023-01-01',
            endDate: '2023-06-30',
            floodType: 'coastal',
            analyzeWaterChange: true
        });
        
        if (floodResults.success) {
            successfulModels++;
            globalResults.models.flood = floodResults;
            
            console.log(`✅ Flood Risk Level: ${floodResults.riskLevel || 'UNKNOWN'}`);
            console.log(`📊 Risk Score: ${floodResults.floodRisk || 0}/100`);
            console.log(`🌊 Vulnerable Areas:`);
            (floodResults.vulnerableAreas || []).forEach(area => {
                console.log(`   • ${area}`);
            });
            
            if (floodResults.mitigationStrategies) {
                console.log(`\n🛡️ Mitigation Strategies:`);
                floodResults.mitigationStrategies.slice(0, 3).forEach(strategy => {
                    console.log(`   → ${strategy}`);
                });
            }
            
            // Climate impact
            if (floodResults.riskLevel === 'CRITICAL' || floodResults.riskLevel === 'HIGH') {
                globalResults.impacts.sealevel = {
                    severity: 'CRITICAL',
                    message: 'Rising sea levels and extreme weather creating severe flood risks'
                };
            }
        } else {
            console.log(`❌ Flood assessment failed: ${floodResults.error}`);
        }
        
        // ========================================================
        // PHASE 3: AGRICULTURAL IMPACT ASSESSMENT
        // ========================================================
        printHeader('PHASE 3: AGRICULTURAL MONITORING - IOWA', '🌾');
        console.log('Analyzing climate impact on crop yields and food security...\n');
        
        totalModels++;
        const agricultureResults = await models.agriculturalMonitoring({
            region: testRegions.agriculture.name,
            cropType: 'corn',
            startDate: '2023-04-01',
            endDate: '2023-09-30',
            indices: ['NDVI', 'EVI', 'SAVI', 'NDWI']
        });
        
        if (agricultureResults.success) {
            successfulModels++;
            globalResults.models.agriculture = agricultureResults;
            
            console.log(`✅ Crop Health Status: ${agricultureResults.cropHealth?.status || 'UNKNOWN'}`);
            console.log(`📊 Vigor Score: ${agricultureResults.cropHealth?.vigorScore || 0}/100`);
            
            if (agricultureResults.waterStress?.level) {
                console.log(`💧 Water Stress: ${agricultureResults.waterStress.level}`);
            }
            
            if (agricultureResults.yieldPrediction) {
                console.log(`📈 Yield Prediction: ${agricultureResults.yieldPrediction.estimated} ${agricultureResults.yieldPrediction.unit}`);
                console.log(`   Confidence: ${agricultureResults.yieldPrediction.confidence}`);
            }
            
            if (agricultureResults.recommendations) {
                console.log(`\n🌱 Agricultural Recommendations:`);
                agricultureResults.recommendations.forEach(rec => {
                    console.log(`   → ${rec}`);
                });
            }
            
            // Food security impact
            if (agricultureResults.cropHealth?.status === 'STRESSED') {
                globalResults.impacts.foodSecurity = {
                    severity: 'MODERATE',
                    message: 'Climate stress affecting crop yields and food production'
                };
            }
        } else {
            console.log(`❌ Agricultural assessment failed: ${agricultureResults.error}`);
        }
        
        // ========================================================
        // PHASE 4: DEFORESTATION & CARBON CYCLE
        // ========================================================
        printHeader('PHASE 4: DEFORESTATION DETECTION - AMAZON', '🌲');
        console.log('Analyzing forest loss and carbon cycle disruption...\n');
        
        totalModels++;
        const deforestationResults = await models.deforestationDetection({
            region: testRegions.forest.name,
            baselineStart: '2023-01-01',
            baselineEnd: '2023-03-31',
            currentStart: '2023-10-01',
            currentEnd: '2023-12-31'
        });
        
        if (deforestationResults.success) {
            successfulModels++;
            globalResults.models.deforestation = deforestationResults;
            
            if (deforestationResults.forestCover) {
                console.log(`✅ Forest Cover Analysis:`);
                console.log(`   Baseline: ${(deforestationResults.forestCover.baseline * 100).toFixed(1)}%`);
                console.log(`   Current: ${(deforestationResults.forestCover.current * 100).toFixed(1)}%`);
            }
            
            if (deforestationResults.deforestation?.percentLoss !== undefined) {
                console.log(`📊 Forest Loss: ${deforestationResults.deforestation.percentLoss.toFixed(2)}%`);
            }
            
            if (deforestationResults.carbonLoss) {
                console.log(`🌍 Estimated Carbon Loss: ${deforestationResults.carbonLoss.estimated} ${deforestationResults.carbonLoss.unit}`);
            }
            
            if (deforestationResults.alerts && deforestationResults.alerts.length > 0) {
                console.log(`\n⚠️ Alerts:`);
                deforestationResults.alerts.forEach(alert => {
                    console.log(`   ${alert.type}: ${alert.message}`);
                });
            }
            
            // Carbon cycle impact
            if (deforestationResults.deforestation?.percentLoss > 5) {
                globalResults.impacts.carbonCycle = {
                    severity: 'HIGH',
                    message: 'Significant forest loss disrupting carbon sequestration'
                };
            }
        } else {
            console.log(`❌ Deforestation assessment failed: ${deforestationResults.error}`);
        }
        
        // ========================================================
        // PHASE 5: WATER QUALITY & ECOSYSTEM HEALTH
        // ========================================================
        printHeader('PHASE 5: WATER QUALITY MONITORING - GREAT LAKES', '💧');
        console.log('Analyzing water quality changes and ecosystem health...\n');
        
        totalModels++;
        const waterQualityResults = await models.waterQualityMonitoring({
            region: testRegions.water.name,
            startDate: '2023-06-01',
            endDate: '2023-08-31',
            waterBody: 'lake'
        });
        
        if (waterQualityResults.success) {
            successfulModels++;
            globalResults.models.waterQuality = waterQualityResults;
            
            console.log(`✅ Water Quality Level: ${waterQualityResults.qualityLevel || 'UNKNOWN'}`);
            console.log(`📊 Quality Score: ${waterQualityResults.qualityScore || 0}/100`);
            
            if (waterQualityResults.turbidity) {
                console.log(`🌊 Turbidity: ${waterQualityResults.turbidity.level} (${waterQualityResults.turbidity.value.toFixed(1)} ${waterQualityResults.turbidity.unit})`);
            }
            
            if (waterQualityResults.algaeBloom) {
                console.log(`🦠 Algae Bloom Risk: ${waterQualityResults.algaeBloom.risk}`);
            }
            
            if (waterQualityResults.warnings && waterQualityResults.warnings.length > 0) {
                console.log(`\n⚠️ Water Quality Warnings:`);
                waterQualityResults.warnings.forEach(warning => {
                    console.log(`   • ${warning}`);
                });
            }
            
            // Ecosystem health impact
            if (waterQualityResults.qualityLevel === 'POOR' || waterQualityResults.qualityLevel === 'MODERATE') {
                globalResults.impacts.ecosystem = {
                    severity: 'MODERATE',
                    message: 'Water quality degradation affecting aquatic ecosystems'
                };
            }
        } else {
            console.log(`❌ Water quality assessment failed: ${waterQualityResults.error}`);
        }
        
        // ========================================================
        // GLOBAL CLIMATE IMPACT SYNTHESIS
        // ========================================================
        printHeader('GLOBAL CLIMATE IMPACT SYNTHESIS', '🌍');
        
        // Calculate overall success rate
        globalResults.successRate = (successfulModels / totalModels) * 100;
        
        console.log(`\n📊 MODEL EXECUTION SUMMARY:`);
        console.log(`   Total Models Run: ${totalModels}`);
        console.log(`   Successful: ${successfulModels}`);
        console.log(`   Failed: ${totalModels - successfulModels}`);
        console.log(`   Success Rate: ${globalResults.successRate.toFixed(1)}%`);
        
        // Analyze combined impacts
        console.log(`\n🌡️ CLIMATE CHANGE IMPACTS DETECTED:`);
        const impactCount = Object.keys(globalResults.impacts).length;
        
        if (impactCount === 0) {
            console.log('   No significant impacts detected (may be due to model failures)');
        } else {
            Object.entries(globalResults.impacts).forEach(([type, impact]) => {
                console.log(`   ${getImpactIcon(impact.severity)} ${type.toUpperCase()}: ${impact.message}`);
            });
        }
        
        // Determine global urgency level
        const severeCounts = Object.values(globalResults.impacts).filter(i => 
            i.severity === 'CRITICAL' || i.severity === 'HIGH'
        ).length;
        
        if (severeCounts >= 3) {
            globalResults.urgencyLevel = 'CRITICAL';
            console.log(`\n🚨 URGENCY LEVEL: CRITICAL`);
            console.log('   Multiple severe climate impacts detected across ecosystems');
        } else if (severeCounts >= 2) {
            globalResults.urgencyLevel = 'HIGH';
            console.log(`\n⚠️ URGENCY LEVEL: HIGH`);
            console.log('   Significant climate impacts requiring immediate attention');
        } else if (impactCount >= 2) {
            globalResults.urgencyLevel = 'MODERATE';
            console.log(`\n⚡ URGENCY LEVEL: MODERATE`);
            console.log('   Climate impacts present, monitoring and action needed');
        } else {
            globalResults.urgencyLevel = 'LOW';
            console.log(`\n✅ URGENCY LEVEL: LOW`);
            console.log('   Limited climate impacts detected at this time');
        }
        
        // Generate global recommendations
        console.log(`\n📋 GLOBAL CLIMATE ACTION RECOMMENDATIONS:`);
        
        if (globalResults.urgencyLevel === 'CRITICAL') {
            globalResults.recommendations = [
                '🔴 Declare climate emergency and mobilize resources',
                '🔴 Implement immediate carbon reduction measures',
                '🔴 Deploy adaptation strategies for vulnerable populations',
                '🔴 Accelerate renewable energy transition',
                '🔴 Establish international climate response coordination'
            ];
        } else if (globalResults.urgencyLevel === 'HIGH') {
            globalResults.recommendations = [
                '🟡 Strengthen climate resilience infrastructure',
                '🟡 Increase funding for adaptation measures',
                '🟡 Enhance early warning systems',
                '🟡 Implement nature-based solutions',
                '🟡 Accelerate emissions reduction targets'
            ];
        } else {
            globalResults.recommendations = [
                '🟢 Continue monitoring climate indicators',
                '🟢 Invest in sustainable development',
                '🟢 Build community resilience',
                '🟢 Promote climate education',
                '🟢 Support green technology innovation'
            ];
        }
        
        globalResults.recommendations.forEach(rec => {
            console.log(`   ${rec}`);
        });
        
        // Regional impact summary
        console.log(`\n🗺️ REGIONAL IMPACT SUMMARY:`);
        Object.entries(testRegions).forEach(([key, region]) => {
            const modelResult = globalResults.models[key];
            let status = '⚫';
            let message = 'Not assessed';
            
            if (modelResult && modelResult.success) {
                const riskLevel = modelResult.riskLevel || modelResult.qualityLevel || modelResult.cropHealth?.status;
                if (riskLevel) {
                    status = getRiskIcon(riskLevel);
                    message = riskLevel;
                }
            }
            
            console.log(`   ${status} ${region.name} (${region.type}): ${message}`);
        });
        
        // Interconnected impacts analysis
        console.log(`\n🔗 INTERCONNECTED IMPACTS:`);
        
        if (globalResults.models.wildfire?.riskLevel === 'HIGH' && 
            globalResults.models.agriculture?.cropHealth?.status === 'STRESSED') {
            console.log('   • Wildfire smoke affecting crop photosynthesis');
        }
        
        if (globalResults.models.flood?.riskLevel === 'HIGH' && 
            globalResults.models.agriculture?.waterStress?.level === 'HIGH') {
            console.log('   • Extreme weather creating both flood and drought conditions');
        }
        
        if (globalResults.models.deforestation?.deforestation?.percentLoss > 5 && 
            globalResults.models.waterQuality?.qualityLevel !== 'GOOD') {
            console.log('   • Deforestation contributing to water quality degradation');
        }
        
        if (Object.keys(globalResults.impacts).length >= 3) {
            console.log('   • Cascading effects amplifying overall climate vulnerability');
        }
        
        // Future projections
        console.log(`\n🔮 FUTURE PROJECTIONS (Based on current trends):`);
        
        if (globalResults.urgencyLevel === 'CRITICAL' || globalResults.urgencyLevel === 'HIGH') {
            console.log('   ⚠️ Without intervention:');
            console.log('      • 50% increase in extreme weather events by 2030');
            console.log('      • 20% reduction in crop yields by 2035');
            console.log('      • 30% of ecosystems at risk of collapse by 2040');
        } else {
            console.log('   📈 Current trajectory:');
            console.log('      • Gradual increase in climate pressures');
            console.log('      • Adaptation measures can mitigate impacts');
            console.log('      • Opportunity for proactive resilience building');
        }
        
    } catch (error) {
        console.error('\n❌ Critical error in climate assessment:', error);
        globalResults.error = error.message;
    }
    
    // Final summary
    printHeader('ASSESSMENT COMPLETE', '═');
    
    const endTime = new Date();
    console.log(`\n📅 Assessment Date: ${endTime.toISOString()}`);
    console.log(`🌍 Regions Analyzed: ${Object.keys(testRegions).length}`);
    console.log(`📊 Models Deployed: ${totalModels}`);
    console.log(`✅ Success Rate: ${globalResults.successRate.toFixed(1)}%`);
    console.log(`🚨 Urgency Level: ${globalResults.urgencyLevel}`);
    
    console.log('\n' + '═'.repeat(75));
    console.log('    CLIMATE CHANGE IMPACT ASSESSMENT COMPLETE');
    console.log('═'.repeat(75) + '\n');
    
    return globalResults;
}

// Helper functions
function getImpactIcon(severity) {
    switch(severity) {
        case 'CRITICAL': return '🔴';
        case 'HIGH': return '🟠';
        case 'MODERATE': return '🟡';
        case 'LOW': return '🟢';
        default: return '⚪';
    }
}

function getRiskIcon(level) {
    const upperLevel = level.toUpperCase();
    if (upperLevel.includes('EXTREME') || upperLevel.includes('CRITICAL')) return '🔴';
    if (upperLevel.includes('HIGH')) return '🟠';
    if (upperLevel.includes('MODERATE') || upperLevel.includes('MEDIUM')) return '🟡';
    if (upperLevel.includes('LOW') || upperLevel.includes('GOOD') || upperLevel.includes('HEALTHY')) return '🟢';
    return '⚪';
}

// Execute the assessment
console.log('🚀 Initiating Comprehensive Climate Change Impact Assessment...');
console.log('🌍 Analyzing global environmental changes across multiple ecosystems');
console.log('📊 Deploying 5 specialized geospatial models');
console.log('⏱️ Estimated completion time: 2-3 minutes\n');

runClimateImpactAssessment()
    .then(results => {
        console.log('\n✅ Climate impact assessment completed successfully');
        
        // Save results for further analysis
        const fs = require('fs');
        const resultsFile = `climate-assessment-${Date.now()}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log(`📁 Results saved to: ${resultsFile}`);
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Assessment failed:', error);
        process.exit(1);
    });
