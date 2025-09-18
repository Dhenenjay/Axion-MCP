# 🌍 Axion-MCP Earth Engine Deployment & Usage Guide

## 🚀 Live Service

Once deployed to Render, your Axion-MCP service will be publicly available at:
```
https://axion-mcp.onrender.com
```

## 🔧 For Users: How to Connect

### Claude Desktop Configuration

1. **Open Claude Desktop settings**
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Add the Axion-MCP server configuration:**

```json
{
  "mcpServers": {
    "axion-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@vercel/mcp-bridge",
        "https://axion-mcp.onrender.com/api/mcp/sse-stream"
      ],
      "env": {}
    }
  }
}
```

3. **Restart Claude Desktop** to apply the configuration.

### Cursor Configuration

1. **Open Cursor Settings** (Cmd/Ctrl + ,)

2. **Go to the MCP section**

3. **Add a new server with:**
   - Name: `axion-mcp`
   - URL: `https://axion-mcp.onrender.com/api/mcp/sse-stream`
   - Type: `SSE`

## 📊 Available Super Tools

The service provides 6 powerful consolidated tools for Earth Engine operations:

### 1. **earth_engine_data**
Retrieve and analyze Earth Engine data from various sources.
- Get imagery collections (Landsat, Sentinel, MODIS)
- Fetch feature collections
- Access climate and weather data
- Query asset metadata

### 2. **earth_engine_process**
Process and analyze geospatial data.
- Apply filters and transformations
- Perform statistical analysis
- Calculate indices (NDVI, EVI, etc.)
- Execute custom algorithms

### 3. **earth_engine_export**
Export processed data and results.
- Export to Google Drive
- Export to Cloud Storage
- Generate downloadable URLs
- Create visualization tiles

### 4. **earth_engine_system**
System operations and monitoring.
- Check authentication status
- Get quota information
- Monitor job status
- Manage assets

### 5. **earth_engine_map**
Generate interactive maps and visualizations.
- Create tile services
- Generate map IDs
- Configure visualization parameters
- Export static maps

### 6. **crop_classification**
Advanced crop classification and agricultural analysis.
- Identify crop types
- Monitor crop health
- Predict yields
- Detect anomalies

## 🌐 Geospatial Models

Advanced analysis models available:

- **Wildfire Risk Assessment** - Analyze fire danger zones
- **Flood Risk Analysis** - Evaluate flood-prone areas  
- **Agricultural Monitoring** - Track crop health and yields
- **Deforestation Detection** - Monitor forest changes
- **Water Quality Assessment** - Analyze water bodies

## 🔒 Security & Access

- **No authentication required** - Public access for all users
- **Rate limiting** - Automatic rate limiting to prevent abuse
- **Timeout protection** - 60-second timeout for complex operations
- **Error handling** - Graceful error messages and recovery

## 💡 Example Usage in Claude

Once connected, you can use natural language to interact with Earth Engine:

```
"Show me NDVI analysis for California farmlands in the last month"

"Detect recent wildfire burn scars in Australia"

"Export Sentinel-2 imagery for NYC from last week to my Drive"

"Create a flood risk map for Bangladesh during monsoon season"

"Analyze deforestation patterns in the Amazon over the last 5 years"
```

## 🛠️ For Developers: Self-Hosting

### Prerequisites
- Node.js 18+ 
- Google Earth Engine service account
- Render account (or similar hosting platform)

### Quick Deploy to Render

1. **Fork the repository**
   ```bash
   https://github.com/Dhenenjay/Axion-MCP
   ```

2. **Create a new Web Service on Render**
   - Connect your GitHub account
   - Select the forked repository
   - Use the included `render.yaml` configuration

3. **Set environment variables** (if not using render.yaml):
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account JSON
   - `PORT`: 10000 (Render's default)
   - `NODE_ENV`: production

4. **Deploy** - Render will automatically build and deploy

### Local Development

```bash
# Clone the repository
git clone https://github.com/Dhenenjay/Axion-MCP.git
cd Axion-MCP

# Install dependencies
npm install

# Set up your service account
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account.json"

# Build the application
npm run build

# Start the server
npm start
```

## 📈 Performance

- **Response time**: < 2s for basic queries
- **Complex operations**: Up to 60s timeout
- **Caching**: Built-in caching for repeated queries
- **Concurrent requests**: Unlimited (rate-limited)

## 🆘 Troubleshooting

### Connection Issues
- Verify the service URL is correct
- Check your internet connection
- Ensure Claude Desktop is restarted after config changes

### Tool Errors
- Check if the region/date range has available data
- Verify coordinate formats (use decimal degrees)
- Ensure date formats are YYYY-MM-DD

### Performance Issues
- Break large queries into smaller chunks
- Use specific date ranges instead of "all time"
- Specify smaller regions for complex analyses

## 📞 Support

- **GitHub Issues**: https://github.com/Dhenenjay/Axion-MCP/issues
- **Documentation**: https://github.com/Dhenenjay/Axion-MCP#readme
- **Earth Engine Docs**: https://developers.google.com/earth-engine

## 🎉 Ready to Use!

Your Axion-MCP Earth Engine service is now available globally. Anyone can connect and start using powerful geospatial analysis capabilities directly in Claude Desktop or Cursor!

---

**Built with ❤️ using Google Earth Engine and MCP (Model Context Protocol)**