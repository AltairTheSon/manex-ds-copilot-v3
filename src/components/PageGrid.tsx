import React from 'react';
import { PageWithThumbnail } from '../types/figma';
import './PageGrid.css';

interface PageGridProps {
  pages: PageWithThumbnail[];
  fileName: string;
  onBack: () => void;
}

const PageGrid: React.FC<PageGridProps> = ({ pages, fileName, onBack }) => {
  const formatBackgroundColor = (backgroundColor?: { r: number; g: number; b: number; a: number }) => {
    if (!backgroundColor) return '#ffffff';
    const { r, g, b, a } = backgroundColor;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
  };

  const handleImageError = (pageId: string) => {
    console.warn(`Failed to load thumbnail for page: ${pageId}`);
  };

  return (
    <div className="page-grid-container">
      <div className="page-grid-header">
        <button onClick={onBack} className="back-button">
          ← Back to Form
        </button>
        <div className="file-info">
          <h1>Pages in "{fileName}"</h1>
          <p>{pages.length} page{pages.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="page-grid">
        {pages.map((page) => (
          <div key={page.id} className="page-card">
            <div className="page-thumbnail-container">
              {page.loading ? (
                <div className="page-loading">
                  <div className="loading-spinner"></div>
                  <span>Loading thumbnail...</span>
                </div>
              ) : page.error ? (
                <div className="page-error">
                  <div className="error-icon">⚠️</div>
                  <span>Failed to load thumbnail</span>
                  <small>{page.error}</small>
                </div>
              ) : page.thumbnailUrl ? (
                <img
                  src={page.thumbnailUrl}
                  alt={`Thumbnail for ${page.name}`}
                  className="page-thumbnail"
                  onError={() => handleImageError(page.id)}
                  loading="lazy"
                />
              ) : (
                <div 
                  className="page-placeholder"
                  style={{ backgroundColor: formatBackgroundColor(page.backgroundColor) }}
                >
                  <div className="placeholder-icon">📄</div>
                  <span>No thumbnail available</span>
                </div>
              )}
            </div>
            
            <div className="page-info">
              <h3 className="page-name" title={page.name}>
                {page.name}
              </h3>
              <div className="page-meta">
                <span className="page-type">{page.type}</span>
                {page.children && (
                  <span className="page-children">
                    {page.children.length} element{page.children.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pages.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No pages found</h3>
          <p>This Figma file doesn't seem to have any pages, or there was an issue loading them.</p>
        </div>
      )}
    </div>
  );
};

export default PageGrid;