const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.MCP_SERVER_PORT || 3001;
const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Configure CORS to allow requests from any origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

app.use(express.json());

// Health check endpoint
app.get('/mcp/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'figma-mcp-server',
    version: '1.0.0'
  });
});

// MCP tool endpoints
app.post('/mcp/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    
    if (!args.token) {
      return res.status(400).json({
        error: 'Authentication token is required',
        code: 'MISSING_TOKEN'
      });
    }

    let result;
    
    switch (name) {
      case 'get_file':
        result = await callFigmaAPI(`/files/${args.file_id}`, args.token);
        break;
        
      case 'get_comments':
        result = await callFigmaAPI(`/files/${args.file_id}/comments`, args.token);
        break;
        
      case 'get_versions':
        result = await callFigmaAPI(`/files/${args.file_id}/versions`, args.token);
        break;
        
      case 'get_components':
        result = await callFigmaAPI(`/files/${args.file_id}/components`, args.token);
        break;
        
      case 'get_styles':
        result = await callFigmaAPI(`/files/${args.file_id}/styles`, args.token);
        break;
        
      case 'get_user':
        result = await callFigmaAPI('/me', args.token);
        break;
        
      case 'get_images':
        const imageParams = new URLSearchParams({
          ids: args.ids,
          format: args.format || 'png',
          scale: args.scale || '1'
        });
        result = await callFigmaAPI(`/images/${args.file_id}?${imageParams}`, args.token);
        break;
        
      case 'get_nodes':
        const nodeParams = new URLSearchParams({
          ids: args.ids
        });
        result = await callFigmaAPI(`/files/${args.file_id}/nodes?${nodeParams}`, args.token);
        break;
        
      default:
        return res.status(400).json({
          error: `Unknown tool: ${name}`,
          code: 'UNKNOWN_TOOL',
          availableTools: ['get_file', 'get_comments', 'get_versions', 'get_components', 'get_styles', 'get_user', 'get_images', 'get_nodes']
        });
    }
    
    res.json({
      content: [{
        type: 'text',
        text: JSON.stringify(result)
      }],
      isError: false
    });
    
  } catch (error) {
    console.error('MCP tool call error:', error.message);
    
    res.status(error.response?.status || 500).json({
      content: [{
        type: 'text',
        text: error.message
      }],
      isError: true,
      errorMessage: error.message
    });
  }
});

// List available tools
app.get('/mcp/tools/list', (req, res) => {
  res.json({
    tools: [
      {
        name: 'get_file',
        description: 'Get Figma file data',
        parameters: ['file_id', 'token']
      },
      {
        name: 'get_comments',
        description: 'Get comments for a Figma file',
        parameters: ['file_id', 'token']
      },
      {
        name: 'get_versions',
        description: 'Get version history for a Figma file',
        parameters: ['file_id', 'token']
      },
      {
        name: 'get_components',
        description: 'Get components from a Figma file',
        parameters: ['file_id', 'token']
      },
      {
        name: 'get_styles',
        description: 'Get styles from a Figma file',
        parameters: ['file_id', 'token']
      },
      {
        name: 'get_user',
        description: 'Get current user information',
        parameters: ['token']
      },
      {
        name: 'get_images',
        description: 'Get image URLs for Figma nodes',
        parameters: ['file_id', 'ids', 'token', 'format', 'scale']
      },
      {
        name: 'get_nodes',
        description: 'Get specific nodes from a Figma file',
        parameters: ['file_id', 'ids', 'token']
      }
    ]
  });
});

async function callFigmaAPI(endpoint, token) {
  const url = `${FIGMA_API_BASE}${endpoint}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'X-Figma-Token': token
      },
      timeout: 30000
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Figma API error: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Network error: Unable to reach Figma API');
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /mcp/health',
      'GET /mcp/tools/list', 
      'POST /mcp/tools/call'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`MCP Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/mcp/health`);
  console.log(`Available tools: http://localhost:${PORT}/mcp/tools/list`);
});