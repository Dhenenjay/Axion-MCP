#!/usr/bin/env node
/**
 * Axion MCP Bridge
 * Connects Claude Desktop to remote Axion MCP server via SSE
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import EventSource from 'eventsource';

interface BridgeOptions {
  url?: string;
  debug?: boolean;
}

export class AxionMCPBridge {
  private server: Server;
  private transport: StdioServerTransport;
  private eventSource?: EventSource;
  private options: BridgeOptions;

  constructor(options: BridgeOptions = {}) {
    this.options = {
      url: options.url || process.env.AXION_MCP_URL || 'https://axion-mcp.onrender.com/sse',
      debug: options.debug || process.env.AXION_DEBUG === 'true'
    };

    this.server = new Server({
      name: 'axion-mcp-bridge',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    this.transport = new StdioServerTransport();
  }

  private log(...args: any[]) {
    if (this.options.debug) {
      console.error('[Bridge]', ...args);
    }
  }

  async start() {
    this.log('Starting Axion MCP Bridge...');
    this.log(`Connecting to: ${this.options.url}`);

    // Set up SSE connection to remote server
    this.eventSource = new EventSource(this.options.url!);

    this.eventSource.onopen = () => {
      this.log('Connected to Axion MCP server');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleRemoteMessage(data);
      } catch (error) {
        this.log('Error parsing SSE message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      this.log('SSE connection error:', error);
      // Implement reconnection logic if needed
    };

    // Set up handlers for Claude Desktop
    this.server.setRequestHandler('initialize', async (request) => {
      this.log('Initialize request from Claude Desktop');
      
      // Forward to remote server via HTTP
      const response = await fetch(`${this.options.url!.replace('/sse', '/transport')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'initialize',
          params: request.params
        })
      });

      const result = await response.json();
      return result.result;
    });

    this.server.setRequestHandler('tools/list', async () => {
      this.log('Tools list request from Claude Desktop');
      
      const response = await fetch(`${this.options.url!.replace('/sse', '/transport')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'tools/list'
        })
      });

      const result = await response.json();
      return result.result;
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      this.log('Tool call request:', request.params?.name);
      
      const response = await fetch(`${this.options.url!.replace('/sse', '/transport')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'tools/call',
          params: request.params
        })
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.result;
    });

    // Connect transport
    await this.server.connect(this.transport);
    this.log('Bridge is ready!');
  }

  private handleRemoteMessage(data: any) {
    // Handle SSE messages from remote server
    if (data.type === 'notification') {
      this.server.notification({
        method: data.method,
        params: data.params
      });
    }
  }

  async stop() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    await this.server.close();
  }
}

// Run if called directly
if (require.main === module) {
  const bridge = new AxionMCPBridge();
  
  bridge.start().catch(error => {
    console.error('Failed to start bridge:', error);
    process.exit(1);
  });

  process.on('SIGINT', async () => {
    await bridge.stop();
    process.exit(0);
  });
}