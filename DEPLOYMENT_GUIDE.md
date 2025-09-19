# 🌍 Axion MCP - Global Deployment & Usage Guide

## 🚀 Quick Start for End Users

### Option 1: Use Our Hosted Version (Easiest)
```json
// Add to Claude Desktop config (claude_desktop_config.json)
{
  "mcpServers": {
    "axion-earth-engine": {
      "url": "https://axion-mcp.onrender.com/sse",
      "transport": "sse"
    }
  }
}
```
**That's it!** The server is already running on Render and ready to use.

### Option 2: Run Your Own Instance

## 📋 Prerequisites

### For Users
- Claude Desktop App installed
- Internet connection

### For Self-Hosting
- Node.js 18+ 
- Google Earth Engine account (free)
- Redis instance (optional, for persistence)

## 🎯 For Claude Desktop Users

### Step 1: Configure Claude Desktop

**Windows:** 
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Mac:** 
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:** 
```
~/.config/Claude/claude_desktop_config.json
```

Add this configuration:
```json
{
  "mcpServers": {
    "axion-earth-engine": {
      "url": "https://axion-mcp.onrender.com/sse",
      "transport": "sse"
    }
  }
}
```

### Step 2: Restart Claude Desktop

### Step 3: Start Using!
Ask Claude to:
- "Create a vegetation index map of Los Angeles"
- "Show me deforestation in the Amazon"
- "Analyze crop health in Iowa"
- "Create a flood risk map for Bangladesh"

## 🏗️ For Developers - Deploy Your Own Instance

### Method 1: One-Click Deploy to Cloud

#### Deploy to Render (Recommended)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Click the button above
2. Connect your GitHub account
3. Set environment variables:
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   REDIS_URL=redis://...
   BASE_URL=https://your-app.onrender.com
   ```

#### Deploy to Vercel
```bash
npx vercel --prod
```

#### Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

#### Deploy to Heroku
```bash
heroku create your-app-name
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

### Method 2: Self-Host on VPS

#### Using Docker (Easiest)
```bash
# Clone the repo
git clone https://github.com/Dhenenjay/Axion-MCP.git
cd Axion-MCP

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - redis
  
  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
EOF

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Start services
docker-compose up -d
```

#### Manual Installation
```bash
# Install dependencies
npm install

# Build
npm run build

# Use PM2 for production
npm install -g pm2
pm2 start npm --name "axion-mcp" -- start
pm2 save
pm2 startup
```

### Method 3: Serverless Deployment

#### AWS Lambda
```bash
# Install Serverless Framework
npm install -g serverless

# Deploy
serverless deploy
```

#### Google Cloud Run
```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT-ID/axion-mcp

# Deploy
gcloud run deploy --image gcr.io/PROJECT-ID/axion-mcp --platform managed
```

## 🔐 Setting Up Earth Engine Credentials

### Step 1: Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Earth Engine API
4. Create service account:
   ```bash
   gcloud iam service-accounts create earth-engine-sa \
     --display-name="Earth Engine Service Account"
   ```

### Step 2: Register with Earth Engine
1. Visit [Earth Engine Service Accounts](https://signup.earthengine.google.com/#!/service_accounts)
2. Register your service account email
3. Wait for approval (usually instant)

### Step 3: Generate Key
```bash
gcloud iam service-accounts keys create key.json \
  --iam-account=earth-engine-sa@PROJECT-ID.iam.gserviceaccount.com
```

## 🌐 Global CDN Setup (Optional)

### Using Cloudflare
1. Add your domain to Cloudflare
2. Set SSL to "Full"
3. Enable "Auto Minify"
4. Create page rules for caching

### Using AWS CloudFront
```javascript
// cloudfront-config.json
{
  "Origins": [{
    "DomainName": "your-app.onrender.com",
    "CustomOriginConfig": {
      "HTTPPort": 80,
      "HTTPSPort": 443,
      "OriginProtocolPolicy": "https-only"
    }
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "axion-mcp",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89e-4fab-a63d-7e88639e58f6"
  }
}
```

## 📊 Redis Setup Options

### Redis Cloud (Recommended for Production)
```bash
# Free tier: 30MB
# Sign up at: https://redis.com/try-free/
REDIS_URL=redis://default:password@redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com:12345
```

### Local Redis
```bash
# Windows
winget install Redis.Redis

# Mac
brew install redis
brew services start redis

# Linux
sudo apt install redis-server
sudo systemctl start redis
```

## 🔧 Environment Variables

Create `.env` file:
```bash
# Required
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Optional but Recommended
REDIS_URL=redis://localhost:6379
BASE_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Optional
PORT=3000
NODE_ENV=production
```

## 📱 Usage Examples

### Basic Earth Engine Operations
```javascript
// In Claude Desktop, just ask naturally:
"Create a vegetation index map of California"
"Show me water bodies in Texas"
"Analyze urban growth in New York"
```

### Advanced Analysis
```javascript
// Agricultural Monitoring
"Analyze crop health in Iowa using Sentinel-2 data from last month"

// Climate Analysis  
"Show me temperature anomalies in Australia"

// Disaster Response
"Create a flood extent map for recent flooding in Bangladesh"

// Urban Planning
"Analyze urban heat islands in Phoenix"
```

## 🌍 Regional Optimizations

### For Users in Asia
Use Singapore region:
```javascript
// Deploy to Singapore
fly regions add sin
fly scale count 1 --region sin
```

### For Users in Europe
Use Frankfurt region:
```javascript
// Deploy to EU
fly regions add fra
fly scale count 1 --region fra
```

## 📈 Monitoring & Analytics

### Health Check Endpoint
```bash
curl https://axion-mcp.onrender.com/api/health
```

### Status Dashboard
Visit: `https://axion-mcp.onrender.com/` 

### Logging
```javascript
// View logs
pm2 logs axion-mcp

// Or with Docker
docker logs axion-mcp
```

## 🆘 Troubleshooting

### Common Issues

#### "Cannot connect to MCP server"
- Check if server is running: `curl https://axion-mcp.onrender.com/api/health`
- Verify Claude Desktop config path
- Restart Claude Desktop

#### "Earth Engine authentication failed"
- Verify service account is registered with Earth Engine
- Check if private key JSON is correctly formatted
- Ensure environment variables are set

#### "Maps not loading"
- Clear browser cache
- Check if Redis is running
- Verify BASE_URL is correctly set

## 📞 Support & Community

- **GitHub Issues**: [github.com/Dhenenjay/Axion-MCP/issues](https://github.com/Dhenenjay/Axion-MCP/issues)
- **Documentation**: [Full API Docs](./API_DOCUMENTATION.md)
- **Examples**: [Example Queries](./EXAMPLES.md)

## 🎉 Success Stories

Users worldwide are using Axion MCP for:
- 🌾 Agricultural monitoring in India
- 🌳 Deforestation tracking in Brazil
- 🏙️ Urban planning in Singapore
- 🌊 Coastal monitoring in Netherlands
- 🔥 Wildfire analysis in Australia

## 🚀 Quick Test

After setup, try this in Claude Desktop:
```
"Create an interactive map showing vegetation health in Los Angeles using the latest Sentinel-2 imagery"
```

You should see:
1. Composite creation confirmation
2. NDVI calculation
3. Interactive map URL
4. Map opens with proper visualization

## 📝 License

MIT License - Free to use, modify, and distribute!

---

**Built with ❤️ by the Axion Team**
*Making Earth observation accessible to everyone through AI*