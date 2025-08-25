import React from 'react';
import { FrameWithThumbnail } from '../types/figma';
import './FrameView.css';

interface FrameViewProps {
  frames: FrameWithThumbnail[];
  pageName: string;
  fileName: string;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

const FrameView: React.FC<FrameViewProps> = ({ 
  frames, 
  pageName, 
  fileName, 
  onBack, 
  loading, 
  error 
}) => {
  const formatDimensions = (box?: { x: number; y: number; width: number; height: number }) => {
    if (!box) return null;
    return `${Math.round(box.width)} × ${Math.round(box.height)}`;
  };

  const handleImageError = (frameId: string) => {
    console.warn(`Failed to load thumbnail for frame: ${frameId}`);
  };

  if (loading) {
    return (
      <div className="frame-view-container">
        <div className="frame-view-header">
          <button onClick={onBack} className="back-button">
            ← Back to Pages
          </button>
          <div className="page-info">
            <h1>Loading frames in "{pageName}"</h1>
            <p>From "{fileName}"</p>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner large"></div>
            <h2>Fetching page frames...</h2>
            <p>Getting detailed frame information</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="frame-view-container">
        <div className="frame-view-header">
          <button onClick={onBack} className="back-button">
            ← Back to Pages
          </button>
          <div className="page-info">
            <h1>Error loading frames</h1>
            <p>From "{fileName}"</p>
          </div>
        </div>
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>Failed to load frames</h2>
            <p>{error}</p>
            <button onClick={onBack} className="retry-button">
              Return to Pages
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="frame-view-container">
      <div className="frame-view-header">
        <button onClick={onBack} className="back-button">
          ← Back to Pages
        </button>
        <div className="page-info">
          <h1>Frames in "{pageName}"</h1>
          <p>From "{fileName}" • {frames.length} frame{frames.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="frame-grid">
        {frames.map((frame) => (
          <div key={frame.id} className="frame-card">
            <div className="frame-thumbnail-container">
              {frame.loading ? (
                <div className="frame-loading">
                  <div className="loading-spinner"></div>
                  <span>Loading...</span>
                </div>
              ) : frame.error ? (
                <div className="frame-error">
                  <div className="error-icon">⚠️</div>
                  <span>Failed to load</span>
                </div>
              ) : frame.thumbnailUrl ? (
                <img
                  src={frame.thumbnailUrl}
                  alt={`Thumbnail for ${frame.name}`}
                  className="frame-thumbnail"
                  onError={() => handleImageError(frame.id)}
                  loading="lazy"
                />
              ) : (
                <div className="frame-placeholder">
                  <div className="placeholder-icon">🖼️</div>
                  <span>No preview</span>
                </div>
              )}
            </div>
            
            <div className="frame-info">
              <h3 className="frame-name" title={frame.name}>
                {frame.name}
              </h3>
              <div className="frame-meta">
                <span className="frame-type">
                  🖼️ Frame
                </span>
                {formatDimensions(frame.absoluteBoundingBox) && (
                  <span className="frame-dimensions">
                    {formatDimensions(frame.absoluteBoundingBox)}
                  </span>
                )}
                {frame.visible === false && (
                  <span className="frame-hidden">🙈 Hidden</span>
                )}
                {frame.locked && (
                  <span className="frame-locked">🔒 Locked</span>
                )}
              </div>
              {frame.children && frame.children.length > 0 && (
                <div className="frame-children">
                  {frame.children.length} child element{frame.children.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {frames.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🖼️</div>
          <h3>No frames found</h3>
          <p>This page doesn't seem to have any frames, or there was an issue loading them.</p>
        </div>
      )}
    </div>
  );
};

export default FrameView;