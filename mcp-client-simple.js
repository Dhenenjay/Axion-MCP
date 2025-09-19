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

      const result = await response.json();
      console.error(`[Client] Response received for ${method}`);
      console.error(`[Client] Response status: ${response.status}, ok: ${response.ok}`);
      console.error(`[Client] Response has jsonrpc: ${!!result.jsonrpc}, has error: ${!!result.error}, has result: ${!!result.result}`);
      
      // Check if the result is already a properly formatted MCP response
      if (result.jsonrpc === '2.0') {
        // It's already properly formatted, send it as-is
        console.error('[Client] Sending properly formatted MCP response');
        console.log(JSON.stringify(result));
      } else if (response.ok) {
        // Wrap non-MCP responses in proper format
        const wrappedResponse = {
          jsonrpc: '2.0',
          id: message.id,
          result: result
        };
        console.log(JSON.stringify(wrappedResponse));
      } else {
        // Server returned an error status but we got JSON - it might be an MCP error
        if (result.error) {
          // It looks like an error response, ensure it has proper MCP format
          const errorResponse = {
            jsonrpc: '2.0',
            id: message.id || result.id || null,
            error: result.error
          };
          console.log(JSON.stringify(errorResponse));
        } else {
          // Unknown error format, create a proper error response
          const errorResponse = {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32603,
              message: `Server error ${response.status}`,
              data: result
            }
          };
          console.log(JSON.stringify(errorResponse));
        }
      }
      
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
