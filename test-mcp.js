#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

console.error('[Test MCP] Server starting...');

rl.on('line', (line) => {
  console.error('[Test MCP] Received:', line);
  
  try {
    const message = JSON.parse(line);
    
    if (message.method === 'initialize') {
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: '2025-06-18',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'earth-engine',
            version: '1.0.0'
          }
        }
      };
      console.log(JSON.stringify(response));
      console.error('[Test MCP] Sent initialize response');
    } else if (message.method === 'tools/list') {
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          tools: [
            {
              name: 'convert_place_to_shapefile_geometry',
              description: 'Convert place name to shapefile boundary',
              inputSchema: {
                type: 'object',
                properties: {
                  place_name: { type: 'string' }
                },
                required: ['place_name']
              }
            }
          ]
        }
      };
      console.log(JSON.stringify(response));
      console.error('[Test MCP] Sent tools list');
    } else if (message.method === 'tools/call') {
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              message: 'Shapefile tool called successfully!',
              tool: message.params.name,
              args: message.params.arguments
            })
          }]
        }
      };
      console.log(JSON.stringify(response));
      console.error('[Test MCP] Tool called:', message.params.name);
    }
  } catch (e) {
    console.error('[Test MCP] Error:', e.message);
  }
});
