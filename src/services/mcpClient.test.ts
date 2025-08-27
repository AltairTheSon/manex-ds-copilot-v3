import { FigmaMcpClient } from '../services/mcpClient';
import { configManager } from '../utils/configManager';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortSignal.timeout
Object.defineProperty(global, 'AbortSignal', {
  writable: true,
  value: {
    timeout: jest.fn(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      aborted: false,
      dispatchEvent: jest.fn(),
    }))
  }
});

describe('FigmaMcpClient', () => {
  let mcpClient: FigmaMcpClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mcpClient = new FigmaMcpClient({
      serverUrl: 'http://localhost:3001/mcp',
      timeout: 5000,
      logLevel: 'error', // Reduce noise in tests
      enableReconnect: false, // Disable reconnect for tests
      enableHealthCheck: false // Disable health check for tests
    });
  });

  afterEach(async () => {
    await mcpClient.disconnect();
  });

  describe('Configuration Management', () => {
    it('should use environment configuration', () => {
      const envConfig = configManager.getMcpConfig();
      expect(envConfig.serverUrl).toBe('http://localhost:3001/mcp');
      expect(envConfig.timeout).toBe(30000);
    });

    it('should validate MCP configuration', () => {
      const validation = configManager.validateMcpConfig();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should provide configuration summary', () => {
      const summary = configManager.getConfigSummary();
      expect(summary).toHaveProperty('mcpEnabled');
      expect(summary).toHaveProperty('serverUrl');
      expect(summary).toHaveProperty('isValid');
    });
  });

  describe('Connection Management', () => {
    it('should initialize with disconnected state', () => {
      const state = mcpClient.getConnectionState();
      expect(state.status).toBe('disconnected');
      expect(mcpClient.isClientConnected()).toBe(false);
    });

    it('should handle connection failure gracefully', async () => {
      // Mock fetch to simulate connection failure
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(mcpClient.connect()).rejects.toThrow('MCP connection failed');
      
      const state = mcpClient.getConnectionState();
      expect(state.status).toBe('error');
      expect(state.lastError).toBeDefined();
    });

    it('should handle successful health check', async () => {
      // Mock successful health check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' })
      });

      await mcpClient.connect();
      
      const state = mcpClient.getConnectionState();
      expect(state.status).toBe('connected');
      expect(mcpClient.isClientConnected()).toBe(true);
    });
  });

  describe('Tool Calls', () => {
    beforeEach(async () => {
      // Mock successful connection
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' })
      });
      await mcpClient.connect();
    });

    it('should make successful tool calls', async () => {
      const mockResponse = { name: 'Test File', id: '123' };
      
      // Mock successful tool call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await mcpClient.callTool('get_file', { file_id: '123', token: 'test-token' });
      
      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const parsedContent = JSON.parse(result.content[0].text || '{}');
      expect(parsedContent).toEqual(mockResponse);
    });

    it('should handle tool call errors', async () => {
      // Mock failed tool call
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(mcpClient.callTool('get_file', { file_id: '123', token: 'test-token' }))
        .rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle network errors', async () => {
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(mcpClient.callTool('get_file', { file_id: '123', token: 'test-token' }))
        .rejects.toThrow('MCP tool call failed');
    });

    it('should require connection for tool calls', async () => {
      await mcpClient.disconnect();

      await expect(mcpClient.callTool('get_file', { file_id: '123', token: 'test-token' }))
        .rejects.toThrow('MCP client is not connected');
    });
  });

  describe('Figma-specific Methods', () => {
    beforeEach(async () => {
      // Mock successful connection
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' })
      });
      await mcpClient.connect();
    });

    it('should call getFigmaFile correctly', async () => {
      const mockResponse = { name: 'Test File' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await mcpClient.getFigmaFile('test-file-id', 'test-token');
      expect(result.isError).toBe(false);
    });

    it('should call getFigmaStyles correctly', async () => {
      const mockResponse = { meta: { styles: [] } };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await mcpClient.getFigmaStyles('test-file-id', 'test-token');
      expect(result.isError).toBe(false);
    });
  });

  describe('List Tools', () => {
    beforeEach(async () => {
      // Mock successful connection
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' })
      });
      await mcpClient.connect();
    });

    it('should return available tools', async () => {
      const tools = await mcpClient.listTools();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toContain('get_file');
      expect(tools).toContain('get_styles');
    });
  });
});