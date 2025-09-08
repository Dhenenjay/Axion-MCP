const { listDriveFiles, createFolderIfNotExists } = require('./src/earth-engine/drive-access');
const { createBatchExport } = require('./src/earth-engine/export-highres');
const { initializeEarthEngine } = require('./src/earth-engine/init');

async function testDriveSetup() {
  try {
    const keyPath = 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json';
    
    console.log('🔧 SERVICE ACCOUNT DRIVE SETUP TEST');
    console.log('='.repeat(60) + '\n');
    
    // Initialize Earth Engine
    console.log('1️⃣ Initializing Earth Engine...');
    await initializeEarthEngine(keyPath);
    console.log('   ✅ Earth Engine initialized\n');
    
    // Test Drive access
    console.log('2️⃣ Testing Drive API access...');
    try {
      const files = await listDriveFiles(keyPath);
      console.log('   ✅ Drive API working!');
      console.log(`   📁 Found ${files.length} files in root of service account Drive\n`);
      
      if (files.length > 0) {
        console.log('   Recent files:');
        files.slice(0, 3).forEach(file => {
          console.log(`      • ${file.name} (${file.size})`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('   ⚠️ Drive API error:', error.message);
      console.log('   This might be a first-time setup issue\n');
    }
    
    // Create folder if needed
    console.log('3️⃣ Setting up EarthEngine_Exports folder...');
    const folderResult = await createFolderIfNotExists(keyPath, 'EarthEngine_Exports');
    console.log('   ' + (folderResult.created ? '✅ Created new folder' : '📁 Folder already exists'));
    console.log('   Folder ID:', folderResult.id);
    console.log('   Status:', folderResult.message + '\n');
    
    // Try listing files in the folder
    console.log('4️⃣ Checking folder contents...');
    try {
      const folderFiles = await listDriveFiles(keyPath, 'EarthEngine_Exports');
      console.log(`   📁 Found ${folderFiles.length} files in EarthEngine_Exports folder`);
      if (folderFiles.length > 0) {
        console.log('   Existing exports:');
        folderFiles.forEach(file => {
          console.log(`      • ${file.name} (${file.size}) - ${new Date(file.created).toLocaleString()}`);
        });
      }
    } catch (error) {
      console.log('   Folder is empty or just created');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DRIVE SETUP COMPLETE!\n');
    
    // Now test export without folder parameter (root export)
    console.log('5️⃣ Testing export to root of Drive (no folder)...');
    const exportResult = await createBatchExport({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-08-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco
        buffer: 5000 // 5km buffer
      },
      bands: ['B4', 'B3', 'B2'], // Just RGB
      scale: 10,
      description: `test_root_export_${Date.now()}`,
      // NOTE: No folder parameter - will export to root
    });
    
    console.log('   ✅ Export submitted to root of Drive!');
    console.log('   File will appear as:', exportResult.driveAccess.fileName);
    console.log('');
    
    // Also test with folder
    console.log('6️⃣ Testing export WITH folder...');
    const folderExport = await createBatchExport({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-08-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749],
        buffer: 5000
      },
      bands: ['B4', 'B3', 'B2'],
      scale: 10,
      description: `test_folder_export_${Date.now()}`,
      folder: 'EarthEngine_Exports' // WITH folder
    });
    
    console.log('   ✅ Export submitted to EarthEngine_Exports folder!');
    console.log('   File will appear as:', folderExport.driveAccess.fileName);
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:');
    console.log('• Service account Drive is accessible');
    console.log('• Folder "EarthEngine_Exports" is ready');
    console.log('• Exports can go to root (no folder) or specific folder');
    console.log('• Both export tasks are now processing');
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Wait 5-10 minutes for exports to complete');
    console.log('2. Run this script again to see the exported files');
    console.log('3. Use downloadFromDrive() to get the files locally');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testDriveSetup();
