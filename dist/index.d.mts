#!/usr/bin/env node
declare function buildServer(): Promise<{
    callTool: (name: string, args: any) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    listTools: () => {
        tools: {
            name: string;
            description: string;
            inputSchema: any;
        }[];
    };
}>;

declare function initEarthEngineWithSA(): Promise<void>;

export { buildServer, initEarthEngineWithSA };
