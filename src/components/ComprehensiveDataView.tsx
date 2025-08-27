import React, { useState } from 'react';
import { ComprehensiveFigmaData, ApiProgress } from '../types/figmaExtended';
import './ComprehensiveDataView.css';

interface ComprehensiveDataViewProps {
  data: ComprehensiveFigmaData;
  fileName: string;
  connectionMethod: 'token' | 'mcp';
  onBack: () => void;
  loading: boolean;
  progress: ApiProgress;
  error: string | null;
}

const ComprehensiveDataView: React.FC<ComprehensiveDataViewProps> = ({
  data,
  fileName,
  connectionMethod,
  onBack,
  loading,
  progress,
  error
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const getProgressPercentage = () => {
    const completed = Object.values(progress).filter(Boolean).length;
    const total = Object.keys(progress).length;
    return Math.round((completed / total) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `figma-data-${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredComponents = data.file.components.filter(component =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStyles = data.file.styles.filter(style =>
    style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    style.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredComments = data.file.comments.filter(comment =>
    comment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.author.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="comprehensive-data-view">
      {/* Header */}
      <div className="data-header">
        <div className="header-content">
          <button onClick={onBack} className="back-button">
            ← Back to Input
          </button>
          <div className="header-info">
            <h1>{fileName}</h1>
            <p>Connected via {connectionMethod === 'mcp' ? 'MCP Server' : 'Direct API'}</p>
          </div>
          <button onClick={exportData} className="export-button" disabled={loading}>
            Export Data
          </button>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <div className="progress-details">
              <span>Loading comprehensive data... {getProgressPercentage()}%</span>
              <div className="progress-items">
                {Object.entries(progress).map(([key, completed]) => (
                  <span key={key} className={`progress-item ${completed ? 'completed' : ''}`}>
                    {completed ? '✓' : '○'} {key}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-section">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search components, styles, comments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        {[
          { id: 'overview', label: 'Overview', count: '' },
          { id: 'structure', label: 'File Structure', count: data.organized.fileStructure.pages.length },
          { id: 'components', label: 'Components', count: data.file.components.length },
          { id: 'styles', label: 'Styles', count: data.file.styles.length },
          { id: 'comments', label: 'Comments', count: data.file.comments.length },
          { id: 'versions', label: 'Versions', count: data.file.versions.length },
          { id: 'user', label: 'User Info', count: '' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeSection === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSection(tab.id)}
          >
            {tab.label}
            {tab.count ? <span className="count">({tab.count})</span> : ''}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="content-sections">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="section overview-section">
            <h2>File Overview</h2>
            <div className="overview-grid">
              <div className="overview-card">
                <h3>File Information</h3>
                <p><strong>Name:</strong> {data.file.info?.name || 'N/A'}</p>
                <p><strong>Last Modified:</strong> {data.file.info?.lastModified ? formatDate(data.file.info.lastModified) : 'N/A'}</p>
                <p><strong>Version:</strong> {data.file.info?.version || 'N/A'}</p>
                <p><strong>Editor Type:</strong> {data.file.info?.editorType || 'N/A'}</p>
              </div>

              <div className="overview-card">
                <h3>Content Statistics</h3>
                <p><strong>Pages:</strong> {data.organized.fileStructure.pages.length}</p>
                <p><strong>Components:</strong> {data.file.components.length}</p>
                <p><strong>Styles:</strong> {data.file.styles.length}</p>
                <p><strong>Comments:</strong> {data.file.comments.length}</p>
                <p><strong>Versions:</strong> {data.file.versions.length}</p>
              </div>

              <div className="overview-card">
                <h3>User Information</h3>
                {data.user ? (
                  <>
                    <p><strong>Handle:</strong> {data.user.handle}</p>
                    <p><strong>Email:</strong> {data.user.email}</p>
                    <p><strong>ID:</strong> {data.user.id}</p>
                  </>
                ) : (
                  <p>User information not available</p>
                )}
              </div>

              <div className="overview-card">
                <h3>Data Breakdown</h3>
                <p><strong>Fill Styles:</strong> {data.organized.styles.fill.length}</p>
                <p><strong>Text Styles:</strong> {data.organized.styles.text.length}</p>
                <p><strong>Effect Styles:</strong> {data.organized.styles.effect.length}</p>
                <p><strong>Grid Styles:</strong> {data.organized.styles.grid.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* File Structure Section */}
        {activeSection === 'structure' && (
          <div className="section structure-section">
            <h2>File Structure</h2>
            <div className="structure-content">
              <h3>Pages ({data.organized.fileStructure.pages.length})</h3>
              {data.organized.fileStructure.pages.map((page, index) => (
                <div key={page.id || index} className="structure-item">
                  <h4>{page.name}</h4>
                  <p>Type: {page.type}</p>
                  <p>ID: {page.id}</p>
                  {page.children && <p>Children: {page.children.length}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Components Section */}
        {activeSection === 'components' && (
          <div className="section components-section">
            <h2>Components ({filteredComponents.length})</h2>
            <div className="components-grid">
              {filteredComponents.map(component => (
                <div key={component.key} className="component-card">
                  {component.thumbnail_url && (
                    <img src={component.thumbnail_url} alt={component.name} className="component-thumbnail" />
                  )}
                  <div className="component-info">
                    <h3>{component.name}</h3>
                    <p className="component-description">{component.description}</p>
                    <div className="component-meta">
                      <span>Created: {formatDate(component.created_at)}</span>
                      <span>Updated: {formatDate(component.updated_at)}</span>
                      <span>By: {component.user.handle}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Styles Section */}
        {activeSection === 'styles' && (
          <div className="section styles-section">
            <h2>Styles ({filteredStyles.length})</h2>
            <div className="styles-grid">
              {Object.entries(data.organized.styles).map(([type, styles]) => (
                <div key={type} className="style-category">
                  <h3>{type.charAt(0).toUpperCase() + type.slice(1)} Styles ({styles.length})</h3>
                  {styles.filter(style => 
                    style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    style.description.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(style => (
                    <div key={style.key} className="style-card">
                      {style.thumbnail_url && (
                        <img src={style.thumbnail_url} alt={style.name} className="style-thumbnail" />
                      )}
                      <div className="style-info">
                        <h4>{style.name}</h4>
                        <p>{style.description}</p>
                        <span className="style-type">{style.style_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        {activeSection === 'comments' && (
          <div className="section comments-section">
            <h2>Comments ({filteredComments.length})</h2>
            <div className="comments-filters">
              <button 
                className={`filter-btn ${activeSection === 'comments' ? 'active' : ''}`}
                onClick={() => {/* Add filter logic */}}
              >
                All ({data.file.comments.length})
              </button>
              <button className="filter-btn">
                Resolved ({data.organized.comments.resolved.length})
              </button>
              <button className="filter-btn">
                Unresolved ({data.organized.comments.unresolved.length})
              </button>
            </div>
            <div className="comments-list">
              {filteredComments.map(comment => (
                <div key={comment.id} className="comment-card">
                  <div className="comment-header">
                    <img src={comment.author.img_url} alt={comment.author.handle} className="author-avatar" />
                    <div className="comment-info">
                      <span className="author-name">{comment.author.handle}</span>
                      <span className="comment-date">{formatDate(comment.created_at)}</span>
                      {comment.resolved_at && (
                        <span className="resolved-badge">Resolved</span>
                      )}
                    </div>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Versions Section */}
        {activeSection === 'versions' && (
          <div className="section versions-section">
            <h2>Versions ({data.file.versions.length})</h2>
            <div className="versions-list">
              {data.organized.versions.chronological.map(version => (
                <div key={version.id} className="version-card">
                  {version.thumbnail_url && (
                    <img src={version.thumbnail_url} alt={`Version ${version.label}`} className="version-thumbnail" />
                  )}
                  <div className="version-info">
                    <h3>{version.label}</h3>
                    <p>{version.description}</p>
                    <div className="version-meta">
                      <span>Created: {formatDate(version.created_at)}</span>
                      <span>By: {version.user.handle}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Info Section */}
        {activeSection === 'user' && (
          <div className="section user-section">
            <h2>User Information</h2>
            {data.user ? (
              <div className="user-card">
                <img src={data.user.img_url} alt={data.user.handle} className="user-avatar" />
                <div className="user-info">
                  <h3>{data.user.handle}</h3>
                  <p>Email: {data.user.email}</p>
                  <p>User ID: {data.user.id}</p>
                </div>
              </div>
            ) : (
              <p>User information is not available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveDataView;