import ee from '@google/earthengine';
import { register, z } from '../registry';
import { parseAoi } from '@/src/utils/geo';

register({
  name: 'filter_collection_by_date_and_region',
  description: 'Filter an ImageCollection by time range and AOI (supports place names like "San Francisco")',
  input: z.object({ 
    datasetId: z.string(), 
    aoi: z.any(), 
    start: z.string(), 
    end: z.string(),
    placeName: z.string().optional() // Optional place name for boundary lookup
  }),
  output: z.object({ 
    count: z.number(),
    regionType: z.string(),
    message: z.string()
  }),
  handler: async ({ datasetId, aoi, start, end, placeName }) => {
    // If placeName is provided, add it to aoi for boundary lookup
    if (placeName && typeof aoi === 'object') {
      aoi.placeName = placeName;
    }
    
    const region = parseAoi(aoi);
    const col = new ee.ImageCollection(datasetId).filterDate(start, end).filterBounds(region);
    const count = await col.size().getInfo();
    
    // Determine what type of region was used
    const regionType = aoi.placeName && region ? 'administrative_boundary' : 'polygon';
    const message = regionType === 'administrative_boundary' 
      ? `Using exact administrative boundary for ${aoi.placeName}`
      : 'Using polygon region';
    
    return { 
      count,
      regionType,
      message
    };
  },
});
