#!/usr/bin/env node

/**
 * MCP Client Bridge for Axion MCP Server
 * This bridges Claude Desktop to the deployed Axion MCP server on Render
 */

const { StdioServerTransport } = require('@modelcontextprotocol/sdk/node');
const { Client } = require('@modelcontextprotocol/sdk/client');

// The deployed server URL
const SERVER_URL = 'https://axion-mcp.onrender.com';

class MCPBridge {
  constructor() {
    this.client = null;
    this.transport = null;
  }

  async start() {
    try {
      console.error('[Bridge] Starting MCP bridge to', SERVER_URL);
      
      // Create stdio transport for communication with Claude
      this.transport = new StdioServerTransport();
      
      // Create MCP client
      this.client = new Client({
        name: 'axion-mcp-bridge',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      // Connect the client to stdio transport
      await this.client.connect(this.transport);
      
      // Set up message forwarding from Claude to server
      this.transport.onMessage = async (message) => {
        console.error('[Bridge] Received from Claude:', JSON.stringify(message));
        
        try {
          // Forward the message to the deployed server
          const response = await fetch(`${SERVER_URL}/api/mcp/consolidated`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
          });

          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          console.error('[Bridge] Response from server:', JSON.stringify(result));
          
          // Send the response back to Claude
          return result;
        } catch (error) {
          console.error('[Bridge] Error forwarding message:', error);
          return {
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: error.message
            },
            id: message.id || null
          };
        }
      };

      console.error('[Bridge] MCP bridge ready');
      
      // Keep the process alive
      process.stdin.resume();
      
    } catch (error) {
      console.error('[Bridge] Failed to start:', error);
      process.exit(1);
    }
  }

  async stop() {
    if (this.client) {
      await this.client.close();
    }
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.error('[Bridge] Shutting down...');
  if (bridge) {
    await bridge.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('[Bridge] Shutting down...');
  if (bridge) {
    await bridge.stop();
  }
  process.exit(0);
});

// Start the bridge
const bridge = new MCPBridge();
bridge.start().catch(error => {
  console.error('[Bridge] Fatal error:', error);
  process.exit(1);
});