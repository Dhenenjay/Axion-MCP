#!/usr/bin/env node

/**
 * Deploy Axion-MCP to Render with Pro Plan
 * This script creates or updates a Render service with proper environment variables
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const RENDER_API_KEY = 'rnd_kZQiMR6Gzvq1hkmqDDHhnJyNDHms';
const SERVICE_NAME = 'axion-mcp';
const GITHUB_REPO = 'https://github.com/Dhenenjay/Axion-MCP';

// Read the service account key
const serviceAccountPath = path.join(__dirname, 'gee-service-account.json');
let serviceAccountKey;

try {
  serviceAccountKey = fs.readFileSync(serviceAccountPath, 'utf8');
  console.log('✓ Service account key loaded');
} catch (err) {
  console.error('Error: Could not read gee-service-account.json');
  console.error('Make sure the file exists in the project root');
  process.exit(1);
}

// Parse service account to get project info
const serviceAccount = JSON.parse(serviceAccountKey);

// Function to make API request to Render
function apiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (e) {
            resolve(body);
          }
        } else {
          console.error(`API Error (${res.statusCode}):`, body);
          reject(new Error(`API request failed with status ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      const payload = JSON.stringify(data);
      req.write(payload);
    }
    
    req.end();
  });
}

// Main deployment function
async function deploy() {
  console.log('🚀 Starting deployment to Render with Pro plan...\n');
  
  try {
    // First, get the owner information
    console.log('📋 Getting account information...');
    const owners = await apiRequest('GET', '/owners');
    let ownerId;
    
    if (Array.isArray(owners) && owners.length > 0) {
      ownerId = owners[0].owner.id;
      console.log(`✓ Found owner ID: ${ownerId}`);
    } else {
      throw new Error('Could not find owner ID. Please check your API key.');
    }
    
    // Then check if service already exists
    console.log('📋 Checking for existing services...');
    const services = await apiRequest('GET', '/services?limit=100');
    
    let existingService = null;
    if (Array.isArray(services)) {
      existingService = services.find(s => s.service && s.service.name === SERVICE_NAME);
    }
    
    if (existingService) {
      console.log(`✓ Found existing service: ${existingService.service.id}`);
      console.log('📝 Service URL:', existingService.service.serviceDetails?.url || `https://${SERVICE_NAME}.onrender.com`);
      
      // Update the service to use Pro plan
      console.log('🔄 Updating to Pro plan...');
      try {
        await apiRequest('PATCH', `/services/${existingService.service.id}`, {
          plan: 'pro'
        });
        console.log('✓ Updated to Pro plan');
      } catch (e) {
        console.log('Note: Plan update may require manual action in Render dashboard');
      }
      
      // Update environment variables
      console.log('📝 Updating environment variables...');
      const envVars = [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'PORT', value: '10000' },
        { key: 'GOOGLE_APPLICATION_CREDENTIALS_JSON', value: serviceAccountKey },
        { key: 'GCP_PROJECT_ID', value: serviceAccount.project_id },
        { key: 'GCP_SERVICE_ACCOUNT_EMAIL', value: serviceAccount.client_email },
        { key: 'NEXT_TELEMETRY_DISABLED', value: '1' }
      ];
      
      for (const envVar of envVars) {
        try {
          // Try to update existing env var
          await apiRequest('PUT', `/services/${existingService.service.id}/env-vars/${envVar.key}`, {
            value: envVar.value
          });
          console.log(`  ✓ Updated ${envVar.key}`);
        } catch (err) {
          // If update fails, try to create new
          try {
            await apiRequest('POST', `/services/${existingService.service.id}/env-vars`, envVar);
            console.log(`  ✓ Created ${envVar.key}`);
          } catch (e) {
            console.log(`  ⚠ Could not set ${envVar.key}: ${e.message}`);
          }
        }
      }
      
      console.log('\n🔄 Triggering new deployment...');
      await apiRequest('POST', `/services/${existingService.service.id}/deploys`, {
        clearCache: 'clear'
      });
      
      console.log('\n✅ Deployment triggered successfully!');
      console.log(`\n🌐 Your service will be available at: https://${SERVICE_NAME}.onrender.com`);
      
    } else {
      // Create new service
      console.log('Creating new Render service with Pro plan...');
      
      const createPayload = {
        type: 'web_service',
        name: SERVICE_NAME,
        ownerId: ownerId,
        repo: GITHUB_REPO,
        branch: 'main',
        autoDeploy: 'yes',
        serviceDetails: {
          env: 'node',
          region: 'oregon',
          plan: 'pro',
          buildCommand: 'npm install && npm run build',
          startCommand: 'npm start',
          healthCheckPath: '/api/health',
          envVars: [
            { key: 'NODE_ENV', value: 'production' },
            { key: 'PORT', value: '10000' },
            { key: 'GOOGLE_APPLICATION_CREDENTIALS_JSON', value: serviceAccountKey },
            { key: 'GCP_PROJECT_ID', value: serviceAccount.project_id },
            { key: 'GCP_SERVICE_ACCOUNT_EMAIL', value: serviceAccount.client_email },
            { key: 'NEXT_TELEMETRY_DISABLED', value: '1' }
          ]
        }
      };
      
      const newService = await apiRequest('POST', '/services', createPayload);
      
      if (newService.service) {
        console.log('✓ Service created:', newService.service.id);
        console.log('\n✅ Deployment started with Pro plan!');
        console.log(`\n🌐 Your service will be available at: https://${SERVICE_NAME}.onrender.com`);
      } else {
        console.log('Response:', newService);
      }
    }
    
    console.log('\n📖 Next Steps:');
    console.log('1. Wait 5-10 minutes for the initial deployment to complete');
    console.log('2. Check deployment status at: https://dashboard.render.com');
    console.log('3. Once deployed, users can connect using:');
    console.log('\n📋 Claude Desktop Config:');
    console.log(JSON.stringify({
      mcpServers: {
        "axion-mcp": {
          command: "npx",
          args: [
            "-y",
            "@vercel/mcp-bridge",
            `https://${SERVICE_NAME}.onrender.com/api/mcp/sse-stream`
          ]
        }
      }
    }, null, 2));
    
    console.log('\n✨ Your Axion-MCP Earth Engine service is deploying!');
    
  } catch (error) {
    console.error('\n❌ Deployment error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if the Render API key is valid');
    console.error('2. Ensure the GitHub repository is public');
    console.error('3. Try deploying manually via https://dashboard.render.com');
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run deployment
console.log('='.repeat(60));
console.log('   Axion-MCP Earth Engine - Render Deployment (Pro Plan)');
console.log('='.repeat(60));
console.log();

deploy();