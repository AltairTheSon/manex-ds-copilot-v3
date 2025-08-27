import { McpClientConfig, McpConnectionState, McpToolResponse, McpConfig } from '../types/mcp.js';
import { configManager } from '../utils/configManager';

// Load MCP configuration
import mcpConfigData from '../mcp.config.json';
const mcpConfig = mcpConfigData as McpConfig;

export class FigmaMcpClient {
  private connectionState: McpConnectionState;
  private config: McpClientConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: McpClientConfig) {
    // Merge environment config with passed config
    const envConfig = configManager.getMcpConfig();
    
    this.config = {
      timeout: mcpConfig.transport.defaultTimeout,
      retryAttempts: mcpConfig.transport.retryAttempts,
      retryDelay: mcpConfig.transport.retryDelay,
      enableHealthCheck: true,
      enableReconnect: true,
      logLevel: mcpConfig.logging.level,
      ...envConfig,  // Apply environment configuration
      ...config      // Apply passed configuration (highest priority)
    };

    this.connectionState = {
      status: 'disconnected',
      reconnectAttempts: 0,
      serverCapabilities: [],
      availableTools: []
    };

    // Validate configuration on initialization
    const validation = configManager.validateMcpConfig();
    if (!validation.isValid) {
      this.log('warn', 'MCP configuration validation warnings:', validation.errors);
    }

    this.log('debug', 'MCP client initialized', { config: this.config });
  }

  async connect(): Promise<void> {
    if (this.connectionState.status === 'connected' || this.connectionState.status === 'connecting') {
      return;
    }

    this.connectionState.status = 'connecting';
    this.log('info', 'Connecting to MCP server...');

    try {
      // Determine server URL - use provided config or default from mcp.config.json
      const serverUrl = this.config.serverUrl || mcpConfig.servers.figma.url;
      
      this.log('info', `Attempting to connect to MCP server at: ${serverUrl}`);

      // For now, we'll create a proper HTTP-based MCP client
      // In a browser environment, we need to use HTTP/SSE instead of WebSocket or stdio
      
      // Check if the server is reachable
      const healthCheck = await this.performHealthCheck(serverUrl);
      if (!healthCheck) {
        throw new Error('MCP server is not reachable or not responding to health checks');
      }

      // Initialize available tools from configuration
      this.connectionState.availableTools = mcpConfig.servers.figma.tools;
      this.connectionState.serverCapabilities = mcpConfig.servers.figma.capabilities;

      this.connectionState.status = 'connected';
      this.connectionState.lastConnected = new Date();
      this.connectionState.reconnectAttempts = 0;
      this.connectionState.lastError = undefined;

      this.log('info', 'MCP client connected successfully');
      this.log('debug', `Available tools: ${this.connectionState.availableTools.join(', ')}`);

      // Start health check if enabled
      if (this.config.enableHealthCheck) {
        this.startHealthCheck();
      }

    } catch (error) {
      this.connectionState.status = 'error';
      this.connectionState.lastError = error instanceof Error ? error : new Error(String(error));
      
      this.log('error', `Failed to connect to MCP server: ${error}`);

      if (this.config.enableReconnect && this.connectionState.reconnectAttempts < (this.config.retryAttempts || 3)) {
        this.scheduleReconnect();
      } else {
        throw new Error(`MCP connection failed: ${error}`);
      }
    }
  }

  private async performHealthCheck(serverUrl: string): Promise<boolean> {
    try {
      // For HTTP-based MCP servers, try to ping the health endpoint
      const healthUrl = `${serverUrl}/health`;
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout || 5000)
      });

      return response.ok;
    } catch (error) {
      this.log('warn', `Health check failed: ${error}`);
      return false;
    }
  }

  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.connectionState.status === 'connected') {
        try {
          // Perform a simple health check
          const serverUrl = this.config.serverUrl || mcpConfig.servers.figma.url;
          const isHealthy = await this.performHealthCheck(serverUrl);
          if (!isHealthy) {
            throw new Error('Health check failed');
          }
        } catch (error) {
          this.log('warn', `Health check failed: ${error}`);
          if (this.config.enableReconnect) {
            this.handleConnectionLoss();
          }
        }
      }
    }, mcpConfig.connection.healthCheckInterval);
  }

  private handleConnectionLoss(): void {
    this.connectionState.status = 'error';
    this.connectionState.lastError = new Error('Connection lost during health check');
    
    if (this.connectionState.reconnectAttempts < (this.config.retryAttempts || 3)) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = (this.config.retryDelay || 1000) * Math.pow(2, this.connectionState.reconnectAttempts);
    this.connectionState.reconnectAttempts++;
    this.connectionState.status = 'reconnecting';

    this.log('info', `Scheduling reconnect in ${delay}ms (attempt ${this.connectionState.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.log('error', `Reconnection failed: ${error}`);
      }
    }, delay);
  }

  async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.connectionState.status = 'disconnected';
    this.connectionState.reconnectAttempts = 0;

    this.log('info', 'MCP client disconnected');
  }

  async callTool(toolName: string, args: any): Promise<McpToolResponse> {
    if (this.connectionState.status !== 'connected') {
      throw new Error(`MCP client is not connected: ${this.connectionState.status}`);
    }

    try {
      this.log('debug', `Calling MCP tool: ${toolName}`, args);

      // Get server URL for API calls
      const serverUrl = this.config.serverUrl || mcpConfig.servers.figma.url;
      
      // Make HTTP request to MCP server
      const response = await fetch(`${serverUrl}/tools/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': args.token ? `Bearer ${args.token}` : '',
        },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      this.log('debug', `MCP tool call successful: ${toolName}`);

      // Transform HTTP response to MCP format
      return {
        content: [{
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result)
        }],
        isError: false
      };

    } catch (error) {
      this.log('error', `MCP tool call failed for ${toolName}:`, error);
      
      // Check if this is a connection error
      if (error instanceof Error && (
        error.message.includes('fetch') || 
        error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.message.includes('HTTP 5')
      )) {
        this.handleConnectionLoss();
      }

      throw new Error(`MCP tool call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listTools(): Promise<string[]> {
    if (this.connectionState.status !== 'connected') {
      throw new Error('MCP client is not connected');
    }

    return this.connectionState.availableTools || [];
  }

  isClientConnected(): boolean {
    return this.connectionState.status === 'connected';
  }

  getConnectionState(): McpConnectionState {
    return { ...this.connectionState };
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logLevel = this.config.logLevel || 'info';
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    
    if (levels[level] >= levels[logLevel]) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [MCP] [${level.toUpperCase()}]`;
      
      if (data) {
        console[level === 'debug' ? 'log' : level](`${prefix} ${message}`, data);
      } else {
        console[level === 'debug' ? 'log' : level](`${prefix} ${message}`);
      }
    }
  }

  // Figma-specific MCP tool calls
  async getFigmaFile(fileId: string, token: string): Promise<McpToolResponse> {
    return this.callTool('get_file', { file_id: fileId, token });
  }

  async getFigmaComments(fileId: string, token: string): Promise<McpToolResponse> {
    return this.callTool('get_comments', { file_id: fileId, token });
  }

  async getFigmaVersions(fileId: string, token: string): Promise<McpToolResponse> {
    return this.callTool('get_versions', { file_id: fileId, token });
  }

  async getFigmaComponents(fileId: string, token: string): Promise<McpToolResponse> {
    return this.callTool('get_components', { file_id: fileId, token });
  }

  async getFigmaStyles(fileId: string, token: string): Promise<McpToolResponse> {
    return this.callTool('get_styles', { file_id: fileId, token });
  }

  async getFigmaUser(token: string): Promise<McpToolResponse> {
    return this.callTool('get_user', { token });
  }

  async getFigmaImages(fileId: string, nodeIds: string[], token: string): Promise<McpToolResponse> {
    return this.callTool('get_images', { 
      file_id: fileId, 
      node_ids: nodeIds.join(','), 
      token 
    });
  }

  async getFigmaNodes(fileId: string, nodeIds: string[], token: string): Promise<McpToolResponse> {
    return this.callTool('get_nodes', { 
      file_id: fileId, 
      node_ids: nodeIds.join(','), 
      token 
    });
  }
}