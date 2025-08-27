export interface McpTransportConfig {
  type: 'http' | 'websocket';
  defaultTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface McpServerConfig {
  url: string;
  capabilities: string[];
  tools: string[];
  authentication: {
    type: 'bearer' | 'api-key' | 'none';
    required: boolean;
  };
  rateLimit: {
    requestsPerSecond: number;
    burstSize: number;
  };
}

export interface McpConnectionConfig {
  healthCheckInterval: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  pingInterval: number;
}

export interface McpLoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableDebug: boolean;
}

export interface McpConfig {
  protocol: {
    version: string;
  };
  client: {
    name: string;
    version: string;
  };
  transport: McpTransportConfig;
  servers: {
    [key: string]: McpServerConfig;
  };
  connection: McpConnectionConfig;
  logging: McpLoggingConfig;
}

export interface McpClientConfig {
  serverUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableHealthCheck?: boolean;
  enableReconnect?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface McpConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';
  lastConnected?: Date;
  lastError?: Error;
  reconnectAttempts: number;
  serverCapabilities?: string[];
  availableTools?: string[];
}

export interface McpToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface McpToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: any;
    mimeType?: string;
  }>;
  isError?: boolean;
  errorMessage?: string;
}

export interface McpMessage {
  id: string;
  method: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}