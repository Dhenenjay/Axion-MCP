const { createBatchExport } = require('./src/earth-engine/export-highres');
const { listDriveFiles, getFileDownloadUrl, downloadFromDrive, waitAndDownload } = require('./src/earth-engine/drive-access');
const { initializeEarthEngine } = require('./src/earth-engine/init');
const path = require('path');

async function testDriveExport() {
  try {
    const keyPath = 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json';
    
    console.log('🚀 SERVICE ACCOUNT DRIVE EXPORT TEST');
    console.log('='.repeat(60) + '\n');
    
    // Initialize Earth Engine
    console.log('1️⃣ Initializing Earth Engine...');
    await initializeEarthEngine(keyPath);
    console.log('   ✅ Earth Engine initialized\n');
    
    // Create export task
    console.log('2️⃣ Creating batch export task for large area...');
    const exportResult = await createBatchExport({
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-08-01',
      endDate: '2024-09-01',
      region: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco
        buffer: 10000 // 10km buffer for larger area
      },
      bands: ['B4', 'B3', 'B2', 'B8'], // RGB + NIR
      scale: 10, // Native resolution
      description: `sf_export_test_${Date.now()}`,
      folder: 'EarthEngine_Exports'
    });
    
    console.log('   ✅ Export task submitted!');
    console.log('   📋 Task ID:', exportResult.taskId);
    console.log('   📁 Folder:', exportResult.driveAccess.folder);
    console.log('   📄 File Name:', exportResult.driveAccess.fileName);
    console.log('   ⏱️ Estimated Time:', exportResult.estimatedTime);
    console.log('   💾 Quality:', exportResult.quality);
    console.log('   📊 Parameters:');
    Object.entries(exportResult.exportParams).forEach(([key, value]) => {
      console.log(`      ${key}: ${value}`);
    });
    console.log('');
    
    // List existing files in Drive
    console.log('3️⃣ Checking service account Drive for existing exports...');
    try {
      const files = await listDriveFiles(keyPath, 'EarthEngine_Exports');
      if (files.length > 0) {
        console.log(`   📁 Found ${files.length} existing files in Drive:`);
        files.slice(0, 5).forEach(file => {
          console.log(`      • ${file.name} (${file.size}) - Created: ${new Date(file.created).toLocaleString()}`);
        });
      } else {
        console.log('   📁 No existing files found in EarthEngine_Exports folder');
      }
    } catch (error) {
      console.log('   ⚠️ Could not list Drive files:', error.message);
      console.log('   Note: The folder may not exist yet or permissions may need adjustment');
    }
    console.log('');
    
    // Option 1: Wait and download automatically
    console.log('4️⃣ Option A: Wait for export and download automatically');
    console.log('   This would wait for the export to complete and download it:');
    console.log(`   await waitAndDownload(keyPath, '${exportResult.driveAccess.fileName}', './downloads/${exportResult.driveAccess.fileName}', 30);`);
    console.log('   (Skipping automatic wait to save time - uncomment if needed)\n');
    
    // Uncomment to actually wait and download:
    /*
    const downloadPath = path.join(__dirname, 'downloads', exportResult.driveAccess.fileName);
    console.log('   ⏳ Waiting for export to complete...');
    const downloadResult = await waitAndDownload(keyPath, exportResult.driveAccess.fileName, downloadPath, 30);
    console.log('   ✅ Download complete!');
    console.log('   📁 Saved to:', downloadResult.savedTo);
    console.log('   📊 File size:', downloadResult.fileSize);
    */
    
    // Option 2: Check and download later
    console.log('5️⃣ Option B: Check status and download manually later');
    console.log('   You can check if the file is ready with:');
    console.log(`   const fileInfo = await getFileDownloadUrl(keyPath, '${exportResult.driveAccess.fileName}');`);
    console.log('   Then download with:');
    console.log(`   await downloadFromDrive(keyPath, fileInfo.fileId, './downloads/${exportResult.driveAccess.fileName}');`);
    console.log('');
    
    // Demonstrate checking for a file
    console.log('6️⃣ Checking if export is ready (demonstration)...');
    const fileCheck = await getFileDownloadUrl(keyPath, exportResult.driveAccess.fileName);
    if (fileCheck.found) {
      console.log('   ✅ File is ready!');
      console.log('   📁 File Name:', fileCheck.fileName);
      console.log('   📊 Size:', fileCheck.size);
      console.log('   🔗 Direct URL:', fileCheck.directUrl);
    } else {
      console.log('   ⏳ File not ready yet');
      console.log('   💡', fileCheck.suggestion);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SERVICE ACCOUNT DRIVE EXPORT TEST COMPLETE!\n');
    
    console.log('📋 SUMMARY:');
    console.log('• Export tasks automatically go to service account Drive');
    console.log('• No manual intervention needed');
    console.log('• Files can be accessed programmatically via Drive API');
    console.log('• Use waitAndDownload() for automated download after export');
    console.log('• Use listDriveFiles() to see all exported files');
    console.log('• Use downloadFromDrive() to download specific files');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Wait 5-15 minutes for export to complete');
    console.log('2. Run listDriveFiles() to see the exported file');
    console.log('3. Use downloadFromDrive() to get the GeoTIFF');
    console.log('4. Import the GeoTIFF into QGIS/ArcGIS for analysis');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testDriveExport();
