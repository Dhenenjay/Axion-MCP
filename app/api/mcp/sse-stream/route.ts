/**
 * SSE Stream endpoint for MCP bridge
 * This properly implements Server-Sent Events for Claude Desktop via @vercel/mcp-bridge
 */

import { NextRequest } from 'next/server';
import { initEarthEngineWithSA } from '../../../../src/gee/client';
import { callTool } from '../../../../src/mcp/server-consolidated';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Initialize Earth Engine once
let eeInitialized = false;
async function ensureEEInitialized() {
  if (!eeInitialized) {
    await initEarthEngineWithSA();
    eeInitialized = true;
  }
}

// Complete tools list matching mcp-sse-complete.cjs
const TOOLS = [
  {
    name: 'earth_engine_data',
    description: 'Data Discovery & Access - search, filter, geometry, info, boundaries operations',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['search', 'filter', 'geometry', 'info', 'boundaries'],
          description: 'Operation to perform'
        },
        query: { type: 'string', description: 'Search query (for search operation)' },
        datasetId: { type: 'string', description: 'Dataset ID' },
        startDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
        endDate: { type: 'string', description: 'End date YYYY-MM-DD' },
        region: { type: 'string', description: 'Region name or geometry' },
        placeName: { type: 'string', description: 'Place name for geometry lookup' },
        limit: { type: 'number', description: 'Maximum results', default: 10 }
      },
      required: ['operation']
    }
  },
  {
    name: 'earth_engine_process',
    description: 'Processing & Analysis - clip, mask, index, analyze, composite, terrain, resample operations',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['clip', 'mask', 'index', 'analyze', 'composite', 'terrain', 'resample'],
          description: 'Processing operation'
        },
        input: { type: 'string', description: 'Input dataset or result' },
        datasetId: { type: 'string', description: 'Dataset ID' },
        region: { type: 'string', description: 'Region for processing' },
        indexType: {
          type: 'string',
          enum: ['NDVI', 'NDWI', 'NDBI', 'EVI', 'SAVI', 'MNDWI', 'NBR', 'custom'],
          description: 'Index type'
        },
        maskType: {
          type: 'string',
          enum: ['clouds', 'water', 'quality', 'shadow'],
          description: 'Mask type'
        },
        scale: { type: 'number', description: 'Processing scale', default: 30 }
      },
      required: ['operation']
    }
  },
  {
    name: 'earth_engine_export',
    description: 'Export & Visualization - export, thumbnail, tiles, status, download operations',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['export', 'thumbnail', 'tiles', 'status', 'download'],
          description: 'Export operation'
        },
        input: { type: 'string', description: 'Input data to export' },
        datasetId: { type: 'string', description: 'Dataset ID' },
        region: { type: 'string', description: 'Export region' },
        destination: {
          type: 'string',
          enum: ['gcs', 'drive', 'auto'],
          description: 'Export destination'
        },
        scale: { type: 'number', description: 'Export scale', default: 10 }
      },
      required: ['operation']
    }
  },
  {
    name: 'earth_engine_system',
    description: 'System & Advanced - auth, execute, setup, load, info, health operations',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['auth', 'execute', 'setup', 'load', 'info', 'health'],
          description: 'System operation'
        },
        checkType: {
          type: 'string',
          enum: ['status', 'projects', 'permissions'],
          description: 'Auth check type'
        }
      },
      required: ['operation']
    }
  },
  {
    name: 'earth_engine_map',
    description: 'Interactive Map Viewer - create, list, delete interactive web maps for large regions',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['create', 'list', 'delete'],
          description: 'Map operation'
        },
        mapId: { type: 'string', description: 'Map ID (for list/delete)' },
        layers: { type: 'array', items: { type: 'object' }, description: 'Map layers' }
      },
      required: ['operation']
    }
  },
  {
    name: 'crop_classification',
    description: 'Machine learning crop and land cover classification using satellite imagery. Supports Iowa, California, Texas, Kansas, Nebraska, Illinois.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['classify', 'train', 'evaluate', 'export'],
          description: 'Operation type: classify (full classification), train (model only), evaluate (accuracy metrics), export (save results)'
        },
        region: { 
          type: 'string', 
          description: 'US state name (e.g., Iowa, California) or geometry. Supported states: Iowa, California, Texas, Kansas, Nebraska, Illinois' 
        },
        startDate: { 
          type: 'string', 
          description: 'Start date for imagery in YYYY-MM-DD format. Default: 6 months ago' 
        },
        endDate: { 
          type: 'string', 
          description: 'End date for imagery in YYYY-MM-DD format. Default: current date' 
        },
        classifier: {
          type: 'string',
          enum: ['randomForest', 'svm', 'cart', 'naiveBayes'],
          description: 'Machine learning classifier. Default: randomForest (best accuracy)'
        },
        numberOfTrees: {
          type: 'number',
          description: 'Number of trees for Random Forest classifier (10-500). Default: 50'
        },
        includeIndices: {
          type: 'boolean',
          description: 'Include vegetation indices (NDVI, EVI, SAVI, NDWI). Default: true'
        },
        createMap: {
          type: 'boolean',
          description: 'Create interactive web map (slower for large areas). Default: false. Set to false for faster processing'
        },
        scale: {
          type: 'number',
          description: 'Pixel resolution in meters (10-1000). Default: 30 for Landsat/Sentinel'
        },
        cloudCoverMax: {
          type: 'number',
          description: 'Maximum cloud cover percentage (0-100). Default: 20'
        }
      },
      required: ['operation', 'region']
    }
  },
  {
    name: 'flood_risk_assessment',
    description: 'Analyze flood risk factors including terrain, precipitation, water indices, and urban development. Supports urban, coastal, riverine, and snowmelt flood analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        region: { 
          type: 'string', 
          description: 'Area to analyze (e.g., "Houston", "Miami", "New Orleans"). Default: Houston' 
        },
        startDate: { 
          type: 'string', 
          description: 'Start date for analysis in YYYY-MM-DD format. Default: 6 months ago' 
        },
        endDate: { 
          type: 'string', 
          description: 'End date for analysis in YYYY-MM-DD format. Default: current date' 
        },
        floodType: {
          type: 'string',
          enum: ['urban', 'coastal', 'riverine', 'snowmelt'],
          description: 'Type of flooding to analyze. Default: urban'
        },
        analyzeWaterChange: {
          type: 'boolean',
          description: 'Analyze water body extent changes. Default: true'
        },
        scale: {
          type: 'number',
          description: 'Analysis scale in meters. Default: 100'
        }
      },
      required: []
    }
  },
  {
    name: 'deforestation_detection',
    description: 'Monitor forest loss and degradation by comparing baseline and current forest cover. Calculates deforestation percentage, estimates carbon loss, and generates alerts.',
    inputSchema: {
      type: 'object',
      properties: {
        region: { 
          type: 'string', 
          description: 'Forest area to analyze (e.g., "Amazon", "Congo Basin", "Borneo"). Default: Amazon' 
        },
        baselineStart: { 
          type: 'string', 
          description: 'Baseline period start date in YYYY-MM-DD format. Default: 6 months ago' 
        },
        baselineEnd: { 
          type: 'string', 
          description: 'Baseline period end date in YYYY-MM-DD format. Default: 3 months ago' 
        },
        currentStart: { 
          type: 'string', 
          description: 'Current period start date in YYYY-MM-DD format. Default: 1 month ago' 
        },
        currentEnd: { 
          type: 'string', 
          description: 'Current period end date in YYYY-MM-DD format. Default: current date' 
        },
        scale: {
          type: 'number',
          description: 'Analysis scale in meters. Default: 30'
        },
        dataset: {
          type: 'string',
          description: 'Satellite dataset to use. Default: COPERNICUS/S2_SR_HARMONIZED'
        }
      },
      required: []
    }
  }
];

// Handle SSE stream for MCP protocol
export async function GET(req: NextRequest) {
  console.log('[SSE-Stream] GET request received');
  
  // Initialize Earth Engine
  await ensureEEInitialized();
  
  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode('event: connected\ndata: {"status":"connected"}\n\n'));
      
      // Keep connection alive with periodic pings
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'));
        } catch (e) {
          clearInterval(pingInterval);
        }
      }, 30000);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable buffering for Render
    }
  });
}

// Handle MCP protocol messages
export async function POST(req: NextRequest) {
  try {
    const message = await req.json();
    console.log('[SSE-Stream] Received message:', message);
    
    // Initialize Earth Engine
    await ensureEEInitialized();
    
    // Handle different MCP methods
    if (message.method === 'initialize') {
      return Response.json({
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            prompts: {},
            resources: {}
          },
          serverInfo: {
            name: 'Axion MCP Earth Engine',
            version: '2.0.0'
          }
        }
      });
    } else if (message.method === 'tools/list') {
      return Response.json({
        jsonrpc: '2.0',
        id: message.id,
        result: { tools: TOOLS }
      });
    } else if (message.method === 'tools/call') {
      const { name, arguments: args } = message.params;
      
      try {
        // Call the actual tool
        const result = await callTool(name, args || {});
        
        return Response.json({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          }
        });
      } catch (error: any) {
        return Response.json({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32603,
            message: error.message
          }
        });
      }
    } else if (message.method === 'prompts/list') {
      return Response.json({
        jsonrpc: '2.0',
        id: message.id,
        result: { prompts: [] }
      });
    } else if (message.method === 'resources/list') {
      return Response.json({
        jsonrpc: '2.0',
        id: message.id,
        result: { resources: [] }
      });
    } else {
      return Response.json({
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32601,
          message: `Method not found: ${message.method}`
        }
      });
    }
  } catch (error: any) {
    console.error('[SSE-Stream] Error:', error);
    // IMPORTANT: Always return MCP-formatted error responses
    // Try to extract the ID from the message if possible
    let messageId = null;
    try {
      const message = await req.clone().json();
      messageId = message.id;
    } catch {}
    
    return Response.json({
      jsonrpc: '2.0',
      id: messageId || null,  // Use null if we couldn't get the ID
      error: {
        code: -32700,  // Parse error
        message: error.message || 'Request parsing failed',
        data: {
          stack: error.stack
        }
      }
    });
  }
}
