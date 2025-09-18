# 🌍 Axion-MCP

> **Advanced Earth Engine MCP Server** - Enterprise-grade geospatial analysis platform for Claude Desktop

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Earth Engine](https://img.shields.io/badge/Google-Earth%20Engine-4285F4?logo=google-earth)](https://earthengine.google.com/)

Transform Claude Desktop into a powerful geospatial analysis workstation with direct access to Google Earth Engine's massive satellite data catalog and advanced processing capabilities.

## ✨ Key Features

### 🛰️ Consolidated Super Tools (6 Total)
- **earth_engine_data** - Search, filter, and access satellite datasets
- **earth_engine_process** - Advanced image processing and analysis
- **earth_engine_export** - Export data to various formats and destinations
- **earth_engine_system** - System management and configuration
- **earth_engine_map** - Interactive web-based visualization
- **crop_classification** - ML-powered crop type classification

### 🌐 Geospatial Models (5 Total)
- 🔥 **Wildfire Risk Assessment** - Multi-factor fire danger analysis
- 🌊 **Flood Risk Assessment** - Hydrological and terrain-based flood modeling
- 🌾 **Agricultural Monitoring** - Crop health and yield estimation
- 🌳 **Deforestation Detection** - Forest change tracking
- 💧 **Water Quality Monitoring** - Water body analysis

### 🚀 Technical Capabilities
- **30+ Satellite Datasets** - Landsat, Sentinel, MODIS, and more
- **Vegetation Indices** - NDVI, NDWI, EVI, SAVI, NBR
- **Cloud-Free Composites** - Automatic cloud masking and mosaicking
- **Time Series Analysis** - Temporal change detection
- **Export Options** - Google Drive, Cloud Storage, Earth Engine Assets
- **Interactive Maps** - Web-based visualization with multiple layers

## 🔧 Installation

### Prerequisites
- Node.js 18+ 
- Google Cloud account with Earth Engine access
- Claude Desktop application

### Quick Setup

1. **Clone the repository**
```bash
git clone https://github.com/Dhenenjay/Axion-MCP.git
cd Axion-MCP
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the project**
```bash
npm run build
npm run build:next
```

4. **Set up Earth Engine credentials**
```bash
# Set your service account key path
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
```

5. **Start the server**
```bash
npm run start:next
```

6. **Configure Claude Desktop**
Add to `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "axion-mcp": {
      "command": "node",
      "args": ["C:\\path\\to\\Axion-MCP\\mcp-sse-complete.cjs"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "path/to/credentials.json"
      }
    }
  }
}
```

## 💡 Usage Examples

### In Claude Desktop

**Calculate vegetation index:**
> "Use Earth Engine to calculate NDVI for California in the last month"

**Wildfire risk assessment:**
> "Analyze wildfire risk for Colorado considering vegetation, moisture, and terrain"

**Crop classification:**
> "Create a crop type map for Iowa using recent Sentinel-2 imagery"

**Water quality monitoring:**
> "Monitor water quality changes in Lake Tahoe over the past year"

## 📊 Architecture

```
Claude Desktop ← MCP Protocol → Axion-MCP Server
                                      ↓
                                 SSE Bridge
                                      ↓
                                Next.js API
                                      ↓
                              Earth Engine API
                                      ↓
                              Satellite Data
```

## 🛠️ Available Operations

### Data Operations
- Search satellite datasets
- Filter by date, location, cloud cover
- Get dataset information
- Convert place names to coordinates

### Processing Operations
- Calculate vegetation indices
- Create cloud-free composites
- Perform terrain analysis
- Time series analysis
- Statistical operations

### Export Operations
- Generate visualization thumbnails
- Export to Google Drive
- Export to Cloud Storage
- Save as Earth Engine Assets

## 📈 Performance

- **Optimized for stability** - Reduced from 30+ tools to 6 consolidated super tools
- **Caching system** - Smart caching for repeated operations
- **Timeout handling** - Graceful handling of long-running operations
- **Parallel processing** - Batch operations support

## 🔒 Security

- Service account authentication
- Secure credential handling
- Rate limiting support
- Input validation

## 📚 Documentation

- [Earth Engine Catalog](https://developers.google.com/earth-engine/datasets)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [API Reference](./docs/api.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

## 📄 License

MIT © 2024 Dhenenjay

## 🙏 Acknowledgments

- Google Earth Engine team
- Anthropic MCP team
- Open source community

---

**Need help?** Open an [issue](https://github.com/Dhenenjay/Axion-MCP/issues) or reach out!
