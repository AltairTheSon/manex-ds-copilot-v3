import React, { useState } from 'react';
import { ConnectionMethod, ConnectionConfig } from '../types/figmaExtended';
import './EnhancedInputForm.css';

interface EnhancedInputFormProps {
  onConnect: (config: ConnectionConfig, fileId: string) => void;
  loading: boolean;
  error: string | null;
}

const EnhancedInputForm: React.FC<EnhancedInputFormProps> = ({ onConnect, loading, error }) => {
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>('token');
  const [token, setToken] = useState('');
  const [fileId, setFileId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [mcpServerUrl, setMcpServerUrl] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    token?: string;
    fileId?: string;
    mcpServer?: string;
  }>({});

  const validateInputs = () => {
    const errors: { token?: string; fileId?: string; mcpServer?: string } = {};

    if (!fileId.trim()) {
      errors.fileId = 'File ID is required';
    } else if (!validateFileId(fileId.trim())) {
      errors.fileId = 'Invalid file ID format. Please check your Figma file ID.';
    }

    if (connectionMethod === 'token') {
      if (!token.trim()) {
        errors.token = 'Access token is required';
      } else if (!validateToken(token.trim())) {
        errors.token = 'Invalid token format. Please check your Figma access token.';
      }
    } else if (connectionMethod === 'mcp') {
      // MCP validation - for now we'll use a built-in server, but allow custom URL
      if (mcpServerUrl && !isValidUrl(mcpServerUrl)) {
        errors.mcpServer = 'Invalid server URL format';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateToken = (token: string): boolean => {
    const tokenRegex = /^figd_[a-zA-Z0-9_-]{71}$/;
    return tokenRegex.test(token) || token.length >= 20;
  };

  const validateFileId = (fileId: string): boolean => {
    const fileIdRegex = /^[a-zA-Z0-9]+$/;
    return fileIdRegex.test(fileId) && fileId.length > 10;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateInputs()) {
      const config: ConnectionConfig = {
        method: connectionMethod,
        ...(connectionMethod === 'token' && { token: token.trim() }),
        ...(connectionMethod === 'mcp' && {
          mcpConfig: {
            serverUrl: mcpServerUrl || undefined,
            timeout: 30000
          }
        })
      };

      onConnect(config, fileId.trim());
    }
  };

  const extractFileIdFromUrl = (input: string): string => {
    const urlMatch = input.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return urlMatch ? urlMatch[1] : input;
  };

  const handleFileIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const extractedId = extractFileIdFromUrl(input);
    setFileId(extractedId);
    
    if (validationErrors.fileId) {
      setValidationErrors(prev => ({ ...prev, fileId: undefined }));
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
    
    if (validationErrors.token) {
      setValidationErrors(prev => ({ ...prev, token: undefined }));
    }
  };

  const handleMcpServerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMcpServerUrl(e.target.value);
    
    if (validationErrors.mcpServer) {
      setValidationErrors(prev => ({ ...prev, mcpServer: undefined }));
    }
  };

  const handleConnectionMethodChange = (method: ConnectionMethod) => {
    setConnectionMethod(method);
    // Clear relevant validation errors when switching methods
    setValidationErrors(prev => ({
      ...prev,
      token: undefined,
      mcpServer: undefined
    }));
  };

  return (
    <div className="enhanced-input-form">
      <div className="form-header">
        <h1>Comprehensive Figma Data Retrieval</h1>
        <p>Connect to Figma and retrieve complete file data including components, styles, comments, and versions.</p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        {/* Connection Method Selector */}
        <div className="form-group">
          <label className="form-label">Connection Method *</label>
          <div className="connection-method-selector">
            <div 
              className={`method-option ${connectionMethod === 'token' ? 'active' : ''}`}
              onClick={() => handleConnectionMethodChange('token')}
            >
              <div className="method-radio">
                <input
                  type="radio"
                  name="connectionMethod"
                  value="token"
                  checked={connectionMethod === 'token'}
                  onChange={() => handleConnectionMethodChange('token')}
                />
                <span className="radio-checkmark"></span>
              </div>
              <div className="method-content">
                <h3>Direct API Access</h3>
                <p>Use your Figma access token for direct API calls</p>
              </div>
            </div>
            
            <div 
              className={`method-option ${connectionMethod === 'mcp' ? 'active' : ''}`}
              onClick={() => handleConnectionMethodChange('mcp')}
            >
              <div className="method-radio">
                <input
                  type="radio"
                  name="connectionMethod"
                  value="mcp"
                  checked={connectionMethod === 'mcp'}
                  onChange={() => handleConnectionMethodChange('mcp')}
                />
                <span className="radio-checkmark"></span>
              </div>
              <div className="method-content">
                <h3>MCP Server</h3>
                <p>Connect via Model Context Protocol server</p>
              </div>
            </div>
          </div>
        </div>

        {/* Token Input (only shown for token method) */}
        {connectionMethod === 'token' && (
          <div className="form-group">
            <label htmlFor="token" className="form-label">
              Figma Access Token *
            </label>
            <div className="password-input-container">
              <input
                id="token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={handleTokenChange}
                placeholder="Enter your Figma access token"
                className={`form-input ${validationErrors.token ? 'error' : ''}`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="password-toggle"
                disabled={loading}
                aria-label={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            {validationErrors.token && (
              <span className="error-message">{validationErrors.token}</span>
            )}
            <small className="form-help">
              Get your token from{' '}
              <a 
                href="https://www.figma.com/developers/api#access-tokens" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Figma Developer Settings
              </a>
            </small>
          </div>
        )}

        {/* MCP Server Configuration (only shown for MCP method) */}
        {connectionMethod === 'mcp' && (
          <div className="form-group">
            <label htmlFor="mcpServer" className="form-label">
              MCP Server URL (Optional)
            </label>
            <input
              id="mcpServer"
              type="text"
              value={mcpServerUrl}
              onChange={handleMcpServerUrlChange}
              placeholder="Leave empty to use built-in server"
              className={`form-input ${validationErrors.mcpServer ? 'error' : ''}`}
              disabled={loading}
            />
            {validationErrors.mcpServer && (
              <span className="error-message">{validationErrors.mcpServer}</span>
            )}
            <small className="form-help">
              Leave empty to use the built-in figma-mcp server, or specify a custom MCP server URL
            </small>
          </div>
        )}

        {/* File ID Input */}
        <div className="form-group">
          <label htmlFor="fileId" className="form-label">
            Figma File ID *
          </label>
          <input
            id="fileId"
            type="text"
            value={fileId}
            onChange={handleFileIdChange}
            placeholder="Enter file ID or paste Figma file URL"
            className={`form-input ${validationErrors.fileId ? 'error' : ''}`}
            disabled={loading}
          />
          {validationErrors.fileId && (
            <span className="error-message">{validationErrors.fileId}</span>
          )}
          <small className="form-help">
            You can paste the full Figma file URL or just the file ID
          </small>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          className="connect-button"
          disabled={loading || !fileId.trim() || (connectionMethod === 'token' && !token.trim())}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              {connectionMethod === 'mcp' ? 'Connecting to MCP Server...' : 'Connecting...'}
            </>
          ) : (
            `Connect & Retrieve Data via ${connectionMethod === 'mcp' ? 'MCP' : 'API'}`
          )}
        </button>

        {/* Connection Method Info */}
        <div className="connection-info">
          <h4>About Connection Methods:</h4>
          <div className="info-grid">
            <div className="info-item">
              <strong>Direct API Access:</strong>
              <p>Uses your personal access token to make direct calls to the Figma REST API. Requires a valid Figma access token.</p>
            </div>
            <div className="info-item">
              <strong>MCP Server:</strong>
              <p>Connects through a Model Context Protocol server that handles Figma API communication. More secure and allows for advanced features.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EnhancedInputForm;