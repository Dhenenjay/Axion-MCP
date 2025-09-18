#!/usr/bin/env node

/**
 * Final Deployment Script for Axion-MCP to Render (Pro Plan)
 * This handles the complex Render API requirements properly
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const RENDER_API_KEY = 'rnd_kZQiMR6Gzvq1hkmqDDHhnJyNDHms';
const SERVICE_NAME = 'axion-mcp';
const GITHUB_REPO = 'https://github.com/Dhenenjay/Axion-MCP';

// Read service account
const serviceAccountPath = path.join(__dirname, 'gee-service-account.json');
const serviceAccountKey = fs.readFileSync(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(serviceAccountKey);

console.log('🚀 Axion-MCP Deployment to Render (Pro Plan)');
console.log('='.repeat(50));

// Make API request
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
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`API ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function deploy() {
  try {
    // Get owner ID
    console.log('📋 Getting account info...');
    const owners = await apiRequest('GET', '/owners');
    const ownerId = owners[0]?.owner?.id;
    if (!ownerId) throw new Error('Could not get owner ID');
    console.log('✓ Owner ID:', ownerId);

    // Check existing services
    console.log('📋 Checking existing services...');
    const services = await apiRequest('GET', '/services?limit=100');
    const existing = services.find(s => s.service?.name === SERVICE_NAME);

    if (existing) {
      const serviceId = existing.service.id;
      console.log('✓ Found existing service:', serviceId);
      console.log('🌐 URL: https://axion-mcp.onrender.com');
      
      // Update plan
      console.log('📝 Updating to Pro plan...');
      try {
        await apiRequest('PATCH', `/services/${serviceId}`, {
          serviceDeploy: { plan: 'pro' }
        });
        console.log('✓ Plan updated');
      } catch (e) {
        console.log('⚠ Plan update may need manual action');
      }

      // Update env vars
      console.log('📝 Setting environment variables...');
      const envVars = [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'PORT', value: '10000' },
        { key: 'GOOGLE_APPLICATION_CREDENTIALS_JSON', value: serviceAccountKey },
        { key: 'GCP_PROJECT_ID', value: serviceAccount.project_id },
        { key: 'GCP_SERVICE_ACCOUNT_EMAIL', value: serviceAccount.client_email },
        { key: 'NEXT_TELEMETRY_DISABLED', value: '1' }
      ];

      // First, get existing env vars
      const currentEnvVars = await apiRequest('GET', `/services/${serviceId}/env-vars`);
      const existingKeys = currentEnvVars.map(e => e.envVar.key);

      for (const envVar of envVars) {
        try {
          if (existingKeys.includes(envVar.key)) {
            // Update existing
            await apiRequest('PUT', `/services/${serviceId}/env-vars/${envVar.key}`, {
              value: envVar.value
            });
          } else {
            // Create new
            await apiRequest('POST', `/services/${serviceId}/env-vars`, envVar);
          }
          console.log(`  ✓ ${envVar.key}`);
        } catch (e) {
          console.log(`  ⚠ ${envVar.key}: ${e.message}`);
        }
      }

      // Trigger deployment
      console.log('🔄 Triggering deployment...');
      await apiRequest('POST', `/services/${serviceId}/deploys`, {
        clearCache: 'clear'
      });
      
      console.log('\n✅ DEPLOYMENT TRIGGERED!');
      console.log('\n📊 Service Details:');
      console.log('  URL: https://axion-mcp.onrender.com');
      console.log('  Health: https://axion-mcp.onrender.com/api/health');
      console.log('  SSE: https://axion-mcp.onrender.com/api/mcp/sse-stream');
      
    } else {
      // Create new service
      console.log('🆕 Creating new service with Pro plan...');
      
      // Render's create service payload structure
      const payload = {
        type: 'web_service',
        name: SERVICE_NAME,
        ownerId: ownerId,
        repo: GITHUB_REPO,
        autoDeploy: 'yes',
        branch: 'main',
        serviceDetails: {
          publishPath: 'public',
          envSpecificDetails: {
            buildCommand: 'npm install && npm run build',
            startCommand: 'npm start',
            plan: 'pro',
            region: 'oregon',
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
        }
      };

      const result = await apiRequest('POST', '/services', payload);
      
      if (result.service) {
        console.log('✓ Service created:', result.service.id);
        console.log('\n✅ DEPLOYMENT STARTED!');
        console.log('\n📊 Service Details:');
        console.log('  URL: https://axion-mcp.onrender.com');
        console.log('  Health: https://axion-mcp.onrender.com/api/health');
        console.log('  SSE: https://axion-mcp.onrender.com/api/mcp/sse-stream');
      } else {
        console.log('Service creation response:', result);
      }
    }

    console.log('\n📋 Claude Desktop Configuration:');
    console.log(JSON.stringify({
      mcpServers: {
        "axion-mcp": {
          command: "npx",
          args: ["-y", "@vercel/mcp-bridge", "https://axion-mcp.onrender.com/api/mcp/sse-stream"]
        }
      }
    }, null, 2));

    console.log('\n⏰ Deployment typically takes 5-10 minutes');
    console.log('📊 Monitor at: https://dashboard.render.com');
    console.log('\n✨ Axion-MCP is deploying to the world! 🌍');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTrying alternative approach...');
    
    // Try alternative API structure
    try {
      const owners = await apiRequest('GET', '/owners');
      const ownerId = owners[0]?.owner?.id;
      
      const simplePayload = {
        type: 'web_service',
        name: SERVICE_NAME,
        ownerId: ownerId,
        repo: GITHUB_REPO,
        branch: 'main',
        runtime: 'node',
        region: 'oregon',
        plan: 'pro',
        buildCommand: 'npm install && npm run build',
        startCommand: 'npm start',
        autoDeploy: true,
        envVars: {
          NODE_ENV: 'production',
          PORT: '10000',
          GOOGLE_APPLICATION_CREDENTIALS_JSON: serviceAccountKey,
          GCP_PROJECT_ID: serviceAccount.project_id,
          GCP_SERVICE_ACCOUNT_EMAIL: serviceAccount.client_email,
          NEXT_TELEMETRY_DISABLED: '1'
        }
      };
      
      const result = await apiRequest('POST', '/services', simplePayload);
      console.log('Alternative approach result:', result);
    } catch (altError) {
      console.error('Alternative approach also failed:', altError.message);
      console.log('\n📝 Manual deployment required:');
      console.log('1. Go to https://dashboard.render.com');
      console.log('2. Create new Web Service');
      console.log('3. Connect repo: Dhenenjay/Axion-MCP');
      console.log('4. Use Pro plan');
      console.log('5. Set the environment variables shown above');
    }
  }
}

deploy();