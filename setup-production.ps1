# Earth Engine MCP Production Setup Script
# ========================================

Write-Host "Earth Engine MCP Production Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check for Node.js
Write-Host "`nChecking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($?) {
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check for GEE service account key
Write-Host "`nChecking for Google Earth Engine service account key..." -ForegroundColor Yellow
$keyPath = "C:\Users\Dhenenjay\Downloads\ee-key.json"
if (Test-Path $keyPath) {
    Write-Host "✓ Service account key found at: $keyPath" -ForegroundColor Green
} else {
    Write-Host "✗ Service account key not found at expected location." -ForegroundColor Red
    Write-Host "  Please ensure your GEE JSON key is at: $keyPath" -ForegroundColor Yellow
    Write-Host "  Or update the GEE_JSON_PATH in claude_desktop_config_production.json" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install

# Copy Claude Desktop config
Write-Host "`nSetting up Claude Desktop configuration..." -ForegroundColor Yellow
$claudeConfigPath = "$env:APPDATA\Claude\claude_desktop_config.json"
$claudeDir = "$env:APPDATA\Claude"

if (!(Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
    Write-Host "✓ Created Claude config directory" -ForegroundColor Green
}

# Backup existing config if it exists
if (Test-Path $claudeConfigPath) {
    $backupPath = "$claudeConfigPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $claudeConfigPath $backupPath
    Write-Host "✓ Backed up existing config to: $backupPath" -ForegroundColor Green
}

# Copy new config
Copy-Item "claude_desktop_config_production.json" $claudeConfigPath -Force
Write-Host "✓ Claude Desktop configuration updated" -ForegroundColor Green

# Test the server
Write-Host "`nTesting Earth Engine MCP server..." -ForegroundColor Yellow
$testScript = @'
const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'mcp-production.js');
const proc = spawn('node', [serverPath], {
    env: {
        ...process.env,
        GEE_JSON_PATH: 'C:\\Users\\Dhenenjay\\Downloads\\ee-key.json'
    }
});

let output = '';
proc.stdout.on('data', (data) => {
    output += data.toString();
    if (output.includes('Earth Engine MCP Server is running')) {
        console.log('✓ Server started successfully');
        proc.kill();
        process.exit(0);
    }
});

proc.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
});

setTimeout(() => {
    console.log('✗ Server startup timeout');
    proc.kill();
    process.exit(1);
}, 10000);
'@

$testScript | Out-File -FilePath "test-server-startup.js" -Encoding UTF8
node test-server-startup.js
Remove-Item "test-server-startup.js" -Force

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Restart Claude Desktop application" -ForegroundColor White
Write-Host "2. The Earth Engine MCP server will be available in Claude" -ForegroundColor White
Write-Host "3. You can test it by asking Claude to check Earth Engine health" -ForegroundColor White
Write-Host "`nExample prompt for Claude:" -ForegroundColor Yellow
Write-Host '  "Check the Earth Engine server health status"' -ForegroundColor Cyan
Write-Host '  "Calculate NDVI for California from June to August 2023"' -ForegroundColor Cyan
Write-Host '  "Assess wildfire risk for Yellowstone"' -ForegroundColor Cyan
