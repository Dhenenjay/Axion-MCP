import { NextRequest } from 'next/server';
import { buildServer } from '@/src/mcp/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('SSE endpoint received:', JSON.stringify(body, null, 2));
    
    const server = await buildServer();
    
    // Normalize parameter names for each tool
    const normalizeParams = (toolName: string, args: any) => {
      const paramMapping: { [key: string]: { [key: string]: string } } = {
        'convert_place_to_shapefile_geometry': {
          'place_name': 'placeName'
        },
        'filter_collection_by_date_and_region': {
          'collection_id': 'datasetId',
          'start_date': 'start',
          'end_date': 'end',
          'region': 'aoi'
        },
        'create_clean_mosaic': {
          'collection': 'datasetId',
          'dateStart': 'start',
          'dateEnd': 'end',
          'region': 'aoi'
        }
      };
      
      if (paramMapping[toolName]) {
        const normalized = { ...args };
        for (const [oldKey, newKey] of Object.entries(paramMapping[toolName])) {
          if (args[oldKey] !== undefined) {
            normalized[newKey] = args[oldKey];
            if (oldKey !== newKey) {
              delete normalized[oldKey];
            }
          }
        }
        return normalized;
      }
      return args;
    };
    
    // Handle tool call directly
    if (body.tool && body.arguments) {
      let normalizedArgs = normalizeParams(body.tool, body.arguments);
      
      // Apply default values for GCS export
      if (body.tool === 'export_image_to_cloud_storage') {
        normalizedArgs = {
          scale: 10,
          bucket: 'earth-engine-exports-stoked-flame-455410-k2',
          folder: 'exports',
          ...normalizedArgs
        };
      }
      
      console.log(`Calling ${body.tool} with:`, normalizedArgs);
      const result = await (server as any).callTool(body.tool, normalizedArgs);
      return Response.json(result);
    }
    
    // Legacy format support
    if (body.name && body.params) {
      const normalizedArgs = normalizeParams(body.name, body.params);
      const result = await (server as any).callTool(body.name, normalizedArgs);
      return Response.json(result);
    }
    
    return Response.json({ error: 'Invalid request format' }, { status: 400 });
  } catch (error: any) {
    console.error('SSE endpoint error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  return Response.json({ status: 'ok', message: 'Earth Engine SSE endpoint' });
}
