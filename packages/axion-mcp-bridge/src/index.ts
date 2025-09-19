/**
 * Axion MCP Bridge
 * Main entry point for the NPM package
 */

export { AxionMCPBridge } from './bridge';

// Export types
export interface AxionMCPConfig {
  url?: string;
  debug?: boolean;
}

// Export a convenience function for quick setup
export async function connectToAxion(config?: AxionMCPConfig) {
  const { AxionMCPBridge } = require('./bridge');
  const bridge = new AxionMCPBridge(config);
  await bridge.start();
  return bridge;
}