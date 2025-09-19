/**
 * Consolidated API Route for Earth Engine MCP Server
 * Handles the 4 super tools that replace 30+ individual tools
 */

import { NextRequest, NextResponse } from 'next/server';
import { callTool } from '../../../../src/mcp/server-consolidated';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Increase maximum duration for complex Earth Engine operations
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { tool, arguments: args } = await request.json();
    
    console.log('[SSE] Consolidated tool called:', tool);
    console.log('[SSE] Arguments:', JSON.stringify(args, null, 2));
    
    // Core consolidated tools
    const coreTools = [
      'earth_engine_data',
      'earth_engine_process', 
      'earth_engine_export',
      'earth_engine_system',
      'earth_engine_map',
      'crop_classification'  // New crop classification tool
    ];
    
    // Model tools that use the core tools internally
    // Only exposing flood risk and deforestation detection for deployment
    const modelTools = [
      'flood_risk_assessment',
      'flood_risk_analysis', // alternate name
      'deforestation_detection',
      'deforestation_tracking' // alternate name  
    ];
    
    // Check if it's a core tool
    if (coreTools.includes(tool)) {
      // Execute the core tool
      const startTime = Date.now();
      const result = await callTool(tool, args);
      const duration = Date.now() - startTime;
      
      console.log(`[SSE] Core tool ${tool} completed in ${duration}ms`);
      return NextResponse.json(result);
    }
    
    // Check if it's a model tool
    if (modelTools.includes(tool)) {
      // Import and execute the model
      const models = await import('../../../../src/models/geospatial-models.js');
      
      // Map tool names to model functions
      // Only including flood and deforestation models for deployment
      const modelMap: any = {
        'flood_risk_assessment': models.floodRiskAssessment,
        'flood_risk_analysis': models.floodRiskAssessment,
        'deforestation_detection': models.deforestationDetection,
        'deforestation_tracking': models.deforestationDetection
      };
      
      const modelFunc = modelMap[tool];
      if (modelFunc) {
        const startTime = Date.now();
        const result = await modelFunc(args);
        const duration = Date.now() - startTime;
        
        console.log(`[SSE] Model ${tool} completed in ${duration}ms`);
        return NextResponse.json(result);
      }
    }
    
    // Invalid tool
    return NextResponse.json({
      error: {
        message: `Invalid tool: ${tool}. Valid tools are: Core: ${coreTools.join(', ')}, Models: ${modelTools.join(', ')}`
      }
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('[SSE] Error in consolidated route:', error);
    
    return NextResponse.json({
      error: {
        message: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
