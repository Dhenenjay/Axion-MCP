# 🌍 @axion/mcp-bridge

> Universal bridge to connect any MCP client to Axion Earth Engine server

[![npm version](https://badge.fury.io/js/@axion%2Fmcp-bridge.svg)](https://www.npmjs.com/package/@axion/mcp-bridge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start (1 minute setup!)

### For Any MCP Client (Claude Desktop, Cursor, VS Code, etc.)

```bash
# Install globally
npm install -g @axion/mcp-bridge

# Generate config for your MCP client
axion-mcp init

# Test connection
axion-mcp test
```

That's it! Copy the generated config to your MCP client and start using Earth Engine features.

## 📋 Supported MCP Clients

- ✅ **Claude Desktop** - Full support
- ✅ **Cursor** - Full support  
- ✅ **VS Code MCP** - Full support
- ✅ **Any MCP-compatible client** - Generic config available

## 🎯 Features

- 🛰️ **50+ Satellite Datasets** - Landsat, Sentinel, MODIS, and more
- 📊 **Advanced Analysis** - NDVI, water detection, urban analysis
- 🗺️ **Interactive Maps** - Beautiful web-based visualizations
- 🤖 **AI-Powered** - Natural language queries
- 🌐 **Global Coverage** - Any location on Earth

## 💻 CLI Commands

### `axion-mcp init`
Interactive setup wizard for your MCP client

```bash
axion-mcp init
# Follow the prompts to set up your client
```

### `axion-mcp config`
Generate configuration for your MCP client

```bash
# Show config for all clients
axion-mcp config

# Specific client
axion-mcp config --client claude

# Use local server
axion-mcp config --local

# Custom server
axion-mcp config --url https://your-server.com
```

### `axion-mcp start`
Run the bridge in stdio mode (advanced)

```bash
axion-mcp start --debug
```

### `axion-mcp test`
Test connection to server

```bash
axion-mcp test
```

## 🔧 Configuration Examples

### Claude Desktop
Add to `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):

```json
{
  "mcpServers": {
    "axion-earth-engine": {
      "command": "npx",
      "args": ["@axion/mcp-bridge", "start"],
      "env": {}
    }
  }
}
```

### Cursor
Add to your Cursor MCP config:

```json
{
  "mcpServers": {
    "axion-earth-engine": {
      "command": "npx",
      "args": ["@axion/mcp-bridge", "start"],
      "env": {}
    }
  }
}
```

### Generic MCP Client
For any MCP-compatible client:

```json
{
  "mcpServers": {
    "axion-earth-engine": {
      "command": "npx",
      "args": ["@axion/mcp-bridge", "start"],
      "env": {
        "AXION_MCP_URL": "https://axion-mcp.onrender.com/sse"
      }
    }
  }
}
```

## 🌟 Usage Examples

Once configured, use natural language in your MCP client:

```
"Show vegetation health in California"
"Create a water map of the Nile River"
"Analyze urban growth in Tokyo"
"Monitor deforestation in the Amazon"
"Detect drought conditions in Australia"
```

## 🛠️ Advanced Usage

### Programmatic API

```javascript
import { connectToAxion } from '@axion/mcp-bridge';

// Connect to Axion server
const bridge = await connectToAxion({
  url: 'https://axion-mcp.onrender.com/sse',
  debug: true
});

// Bridge is now running
```

### Custom Server

Run your own Axion server and connect:

```bash
# Start your local Axion server
cd axion-mcp
npm start

# Connect bridge to local server
axion-mcp start --url http://localhost:3000
```

## 🌐 Environment Variables

- `AXION_MCP_URL` - Server URL (default: https://axion-mcp.onrender.com/sse)
- `AXION_DEBUG` - Enable debug logging (true/false)

## 📊 What Can You Do?

### Earth Observation
- Vegetation indices (NDVI, EVI, SAVI)
- Water body mapping
- Urban heat islands
- Deforestation tracking
- Crop health monitoring
- Flood extent mapping
- Wildfire detection
- Drought monitoring

### Data Sources
- Sentinel-2 (10m resolution)
- Landsat 8/9 (30m resolution)
- MODIS (Daily global)
- VIIRS (375m resolution)
- Climate datasets
- Elevation models
- Land cover classifications

## 🆘 Troubleshooting

### "Cannot connect to MCP server"
```bash
# Test the connection
axion-mcp test

# Check server status
curl https://axion-mcp.onrender.com/api/health
```

### "Command not found"
```bash
# Reinstall globally
npm uninstall -g @axion/mcp-bridge
npm install -g @axion/mcp-bridge
```

### "Bridge not starting"
```bash
# Run with debug mode
axion-mcp start --debug
```

## 🤝 Contributing

Contributions welcome! See the [main repository](https://github.com/Dhenenjay/Axion-MCP).

## 📄 License

MIT © Axion Team

## 🔗 Links

- [GitHub Repository](https://github.com/Dhenenjay/Axion-MCP)
- [NPM Package](https://www.npmjs.com/package/@axion/mcp-bridge)
- [Documentation](https://github.com/Dhenenjay/Axion-MCP/blob/main/DOCUMENTATION.md)

---

**Made with ❤️ by the Axion Team**

*Bringing satellite intelligence to every MCP client*