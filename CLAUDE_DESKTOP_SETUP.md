# Claude Desktop Configuration for Earth Engine MCP

## Quick Setup

### Option 1: Connect to Running Server (Recommended for Development)

Since your server is already running at `http://localhost:3000`, you can connect Claude Desktop directly to it.

1. **Open Claude Desktop Settings**
   - Click on your profile icon → Settings → Developer

2. **Add MCP Server Configuration**
   
   Add this to your Claude Desktop config file (usually at `%APPDATA%\Claude\claude_desktop_config.json`):

   ```json
   {
     "mcpServers": {
       "earth-engine-local": {
         "url": "http://localhost:3000/api/mcp/sse",
         "transport": "sse"
       }
     }
   }
   ```

3. **Restart Claude Desktop**
   - Close and reopen Claude Desktop
   - You should see "earth-engine-local" in the MCP servers list

### Option 2: Direct Node.js Integration (For Production)

If you want Claude Desktop to manage the server lifecycle:

1. **Build the project first:**
   ```bash
   cd C:\Users\Dhenenjay\earth-engine-mcp
   pnpm build
   ```

2. **Configure Claude Desktop:**
   
   Add to `%APPDATA%\Claude\claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "earth-engine": {
         "command": "node",
         "args": ["C:\\Users\\Dhenenjay\\earth-engine-mcp\\dist\\index.js"],
         "env": {
           "EARTH_ENGINE_PROJECT_ID": "your-project-id",
           "EARTH_ENGINE_PRIVATE_KEY": "C:\\path\\to\\service-account-key.json",
           "GCS_BUCKET": "your-gcs-bucket-name"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

## Finding Your Claude Desktop Config File

### Windows Location:
```
%APPDATA%\Claude\claude_desktop_config.json
```

Which typically resolves to:
```
C:\Users\Dhenenjay\AppData\Roaming\Claude\claude_desktop_config.json
```

### To Edit:
1. Press `Win + R`
2. Type `%APPDATA%\Claude`
3. Open `claude_desktop_config.json` in a text editor

## Verifying Connection

Once configured, in Claude Desktop you can test with:

1. **Check connection:**
   ```
   "Can you check if the Earth Engine MCP server is connected?"
   ```

2. **List available tools:**
   ```
   "What Earth Engine tools are available?"
   ```

3. **Test a simple query:**
   ```
   "Search for Sentinel-2 datasets in the Earth Engine catalog"
   ```

## Available Tools in Claude

Once connected, you'll have access to these tools:

### 🔐 Authentication
- `health_check` - Verify server status
- `auth_check` - Check Earth Engine authentication

### 🔍 Data Discovery
- `search_gee_catalog` - Search for datasets
- `filter_collection_by_date_and_region` - Filter satellite imagery
- `get_dataset_band_names` - Get available bands

### 🖼️ Image Processing
- `mask_clouds_from_image` - Remove cloud pixels
- `calculate_spectral_index` - Calculate NDVI, EVI, NDWI, etc.
- `create_clean_mosaic` - Create cloud-free composites
- `clip_image_to_region` - Crop to area of interest
- `resample_image_to_resolution` - Change pixel resolution

### 📊 Analysis
- `calculate_summary_statistics` - Get min/max/mean/std
- `calculate_zonal_statistics` - Statistics by zones
- `create_time_series_chart_for_region` - Temporal analysis
- `detect_change_between_images` - Change detection

### 🗺️ Visualization
- `get_map_visualization_url` - Generate web map tiles
- `get_thumbnail_image` - Create static previews

### 💾 Export
- `export_image_to_cloud_storage` - Export to Google Cloud Storage
- `get_export_task_status` - Monitor export progress

### 🔧 Advanced
- `gee_script_js` - Run custom Earth Engine JavaScript
- `gee_sdk_call` - Direct SDK method calls

## Example Requests in Claude

### Basic NDVI Analysis:
```
"Calculate NDVI for San Francisco using the latest cloud-free Sentinel-2 image"
```

### Time Series Analysis:
```
"Create a monthly NDVI time series for 2024 for Central Park, New York"
```

### Export Workflow:
```
"Export a cloud-free Landsat composite of California for summer 2024 to my GCS bucket"
```

### Custom Analysis:
```
"Detect deforestation between 2020 and 2024 in the Amazon rainforest region"
```

## Troubleshooting

### Server Not Connecting?

1. **Check server is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return: `{"ok":true,"time":"..."}`

2. **Check logs:**
   - Server logs in terminal where `pnpm dev` is running
   - Claude Desktop logs in Developer tools

3. **Common issues:**
   - Firewall blocking localhost:3000
   - Server not running (`pnpm dev`)
   - Invalid JSON in config file
   - Claude Desktop needs restart after config change

### Earth Engine Authentication Issues?

1. **Check credentials in .env.local:**
   ```
   EARTH_ENGINE_PROJECT_ID=your-project-id
   EARTH_ENGINE_PRIVATE_KEY=path/to/key.json
   ```

2. **Verify service account has access:**
   - Earth Engine API enabled in GCP
   - Service account has Earth Engine permissions

## Support

- **GitHub Issues:** https://github.com/Dhenenjay/earth-engine-mcp/issues
- **Earth Engine Docs:** https://developers.google.com/earth-engine
- **MCP Protocol:** https://modelcontextprotocol.io

## Next Steps

1. ✅ Server is running at http://localhost:3000
2. 📝 Configure Claude Desktop with one of the options above
3. 🔑 Add your Earth Engine credentials to .env.local
4. 🚀 Start using Earth Engine tools in Claude!
