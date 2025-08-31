# Figma MCP Server

A standalone HTTP-based MCP (Model Context Protocol) server that provides Figma API access through a standardized interface.

## Features

- HTTP REST API with proper CORS support
- Health check endpoint for monitoring
- All major Figma API operations supported
- Proper error handling and logging
- No MCP protocol dependencies - works with simple HTTP requests

## Quick Start

### Prerequisites

- Node.js 16+ installed
- Valid Figma access token

### Installation

1. Navigate to the mcp-server directory:
```bash
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will start on http://localhost:3001 by default.

### Testing the Connection

1. Check server health:
```bash
curl http://localhost:3001/mcp/health
```

2. List available tools:
```bash
curl http://localhost:3001/mcp/tools/list
```

3. Test a Figma API call:
```bash
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

- `MCP_SERVER_PORT`: Server port (default: 3001)

### CORS Configuration

The server is configured to accept requests from any origin with the following CORS settings:
- `Access-Control-Allow-Origin`: *
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization, X-Requested-With

## Available Endpoints

### Health Check
- `GET /mcp/health` - Server health status

### Tools
- `GET /mcp/tools/list` - List all available tools
- `POST /mcp/tools/call` - Execute a tool

## Supported Figma API Tools

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

## Usage Examples

### Get Figma File
```javascript
const response = await fetch('http://localhost:3001/mcp/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'get_file',
    arguments: {
      file_id: 'your-file-id',
      token: 'your-figma-token'
    }
  })
});
```

### Get User Information
```javascript
const response = await fetch('http://localhost:3001/mcp/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'get_user',
    arguments: {
      token: 'your-figma-token'
    }
  })
});
```

## Error Handling

The server provides detailed error responses:

### Authentication Errors
```json
{
  "error": "Authentication token is required",
  "code": "MISSING_TOKEN"
}
```

### Unknown Tool Errors
```json
{
  "error": "Unknown tool: invalid_tool",
  "code": "UNKNOWN_TOOL",
  "availableTools": ["get_file", "get_comments", ...]
}
```

### Figma API Errors
```json
{
  "content": [{"type": "text", "text": "Figma API error: 403 Forbidden"}],
  "isError": true,
  "errorMessage": "Figma API error: 403 Forbidden"
}
```

## Troubleshooting

### Server Won't Start
- Check if port 3001 is already in use
- Try a different port: `MCP_SERVER_PORT=3002 npm start`

### CORS Errors
- Verify the server is running
- Check the browser console for specific CORS error messages
- Ensure you're making requests to the correct server URL

### Figma API Errors
- Verify your Figma token is valid and not expired
- Check token permissions for the requested file
- Ensure the file ID is correct

### Connection Timeouts
- Check network connectivity
- Verify firewall settings allow traffic on the server port
- Try increasing timeout values in client code

## Development

### Starting in Development Mode
```bash
npm run dev
```

### Adding New Tools
1. Add the tool case to the `/mcp/tools/call` endpoint
2. Update the tools list in `/mcp/tools/list`
3. Add documentation to this README

## Security Considerations

- Never expose Figma tokens in logs or error messages
- Consider implementing rate limiting for production use
- Use HTTPS in production environments
- Restrict CORS origins for production deployments