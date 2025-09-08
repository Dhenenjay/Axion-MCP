const { createBatchExport } = require('./src/earth-engine/export-highres');
const { initializeEarthEngine } = require('./src/earth-engine/init');

async function testSimpleExport() {
  try {
    const keyPath = 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json';
    
    console.log('🚀 SIMPLE EXPORT TEST (No Drive API Required)');
    console.log('='.repeat(60) + '\n');
    
    // Initialize Earth Engine
    console.log('1️⃣ Initializing Earth Engine...');
    await initializeEarthEngine(keyPath);
    console.log('   ✅ Earth Engine initialized\n');
    
    // Export WITHOUT specifying folder (goes to root)
    console.log('2️⃣ Creating export to service account Drive ROOT...');
    console.log('   (No folder specified - simpler approach)\n');
    
    const exportResult = await createBatchExport({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-08-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco
        buffer: 10000 // 10km buffer
      },
      bands: ['B4', 'B3', 'B2', 'B8'], // RGB + NIR
      scale: 10,
      description: `sf_export_${Date.now()}`
      // NO folder parameter - exports to root
    });
    
    console.log('✅ EXPORT SUCCESSFULLY SUBMITTED!\n');
    console.log('📋 Export Details:');
    console.log('   Task ID:', exportResult.taskId);
    console.log('   Status:', exportResult.status);
    console.log('   File Name:', exportResult.driveAccess.fileName);
    console.log('   Location:', exportResult.driveAccess.location);
    console.log('   Quality:', exportResult.quality);
    console.log('');
    
    console.log('📊 Export Parameters:');
    Object.entries(exportResult.exportParams).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    console.log('\n⏱️ Processing Information:');
    console.log('   ' + exportResult.message);
    console.log('   Estimated time:', exportResult.estimatedTime);
    console.log('   Estimated completion:', new Date(exportResult.monitoring.estimatedCompletion).toLocaleString());
    
    console.log('\n' + '='.repeat(60));
    console.log('📝 IMPORTANT NOTES:\n');
    console.log('1. The export is now processing on Google Earth Engine servers');
    console.log('2. It will appear in the service account\'s Drive (not your personal Drive)');
    console.log('3. Since we\'re not specifying a folder, it goes to the root directory');
    console.log('4. This avoids any folder creation issues\n');
    
    console.log('🎯 TO ACCESS THE FILE:\n');
    console.log('Option 1: Enable Drive API for the service account');
    console.log('   Visit: https://console.developers.google.com/apis/api/drive.googleapis.com/');
    console.log('   Enable the API for project:', exportResult.exportParams.projectId || 'your-project');
    console.log('   Then use the drive-access.js functions to download\n');
    
    console.log('Option 2: Use Earth Engine Code Editor');
    console.log('   The export task is visible in the Code Editor tasks panel');
    console.log('   You can monitor progress there\n');
    
    console.log('Option 3: Share the service account Drive');
    console.log('   Add your personal email as a viewer to the service account\'s Drive');
    console.log('   Then you can see the files in "Shared with me"\n');
    
    console.log('✅ Export is processing successfully!');
    console.log('   Check back in 5-15 minutes for completion.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSimpleExport();
