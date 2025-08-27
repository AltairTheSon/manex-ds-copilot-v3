# MCP (Model Context Protocol) Configuration Guide

## Overview

The MCP integration allows this application to make Figma API calls through an MCP server, providing a standardized way to access external APIs with proper authentication, error handling, and caching.

**NEW**: The application now includes automatic fallback to direct Figma API calls when MCP is unavailable, ensuring the application works in both development and production environments.

## Environment Detection

The application automatically detects the environment and chooses the appropriate connection method:

- **Production/Deployed environments** (Netlify, etc.): Uses direct Figma API calls by default
- **Local development**: Attempts to use MCP server, falls back to direct API if unavailable
- **Manual override**: Use `REACT_APP_MCP_ENABLED=false` to force direct API mode

## Quick Start

### Option 1: Use the Built-in MCP Server (Recommended for Development)

1. **Start the MCP server**:
```bash
# From the project root directory
./scripts/start-mcp-server.sh
```

2. **Verify the server is running**:
```bash
curl http://localhost:3001/mcp/health
```

3. **Use the application** - it will automatically connect to the MCP server

### Option 2: Direct API Mode (Default for Production)

Simply use the application normally - it will use direct Figma API calls when MCP is not available or configured.

## Prerequisites

For MCP server usage:
1. Node.js 16+ installed
2. Valid Figma access token
3. For development: Local MCP server running (see setup below)

## Built-in MCP Server

This repository includes a standalone HTTP-based MCP server located in the `mcp-server/` directory.

### Features
- HTTP REST API with proper CORS support
- Health check endpoint for monitoring
- All major Figma API operations supported
- Proper error handling and logging
- No complex MCP protocol dependencies

### Manual Setup

If the startup script doesn't work, you can start the server manually:

```bash
cd mcp-server
npm install
npm start
```

The server will start on http://localhost:3001 by default.

### Testing the MCP Server

```bash
# Health check
curl http://localhost:3001/mcp/health

# List available tools
curl http://localhost:3001/mcp/tools/list

# Test a Figma API call (requires valid token)
curl -X POST http://localhost:3001/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_user",
    "arguments": {
      "token": "your-figma-token-here"
    }
  }'
```

## Configuration

### Environment Variables

Add these variables to your `.env.local` file (optional - the application works without them):

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
| `REACT_APP_MCP_ENABLED` | `true` (dev), `false` (prod) | Enable/disable MCP integration |
| `REACT_APP_MCP_TIMEOUT` | `30000` | Request timeout in milliseconds |
| `REACT_APP_MCP_RETRY_ATTEMPTS` | `3` | Number of retry attempts for failed requests |
| `REACT_APP_MCP_HEALTH_CHECK_ENABLED` | `true` | Enable periodic health checks |
| `REACT_APP_MCP_LOG_LEVEL` | `info` | Logging level: `debug`, `info`, `warn`, `error` |

## Supported Figma API Tools

The MCP server supports all major Figma API operations:

| Tool Name | Description | Required Parameters |
|-----------|-------------|-------------------|
| `get_file` | Get Figma file data | `file_id`, `token` |
| `get_comments` | Get file comments | `file_id`, `token` |
| `get_versions` | Get version history | `file_id`, `token` |
| `get_components` | Get file components | `file_id`, `token` |
| `get_styles` | Get file styles | `file_id`, `token` |
| `get_user` | Get current user info | `token` |
| `get_images` | Get node images | `file_id`, `ids`, `token` |
| `get_nodes` | Get specific nodes | `file_id`, `ids`, `token` |

## Testing MCP Connection

Use the built-in diagnostic methods to test your MCP configuration:

```javascript
import { comprehensiveFigmaApiService } from './services/comprehensiveFigmaApi';

// Test MCP connection (always returns success with fallback)
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

The MCP client provides detailed error messages and automatic fallback:

### Connection Errors
- **Server not reachable**: Automatically falls back to direct API
- **Authentication failed**: Verify Figma token is valid
- **Tool not found**: Ensure MCP server supports required Figma tools

### Configuration Errors
- **Invalid URL**: Falls back to direct API with warning
- **Timeout too low**: Uses default timeout values
- **Invalid log level**: Uses default 'info' level

## Fallback Behavior

When MCP is not available, the application automatically falls back to:
1. **Direct Figma API calls** (if token is provided)
2. **Mock data** (for development/testing)

**Benefits of Fallback:**
- Application works in all environments
- No setup required for basic usage
- Graceful degradation
- Better user experience

## Troubleshooting

### Common Issues

1. **MCP server won't start**
   - Check if port 3001 is already in use
   - Try a different port: `MCP_SERVER_PORT=3002 npm start`
   - Ensure Node.js 16+ is installed

2. **CORS errors**
   - Verify the MCP server is running
   - Check browser console for specific CORS error messages
   - Ensure you're making requests to the correct server URL

3. **Connection timeouts**
   - Check network connectivity to MCP server
   - Verify firewall settings allow traffic on the server port
   - Application will fall back to direct API automatically

4. **Figma API errors**
   - Verify your Figma token is valid and not expired
   - Check token permissions for the requested file
   - Ensure the file ID is correct

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
REACT_APP_MCP_LOG_LEVEL=debug
```

This will log all MCP requests, responses, and connection events to the browser console.

## Production Deployment

### For Netlify/Vercel/Similar Platforms

1. **No MCP server setup required** - the application automatically uses direct API mode
2. **Users provide their own Figma tokens** through the UI
3. **All Figma API calls are made directly** from the client

### For Custom Deployments with MCP Server

1. Deploy the MCP server to a cloud service (Heroku, Railway, etc.)
2. Update `REACT_APP_MCP_SERVER_URL` to point to your deployed server
3. Ensure CORS is properly configured for your domain
4. Use HTTPS for the MCP server in production

## Security Considerations

1. **Token Security**: Never hardcode Figma tokens in environment variables
2. **Server Security**: Ensure MCP server is properly secured if exposed to network
3. **HTTPS**: Use HTTPS for MCP server in production environments
4. **Rate Limiting**: Consider implementing rate limiting on deployed MCP servers
5. **CORS**: Restrict CORS origins for production deployments

## Performance Optimization

1. **Caching**: Responses are cached for 5 minutes by default
2. **Connection Pooling**: Single connection reused for multiple requests
3. **Health Checks**: Periodic checks ensure connection stability
4. **Retry Logic**: Automatic retry with exponential backoff
5. **Fallback**: Instant fallback to direct API when MCP unavailable

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
5. Remember that fallback to direct API is always available