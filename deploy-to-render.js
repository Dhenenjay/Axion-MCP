#!/usr/bin/env node

/**
 * Deploy Axion-MCP to Render
 * This script creates a new Render service and configures it with proper environment variables
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const RENDER_API_KEY = process.env.RENDER_API_KEY || 'rnd_kZQiMR6Gzvq1hkmqDDHhnJyNDHms';
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

// Render API configuration for service creation
const renderConfig = {
  type: 'web_service',
  name: SERVICE_NAME,
  serviceDetails: {
    env: 'node',
    region: 'orego      {
        key: 'NODE_ENV',
        value: 'production'
      },
    {
      key: 'PORT',
      value: '10000'
    },
    {
      key: 'GOOGLE_APPLICATION_CREDENTIALS_JSON',
      value: serviceAccountKey
    },
    {
      key: 'GCP_PROJECT_ID',
      value: serviceAccount.project_id
    },
    {
      key: 'GCP_SERVICE_ACCOUNT_EMAIL',
      value: serviceAccount.client_email
    },
    {
      key: 'NEXT_TELEMETRY_DISABLED',
      value: '1'
    }
    ],
    repo: GITHUB_REPO,
    branch: 'main',
    autoDeploy: 'yes'
  }
};

// Function to make API request
function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error (${res.statusCode}): ${JSON.stringify(parsed)}`));
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Main deployment function
async function deploy() {
  console.log('🚀 Starting deployment to Render...\n');

  try {
    // Check if service already exists
    console.log('📋 Checking existing services...');
    const services = await apiRequest('GET', '/services');
    
    const existingService = services.find(s => s.service.name === SERVICE_NAME);
    
    if (existingService) {
      console.log(`✓ Found existing service: ${existingService.service.id}`);
      console.log('📝 Updating environment variables...');
      
      // Update environment variables
      for (const envVar of renderConfig.envVars) {
        try {
          await apiRequest('PUT', `/services/${existingService.service.id}/env-vars/${envVar.key}`, {
            value: envVar.value
          });
        } catch (err) {
          // Try to create if update fails
          await apiRequest('POST', `/services/${existingService.service.id}/env-vars`, envVar);
        }
      }
      
      console.log('✓ Environment variables updated');
      console.log('🔄 Triggering new deployment...');
      
      // Trigger a new deployment
      await apiRequest('POST', `/services/${existingService.service.id}/deploys`);
      
      console.log('\n✅ Deployment triggered successfully!');
      console.log(`🌐 Service URL: ${existingService.service.serviceUrl || 'https://' + SERVICE_NAME + '.onrender.com'}`);
    } else {
      console.log('Creating new service...');
      
      // Create new service
      const newService = await apiRequest('POST', '/services', renderConfig);
      
      console.log('✓ Service created:', newService.service.id);
      console.log('\n✅ Deployment started!');
      console.log(`🌐 Service URL: https://${SERVICE_NAME}.onrender.com`);
    }
    
    console.log('\n📖 Next Steps:');
    console.log('1. Wait for the deployment to complete (5-10 minutes)');
    console.log('2. Check the deployment status at: https://dashboard.render.com');
    console.log('3. Once deployed, users can connect using the instructions in DEPLOY_GUIDE.md');
    console.log('\n🔗 SSE Endpoint for Claude/Cursor:');
    console.log(`   https://${SERVICE_NAME}.onrender.com/api/mcp/sse`);
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify your Render API key is correct');
    console.error('2. Ensure you have a Render account');
    console.error('3. Check that the GitHub repository is public');
    process.exit(1);
  }
}

// Run deployment
deploy();