import { McpClientConfig } from '../types/mcp';

export class ConfigManager {
  private static instance: ConfigManager;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  getMcpConfig(): McpClientConfig {
    const serverUrl = process.env.REACT_APP_MCP_SERVER_URL || 'http://localhost:3001/mcp';
    const timeout = parseInt(process.env.REACT_APP_MCP_TIMEOUT || '30000', 10);
    const retryAttempts = parseInt(process.env.REACT_APP_MCP_RETRY_ATTEMPTS || '3', 10);
    const retryDelay = parseInt(process.env.REACT_APP_MCP_RETRY_DELAY || '1000', 10);
    const enableHealthCheck = process.env.REACT_APP_MCP_HEALTH_CHECK_ENABLED !== 'false';
    const enableReconnect = process.env.REACT_APP_MCP_RECONNECT_ENABLED !== 'false';
    const logLevel = (process.env.REACT_APP_MCP_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error';

    return {
      serverUrl,
      timeout,
      retryAttempts,
      retryDelay,
      enableHealthCheck,
      enableReconnect,
      logLevel
    };
  }

  isMcpEnabled(): boolean {
    return process.env.REACT_APP_MCP_ENABLED !== 'false';
  }

  validateMcpConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.getMcpConfig();

    if (!config.serverUrl) {
      errors.push('MCP server URL is required');
    } else {
      try {
        new URL(config.serverUrl);
      } catch (error) {
        errors.push('MCP server URL is not a valid URL');
      }
    }

    if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
      errors.push('MCP timeout must be between 1000ms and 300000ms');
    }

    if (config.retryAttempts && (config.retryAttempts < 0 || config.retryAttempts > 10)) {
      errors.push('MCP retry attempts must be between 0 and 10');
    }

    if (config.retryDelay && (config.retryDelay < 100 || config.retryDelay > 30000)) {
      errors.push('MCP retry delay must be between 100ms and 30000ms');
    }

    const validLogLevels = ['debug', 'info', 'warn', 'error'];
    if (config.logLevel && !validLogLevels.includes(config.logLevel)) {
      errors.push('MCP log level must be one of: debug, info, warn, error');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getConfigSummary(): Record<string, any> {
    const config = this.getMcpConfig();
    const validation = this.validateMcpConfig();

    return {
      mcpEnabled: this.isMcpEnabled(),
      serverUrl: config.serverUrl,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      enableHealthCheck: config.enableHealthCheck,
      enableReconnect: config.enableReconnect,
      logLevel: config.logLevel,
      isValid: validation.isValid,
      validationErrors: validation.errors
    };
  }

  logConfigSummary(): void {
    const summary = this.getConfigSummary();
    console.log('MCP Configuration Summary:', summary);
    
    if (!summary.isValid) {
      console.error('MCP Configuration Validation Errors:', summary.validationErrors);
    }
  }
}

export const configManager = ConfigManager.getInstance();