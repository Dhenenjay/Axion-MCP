#!/usr/bin/env node

const readline = require('readline');
const { initializeEarthEngine } = require('./src/earth-engine/init');
const tools = require('./src/earth-engine/tools');

// Get Earth Engine key path from environment or command line
const EE_KEY_PATH = process.env.EARTH_ENGINE_PRIVATE_KEY || process.argv[2] || 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json';

// Create interface for stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Tool definitions
const TOOL_DEFINITIONS = [
  {
    name: 'search_catalog',
    description: 'Search the Google Earth Engine data catalog',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "sentinel-2", "landsat", "modis")' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_band_names',
    description: 'Get band names for an Earth Engine dataset',
    inputSchema: {
      type: 'object',
      properties: {
        datasetId: { type: 'string', description: 'Dataset ID (e.g., "COPERNICUS/S2_SR_HARMONIZED")' }
      },
      required: ['datasetId']
    }
  },
  {
    name: 'filter_collection',
    description: 'Filter an image collection by date and region',
    inputSchema: {
      type: 'object',
      properties: {
        datasetId: { type: 'string', description: 'Dataset ID' },
        startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        region: { 
          type: 'object', 
          description: 'GeoJSON geometry',
          properties: {
            type: { type: 'string' },
            coordinates: { type: 'array' }
          }
        }
      },
      required: ['datasetId', 'startDate', 'endDate']
    }
  },
  {
    name: 'calculate_ndvi',
    description: 'Calculate NDVI (Normalized Difference Vegetation Index)',
    inputSchema: {
      type: 'object',
      properties: {
        imageId: { type: 'string', description: 'Image or collection ID' },
        redBand: { type: 'string', description: 'Red band name (default: B4)' },
        nirBand: { type: 'string', description: 'NIR band name (default: B8)' }
      },
      required: ['imageId']
    }
  },
  {
    name: 'get_map_url',
    description: 'Get a map visualization URL for an image',
    inputSchema: {
      type: 'object',
      properties: {
        imageId: { type: 'string', description: 'Image or collection ID' },
        visParams: {
          type: 'object',
          description: 'Visualization parameters',
          properties: {
            bands: { type: 'array', items: { type: 'string' } },
            min: { type: 'number' },
            max: { type: 'number' },
            palette: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['imageId']
    }
  },
  {
    name: 'calculate_statistics',
    description: 'Calculate statistics for an image',
    inputSchema: {
      type: 'object',
      properties: {
        imageId: { type: 'string', description: 'Image or collection ID' },
        region: { 
          type: 'object', 
          description: 'GeoJSON geometry',
          properties: {
            type: { type: 'string' },
            coordinates: { type: 'array' }
          }
        },
        scale: { type: 'number', description: 'Scale in meters (default: 30)' }
      },
      required: ['imageId']
    }
  }
];

let buffer = '';
let initialized = false;

// Initialize Earth Engine on startup
async function initialize() {
  try {
    console.error(`[MCP] Initializing Earth Engine with key: ${EE_KEY_PATH}`);
    await initializeEarthEngine(EE_KEY_PATH);
    initialized = true;
    console.error('[MCP] Earth Engine initialized successfully');
  } catch (error) {
    console.error('[MCP] Failed to initialize Earth Engine:', error.message);
    process.exit(1);
  }
}

// Process incoming messages
rl.on('line', (line) => {
  buffer += line;
  
  try {
    const message = JSON.parse(buffer);
    buffer = '';
    handleMessage(message);
  } catch (e) {
    // Buffer incomplete message
  }
});

// Handle MCP messages
async function handleMessage(message) {
  try {
    if (message.method === 'initialize') {
      // Initialize Earth Engine if not already done
      if (!initialized) {
        await initialize();
      }
      
      sendResponse(message.id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          prompts: {},
          resources: {}
        },
        serverInfo: {
          name: 'earth-engine-mcp',
          version: '1.0.0'
        }
      });
    } else if (message.method === 'tools/list') {
      sendResponse(message.id, { tools: TOOL_DEFINITIONS });
    } else if (message.method === 'prompts/list') {
      sendResponse(message.id, { prompts: [] });
    } else if (message.method === 'resources/list') {
      sendResponse(message.id, { resources: [] });
    } else if (message.method === 'tools/call') {
      await handleToolCall(message);
    } else if (message.method === 'notifications/initialized') {
      // Client notification, no response needed
    } else {
      sendError(message.id, -32601, `Method not found: ${message.method}`);
    }
  } catch (error) {
    console.error('[MCP] Error handling message:', error);
    sendError(message.id, -32603, error.message);
  }
}

// Handle tool calls
async function handleToolCall(message) {
  const { name, arguments: args } = message.params;
  
  try {
    let result;
    
    switch (name) {
      case 'search_catalog':
        result = await tools.searchCatalog(args.query);
        break;
        
      case 'get_band_names':
        result = await tools.getBandNames(args.datasetId);
        break;
        
      case 'filter_collection':
        result = await tools.filterCollection(args);
        break;
        
      case 'calculate_ndvi':
        result = await tools.calculateNDVI(args);
        break;
        
      case 'get_map_url':
        result = await tools.getMapUrl(args);
        break;
        
      case 'calculate_statistics':
        result = await tools.calculateStatistics(args);
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    // Format result as MCP response
    sendResponse(message.id, {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    });
  } catch (error) {
    console.error(`[MCP] Tool error (${name}):`, error);
    sendResponse(message.id, {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }]
    });
  }
}

// Send JSON-RPC response
function sendResponse(id, result) {
  const response = {
    jsonrpc: '2.0',
    id: id,
    result: result
  };
  console.log(JSON.stringify(response));
}

// Send JSON-RPC error
function sendError(id, code, message) {
  const error = {
    jsonrpc: '2.0',
    id: id,
    error: {
      code: code,
      message: message
    }
  };
  console.log(JSON.stringify(error));
}

// Initialize on startup
initialize().catch(error => {
  console.error('[MCP] Startup error:', error);
  process.exit(1);
});
