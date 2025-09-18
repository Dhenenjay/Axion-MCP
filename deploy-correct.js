#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const RENDER_API_KEY = 'rnd_kZQiMR6Gzvq1hkmqDDHhnJyNDHms';
const serviceAccountKey = fs.readFileSync(path.join(__dirname, 'gee-service-account.json'), 'utf8');

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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            resolve(body);
          }
        } else {
          reject(new Error(`${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function deploy() {
  console.log('🚀 Deploying Axion-MCP to Render with Pro Plan');
  console.log('='.repeat(50));
  
  try {
    // Get owner
    const owners = await apiRequest('GET', '/owners');
    const ownerId = owners[0]?.owner?.id;
    console.log('✓ Owner:', ownerId);

    // Create service with correct structure
    const payload = {
      type: 'web_service',
      name: 'axion-mcp',
      ownerId: ownerId,
      repo: 'https://github.com/Dhenenjay/Axion-MCP',
      branch: 'main',
      autoDeploy: 'yes',
      serviceDetails: {
        env: 'node',
        envSpecificDetails: {
          buildCommand: 'npm install && npm run build',
          startCommand: 'npm start'
        },
        plan: 'pro',
        region: 'oregon',
        healthCheckPath: '/api/health',
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

    console.log('📦 Creating service...');
    const result = await apiRequest('POST', '/services', payload);
    
    if (result.service) {
      console.log('✅ SERVICE CREATED SUCCESSFULLY!');
      console.log('');
      console.log('📊 Service Details:');
      console.log('  ID:', result.service.id);
      console.log('  Name:', result.service.name);
      console.log('  URL: https://axion-mcp.onrender.com');
      console.log('  Health: https://axion-mcp.onrender.com/api/health');
      console.log('  SSE: https://axion-mcp.onrender.com/api/mcp/sse-stream');
      console.log('');
      console.log('📋 Claude Desktop Config:');
      console.log(JSON.stringify({
        mcpServers: {
          "axion-mcp": {
            command: "npx",
            args: ["-y", "@vercel/mcp-bridge", "https://axion-mcp.onrender.com/api/mcp/sse-stream"]
          }
        }
      }, null, 2));
      console.log('');
      console.log('⏰ Deployment will take 5-10 minutes');
      console.log('📊 Monitor at: https://dashboard.render.com');
      console.log('');
      console.log('✨ Axion-MCP is deploying to the world! 🌍');
    } else {
      console.log('Unexpected response:', result);
    }
    
  } catch (error) {
    // Check if service already exists
    try {
      const services = await apiRequest('GET', '/services');
      const existing = services.find(s => s.service?.name === 'axion-mcp');
      
      if (existing) {
        console.log('✓ Service already exists:', existing.service.id);
        console.log('📝 Updating environment variables...');
        
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
            console.log(`  ✓ ${env.key}`);
          } catch {
            try {
              await apiRequest('POST', `/services/${existing.service.id}/env-vars`, env);
              console.log(`  ✓ Created ${env.key}`);
            } catch (e) {
              console.log(`  ⚠ ${env.key}: May already exist`);
            }
          }
        }

        // Trigger deployment
        console.log('🔄 Triggering deployment...');
        await apiRequest('POST', `/services/${existing.service.id}/deploys`, { clearCache: 'clear' });
        
        console.log('');
        console.log('✅ DEPLOYMENT TRIGGERED!');
        console.log('');
        console.log('📊 Service Details:');
        console.log('  URL: https://axion-mcp.onrender.com');
        console.log('  Health: https://axion-mcp.onrender.com/api/health');
        console.log('  SSE: https://axion-mcp.onrender.com/api/mcp/sse-stream');
        console.log('');
        console.log('⏰ Deployment will take 5-10 minutes');
        console.log('📊 Monitor at: https://dashboard.render.com');
      } else {
        console.error('Error creating service:', error.message);
      }
    } catch (e2) {
      console.error('Failed:', e2.message);
    }
  }
}

deploy();