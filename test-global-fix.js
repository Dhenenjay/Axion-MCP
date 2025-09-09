#!/usr/bin/env node

/**
 * Test script for global shapefile support
 * Tests various international cities and regions
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

// Initialize environment
loadEnvFile();

// Setup Earth Engine polyfills
global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
if (typeof global.document === 'undefined') {
  global.document = {
    createElement: () => ({ 
      setAttribute: () => {},
      getElementsByTagName: () => [],
      parentNode: { insertBefore: () => {} }
    }),
    getElementsByTagName: () => [{ appendChild: () => {} }],
    head: { appendChild: () => {} },
    documentElement: {}
  };
}
if (typeof global.window === 'undefined') {
  global.window = {
    location: { href: '', protocol: 'https:' },
    document: global.document
  };
}

async function testGlobalShapefiles() {
  console.log('🌍 Testing Global Shapefile Support...\n');
  
  try {
    // Initialize Earth Engine
    const ee = require('@google/earthengine');
    const { GoogleAuth } = require('google-auth-library');
    
    const keyJson = JSON.parse(Buffer.from(process.env.GEE_SA_KEY_JSON || '', 'base64').toString('utf8'));
    const auth = new GoogleAuth({
      credentials: keyJson,
      scopes: ['https://www.googleapis.com/auth/earthengine']
    });
    
    require('cross-fetch/polyfill');
    
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    
    ee.data.setAuthToken('', 'Bearer', token.token, 3600);
    
    await new Promise((resolve, reject) => {
      ee.initialize(null, null, () => {
        console.log('✅ Earth Engine initialized\n');
        resolve();
      }, (err) => {
        reject(err);
      });
    });
    
    // Test locations
    const testLocations = [
      // European cities
      { name: 'Paris', country: 'France', level: 2 },
      { name: 'London', country: 'United Kingdom', level: 2, altName: 'Greater London' },
      { name: 'Berlin', country: 'Germany', level: 2 },
      { name: 'Madrid', country: 'Spain', level: 2 },
      { name: 'Rome', country: 'Italy', level: 2, altName: 'Roma' },
      
      // Asian cities
      { name: 'Tokyo', country: 'Japan', level: 2 },
      { name: 'Mumbai', country: 'India', level: 2 },
      { name: 'Beijing', country: 'China', level: 2 },
      { name: 'Singapore', country: 'Singapore', level: 2 },
      { name: 'Dubai', country: 'United Arab Emirates', level: 2 },
      
      // South American cities
      { name: 'São Paulo', country: 'Brazil', level: 2, altName: 'Sao Paulo' },
      { name: 'Buenos Aires', country: 'Argentina', level: 2 },
      
      // African cities
      { name: 'Cairo', country: 'Egypt', level: 2 },
      { name: 'Johannesburg', country: 'South Africa', level: 2 },
      
      // Australian cities
      { name: 'Sydney', country: 'Australia', level: 2 },
      
      // Countries
      { name: 'France', level: 0, field: 'ADM0_NAME' },
      { name: 'Japan', level: 0, field: 'ADM0_NAME' },
      { name: 'Brazil', level: 0, field: 'ADM0_NAME' },
      { name: 'India', level: 0, field: 'ADM0_NAME' }
    ];
    
    console.log('Testing FAO GAUL dataset coverage:\n');
    
    for (const location of testLocations) {
      try {
        const collection = `FAO/GAUL/2015/level${location.level}`;
        const fc = new ee.FeatureCollection(collection);
        
        let filtered;
        if (location.level === 0) {
          // Country level
          filtered = fc.filter(ee.Filter.eq('ADM0_NAME', location.name));
        } else if (location.level === 2) {
          // City/District level
          const nameToSearch = location.altName || location.name;
          filtered = fc.filter(ee.Filter.eq('ADM2_NAME', nameToSearch));
          
          if (location.country) {
            filtered = filtered.filter(ee.Filter.eq('ADM0_NAME', location.country));
          }
        }
        
        const count = await filtered.size().getInfo();
        
        if (count > 0) {
          const first = filtered.first();
          const geometry = first.geometry();
          const area = await geometry.area().getInfo();
          const area_km2 = Math.round(area / 1000000);
          
          console.log(`✅ ${location.name}${location.country ? ', ' + location.country : ''}`);
          console.log(`   Found in: ${collection}`);
          console.log(`   Area: ${area_km2.toLocaleString()} km²`);
          
          // Get properties to verify
          const props = await first.getInfo();
          if (props.properties) {
            if (props.properties.ADM2_NAME) {
              console.log(`   ADM2_NAME: ${props.properties.ADM2_NAME}`);
            }
            if (props.properties.ADM1_NAME) {
              console.log(`   ADM1_NAME: ${props.properties.ADM1_NAME}`);
            }
            if (props.properties.ADM0_NAME) {
              console.log(`   ADM0_NAME: ${props.properties.ADM0_NAME}`);
            }
          }
        } else {
          console.log(`❌ ${location.name}${location.country ? ', ' + location.country : ''} - NOT FOUND`);
          
          // Try to find why
          if (location.level === 2 && location.country) {
            // Check if the country exists
            const countryFiltered = fc.filter(ee.Filter.eq('ADM0_NAME', location.country));
            const countryCount = await countryFiltered.size().getInfo();
            if (countryCount > 0) {
              console.log(`   Country "${location.country}" exists with ${countryCount} districts`);
              
              // Try to list some district names for debugging
              const samples = await countryFiltered.limit(5).aggregate_array('ADM2_NAME').getInfo();
              console.log(`   Sample districts: ${samples.join(', ')}`);
            }
          }
        }
        
        console.log('');
        
      } catch (error) {
        console.error(`❌ Error testing ${location.name}: ${error.message}\n`);
      }
    }
    
    // Test with the actual shapefile_to_geometry tool logic
    console.log('\n=== Testing with actual tool logic ===\n');
    
    // Import and test the actual tool
    await import('./src/mcp/tools/index.ts');
    const { get } = require('./src/mcp/registry');
    
    const tool = get('convert_place_to_shapefile_geometry');
    if (tool) {
      const testCities = ['Paris', 'Tokyo', 'Mumbai', 'São Paulo', 'Cairo'];
      
      for (const city of testCities) {
        try {
          console.log(`Testing ${city}...`);
          const result = await tool.handler({ placeName: city });
          if (result.success) {
            console.log(`✅ ${city}: ${result.area_km2} km², Dataset: ${result.dataset}, Level: ${result.level}`);
          } else {
            console.log(`❌ ${city}: Failed`);
          }
        } catch (error) {
          console.log(`❌ ${city}: ${error.message}`);
        }
      }
    } else {
      console.log('Tool not found - may need to run through the server');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testGlobalShapefiles().catch(console.error);
