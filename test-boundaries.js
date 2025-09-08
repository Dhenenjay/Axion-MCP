const { 
  getAdminBoundary, 
  getUSBoundary, 
  searchBoundaries, 
  exportWithBoundary 
} = require('./src/earth-engine/boundaries');
const { initializeEarthEngine } = require('./src/earth-engine/init');

async function testBoundaries() {
  try {
    const keyPath = 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json';
    
    console.log('🗺️ ADMINISTRATIVE BOUNDARIES TEST');
    console.log('='.repeat(60) + '\n');
    
    // Initialize Earth Engine
    console.log('1️⃣ Initializing Earth Engine...');
    await initializeEarthEngine(keyPath);
    console.log('   ✅ Earth Engine initialized\n');
    
    // Test 1: Get San Francisco County boundary
    console.log('2️⃣ Getting San Francisco County boundary...');
    try {
      const sfBoundary = await getAdminBoundary({
        placeName: 'San Francisco',
        adminLevel: 2, // County level
        country: 'United States of America'
      });
      
      console.log('   ✅ Found San Francisco boundary!');
      console.log('   📊 Area:', Math.round(sfBoundary.area), 'km²');
      console.log('   📍 Centroid:', sfBoundary.centroid.coordinates);
      console.log('   📋 Properties:', Object.keys(sfBoundary.properties).slice(0, 5).join(', '), '...\n');
    } catch (error) {
      console.log('   ⚠️ Could not find San Francisco in global dataset');
      console.log('   Trying US-specific dataset...\n');
      
      // Try US-specific dataset
      const sfUS = await getUSBoundary({
        county: 'San Francisco',
        state: 'California',
        type: 'county'
      });
      
      console.log('   ✅ Found using US Census data!');
      console.log('   📋 Properties:', Object.keys(sfUS.properties).slice(0, 5).join(', '), '...\n');
    }
    
    // Test 2: Search for boundaries
    console.log('3️⃣ Searching for boundaries containing "Francisco"...');
    const searchResults = await searchBoundaries({
      searchTerm: 'Francisco',
      adminLevel: 2,
      limit: 5
    });
    
    console.log('   Found', searchResults.length, 'matches:');
    searchResults.forEach(result => {
      console.log(`   • ${result.name} (${result.country})`);
    });
    console.log('');
    
    // Test 3: Get California state boundary
    console.log('4️⃣ Getting California state boundary...');
    const californiaBoundary = await getAdminBoundary({
      placeName: 'California',
      adminLevel: 1, // State level
      country: 'United States of America'
    });
    
    console.log('   ✅ Found California!');
    console.log('   📊 Area:', Math.round(californiaBoundary.area), 'km²');
    console.log('');
    
    // Test 4: Export with actual boundary
    console.log('5️⃣ Starting export with actual San Francisco boundary...');
    const exportResult = await exportWithBoundary({
      placeName: 'San Francisco',
      adminLevel: 2,
      country: 'United States of America',
      datasetId: 'COPERNICUS/S2_SR_HARMONIZED',
      startDate: '2024-08-01',
      endDate: '2024-09-01',
      bands: ['B4', 'B3', 'B2'],
      scale: 10,
      description: 'SanFrancisco_exact_boundary'
    });
    
    console.log('   ✅', exportResult.status);
    console.log('   📍 Place:', exportResult.placeName);
    console.log('   📊 Area:', exportResult.area);
    console.log('   📝', exportResult.message);
    console.log('');
    
    console.log('='.repeat(60));
    console.log('✅ BOUNDARY TEST COMPLETE!\n');
    
    console.log('📚 KEY POINTS:');
    console.log('• Used actual administrative boundaries (not simple polygons)');
    console.log('• Export will be clipped to exact San Francisco county shape');
    console.log('• No data outside the boundary will be included');
    console.log('• File will be smaller and more precise\n');
    
    console.log('🌍 AVAILABLE BOUNDARY DATASETS:');
    console.log('• FAO GAUL: Global admin boundaries (countries, states, districts)');
    console.log('• US Census TIGER: Detailed US boundaries');
    console.log('• GADM: Alternative global boundaries');
    console.log('• Custom shapefiles: Can upload your own via Earth Engine\n');
    
    console.log('📥 TO GET SHAPEFILES:');
    console.log('• GADM: https://gadm.org/download_country.html');
    console.log('• Natural Earth: https://www.naturalearthdata.com/');
    console.log('• OpenStreetMap: https://download.geofabrik.de/');
    console.log('• US Census: https://www.census.gov/geographies/mapping-files.html');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testBoundaries();
