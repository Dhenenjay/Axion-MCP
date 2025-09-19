# 🚀 Axion MCP - Quick Start for Global Users

## For Claude Desktop Users (Anywhere in the World!)

You have **TWO OPTIONS** to use Axion MCP:

---

## Option 1: Use Our NPM Bridge (Easiest - 1 minute!)

### ✅ Benefits:
- Universal - works with any MCP client
- Auto-generates config for your client
- Always up-to-date
- One command setup

### 📋 Steps (1 minute):

1. **Install the bridge globally:**
```bash
npm install -g @axion/mcp-bridge
```

2. **Generate config for your MCP client:**
```bash
axion-mcp init
```

3. **Copy the generated config** to your MCP client

4. **Restart your MCP client**

4. **Start using!** Try these:
   - "Show me NDVI for Tokyo"
   - "Create a water map of the Nile River"
   - "Analyze deforestation in Amazon"
   - "Monitor crops in Punjab, India"

### 📱 Supported MCP Clients:
- **Claude Desktop** - Anthropic's AI assistant
- **Cursor** - AI-powered code editor
- **VS Code MCP** - Microsoft's code editor with MCP support
- **Any MCP-compatible client** - Generic config available

### 🌍 Works Great For:
- 🇺🇸 USA - All states supported
- 🇮🇳 India - Agricultural monitoring
- 🇧🇷 Brazil - Amazon tracking
- 🇪🇺 Europe - Urban planning
- 🇦🇺 Australia - Drought monitoring
- 🇯🇵 Japan - Disaster response
- 🇿🇦 Africa - Conservation
- Anywhere with satellite coverage!

---

## Option 2: Run Your Own Server (More Control)

### ✅ Benefits:
- Full control
- Customize features
- No rate limits
- Private data processing

### 📋 Requirements:
- Computer with Node.js 18+
- Google Earth Engine account (free)
- 10 minutes setup time

### 🔧 Quick Install:

#### Windows (PowerShell):
```powershell
# Clone and setup
git clone https://github.com/Dhenenjay/Axion-MCP.git
cd Axion-MCP
npm install
npm run build

# Create .env file
@"
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
"@ | Out-File .env -Encoding UTF8

# Start server
npm start
```

#### Mac/Linux (Terminal):
```bash
# Clone and setup
git clone https://github.com/Dhenenjay/Axion-MCP.git
cd Axion-MCP
npm install
npm run build

# Create .env file
cat > .env << EOF
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
EOF

# Start server
npm start
```

#### Configure Claude Desktop:
```json
{
  "mcpServers": {
    "axion-local": {
      "url": "http://localhost:3000/sse",
      "transport": "sse"
    }
  }
}
```

---

## 🌟 What Can You Do?

### Agricultural Monitoring 🌾
```
"Show crop health in [Your Region] for the last growing season"
"Identify irrigation patterns in [Agricultural Area]"
"Detect crop stress in [Farm Location]"
```

### Urban Planning 🏙️
```
"Analyze urban growth in [Your City] over the last 5 years"
"Map green spaces in [Metropolitan Area]"
"Detect heat islands in [Urban Center]"
```

### Environmental Monitoring 🌳
```
"Track deforestation in [Forest Name]"
"Monitor water levels in [Lake/River]"
"Assess drought conditions in [Region]"
```

### Disaster Response 🚨
```
"Map flood extent in [Affected Area]"
"Assess wildfire damage in [Location]"
"Monitor volcanic activity near [Volcano]"
```

---

## 🆘 Troubleshooting

### "Cannot connect to MCP"
✅ Solution: Check if you can access https://axion-mcp.onrender.com/api/health

### "Earth Engine error"
✅ Solution: The cloud server handles auth - just retry

### "Map not loading"
✅ Solution: Open the map URL in a new browser tab

---

## 📱 Mobile Users

While Claude Desktop is required, you can:
1. Use Claude Desktop on a laptop/desktop
2. Access generated maps on your phone
3. Share map URLs with anyone

---

## 🎓 Free Earth Engine Access

Don't have Earth Engine? It's FREE!

1. Sign up: https://earthengine.google.com/signup/
2. Select "Research/Education" 
3. Instant approval for most users

---

## 💬 Get Help

- **Discord**: [Join our community](https://discord.gg/axion-mcp)
- **GitHub Issues**: [Report problems](https://github.com/Dhenenjay/Axion-MCP/issues)
- **Email**: support@axion-mcp.com

---

## 🎉 Success Tips

1. **Start Simple**: Try "Show NDVI for [Your City]"
2. **Be Specific**: Include dates, regions, and data types
3. **Explore**: Ask for different indices, time periods, visualizations
4. **Share**: Generated maps have shareable URLs

---

**Ready to transform Earth observation data into insights?** 

**Just copy the config, restart Claude, and start exploring your planet! 🌍**