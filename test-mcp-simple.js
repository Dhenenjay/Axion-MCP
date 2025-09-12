#!/usr/bin/env node

const http = require('http');

// Test simple health check first
const testData = JSON.stringify({
  jsonrpc: '2.0',
  method: 'tools/list',
  params: {},
  id: 1
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/stdio',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length
  }
};

console.log('Testing MCP server...');
console.log('Request:', testData);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse status:', res.statusCode);
    console.log('Response headers:', res.headers);
    console.log('\nRaw response:', data);
    
    try {
      const parsed = JSON.parse(data);
      console.log('\nParsed response:', JSON.stringify(parsed, null, 2));
      
      if (parsed.result) {
        console.log('\n✓ MCP server is responding correctly');
        console.log('Number of tools available:', parsed.result.tools ? parsed.result.tools.length : 'unknown');
      } else {
        console.log('\n✗ MCP server response has no result field');
      }
    } catch (e) {
      console.log('\n✗ Failed to parse response:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('✗ Request failed:', e.message);
});

req.write(testData);
req.end();