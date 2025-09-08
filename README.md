# Earth Engine MCP Server

A Model Context Protocol (MCP) server for Google Earth Engine that enables satellite imagery analysis through Claude Desktop or any MCP-compatible client.

## 🚀 Quick Start

### Prerequisites

1. **Google Earth Engine Account**: Sign up at [earthengine.google.com](https://earthengine.google.com)
2. **Service Account Key**: Create a service account in Google Cloud Console with Earth Engine API access
3. **Node.js**: Version 18 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/Dhenenjay/earth-engine-mcp.git
cd earth-engine-mcp

# Install dependencies
npm install
# or
pnpm install
```

### Configuration

1. **Download your Earth Engine service account JSON key** from Google Cloud Console
2. **Save it to a secure location** (e.g., `C:\Users\YourName\ee-key.json`)

## 🔧 Usage

### Option 1: Claude Desktop (Recommended)

1. **Edit Claude Desktop configuration**:
   
   Open `%APPDATA%\Claude\claude_desktop_config.json` and add:

   ```json
   {
     "mcpServers": {
       "earth-engine": {
         "command": "node",
         "args": ["C:\\path\\to\\earth-engine-mcp\\mcp-earth-engine.js"],
         "env": {
           "EARTH_ENGINE_PRIVATE_KEY": "C:\\path\\to\\your\\ee-key.json"
         }
       }
     }
   }
   ```

2. **Restart Claude Desktop**

3. **Use Earth Engine tools in Claude**:
   - "Search for Sentinel-2 datasets"
   - "Calculate NDVI for San Francisco"
   - "Get Landsat imagery for January 2024"

### Option 2: Direct MCP Client

```javascript
// Connect to the MCP server
const server = spawn('node', ['mcp-earth-engine.js'], {
  env: {
    EARTH_ENGINE_PRIVATE_KEY: '/path/to/ee-key.json'
  }
});
```

### Option 3: SSE Endpoint (For Web Clients)

```bash
# Start the SSE server
EARTH_ENGINE_PRIVATE_KEY=/path/to/ee-key.json npm run dev

# Connect at: http://localhost:3000/api/mcp/sse
```

## 📚 Available Tools

### 1. **search_catalog**
Search the Earth Engine data catalog for datasets.
```json
{
  "query": "sentinel-2"
}
```

### 2. **get_band_names**
Get available bands for a dataset.
```json
{
  "datasetId": "COPERNICUS/S2_SR_HARMONIZED"
}
```

### 3. **filter_collection**
Filter satellite imagery by date and location.
```json
{
  "datasetId": "COPERNICUS/S2_SR_HARMONIZED",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "region": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  }
}
```

### 4. **calculate_ndvi**
Calculate Normalized Difference Vegetation Index.
```json
{
  "imageId": "COPERNICUS/S2_SR_HARMONIZED",
  "redBand": "B4",
  "nirBand": "B8"
}
```

### 5. **get_map_url**
Generate map visualization URLs.
```json
{
  "imageId": "COPERNICUS/S2_SR_HARMONIZED",
  "visParams": {
    "bands": ["B4", "B3", "B2"],
    "min": 0,
    "max": 3000
  }
}
```

### 6. **calculate_statistics**
Calculate image statistics for a region.
```json
{
  "imageId": "COPERNICUS/S2_SR_HARMONIZED",
  "region": {
    "type": "Polygon",
    "coordinates": [[[-122.5, 37.7], [-122.4, 37.7], [-122.4, 37.8], [-122.5, 37.8], [-122.5, 37.7]]]
  },
  "scale": 30
}
```

## 🧪 Testing

```bash
# Run the test suite
node test-earth-engine.js

# Test individual tools
node mcp-earth-engine.js
# Then send JSON-RPC messages via stdin
```

## 🌍 Example Workflows

### NDVI Analysis for Agriculture
```
1. Search for Sentinel-2 imagery
2. Filter by your farm's location and growing season
3. Calculate NDVI to assess crop health
4. Get statistics to track changes over time
```

### Deforestation Monitoring
```
1. Filter Landsat imagery for two time periods
2. Calculate vegetation indices for both
3. Compare statistics to detect forest loss
```

### Urban Heat Island Analysis
```
1. Search for temperature datasets (MODIS)
2. Filter for summer months in urban areas
3. Calculate statistics to identify heat patterns
```

## 📊 Supported Datasets

- **Sentinel-2**: High-resolution optical imagery (10m)
- **Landsat 8/9**: Multispectral imagery (30m)
- **MODIS**: Daily global coverage
- **CHIRPS**: Precipitation data
- **SRTM**: Digital elevation models
- And many more in the Earth Engine catalog

## 🔒 Security

- **Never commit your service account key** to version control
- Store keys in secure locations with restricted access
- Use environment variables for production deployments
- Rotate service account keys regularly

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

## 🆘 Troubleshooting

### "Earth Engine not initialized"
- Check your service account key path
- Verify the key has Earth Engine API access
- Ensure the project has Earth Engine API enabled

### "Dataset not found"
- Use the exact dataset ID from Earth Engine catalog
- Check if the dataset requires special access

### Connection issues
- Verify Node.js version (18+)
- Check firewall settings
- Ensure all dependencies are installed

## 📧 Support

- GitHub Issues: [github.com/Dhenenjay/earth-engine-mcp/issues](https://github.com/Dhenenjay/earth-engine-mcp/issues)
- Earth Engine Documentation: [developers.google.com/earth-engine](https://developers.google.com/earth-engine)

## 🎉 Quick Test

After setup, try this in Claude Desktop:
> "Search for Sentinel-2 satellite imagery and calculate NDVI for San Francisco in January 2024"

The server will:
1. Search the Earth Engine catalog
2. Filter Sentinel-2 data for the specified time and location
3. Calculate NDVI vegetation index
4. Return statistics and visualization URLs

Happy Earth Observing! 🛰️
