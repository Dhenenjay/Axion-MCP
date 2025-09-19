#!/usr/bin/env node
/**
 * Axion MCP CLI
 * Generate configuration for any MCP client (Claude Desktop, Cursor, etc.)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import ora from 'ora';

const program = new Command();

// Banner
const banner = `
${chalk.cyan('╔══════════════════════════════════════════╗')}
${chalk.cyan('║')}  🌍 ${chalk.bold.green('Axion MCP Earth Engine Bridge')}     ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('Satellite data for any MCP client')}     ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════════╝')}
`;

// Supported MCP Clients
const MCP_CLIENTS = {
  claude: {
    name: 'Claude Desktop',
    configPaths: {
      windows: path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'),
      darwin: path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
      linux: path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json')
    }
  },
  cursor: {
    name: 'Cursor',
    configPaths: {
      windows: path.join(process.env.APPDATA || '', 'Cursor', 'mcp_config.json'),
      darwin: path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'mcp_config.json'),
      linux: path.join(os.homedir(), '.config', 'Cursor', 'mcp_config.json')
    }
  },
  vscode: {
    name: 'VS Code MCP',
    configPaths: {
      windows: path.join(process.env.APPDATA || '', 'Code', 'User', 'mcp_config.json'),
      darwin: path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'mcp_config.json'),
      linux: path.join(os.homedir(), '.config', 'Code', 'User', 'mcp_config.json')
    }
  }
};

program
  .name('axion-mcp')
  .description('Connect any MCP client to Axion Earth Engine server')
  .version('1.0.0');

// Init command - Interactive setup
program
  .command('init')
  .description('Interactive setup for your MCP client')
  .option('-c, --client <type>', 'MCP client type (claude, cursor, vscode)')
  .option('-m, --mode <mode>', 'Connection mode (cloud, local, custom)')
  .option('--url <url>', 'Custom server URL')
  .action(async (options) => {
    console.log(banner);
    
    const spinner = ora('Setting up Axion MCP...').start();
    
    // Detect or ask for client type
    let clientType = options.client;
    if (!clientType) {
      spinner.stop();
      console.log(chalk.yellow('\n📱 Select your MCP client:'));
      console.log('  1) Claude Desktop');
      console.log('  2) Cursor');
      console.log('  3) VS Code MCP');
      console.log('  4) Other (show generic config)');
      
      // In a real implementation, you'd use inquirer or prompts
      // For now, we'll default to showing all configs
      clientType = 'all';
    }
    
    // Determine connection mode
    let mode = options.mode || 'cloud';
    let serverUrl = 'https://axion-mcp.onrender.com';
    
    if (mode === 'custom' && options.url) {
      serverUrl = options.url;
    } else if (mode === 'local') {
      serverUrl = 'http://localhost:3000';
    }
    
    spinner.succeed('Configuration ready!');
    
    // Generate configurations
    console.log(chalk.green('\n✨ Configuration for your MCP client:\n'));
    
    if (clientType === 'claude' || clientType === 'all') {
      showClaudeConfig(serverUrl);
    }
    
    if (clientType === 'cursor' || clientType === 'all') {
      showCursorConfig(serverUrl);
    }
    
    if (clientType === 'vscode' || clientType === 'all') {
      showVSCodeConfig(serverUrl);
    }
    
    if (clientType === 'all') {
      showGenericConfig(serverUrl);
    }
    
    // Show next steps
    console.log(chalk.cyan('\n📝 Next steps:'));
    console.log('  1. Copy the configuration above');
    console.log('  2. Add it to your MCP client config file');
    console.log('  3. Restart your MCP client');
    console.log('  4. Start using Earth Engine features!');
    
    console.log(chalk.gray('\n💡 Example queries:'));
    console.log('  • "Show vegetation health in California"');
    console.log('  • "Create a water map of the Nile"');
    console.log('  • "Analyze urban growth in Tokyo"');
  });

// Config command - Just show config
program
  .command('config')
  .description('Generate MCP client configuration')
  .option('-c, --client <type>', 'MCP client type', 'all')
  .option('-f, --format <format>', 'Output format (json, stdio)', 'json')
  .option('--cloud', 'Use cloud server (default)')
  .option('--local', 'Use local server')
  .option('--url <url>', 'Custom server URL')
  .action((options) => {
    const serverUrl = options.url || (options.local ? 'http://localhost:3000' : 'https://axion-mcp.onrender.com');
    
    if (options.format === 'stdio') {
      // Show stdio transport config (for running bridge locally)
      const config = {
        mcpServers: {
          'axion-earth-engine': {
            command: 'npx',
            args: ['@axion/mcp-bridge'],
            env: {
              AXION_MCP_URL: `${serverUrl}/sse`
            }
          }
        }
      };
      console.log(JSON.stringify(config, null, 2));
    } else {
      // Show SSE transport config (direct connection)
      const config = {
        mcpServers: {
          'axion-earth-engine': {
            url: `${serverUrl}/sse`,
            transport: 'sse'
          }
        }
      };
      console.log(JSON.stringify(config, null, 2));
    }
  });

// Start command - Run the bridge
program
  .command('start')
  .description('Start the MCP bridge (stdio mode)')
  .option('--url <url>', 'Server URL', 'https://axion-mcp.onrender.com')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const { AxionMCPBridge } = require('./bridge');
    
    console.log(chalk.green('🚀 Starting Axion MCP Bridge...'));
    console.log(chalk.gray(`Connecting to: ${options.url}`));
    
    const bridge = new AxionMCPBridge({
      url: `${options.url}/sse`,
      debug: options.debug
    });
    
    try {
      await bridge.start();
      console.log(chalk.green('✅ Bridge is running!'));
      
      // Keep process alive
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n👋 Shutting down...'));
        await bridge.stop();
        process.exit(0);
      });
    } catch (error) {
      console.error(chalk.red('❌ Failed to start bridge:'), error);
      process.exit(1);
    }
  });

// Test command
program
  .command('test')
  .description('Test connection to Axion MCP server')
  .option('--url <url>', 'Server URL', 'https://axion-mcp.onrender.com')
  .action(async (options) => {
    const spinner = ora('Testing connection...').start();
    
    try {
      const response = await fetch(`${options.url}/api/health`);
      const data = await response.json();
      
      if (data.status === 'ok') {
        spinner.succeed(`Connected to Axion MCP server!`);
        console.log(chalk.green('✅ Server is healthy'));
        console.log(chalk.gray(`Version: ${data.version || '1.0.0'}`));
        console.log(chalk.gray(`Tools available: ${data.tools?.length || 'Unknown'}`));
      } else {
        spinner.fail('Server health check failed');
      }
    } catch (error) {
      spinner.fail(`Cannot connect to ${options.url}`);
      console.log(chalk.red('Please check if the server is running.'));
    }
  });

// Helper functions
function showClaudeConfig(serverUrl: string) {
  console.log(chalk.bold.blue('📘 Claude Desktop Configuration:'));
  console.log(chalk.gray(`Config file: ${getConfigPath('claude')}`));
  console.log(chalk.white('\nAdd this to your config file:'));
  console.log(chalk.green(JSON.stringify({
    mcpServers: {
      'axion-earth-engine': {
        command: 'npx',
        args: ['@axion/mcp-bridge'],
        env: {
          AXION_MCP_URL: `${serverUrl}/sse`
        }
      }
    }
  }, null, 2)));
}

function showCursorConfig(serverUrl: string) {
  console.log(chalk.bold.magenta('\n🎯 Cursor Configuration:'));
  console.log(chalk.gray(`Config file: ${getConfigPath('cursor')}`));
  console.log(chalk.white('\nAdd this to your config file:'));
  console.log(chalk.green(JSON.stringify({
    mcpServers: {
      'axion-earth-engine': {
        command: 'npx',
        args: ['@axion/mcp-bridge'],
        env: {
          AXION_MCP_URL: `${serverUrl}/sse`
        }
      }
    }
  }, null, 2)));
}

function showVSCodeConfig(serverUrl: string) {
  console.log(chalk.bold.cyan('\n💻 VS Code MCP Configuration:'));
  console.log(chalk.gray(`Config file: ${getConfigPath('vscode')}`));
  console.log(chalk.white('\nAdd this to your config file:'));
  console.log(chalk.green(JSON.stringify({
    mcpServers: {
      'axion-earth-engine': {
        command: 'npx',
        args: ['@axion/mcp-bridge'],
        env: {
          AXION_MCP_URL: `${serverUrl}/sse`
        }
      }
    }
  }, null, 2)));
}

function showGenericConfig(serverUrl: string) {
  console.log(chalk.bold.yellow('\n🔧 Generic MCP Client Configuration:'));
  console.log(chalk.white('\nOption 1 - Using NPX (recommended):'));
  console.log(chalk.green(JSON.stringify({
    mcpServers: {
      'axion-earth-engine': {
        command: 'npx',
        args: ['@axion/mcp-bridge'],
        env: {
          AXION_MCP_URL: `${serverUrl}/sse`
        }
      }
    }
  }, null, 2)));
  
  console.log(chalk.white('\nOption 2 - Direct SSE connection (if supported):'));
  console.log(chalk.green(JSON.stringify({
    mcpServers: {
      'axion-earth-engine': {
        url: `${serverUrl}/sse`,
        transport: 'sse'
      }
    }
  }, null, 2)));
}

function getConfigPath(client: string): string {
  const platform = process.platform as 'win32' | 'darwin' | 'linux';
  const clientConfig = MCP_CLIENTS[client as keyof typeof MCP_CLIENTS];
  
  if (clientConfig && clientConfig.configPaths[platform]) {
    return clientConfig.configPaths[platform];
  }
  
  return 'Check your MCP client documentation for config location';
}

// Show banner and parse
if (process.argv.length === 2) {
  console.log(banner);
  program.help();
} else {
  program.parse();
}