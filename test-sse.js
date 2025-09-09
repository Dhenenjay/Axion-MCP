const http = require('http');

function testSSE(toolName, args) {
  const data = JSON.stringify({
    tool: toolName,
    arguments: args
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/mcp/sse',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:');
      try {
        console.log(JSON.stringify(JSON.parse(body), null, 2));
      } catch (e) {
        console.log(body);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });
  
  console.log(`Testing ${toolName} with args:`, args);
  req.write(data);
  req.end();
}

// Test the endpoint
setTimeout(() => {
  testSSE('convert_place_to_shapefile_geometry', { placeName: 'Los Angeles' });
}, 1000);
