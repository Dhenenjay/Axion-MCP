// Import to self-register
import './auth_check';
import './search_gee_catalog';
import './shapefile_to_geometry';   // PRIMARY: Convert places to shapefile geometries
import './get_shapefile_boundary';  // EXPLICIT shapefile boundary tool
import './use_shapefile_instead';   // Convert bounding boxes to shapefiles
import './filter_collection';
import './smart_filter';  // Smart filtering with place name detection
import './get_band_names';
import './load_cog_from_gcs';
import './mask_clouds';
import './create_mosaic';
import './clip_image';
import './resample_image';
import './spectral_index';
import './reduce_stats';
import './zonal_stats';
import './change_detect';
import './terrain';
import './time_series';
import './get_tiles';
import './get_thumbnail';
import './export_image';
import './export_composite';  // Enhanced composite export
import './export_to_drive';    // Stable Drive export
import './export_to_gcs';      // GCS export for service accounts
import './setup_gcs';          // Setup GCS bucket
import './export_status';
import './gee_script_js';
import './gee_sdk_call';
// subsequent tools will be imported here
