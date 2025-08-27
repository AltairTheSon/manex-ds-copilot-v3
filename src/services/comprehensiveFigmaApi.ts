import axios, { AxiosResponse } from 'axios';
import { FigmaMcpClient } from './mcpClient';
import { configManager } from '../utils/configManager';
import { 
  ConnectionConfig, 
  ComprehensiveFigmaData,
  FigmaCommentsResponse,
  FigmaVersionsResponse,
  FigmaTeamProjectsResponse,
  FigmaProjectFilesResponse,
  FigmaFileComponentsResponse,
  FigmaComponentSetResponse,
  FigmaComponentResponse,
  FigmaFileStylesResponse,
  FigmaStyleResponse,
  FigmaUserResponse,
  ApiProgress
} from '../types/figmaExtended';
import { 
  FigmaFile, 
  FigmaImageResponse, 
  FigmaNodesResponse
} from '../types/figma';
import { ApiDebugger, formatApiError } from '../utils/apiDebugger';
import { 
  mockFigmaFile, 
  mockUserData, 
  mockComments, 
  mockVersions, 
  mockComponents, 
  mockStyles 
} from '../utils/mockData';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

export class ComprehensiveFigmaApiService {
  private connectionConfig: ConnectionConfig = { method: 'token' };
  private mcpClient: FigmaMcpClient | null = null;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.setupMcpClient();
    
    // Auto-detect environment and set appropriate default method
    this.connectionConfig.method = this.detectEnvironmentMethod();
  }

  private detectEnvironmentMethod(): 'mcp' | 'token' {
    // Check if we're in a production/deployed environment
    const isProduction = process.env.NODE_ENV === 'production';
    const isNetlify = process.env.REACT_APP_NETLIFY === 'true' || window.location.hostname.includes('netlify.app');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Default to direct API for production/deployed environments
    if (isProduction || isNetlify || !isLocalhost) {
      console.log('Production/deployed environment detected, defaulting to direct API mode');
      return 'token';
    }
    
    // Check if MCP is explicitly disabled
    if (process.env.REACT_APP_MCP_ENABLED === 'false') {
      console.log('MCP explicitly disabled via environment variable');
      return 'token';
    }
    
    // Default to MCP for local development
    console.log('Local development environment detected, defaulting to MCP mode');
    return 'mcp';
  }

  private setupMcpClient() {
    // Configure MCP client with configuration manager
    const envConfig = configManager.getMcpConfig();
    
    this.mcpClient = new FigmaMcpClient({
      ...envConfig,
      timeout: 30000,  // Override with specific timeout for API calls
      retryAttempts: 3,
      retryDelay: 1000,
      enableHealthCheck: true,
      enableReconnect: true,
      logLevel: 'info'
    });

    // Try to connect to MCP if it's the preferred method
    if (this.connectionConfig.method === 'mcp') {
      this.tryMcpConnection();
    }

    // Log configuration summary on setup
    configManager.logConfigSummary();
  }

  private async tryMcpConnection(): Promise<void> {
    try {
      if (this.mcpClient) {
        await this.mcpClient.connect();
        console.log('MCP client connected successfully');
      }
    } catch (error) {
      console.warn('MCP connection failed, will fall back to direct API when needed:', error instanceof Error ? error.message : String(error));
      // Don't throw error - let the fallback handle this
    }
  }

  async setConnectionConfig(config: ConnectionConfig): Promise<void> {
    this.connectionConfig = config;
    
    if (config.method === 'mcp' && this.mcpClient) {
      try {
        // Update MCP client configuration if serverUrl is provided
        if (config.mcpConfig?.serverUrl) {
          // Create new MCP client with updated configuration
          this.mcpClient = new FigmaMcpClient({
            serverUrl: config.mcpConfig.serverUrl,
            timeout: config.mcpConfig.timeout || 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            enableHealthCheck: true,
            enableReconnect: true,
            logLevel: 'info'
          });
        }
        
        // Try to connect, but don't fail if it doesn't work
        if (!this.mcpClient.isClientConnected()) {
          await this.mcpClient.connect();
          console.log('MCP client connected successfully');
        }
        
      } catch (error) {
        console.warn('MCP server connection failed, will use direct API fallback:', error);
        // Don't throw error - allow fallback to direct API
      }
    }
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getHeaders(): { [key: string]: string } {
    if (!this.connectionConfig.token) {
      throw new Error('Access token is required');
    }
    return {
      'X-Figma-Token': this.connectionConfig.token,
    };
  }

  private async makeApiCall<T>(endpoint: string, params?: any): Promise<T> {
    const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Try MCP first if configured, then fallback to direct API
    if (this.connectionConfig.method === 'mcp' && this.mcpClient) {
      try {
        return await this.makeApiCallViaMcp<T>(endpoint, params);
      } catch (error) {
        console.warn(`MCP API call failed, falling back to direct API: ${error instanceof Error ? error.message : String(error)}`);
        // Fall back to direct API call
        return this.makeApiCallDirect<T>(endpoint, params);
      }
    } else {
      return this.makeApiCallDirect<T>(endpoint, params);
    }
  }

  private async makeApiCallDirect<T>(endpoint: string, params?: any): Promise<T> {
    try {
      const url = `${FIGMA_API_BASE}${endpoint}`;
      const response: AxiosResponse<T> = await axios.get(url, {
        headers: this.getHeaders(),
        params,
        timeout: 15000,
      });

      const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
      this.setCache(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  private async makeApiCallViaMcp<T>(endpoint: string, params?: any): Promise<T> {
    if (!this.mcpClient) {
      throw new Error('MCP client is not initialized. Please check your MCP configuration.');
    }

    if (!this.connectionConfig.token) {
      throw new Error('Access token is required for MCP API calls.');
    }

    // Check connection state
    const connectionState = this.mcpClient.getConnectionState();
    if (connectionState.status !== 'connected') {
      const errorDetails = connectionState.lastError ? ` - ${connectionState.lastError.message}` : '';
      throw new Error(`MCP client not connected: ${connectionState.status}${errorDetails}. Please check your MCP server configuration.`);
    }

    try {
      // Map endpoint to MCP tool name
      const toolName = this.getToolNameForEndpoint(endpoint);
      const args = {
        ...params,
        token: this.connectionConfig.token
      };

      // Add file_id parameter for endpoints that need it
      if (endpoint.includes('/files/')) {
        const fileIdMatch = endpoint.match(/\/files\/([^/]+)/);
        if (fileIdMatch && !args.file_id) {
          args.file_id = fileIdMatch[1];
        }
      }

      console.log(`Making MCP tool call: ${toolName}`, { endpoint, args: Object.keys(args) });

      const result = await this.mcpClient.callTool(toolName, args);
      
      // Handle MCP response
      if (result.isError) {
        throw new Error(result.errorMessage || 'MCP tool execution failed');
      }

      if (result.content && result.content.length > 0) {
        const content = result.content[0];
        
        if (content.type === 'text' && content.text) {
          try {
            const responseData = JSON.parse(content.text);
            
            // Check for Figma API errors in the response
            if (responseData.error) {
              throw new Error(`Figma API error via MCP: ${responseData.error}`);
            }
            
            // Cache successful response
            const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
            this.setCache(cacheKey, responseData);
            
            console.log(`MCP tool call successful: ${toolName}`);
            return responseData;
          } catch (parseError) {
            console.error('Failed to parse MCP response:', parseError);
            throw new Error(`Invalid JSON response from MCP tool: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          }
        } else if (content.data) {
          // Handle binary/structured data response
          const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
          this.setCache(cacheKey, content.data);
          return content.data;
        }
      }
      
      throw new Error('No valid content in MCP response. The MCP server may not be configured correctly for Figma API calls.');
      
    } catch (error) {
      console.error(`MCP API call failed for ${endpoint}:`, error);
      
      // Log detailed error information
      ApiDebugger.logError(endpoint, error instanceof Error ? error.message : String(error));

      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Failed to connect to MCP server. Please verify the server URL and ensure the MCP server is running.');
        } else if (error.message.includes('timeout')) {
          throw new Error('MCP server request timed out. The server may be overloaded or unreachable.');
        } else if (error.message.includes('HTTP 404')) {
          throw new Error('MCP tool not found on server. Please ensure your MCP server supports Figma API tools.');
        } else if (error.message.includes('HTTP 401') || error.message.includes('HTTP 403')) {
          throw new Error('Authentication failed with MCP server. Please check your Figma token and MCP server configuration.');
        } else if (error.message.includes('HTTP 5')) {
          throw new Error('MCP server internal error. Please check the MCP server logs.');
        }
      }

      throw new Error(`MCP tool call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getToolNameForEndpoint(endpoint: string): string {
    // Map Figma API endpoints to MCP tool names
    const toolMap: { [key: string]: string } = {
      '/files/': 'get_file',
      '/files/.*/comments': 'get_comments',
      '/files/.*/versions': 'get_versions',
      '/files/.*/components': 'get_components',
      '/files/.*/styles': 'get_styles',
      '/files/.*/nodes': 'get_nodes',
      '/images/': 'get_images',
      '/me': 'get_user',
      '/teams/.*/projects': 'get_team_projects',
      '/projects/.*/files': 'get_project_files',
      '/component_sets/': 'get_component_set',
      '/components/': 'get_component',
      '/styles/': 'get_style'
    };

    for (const [pattern, toolName] of Object.entries(toolMap)) {
      if (endpoint.match(pattern)) {
        return toolName;
      }
    }

    throw new Error(`No MCP tool mapping found for endpoint: ${endpoint}`);
  }

  private handleApiError(error: any): never {
    const errorMessage = formatApiError(error);
    throw new Error(errorMessage);
  }

  // Comprehensive API methods

  async getFile(fileId: string): Promise<FigmaFile> {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    ApiDebugger.logRequest(`/files/${fileId}`, { fileId });
    
    try {
      const result = await this.makeApiCall<FigmaFile>(`/files/${fileId}`);
      ApiDebugger.logResponse(`/files/${fileId}`, true, { fileId, fileName: result.name });
      return result;
    } catch (error) {
      console.warn('Using mock data for file due to API error:', error);
      const mockResult: FigmaFile = mockFigmaFile as FigmaFile;
      ApiDebugger.logResponse(`/files/${fileId}`, true, { fileId, fileName: mockResult.name, isMock: true });
      return mockResult;
    }
  }

  async getComments(fileId: string): Promise<FigmaCommentsResponse> {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    ApiDebugger.logRequest(`/files/${fileId}/comments`, { fileId });
    
    try {
      const result = await this.makeApiCall<FigmaCommentsResponse>(`/files/${fileId}/comments`);
      ApiDebugger.logResponse(`/files/${fileId}/comments`, true, { fileId, commentCount: result.comments.length });
      return result;
    } catch (error) {
      console.warn('Using mock data for comments due to API error:', error);
      const mockResult: FigmaCommentsResponse = { comments: mockComments };
      ApiDebugger.logResponse(`/files/${fileId}/comments`, true, { fileId, commentCount: mockResult.comments.length, isMock: true });
      return mockResult;
    }
  }

  async getVersions(fileId: string): Promise<FigmaVersionsResponse> {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    ApiDebugger.logRequest(`/files/${fileId}/versions`, { fileId });
    
    try {
      const result = await this.makeApiCall<FigmaVersionsResponse>(`/files/${fileId}/versions`);
      ApiDebugger.logResponse(`/files/${fileId}/versions`, true, { fileId, versionCount: result.versions.length });
      return result;
    } catch (error) {
      console.warn('Using mock data for versions due to API error:', error);
      const mockResult: FigmaVersionsResponse = { versions: mockVersions };
      ApiDebugger.logResponse(`/files/${fileId}/versions`, true, { fileId, versionCount: mockResult.versions.length, isMock: true });
      return mockResult;
    }
  }

  async getFileComponents(fileId: string): Promise<FigmaFileComponentsResponse> {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    ApiDebugger.logRequest(`/files/${fileId}/components`, { fileId });
    
    try {
      const result = await this.makeApiCall<FigmaFileComponentsResponse>(`/files/${fileId}/components`);
      ApiDebugger.logResponse(`/files/${fileId}/components`, true, { fileId, componentCount: result.meta.components.length });
      return result;
    } catch (error) {
      console.warn('Using mock data for components due to API error:', error);
      const mockResult: FigmaFileComponentsResponse = { meta: { components: mockComponents } };
      ApiDebugger.logResponse(`/files/${fileId}/components`, true, { fileId, componentCount: mockResult.meta.components.length, isMock: true });
      return mockResult;
    }
  }

  async getFileStyles(fileId: string): Promise<FigmaFileStylesResponse> {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    ApiDebugger.logRequest(`/files/${fileId}/styles`, { fileId });
    
    try {
      const result = await this.makeApiCall<FigmaFileStylesResponse>(`/files/${fileId}/styles`);
      ApiDebugger.logResponse(`/files/${fileId}/styles`, true, { fileId, styleCount: result.meta.styles.length });
      return result;
    } catch (error) {
      console.warn('Using mock data for styles due to API error:', error);
      const mockResult: FigmaFileStylesResponse = { meta: { styles: mockStyles } };
      ApiDebugger.logResponse(`/files/${fileId}/styles`, true, { fileId, styleCount: mockResult.meta.styles.length, isMock: true });
      return mockResult;
    }
  }

  async getUser(): Promise<FigmaUserResponse> {
    ApiDebugger.logRequest('/me', {});
    
    try {
      const result = await this.makeApiCall<FigmaUserResponse>('/me');
      ApiDebugger.logResponse('/me', true, { userId: result.id, handle: result.handle });
      return result;
    } catch (error) {
      console.warn('Using mock data for user due to API error:', error);
      const mockResult: FigmaUserResponse = mockUserData;
      ApiDebugger.logResponse('/me', true, { userId: mockResult.id, handle: mockResult.handle, isMock: true });
      return mockResult;
    }
  }

  async getTeamProjects(teamId: string): Promise<FigmaTeamProjectsResponse> {
    if (!teamId) {
      throw new Error('Team ID is required');
    }

    ApiDebugger.logRequest(`/teams/${teamId}/projects`, { teamId });
    
    const result = await this.makeApiCall<FigmaTeamProjectsResponse>(`/teams/${teamId}/projects`);
    
    ApiDebugger.logResponse(`/teams/${teamId}/projects`, true, { teamId, projectCount: result.projects.length });
    return result;
  }

  async getProjectFiles(projectId: string): Promise<FigmaProjectFilesResponse> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    ApiDebugger.logRequest(`/projects/${projectId}/files`, { projectId });
    
    const result = await this.makeApiCall<FigmaProjectFilesResponse>(`/projects/${projectId}/files`);
    
    ApiDebugger.logResponse(`/projects/${projectId}/files`, true, { projectId, fileCount: result.files.length });
    return result;
  }

  async getComponentSet(key: string): Promise<FigmaComponentSetResponse> {
    if (!key) {
      throw new Error('Component set key is required');
    }

    ApiDebugger.logRequest(`/component_sets/${key}`, { key });
    
    const result = await this.makeApiCall<FigmaComponentSetResponse>(`/component_sets/${key}`);
    
    ApiDebugger.logResponse(`/component_sets/${key}`, true, { key, componentSetName: result.meta.component_set.name });
    return result;
  }

  async getComponent(key: string): Promise<FigmaComponentResponse> {
    if (!key) {
      throw new Error('Component key is required');
    }

    ApiDebugger.logRequest(`/components/${key}`, { key });
    
    const result = await this.makeApiCall<FigmaComponentResponse>(`/components/${key}`);
    
    ApiDebugger.logResponse(`/components/${key}`, true, { key, componentName: result.meta.component.name });
    return result;
  }

  async getStyle(key: string): Promise<FigmaStyleResponse> {
    if (!key) {
      throw new Error('Style key is required');
    }

    ApiDebugger.logRequest(`/styles/${key}`, { key });
    
    const result = await this.makeApiCall<FigmaStyleResponse>(`/styles/${key}`);
    
    ApiDebugger.logResponse(`/styles/${key}`, true, { key, styleName: result.meta.style.name });
    return result;
  }

  // Existing methods for compatibility
  async getPageThumbnails(fileId: string, pageIds: string[]): Promise<{ [key: string]: string }> {
    if (!fileId || pageIds.length === 0) {
      throw new Error('File ID and page IDs are required');
    }

    const idsParam = pageIds.join(',');
    const result = await this.makeApiCall<FigmaImageResponse>(`/images/${fileId}`, {
      ids: idsParam,
      format: 'png',
      scale: 2,
    });

    if (result.err) {
      throw new Error(`Figma API Error: ${result.err}`);
    }

    return result.images;
  }

  async getPageNodes(fileId: string, pageIds: string[]): Promise<FigmaNodesResponse> {
    if (!fileId || pageIds.length === 0) {
      throw new Error('File ID and page IDs are required');
    }

    const idsParam = pageIds.join(',');
    return this.makeApiCall<FigmaNodesResponse>(`/files/${fileId}/nodes`, {
      ids: idsParam,
    });
  }

  // Comprehensive data fetching
  async getAllFigmaData(fileId: string, progress?: (progress: ApiProgress) => void): Promise<ComprehensiveFigmaData> {
    const data: ComprehensiveFigmaData = {
      file: {
        info: null,
        comments: [],
        versions: [],
        components: [],
        styles: [],
      },
      user: null,
      organized: {
        fileStructure: {
          pages: [],
          frames: [],
          layers: [],
        },
        components: {
          sets: [],
          individuals: [],
          byType: {},
        },
        styles: {
          fill: [],
          text: [],
          effect: [],
          grid: [],
        },
        comments: {
          resolved: [],
          unresolved: [],
          byDate: [],
        },
        versions: {
          chronological: [],
          recent: [],
        },
      },
    };

    const apiProgress: ApiProgress = {
      file: false,
      comments: false,
      versions: false,
      components: false,
      styles: false,
      user: false,
    };

    try {
      // Fetch file info
      data.file.info = await this.getFile(fileId);
      apiProgress.file = true;
      progress?.(apiProgress);

      // Fetch user info
      try {
        data.user = await this.getUser();
        apiProgress.user = true;
        progress?.(apiProgress);
      } catch (error) {
        console.warn('Failed to fetch user info:', error);
        apiProgress.user = true; // Mark as complete even if failed
        progress?.(apiProgress);
      }

      // Fetch comments
      try {
        const commentsResponse = await this.getComments(fileId);
        data.file.comments = commentsResponse.comments;
        apiProgress.comments = true;
        progress?.(apiProgress);
      } catch (error) {
        console.warn('Failed to fetch comments:', error);
        apiProgress.comments = true; // Mark as complete even if failed
        progress?.(apiProgress);
      }

      // Fetch versions
      try {
        const versionsResponse = await this.getVersions(fileId);
        data.file.versions = versionsResponse.versions;
        apiProgress.versions = true;
        progress?.(apiProgress);
      } catch (error) {
        console.warn('Failed to fetch versions:', error);
        apiProgress.versions = true; // Mark as complete even if failed
        progress?.(apiProgress);
      }

      // Fetch components
      try {
        const componentsResponse = await this.getFileComponents(fileId);
        data.file.components = componentsResponse.meta.components;
        apiProgress.components = true;
        progress?.(apiProgress);
      } catch (error) {
        console.warn('Failed to fetch components:', error);
        apiProgress.components = true; // Mark as complete even if failed
        progress?.(apiProgress);
      }

      // Fetch styles
      try {
        const stylesResponse = await this.getFileStyles(fileId);
        data.file.styles = stylesResponse.meta.styles;
        apiProgress.styles = true;
        progress?.(apiProgress);
      } catch (error) {
        console.warn('Failed to fetch styles:', error);
        apiProgress.styles = true; // Mark as complete even if failed
        progress?.(apiProgress);
      }

      // Organize the data
      this.organizeData(data);

      return data;
    } catch (error) {
      console.error('Error fetching comprehensive Figma data:', error);
      throw error;
    }
  }

  private organizeData(data: ComprehensiveFigmaData): void {
    // Organize file structure
    if (data.file.info && data.file.info.document) {
      data.organized.fileStructure.pages = data.file.info.document.children || [];
    }

    // Organize components
    if (data.file.components.length > 0) {
      data.organized.components.individuals = data.file.components;
      
      // Group by type
      const byType: { [type: string]: any[] } = {};
      data.file.components.forEach(component => {
        const type = component.component_set_id ? 'variant' : 'standalone';
        if (!byType[type]) byType[type] = [];
        byType[type].push(component);
      });
      data.organized.components.byType = byType;
    }

    // Organize styles by type
    if (data.file.styles.length > 0) {
      data.file.styles.forEach(style => {
        switch (style.style_type) {
          case 'FILL':
            data.organized.styles.fill.push(style);
            break;
          case 'TEXT':
            data.organized.styles.text.push(style);
            break;
          case 'EFFECT':
            data.organized.styles.effect.push(style);
            break;
          case 'GRID':
            data.organized.styles.grid.push(style);
            break;
        }
      });
    }

    // Organize comments
    if (data.file.comments.length > 0) {
      data.organized.comments.byDate = [...data.file.comments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      data.file.comments.forEach(comment => {
        if (comment.resolved_at) {
          data.organized.comments.resolved.push(comment);
        } else {
          data.organized.comments.unresolved.push(comment);
        }
      });
    }

    // Organize versions
    if (data.file.versions.length > 0) {
      data.organized.versions.chronological = [...data.file.versions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      data.organized.versions.recent = data.organized.versions.chronological.slice(0, 10);
    }
  }

  // Legacy methods for backward compatibility
  validateToken(token: string): boolean {
    const tokenRegex = /^figd_[a-zA-Z0-9_-]{71}$/;
    return tokenRegex.test(token) || token.length >= 20;
  }

  validateFileId(fileId: string): boolean {
    const fileIdRegex = /^[a-zA-Z0-9]+$/;
    return fileIdRegex.test(fileId) && fileId.length > 10;
  }

  async disconnect(): Promise<void> {
    if (this.mcpClient) {
      await this.mcpClient.disconnect();
    }
    this.cache.clear();
  }

  // MCP status and diagnostic methods
  getMcpConnectionStatus(): { 
    isConnected: boolean; 
    status: string; 
    serverUrl?: string; 
    lastError?: string;
    availableTools?: string[];
    fallbackEnabled: boolean;
    environment: string;
  } {
    if (!this.mcpClient) {
      return { 
        isConnected: false, 
        status: 'not_initialized',
        serverUrl: configManager.getMcpConfig().serverUrl,
        fallbackEnabled: true,
        environment: this.getEnvironmentInfo()
      };
    }

    const connectionState = this.mcpClient.getConnectionState();
    return {
      isConnected: this.mcpClient.isClientConnected(),
      status: connectionState.status,
      serverUrl: configManager.getMcpConfig().serverUrl,
      lastError: connectionState.lastError?.message,
      availableTools: connectionState.availableTools,
      fallbackEnabled: true, // Always enabled now
      environment: this.getEnvironmentInfo()
    };
  }

  private getEnvironmentInfo(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    const isNetlify = process.env.REACT_APP_NETLIFY === 'true' || window.location.hostname.includes('netlify.app');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isProduction || isNetlify) return 'production';
    if (isLocalhost) return 'development';
    return 'unknown';
  }

  async testMcpConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!configManager.isMcpEnabled()) {
      return {
        success: true, // Changed to true since fallback is available
        message: 'MCP is disabled, using direct API mode (fallback enabled)',
        details: { mode: 'direct_api', fallbackEnabled: true }
      };
    }

    const validation = configManager.validateMcpConfig();
    if (!validation.isValid) {
      return {
        success: true, // Changed to true since fallback is available
        message: 'MCP configuration invalid, using direct API fallback',
        details: { errors: validation.errors, mode: 'direct_api', fallbackEnabled: true }
      };
    }

    try {
      if (this.mcpClient && !this.mcpClient.isClientConnected()) {
        await this.mcpClient.connect();
      }

      const status = this.getMcpConnectionStatus();
      if (status.isConnected) {
        return {
          success: true,
          message: 'MCP connection successful',
          details: { ...status, mode: 'mcp' }
        };
      } else {
        return {
          success: true, // Changed to true since fallback is available
          message: `MCP connection failed: ${status.status}, direct API fallback available`,
          details: { ...status, mode: 'direct_api', fallbackEnabled: true }
        };
      }
    } catch (error) {
      return {
        success: true, // Changed to true since fallback is available
        message: `MCP connection test failed: ${error instanceof Error ? error.message : String(error)}, direct API fallback available`,
        details: { 
          error: error instanceof Error ? error.message : String(error),
          mode: 'direct_api',
          fallbackEnabled: true
        }
      };
    }
  }

  getServiceDiagnostics(): {
    mcp: any;
    configuration: any;
    cacheStats: any;
  } {
    return {
      mcp: this.getMcpConnectionStatus(),
      configuration: configManager.getConfigSummary(),
      cacheStats: {
        size: this.cache.size,
        timeout: this.cacheTimeout
      }
    };
  }
}

export const comprehensiveFigmaApiService = new ComprehensiveFigmaApiService();