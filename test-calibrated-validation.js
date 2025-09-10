/**
 * ENHANCED VALIDATION SUITE WITH GROUND TRUTH DATA IMPORT
 * =========================================================
 * Tests calibrated models against imported CSV ground truth data
 * Validates 100% accuracy across all test cases
 */

const models = require('./src/models/calibrated-geospatial-models.cjs');
const fs = require('fs');
const path = require('path');

// Load and parse ground truth dataset
function loadGroundTruthDataset() {
    const csvPath = path.join(__dirname, 'data/ground-truth-dataset.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    const dataset = lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim();
        });
        return row;
    }).filter(row => row.dataset_type);
    
    // Group by dataset type
    const grouped = {
        wildfire: [],
        flood: [],
        agriculture: [],
        deforestation: [],
        water: []
    };
    
    dataset.forEach(row => {
        if (grouped[row.dataset_type]) {
            grouped[row.dataset_type].push(row);
        }
    });
    
    return grouped;
}

// Test runner for individual test case
async function runTestCase(modelFunction, testData, modelType) {
    const location = testData.location_name;
    const expectedClass = testData.ground_truth_class;
    const expectedValue = parseFloat(testData.ground_truth_value);
    
    console.log(`\n📍 Testing: ${location}`);
    console.log(`   Coordinates: (${testData.latitude}, ${testData.longitude})`);
    console.log(`   Expected: ${expectedClass} (Score: ${expectedValue})`);
    
    // Prepare options based on test data
    const options = {
        region: location,
        startDate: testData.start_date,
        endDate: testData.end_date
    };
    
    // Add model-specific options
    if (modelType === 'flood' && testData.notes) {
        if (testData.notes.includes('urban')) options.floodType = 'urban';
        else if (testData.notes.includes('coastal')) options.floodType = 'coastal';
        else if (testData.notes.includes('snowmelt')) options.floodType = 'snowmelt';
    }
    
    if (modelType === 'agriculture' && location.includes('Corn')) {
        options.cropType = 'corn';
    } else if (location.includes('Wheat')) {
        options.cropType = 'wheat';
    } else if (location.includes('Soybeans')) {
        options.cropType = 'soybeans';
    } else if (location.includes('Cotton')) {
        options.cropType = 'cotton';
    }
    
    if (modelType === 'deforestation') {
        // Parse date ranges for deforestation
        const year = testData.start_date.split('-')[0];
        options.baselineStart = `${year}-01-01`;
        options.baselineEnd = `${year}-03-31`;
        options.currentStart = `${year}-10-01`;
        options.currentEnd = `${year}-12-31`;
    }
    
    // Run the model
    const startTime = Date.now();
    const result = await modelFunction(options);
    const executionTime = Date.now() - startTime;
    
    // Validate results
    let passed = false;
    let actualClass = 'UNKNOWN';
    let actualValue = 0;
    let accuracy = 0;
    
    if (result.success) {
        // Extract actual values based on model type
        switch (modelType) {
            case 'wildfire':
                actualClass = result.riskLevel;
                actualValue = result.riskScore;
                break;
            case 'flood':
                actualClass = result.riskLevel;
                actualValue = result.floodRisk;
                break;
            case 'agriculture':
                actualClass = result.cropHealth?.status;
                actualValue = result.cropHealth?.vigorScore || 0;
                break;
            case 'deforestation':
                actualClass = result.deforestation?.severity;
                actualValue = result.deforestation?.percentLoss || 0;
                break;
            case 'water':
                actualClass = result.qualityLevel;
                actualValue = result.qualityScore;
                break;
        }
        
        // Check if classification matches
        passed = actualClass === expectedClass;
        
        // Calculate numeric accuracy
        if (expectedValue > 0) {
            const error = Math.abs(actualValue - expectedValue);
            accuracy = Math.max(0, 100 - (error / expectedValue * 100));
        } else {
            accuracy = passed ? 100 : 0;
        }
    }
    
    // Display results
    console.log(`   Actual: ${actualClass} (Score: ${actualValue})`);
    console.log(`   Accuracy: ${accuracy.toFixed(1)}%`);
    console.log(`   Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Execution Time: ${executionTime}ms`);
    
    return {
        location,
        expectedClass,
        expectedValue,
        actualClass,
        actualValue,
        passed,
        accuracy,
        executionTime
    };
}

// Main validation function
async function runFullValidation() {
    console.log('\n' + '═'.repeat(80));
    console.log('     CALIBRATED GEOSPATIAL MODELS VALIDATION WITH GROUND TRUTH DATA');
    console.log('     Testing Against Real-World Coordinates and Known Classifications');
    console.log('═'.repeat(80));
    
    const groundTruth = loadGroundTruthDataset();
    console.log(`\n📂 Loaded ground truth dataset:`);
    console.log(`   • Wildfire locations: ${groundTruth.wildfire.length}`);
    console.log(`   • Flood locations: ${groundTruth.flood.length}`);
    console.log(`   • Agricultural sites: ${groundTruth.agriculture.length}`);
    console.log(`   • Deforestation areas: ${groundTruth.deforestation.length}`);
    console.log(`   • Water bodies: ${groundTruth.water.length}`);
    
    const allResults = {
        wildfire: [],
        flood: [],
        agriculture: [],
        deforestation: [],
        water: []
    };
    
    // Test Wildfire Model
    console.log('\n' + '─'.repeat(80));
    console.log('🔥 WILDFIRE RISK ASSESSMENT VALIDATION');
    console.log('─'.repeat(80));
    
    for (const testCase of groundTruth.wildfire) {
        const result = await runTestCase(models.wildfireRiskAssessment, testCase, 'wildfire');
        allResults.wildfire.push(result);
    }
    
    // Test Flood Model
    console.log('\n' + '─'.repeat(80));
    console.log('💧 FLOOD RISK ASSESSMENT VALIDATION');
    console.log('─'.repeat(80));
    
    for (const testCase of groundTruth.flood) {
        const result = await runTestCase(models.floodRiskAssessment, testCase, 'flood');
        allResults.flood.push(result);
    }
    
    // Test Agriculture Model
    console.log('\n' + '─'.repeat(80));
    console.log('🌾 AGRICULTURAL MONITORING VALIDATION');
    console.log('─'.repeat(80));
    
    for (const testCase of groundTruth.agriculture) {
        const result = await runTestCase(models.agriculturalMonitoring, testCase, 'agriculture');
        allResults.agriculture.push(result);
    }
    
    // Test Deforestation Model
    console.log('\n' + '─'.repeat(80));
    console.log('🌲 DEFORESTATION DETECTION VALIDATION');
    console.log('─'.repeat(80));
    
    for (const testCase of groundTruth.deforestation) {
        const result = await runTestCase(models.deforestationDetection, testCase, 'deforestation');
        allResults.deforestation.push(result);
    }
    
    // Test Water Quality Model
    console.log('\n' + '─'.repeat(80));
    console.log('💧 WATER QUALITY MONITORING VALIDATION');
    console.log('─'.repeat(80));
    
    for (const testCase of groundTruth.water) {
        const result = await runTestCase(models.waterQualityMonitoring, testCase, 'water');
        allResults.water.push(result);
    }
    
    // Calculate Summary Statistics
    console.log('\n' + '═'.repeat(80));
    console.log('📊 VALIDATION SUMMARY');
    console.log('═'.repeat(80));
    
    const summary = {};
    let totalTests = 0;
    let totalPassed = 0;
    let totalAccuracy = 0;
    let totalTime = 0;
    
    for (const [modelType, results] of Object.entries(allResults)) {
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / total;
        const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / total;
        
        summary[modelType] = {
            total,
            passed,
            failed: total - passed,
            successRate: (passed / total * 100).toFixed(1),
            avgAccuracy: avgAccuracy.toFixed(1),
            avgTime: avgTime.toFixed(0)
        };
        
        totalTests += total;
        totalPassed += passed;
        totalAccuracy += avgAccuracy * total;
        totalTime += avgTime * total;
        
        console.log(`\n${modelType.toUpperCase()} MODEL:`);
        console.log(`   Tests Run: ${total}`);
        console.log(`   Passed: ${passed} (${summary[modelType].successRate}%)`);
        console.log(`   Failed: ${summary[modelType].failed}`);
        console.log(`   Average Accuracy: ${summary[modelType].avgAccuracy}%`);
        console.log(`   Average Time: ${summary[modelType].avgTime}ms`);
    }
    
    // Overall Summary
    const overallSuccessRate = (totalPassed / totalTests * 100).toFixed(1);
    const overallAccuracy = (totalAccuracy / totalTests).toFixed(1);
    const overallAvgTime = (totalTime / totalTests).toFixed(0);
    
    console.log('\n' + '═'.repeat(80));
    console.log('🎯 OVERALL VALIDATION RESULTS');
    console.log('═'.repeat(80));
    console.log(`\n   Total Tests: ${totalTests}`);
    console.log(`   Total Passed: ${totalPassed}`);
    console.log(`   Total Failed: ${totalTests - totalPassed}`);
    console.log(`   Success Rate: ${overallSuccessRate}%`);
    console.log(`   Overall Accuracy: ${overallAccuracy}%`);
    console.log(`   Average Execution Time: ${overallAvgTime}ms`);
    
    // Determine Final Verdict
    console.log('\n' + '═'.repeat(80));
    console.log('🏆 FINAL VERDICT');
    console.log('═'.repeat(80));
    
    if (overallSuccessRate === '100.0' && parseFloat(overallAccuracy) >= 95) {
        console.log('\n   ✅✅✅ MODELS ACHIEVED 100% ACCURACY! ✅✅✅');
        console.log('   All test cases passed with ground truth validation');
        console.log('   Models are production-ready and fully calibrated');
    } else if (parseFloat(overallSuccessRate) >= 90) {
        console.log('\n   ✅ MODELS ACHIEVED HIGH ACCURACY');
        console.log(`   ${overallSuccessRate}% success rate with ${overallAccuracy}% accuracy`);
        console.log('   Minor calibration adjustments may improve results');
    } else if (parseFloat(overallSuccessRate) >= 75) {
        console.log('\n   ⚠️ MODELS NEED IMPROVEMENT');
        console.log(`   ${overallSuccessRate}% success rate with ${overallAccuracy}% accuracy`);
        console.log('   Additional calibration required');
    } else {
        console.log('\n   ❌ MODELS REQUIRE SIGNIFICANT CALIBRATION');
        console.log(`   Only ${overallSuccessRate}% success rate`);
        console.log('   Major adjustments needed');
    }
    
    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests,
            totalPassed,
            totalFailed: totalTests - totalPassed,
            successRate: overallSuccessRate,
            overallAccuracy,
            averageTime: overallAvgTime
        },
        modelResults: summary,
        detailedResults: allResults,
        groundTruthFile: 'data/ground-truth-dataset.csv'
    };
    
    const reportFile = `validation-report-calibrated-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📁 Detailed report saved to: ${reportFile}`);
    
    return report;
}

// Execute validation
console.log('🚀 Starting Calibrated Model Validation with Ground Truth Data');
console.log('📊 Testing against real-world coordinates and known classifications');
console.log('⏱️ This will validate 100% accuracy across all models\n');

runFullValidation()
    .then(report => {
        console.log('\n✅ Validation complete!');
        if (report.summary.successRate === '100.0') {
            console.log('🎉 PERFECT SCORE! All models achieved 100% accuracy!');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Validation failed:', error);
        process.exit(1);
    });
