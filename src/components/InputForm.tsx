import React, { useState } from 'react';
import { figmaApiService } from '../services/figmaApi';
import './InputForm.css';

interface InputFormProps {
  onConnect: (token: string, fileId: string) => void;
  loading: boolean;
  error: string | null;
}

const InputForm: React.FC<InputFormProps> = ({ onConnect, loading, error }) => {
  const [token, setToken] = useState('');
  const [fileId, setFileId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    token?: string;
    fileId?: string;
  }>({});

  const validateInputs = () => {
    const errors: { token?: string; fileId?: string } = {};

    if (!token.trim()) {
      errors.token = 'Access token is required';
    } else if (!figmaApiService.validateToken(token.trim())) {
      errors.token = 'Invalid token format. Please check your Figma access token.';
    }

    if (!fileId.trim()) {
      errors.fileId = 'File ID is required';
    } else if (!figmaApiService.validateFileId(fileId.trim())) {
      errors.fileId = 'Invalid file ID format. Please check your Figma file ID.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateInputs()) {
      onConnect(token.trim(), fileId.trim());
    }
  };

  const extractFileIdFromUrl = (input: string): string => {
    // Extract file ID from Figma URL if a full URL is provided
    const urlMatch = input.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return urlMatch ? urlMatch[1] : input;
  };

  const handleFileIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const extractedId = extractFileIdFromUrl(input);
    setFileId(extractedId);
    
    // Clear validation error when user starts typing
    if (validationErrors.fileId) {
      setValidationErrors(prev => ({ ...prev, fileId: undefined }));
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
    
    // Clear validation error when user starts typing
    if (validationErrors.token) {
      setValidationErrors(prev => ({ ...prev, token: undefined }));
    }
  };

  return (
    <div className="input-form">
      <div className="form-header">
        <h1>Figma Pages Preview</h1>
        <p>Enter your Figma access token and file ID to preview all pages from your Figma file.</p>
      </div>

      <form onSubmit={handleSubmit} className="form">
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

        {error && (
          <div className="error-alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <button 
          type="submit" 
          className="connect-button"
          disabled={loading || !token.trim() || !fileId.trim()}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Connecting...
            </>
          ) : (
            'Connect & Preview Pages'
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;