#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const RENDER_API_KEY = 'rnd_kZQiMR6Gzvq1hkmqDDHhnJyNDHms';
const serviceAccountKey = fs.readFileSync(path.join(__dirname, 'gee-service-account.json'), 'utf8');
const serviceAccount = JSON.parse(serviceAccountKey);

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
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Response ${res.statusCode}:`, body.substring(0, 200));
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    if (data) {
      const payload = JSON.stringify(data);
      console.log('Sending:', payload.substring(0, 500));
      req.write(payload);
    }
    req.end();
  });
}

async function deploy() {
  try {
    // Get owner
    const owners = await apiRequest('GET', '/owners');
    const ownerId = owners[0]?.owner?.id;
    console.log('Owner ID:', ownerId);

    // Check if service exists
    const services = await apiRequest('GET', '/services');
    const existing = services.find(s => s.service?.name === 'axion-mcp');

    if (existing) {
      console.log('Found existing service:', existing.service.id);
      
      // Update env vars
      const envVars = [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'PORT', value: '10000' },
        { key: 'GOOGLE_APPLICATION_CREDENTIALS_JSON', value: serviceAccountKey },
        { key: 'GCP_PROJECT_ID', value: 'axion-orbital' },
        { key: 'GCP_SERVICE_ACCOUNT_EMAIL', value: 'mcp-963@axion-orbital.iam.gserviceaccount.com' },
        { key: 'NEXT_TELEMETRY_DISABLED', value: '1' }
      ];

      for (const env of envVars) {
        try {
          await apiRequest('PUT', `/services/${existing.service.id}/env-vars/${env.key}`, { value: env.value });
          console.log(`✓ ${env.key}`);
        } catch (e) {
          await apiRequest('POST', `/services/${existing.service.id}/env-vars`, env);
          console.log(`✓ Created ${env.key}`);
        }
      }

      // Deploy
      await apiRequest('POST', `/services/${existing.service.id}/deploys`, { clearCache: 'clear' });
      console.log('✅ Deployment triggered!');
      console.log('URL: https://axion-mcp.onrender.com');
      
    } else {
      // Create new - using exact Render format from their docs
      const payload = {
        type: 'web_service',
        name: 'axion-mcp',
        ownerId: ownerId,
        repo: 'https://github.com/Dhenenjay/Axion-MCP',
        branch: 'main',
        autoDeploy: 'yes',
        // Node-specific details
        runtime: 'node', 
        serviceDetails: {
          env: 'node',
          region: 'oregon',
          plan: 'pro',
          buildCommand: 'npm install && npm run build',
          startCommand: 'npm start',
          envVars: [
            { key: 'NODE_ENV', value: 'production' },
            { key: 'PORT', value: '10000' },
            { key: 'GOOGLE_APPLICATION_CREDENTIALS_JSON', value: serviceAccountKey },
            { key: 'GCP_PROJECT_ID', value: 'axion-orbital' },
            { key: 'GCP_SERVICE_ACCOUNT_EMAIL', value: 'mcp-963@axion-orbital.iam.gserviceaccount.com' },
            { key: 'NEXT_TELEMETRY_DISABLED', value: '1' }
          ]
        }
      };

      const result = await apiRequest('POST', '/services', payload);
      
      if (result.service) {
        console.log('✅ Service created!');
        console.log('ID:', result.service.id);
        console.log('URL: https://axion-mcp.onrender.com');
      } else {
        console.log('Result:', result);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    
    // Try the simplest possible payload
    console.log('\nTrying minimal payload...');
    try {
      const owners = await apiRequest('GET', '/owners');
      const ownerId = owners[0]?.owner?.id;
      
      const minimal = {
        type: 'web_service',
        name: 'axion-mcp',
        ownerId: ownerId,
        repo: 'https://github.com/Dhenenjay/Axion-MCP'
      };
      
      const result = await apiRequest('POST', '/services', minimal);
      console.log('Minimal result:', result);
      
      if (result.service) {
        const serviceId = result.service.id;
        console.log('Created! Now configuring...');
        
        // Configure after creation
        await apiRequest('PATCH', `/services/${serviceId}`, {
          branch: 'main',
          runtime: 'node',
          buildCommand: 'npm install && npm run build',
          startCommand: 'npm start',
          plan: 'pro',
          region: 'oregon'
        });
        
        console.log('✅ Service configured!');
        console.log('URL: https://axion-mcp.onrender.com');
      }
    } catch (e2) {
      console.error('Minimal approach failed:', e2.message);
    }
  }
}

console.log('🚀 Deploying Axion-MCP to Render (Pro Plan)');
console.log('='.repeat(50));
deploy();