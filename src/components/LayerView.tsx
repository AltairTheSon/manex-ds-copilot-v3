import React from 'react';
import { LayerWithThumbnail } from '../types/figma';
import './LayerView.css';

interface LayerViewProps {
  layers: LayerWithThumbnail[];
  pageName: string;
  fileName: string;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

const LayerView: React.FC<LayerViewProps> = ({ 
  layers, 
  pageName, 
  fileName, 
  onBack, 
  loading, 
  error 
}) => {
  const formatLayerType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDimensions = (box?: { x: number; y: number; width: number; height: number }) => {
    if (!box) return null;
    return `${Math.round(box.width)} × ${Math.round(box.height)}`;
  };

  const handleImageError = (layerId: string) => {
    console.warn(`Failed to load thumbnail for layer: ${layerId}`);
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'TEXT': return '📝';
      case 'RECTANGLE': return '⬛';
      case 'ELLIPSE': return '⭕';
      case 'FRAME': return '🖼️';
      case 'GROUP': return '📦';
      case 'COMPONENT': return '🧩';
      case 'INSTANCE': return '📋';
      case 'VECTOR': return '✏️';
      case 'LINE': return '📏';
      case 'STAR': return '⭐';
      case 'POLYGON': return '🔶';
      default: return '🎨';
    }
  };

  if (loading) {
    return (
      <div className="layer-view-container">
        <div className="layer-view-header">
          <button onClick={onBack} className="back-button">
            ← Back to Pages
          </button>
          <div className="page-info">
            <h1>Loading layers in "{pageName}"</h1>
            <p>From "{fileName}"</p>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner large"></div>
            <h2>Fetching page layers...</h2>
            <p>Getting detailed layer information</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="layer-view-container">
        <div className="layer-view-header">
          <button onClick={onBack} className="back-button">
            ← Back to Pages
          </button>
          <div className="page-info">
            <h1>Error loading layers</h1>
            <p>From "{fileName}"</p>
          </div>
        </div>
        <div className="error-container">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>Failed to load layers</h2>
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
    <div className="layer-view-container">
      <div className="layer-view-header">
        <button onClick={onBack} className="back-button">
          ← Back to Pages
        </button>
        <div className="page-info">
          <h1>Layers in "{pageName}"</h1>
          <p>From "{fileName}" • {layers.length} layer{layers.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="layer-grid">
        {layers.map((layer) => (
          <div key={layer.id} className="layer-card">
            <div className="layer-thumbnail-container">
              {layer.loading ? (
                <div className="layer-loading">
                  <div className="loading-spinner"></div>
                  <span>Loading...</span>
                </div>
              ) : layer.error ? (
                <div className="layer-error">
                  <div className="error-icon">⚠️</div>
                  <span>Failed to load</span>
                </div>
              ) : layer.thumbnailUrl ? (
                <img
                  src={layer.thumbnailUrl}
                  alt={`Thumbnail for ${layer.name}`}
                  className="layer-thumbnail"
                  onError={() => handleImageError(layer.id)}
                  loading="lazy"
                />
              ) : (
                <div className="layer-placeholder">
                  <div className="placeholder-icon">{getLayerIcon(layer.type)}</div>
                  <span>No preview</span>
                </div>
              )}
            </div>
            
            <div className="layer-info">
              <h3 className="layer-name" title={layer.name}>
                {layer.name}
              </h3>
              <div className="layer-meta">
                <span className="layer-type">
                  {getLayerIcon(layer.type)} {formatLayerType(layer.type)}
                </span>
                {formatDimensions(layer.absoluteBoundingBox) && (
                  <span className="layer-dimensions">
                    {formatDimensions(layer.absoluteBoundingBox)}
                  </span>
                )}
                {layer.visible === false && (
                  <span className="layer-hidden">🙈 Hidden</span>
                )}
                {layer.locked && (
                  <span className="layer-locked">🔒 Locked</span>
                )}
              </div>
              {layer.children && layer.children.length > 0 && (
                <div className="layer-children">
                  {layer.children.length} child element{layer.children.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {layers.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎨</div>
          <h3>No layers found</h3>
          <p>This page doesn't seem to have any layers, or there was an issue loading them.</p>
        </div>
      )}
    </div>
  );
};

export default LayerView;