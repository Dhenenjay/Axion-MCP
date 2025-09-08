import ee from '@google/earthengine';
import { register, z } from '../registry';
import { exportImageToGCS, getTaskStatus } from '@/src/gee/tasks';
import { parseAoi } from '@/src/utils/geo';

register({
  name: 'export_image_to_cloud_storage',
  description: 'Start a GeoTIFF export to GCS (supports place names like "San Francisco")',
  input: z.object({ 
    imageId: z.string(), 
    bucket: z.string(), 
    fileNamePrefix: z.string(), 
    aoi: z.any(), 
    scale: z.number().optional(), 
    crs: z.string().optional(),
    placeName: z.string().optional() // Optional place name for boundary lookup
  }),
  output: z.object({ 
    taskId: z.string(), 
    state: z.string().optional(),
    regionType: z.string()
  }),
  handler: async ({ imageId, bucket, fileNamePrefix, aoi, scale, crs, placeName }) => {
    // If placeName is provided, add it to aoi for boundary lookup
    if (placeName && typeof aoi === 'object') {
      aoi.placeName = placeName;
    }
    
    const image = new ee.Image(imageId); 
    const region = parseAoi(aoi);
    const regionType = aoi.placeName && region ? 'administrative_boundary' : 'polygon';
    
    const { taskId } = exportImageToGCS({ 
      image, 
      description:`export-${fileNamePrefix}`, 
      bucket, 
      fileNamePrefix, 
      region, 
      scale, 
      crs 
    });
    const status = getTaskStatus(taskId);
    return { 
      taskId, 
      state: status.state,
      regionType
    };
  },
});
