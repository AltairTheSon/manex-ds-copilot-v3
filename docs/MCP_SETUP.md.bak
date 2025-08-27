# MCP (Model Context Protocol) Configuration Guide

This guide explains how to configure and use the MCP (Model Context Protocol) integration for Figma API access.

## Overview

The MCP integration allows this application to make Figma API calls through an MCP server, providing a standardized way to access external APIs with proper authentication, error handling, and caching.

## Prerequisites

1. An MCP server that supports Figma API tools
2. Valid Figma access token
3. Node.js environment for running the MCP server (if self-hosted)

## Configuration

### Environment Variables

Add these variables to your `.env.local` file:

```bash
# MCP Configuration
REACT_APP_MCP_SERVER_URL=http://localhost:3001/mcp
REACT_APP_MCP_ENABLED=true
REACT_APP_MCP_TIMEOUT=30000
REACT_APP_MCP_RETRY_ATTEMPTS=3
REACT_APP_MCP_HEALTH_CHECK_ENABLED=true
REACT_APP_MCP_LOG_LEVEL=info
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_MCP_SERVER_URL` | `http://localhost:3001/mcp` | URL of your MCP server |
| `REACT_APP_MCP_ENABLED` | `true` | Enable/disable MCP integration |
| `REACT_APP_MCP_TIMEOUT` | `30000` | Request timeout in milliseconds |
| `REACT_APP_MCP_RETRY_ATTEMPTS` | `3` | Number of retry attempts for failed requests |
| `REACT_APP_MCP_HEALTH_CHECK_ENABLED` | `true` | Enable periodic health checks |
| `REACT_APP_MCP_LOG_LEVEL` | `info` | Logging level: `debug`, `info`, `warn`, `error` |

### MCP Server Configuration

The MCP server must support the following tools for Figma API integration:

- `get_file` - Get Figma file information
- `get_comments` - Get file comments
- `get_versions` - Get file versions
- `get_components` - Get file components
- `get_styles` - Get file styles  
- `get_user` - Get user information
- `get_images` - Get image exports
- `get_nodes` - Get specific nodes

## Setting Up an MCP Server

### Option 1: Using figma-mcp Package

```bash
npm install -g figma-mcp
figma-mcp-server --port 3001
```

### Option 2: Custom MCP Server

Create a custom MCP server that implements the required Figma API tools:

```javascript
const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');

const server = new Server(
  {
    name: 'figma-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Implement Figma API tools
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'get_file':
      return await callFigmaAPI(`/v1/files/${args.file_id}`, args.token);
    case 'get_styles':
      return await callFigmaAPI(`/v1/files/${args.file_id}/styles`, args.token);
    // ... implement other tools
  }
});

async function callFigmaAPI(endpoint, token) {
  const response = await fetch(`https://api.figma.com${endpoint}`, {
    headers: { 'X-Figma-Token': token }
  });
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(await response.json())
    }]
  };
}
```

## Testing MCP Connection

Use the built-in diagnostic methods to test your MCP configuration:

```javascript
import { comprehensiveFigmaApiService } from './services/comprehensiveFigmaApi';

// Test MCP connection
const connectionTest = await comprehensiveFigmaApiService.testMcpConnection();
console.log('Connection test:', connectionTest);

// Get connection status
const status = comprehensiveFigmaApiService.getMcpConnectionStatus();
console.log('MCP status:', status);

// Get full diagnostics
const diagnostics = comprehensiveFigmaApiService.getServiceDiagnostics();
console.log('Service diagnostics:', diagnostics);
```

## Error Handling

The MCP client provides detailed error messages for common issues:

### Connection Errors
- **Server not reachable**: Check if MCP server is running and URL is correct
- **Authentication failed**: Verify Figma token is valid
- **Tool not found**: Ensure MCP server supports required Figma tools

### Configuration Errors
- **Invalid URL**: MCP server URL must be valid HTTP/HTTPS URL
- **Timeout too low**: Increase timeout for slow network connections
- **Invalid log level**: Use one of: `debug`, `info`, `warn`, `error`

## Fallback Behavior

When MCP is not available, the application automatically falls back to:
1. Direct Figma API calls (if token is provided)
2. Mock data (for development/testing)

## Security Considerations

1. **Token Security**: Never hardcode Figma tokens in environment variables
2. **Server Security**: Ensure MCP server is properly secured if exposed to network
3. **HTTPS**: Use HTTPS for MCP server in production environments
4. **Rate Limiting**: Configure appropriate rate limits on MCP server

## Troubleshooting

### Common Issues

1. **"MCP client not configured properly"**
   - Check environment variables are set correctly
   - Verify MCP server is running
   - Test connection with diagnostic methods

2. **Connection timeouts**
   - Increase `REACT_APP_MCP_TIMEOUT` value
   - Check network connectivity to MCP server
   - Verify MCP server is responding to health checks

3. **Authentication errors**
   - Verify Figma token is valid and not expired
   - Check token has required permissions
   - Ensure token is passed correctly to MCP server

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
REACT_APP_MCP_LOG_LEVEL=debug
```

This will log all MCP requests, responses, and connection events to the browser console.

## Performance Optimization

1. **Caching**: Responses are cached for 5 minutes by default
2. **Connection Pooling**: Single connection reused for multiple requests
3. **Health Checks**: Periodic checks ensure connection stability
4. **Retry Logic**: Automatic retry with exponential backoff

## API Reference

### Configuration Manager

```javascript
import { configManager } from './utils/configManager';

// Get MCP configuration
const config = configManager.getMcpConfig();

// Validate configuration
const validation = configManager.validateMcpConfig();

// Check if MCP is enabled
const isEnabled = configManager.isMcpEnabled();
```

### MCP Client

```javascript
import { FigmaMcpClient } from './services/mcpClient';

const client = new FigmaMcpClient({
  serverUrl: 'http://localhost:3001/mcp',
  timeout: 30000,
  logLevel: 'info'
});

await client.connect();
const result = await client.getFigmaFile('file-id', 'token');
await client.disconnect();
```

## Support

For issues with MCP integration:

1. Check the browser console for detailed error messages
2. Use the diagnostic methods to identify configuration issues
3. Verify MCP server logs for server-side errors
4. Test direct Figma API access to isolate network issues