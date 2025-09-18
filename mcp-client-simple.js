#!/usr/bin/env node

/**
 * MCP Client Bridge for Axion MCP Server
 * Connects Claude Desktop to the deployed server via stdio
 */

const readline = require('readline');

// Use the SSE-stream endpoint that handles MCP protocol
const SERVER_URL = 'https://axion-mcp.onrender.com/api/mcp/sse-stream';

async function main() {
  console.error('[Client] MCP Bridge starting...');
  console.error('[Client] Server URL:', SERVER_URL);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    try {
      const message = JSON.parse(line);
      const method = message.method || 'response';
      console.error(`[Client] Processing ${method}`);
      
      // Send to SSE-stream endpoint which handles MCP protocol
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.error(`[Client] Response received for ${method}`);
      
      // Send response back to Claude
      console.log(JSON.stringify(result));
      
    } catch (error) {
      console.error('[Client] Error:', error.message);
      
      // Try to parse the message to get the ID
      let messageId = null;
      try {
        const msg = JSON.parse(line);
        messageId = msg.id;
      } catch {}
      
      const errorResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message
        },
        id: messageId
      };
      console.log(JSON.stringify(errorResponse));
    }
  });

  // Handle shutdown gracefully
  process.on('SIGINT', () => {
    console.error('[Client] Shutting down...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.error('[Client] Shutting down...');
    process.exit(0);
  });

  console.error('[Client] MCP Bridge ready');
  console.error('[Client] Waiting for messages from Claude...');
}

main().catch(error => {
  console.error('[Client] Fatal error:', error);
  process.exit(1);
});
