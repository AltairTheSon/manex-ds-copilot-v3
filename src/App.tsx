import React, { useState } from 'react';
import InputForm from './components/InputForm';
import EnhancedInputForm from './components/EnhancedInputForm';
import PageGrid from './components/PageGrid';
import LayerView from './components/LayerView';
import FrameView from './components/FrameView';
import ComprehensiveDataView from './components/ComprehensiveDataView';
import { figmaApiService } from './services/figmaApi';
import { comprehensiveFigmaApiService } from './services/comprehensiveFigmaApi';
import { FigmaFile, PageWithThumbnail, LayerWithThumbnail, FrameWithThumbnail, FigmaNode } from './types/figma';
import { ConnectionConfig, ComprehensiveFigmaData, ApiProgress } from './types/figmaExtended';
import './App.css';

interface AppState {
  phase: 'input' | 'loading' | 'preview' | 'layers' | 'frames' | 'comprehensive';
  connectionConfig: ConnectionConfig | null;
  fileId: string;
  file: FigmaFile | null;
  comprehensiveData: ComprehensiveFigmaData | null;
  pages: PageWithThumbnail[];
  currentPage: PageWithThumbnail | null;
  layers: LayerWithThumbnail[];
  frames: FrameWithThumbnail[];
  layersLoading: boolean;
  framesLoading: boolean;
  comprehensiveLoading: boolean;
  apiProgress: ApiProgress;
  error: string | null;
  useEnhanced: boolean;
}

function App() {
  const [state, setState] = useState<AppState>({
    phase: 'input',
    connectionConfig: null,
    fileId: '',
    file: null,
    comprehensiveData: null,
    pages: [],
    currentPage: null,
    layers: [],
    frames: [],
    layersLoading: false,
    framesLoading: false,
    comprehensiveLoading: false,
    apiProgress: {
      file: false,
      comments: false,
      versions: false,
      components: false,
      styles: false,
      user: false,
    },
    error: null,
    useEnhanced: true, // Default to enhanced mode
  });

  // Enhanced connection handler for comprehensive data retrieval
  const handleEnhancedConnect = async (config: ConnectionConfig, fileId: string) => {
    setState(prev => ({
      ...prev,
      phase: 'loading',
      connectionConfig: config,
      fileId,
      error: null,
      comprehensiveLoading: true,
      apiProgress: {
        file: false,
        comments: false,
        versions: false,
        components: false,
        styles: false,
        user: false,
      },
    }));

    try {
      // Set up the connection configuration
      await comprehensiveFigmaApiService.setConnectionConfig(config);

      // Fetch all comprehensive data with progress tracking
      const comprehensiveData = await comprehensiveFigmaApiService.getAllFigmaData(
        fileId,
        (progress: ApiProgress) => {
          setState(prev => ({
            ...prev,
            apiProgress: progress,
          }));
        }
      );

      setState(prev => ({
        ...prev,
        comprehensiveData,
        file: comprehensiveData.file.info,
        phase: 'comprehensive',
        comprehensiveLoading: false,
      }));

    } catch (error) {
      console.error('Error connecting to Figma (Enhanced):', error);
      setState(prev => ({
        ...prev,
        phase: 'input',
        comprehensiveLoading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }));
    }
  };

  // Legacy connection handler for backward compatibility
  const handleConnect = async (token: string, fileId: string) => {
    setState(prev => ({
      ...prev,
      phase: 'loading',
      connectionConfig: { method: 'token', token },
      fileId,
      error: null,
    }));

    try {
      // Set the token in the legacy API service
      figmaApiService.setToken(token);

      // Fetch file information
      const file = await figmaApiService.getFile(fileId);
      
      // Extract pages from the document
      const pages: PageWithThumbnail[] = file.document.children
        .filter(child => child.type === 'CANVAS')
        .map(page => ({
          ...page,
          loading: true,
        }));

      setState(prev => ({
        ...prev,
        file,
        pages,
        phase: 'preview',
      }));

      // Fetch thumbnails for all pages
      await fetchPageThumbnails(fileId, pages);

    } catch (error) {
      console.error('Error connecting to Figma:', error);
      setState(prev => ({
        ...prev,
        phase: 'input',
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }));
    }
  };

  const fetchPageThumbnails = async (fileId: string, pages: PageWithThumbnail[]) => {
    const pageIds = pages.map(page => page.id);
    
    try {
      const thumbnails = await figmaApiService.getPageThumbnails(fileId, pageIds);
      
      setState(prev => ({
        ...prev,
        pages: prev.pages.map(page => ({
          ...page,
          loading: false,
          thumbnailUrl: thumbnails[page.id] || undefined,
          error: thumbnails[page.id] ? undefined : 'Thumbnail not available',
        })),
      }));
    } catch (error) {
      console.error('Error fetching thumbnails:', error);
      
      // Update all pages to show error state
      setState(prev => ({
        ...prev,
        pages: prev.pages.map(page => ({
          ...page,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load thumbnail',
        })),
      }));
    }
  };

  const handleBack = () => {
    setState(prev => ({
      ...prev,
      phase: 'input',
      file: null,
      comprehensiveData: null,
      pages: [],
      currentPage: null,
      layers: [],
      frames: [],
      error: null,
      comprehensiveLoading: false,
      apiProgress: {
        file: false,
        comments: false,
        versions: false,
        components: false,
        styles: false,
        user: false,
      },
    }));
  };

  const toggleMode = () => {
    setState(prev => ({
      ...prev,
      useEnhanced: !prev.useEnhanced,
      phase: 'input',
      file: null,
      comprehensiveData: null,
      pages: [],
      error: null,
    }));
  };

  const handleViewLayers = async (page: PageWithThumbnail) => {
    setState(prev => ({
      ...prev,
      phase: 'layers',
      currentPage: page,
      layers: [],
      layersLoading: true,
      error: null,
    }));

    try {
      // Fetch detailed page information
      const nodesResponse = await figmaApiService.getPageNodes(state.fileId, [page.id]);
      
      if (!nodesResponse.nodes[page.id]) {
        throw new Error('Page data not found');
      }

      const pageNode = nodesResponse.nodes[page.id].document;
      
      // Extract all child layers, flattening the structure for easier display
      const extractLayers = (node: FigmaNode, depth = 0): FigmaNode[] => {
        const layers: FigmaNode[] = [];
        
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            layers.push(child);
            // Also include children of children (but limit depth to avoid too much nesting)
            if (depth < 2) {
              layers.push(...extractLayers(child, depth + 1));
            }
          }
        }
        
        return layers;
      };

      const allLayers = extractLayers(pageNode);
      
      // Filter out layers that are too small or not visible
      const visibleLayers = allLayers.filter(layer => {
        const box = layer.absoluteBoundingBox;
        return !box || (box.width > 5 && box.height > 5);
      });

      // Convert to LayerWithThumbnail format
      const layersWithThumbnails: LayerWithThumbnail[] = visibleLayers.map(layer => ({
        ...layer,
        loading: true,
      }));

      setState(prev => ({
        ...prev,
        layers: layersWithThumbnails,
        layersLoading: false,
      }));

      // Fetch thumbnails for layers (limit to first 20 for performance)
      const layersToFetch = layersWithThumbnails.slice(0, 20);
      if (layersToFetch.length > 0) {
        await fetchLayerThumbnails(state.fileId, layersToFetch);
      }

    } catch (error) {
      console.error('Error fetching page layers:', error);
      setState(prev => ({
        ...prev,
        layersLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load page layers',
      }));
    }
  };

  const handleViewFrames = async (page: PageWithThumbnail) => {
    setState(prev => ({
      ...prev,
      phase: 'frames',
      currentPage: page,
      frames: [],
      framesLoading: true,
      error: null,
    }));

    try {
      // Fetch detailed page information
      const nodesResponse = await figmaApiService.getPageNodes(state.fileId, [page.id]);
      
      if (!nodesResponse.nodes[page.id]) {
        throw new Error('Page data not found');
      }

      const pageNode = nodesResponse.nodes[page.id].document;
      
      // Extract frames from the page node
      const extractFrames = (node: FigmaNode): FigmaNode[] => {
        const frames: FigmaNode[] = [];
        
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            // Only include nodes that are frames
            if (child.type === 'FRAME') {
              frames.push(child);
            }
            // Also check children for nested frames
            frames.push(...extractFrames(child));
          }
        }
        
        return frames;
      };

      const allFrames = extractFrames(pageNode);
      
      // Filter out frames that are too small
      const visibleFrames = allFrames.filter(frame => {
        const box = frame.absoluteBoundingBox;
        return !box || (box.width > 10 && box.height > 10);
      });

      // Convert to FrameWithThumbnail format
      const framesWithThumbnails: FrameWithThumbnail[] = visibleFrames.map(frame => ({
        ...frame,
        loading: true,
      }));

      setState(prev => ({
        ...prev,
        frames: framesWithThumbnails,
        framesLoading: false,
      }));

      // Fetch thumbnails for frames (limit to first 20 for performance)
      const framesToFetch = framesWithThumbnails.slice(0, 20);
      if (framesToFetch.length > 0) {
        await fetchFrameThumbnails(state.fileId, framesToFetch);
      }

    } catch (error) {
      console.error('Error fetching page frames:', error);
      setState(prev => ({
        ...prev,
        framesLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load page frames',
      }));
    }
  };

  const fetchLayerThumbnails = async (fileId: string, layers: LayerWithThumbnail[]) => {
    const layerIds = layers.map(layer => layer.id);
    
    console.log(`Attempting to fetch thumbnails for ${layerIds.length} layers`);
    
    try {
      const result = await figmaApiService.getLayerThumbnails(fileId, layerIds);
      
      // Count successful and failed thumbnails
      const successfulIds = Object.keys(result.images);
      const failedIds = Object.keys(result.errors);
      const retriedIds = result.retried;
      
      console.log(`Thumbnail fetch results: ${successfulIds.length} successful, ${failedIds.length} failed, ${retriedIds.length} retried`);
      
      if (failedIds.length > 0) {
        console.warn('Failed layer thumbnail details:', result.errors);
      }
      
      setState(prev => ({
        ...prev,
        layers: prev.layers.map(layer => ({
          ...layer,
          loading: false,
          thumbnailUrl: result.images[layer.id] || undefined,
          error: result.errors[layer.id] || (result.images[layer.id] ? undefined : 'Thumbnail not available'),
        })),
      }));
    } catch (error) {
      console.error('Error fetching layer thumbnails:', error);
      
      // Update all layers to show error state
      setState(prev => ({
        ...prev,
        layers: prev.layers.map(layer => ({
          ...layer,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load thumbnail',
        })),
      }));
    }
  };

  const fetchFrameThumbnails = async (fileId: string, frames: FrameWithThumbnail[]) => {
    const frameIds = frames.map(frame => frame.id);
    
    console.log(`Attempting to fetch thumbnails for ${frameIds.length} frames`);
    
    try {
      const result = await figmaApiService.getFrameThumbnails(fileId, frameIds);
      
      // Count successful and failed thumbnails
      const successfulIds = Object.keys(result.images);
      const failedIds = Object.keys(result.errors);
      const retriedIds = result.retried;
      
      console.log(`Thumbnail fetch results: ${successfulIds.length} successful, ${failedIds.length} failed, ${retriedIds.length} retried`);
      
      if (failedIds.length > 0) {
        console.warn('Failed frame thumbnail details:', result.errors);
      }
      
      setState(prev => ({
        ...prev,
        frames: prev.frames.map(frame => ({
          ...frame,
          loading: false,
          thumbnailUrl: result.images[frame.id] || undefined,
          error: result.errors[frame.id] || (result.images[frame.id] ? undefined : 'Thumbnail not available'),
        })),
      }));
    } catch (error) {
      console.error('Error fetching frame thumbnails:', error);
      
      // Update all frames to show error state
      setState(prev => ({
        ...prev,
        frames: prev.frames.map(frame => ({
          ...frame,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load thumbnail',
        })),
      }));
    }
  };

  const handleBackToPages = () => {
    setState(prev => ({
      ...prev,
      phase: 'preview',
      currentPage: null,
      layers: [],
      frames: [],
      layersLoading: false,
      framesLoading: false,
      error: null,
    }));
  };

  return (
    <div className="App">
      {state.phase === 'input' && (
        <>
          <div className="mode-toggle">
            <button 
              onClick={toggleMode} 
              className="toggle-button"
            >
              Switch to {state.useEnhanced ? 'Basic' : 'Enhanced'} Mode
            </button>
          </div>
          
          {state.useEnhanced ? (
            <EnhancedInputForm
              onConnect={handleEnhancedConnect}
              loading={state.comprehensiveLoading}
              error={state.error}
            />
          ) : (
            <InputForm
              onConnect={handleConnect}
              loading={false}
              error={state.error}
            />
          )}
        </>
      )}
      
      {state.phase === 'loading' && (
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner large"></div>
            <h2>
              {state.useEnhanced 
                ? `Connecting via ${state.connectionConfig?.method === 'mcp' ? 'MCP Server' : 'Direct API'}...`
                : 'Connecting to Figma...'
              }
            </h2>
            <p>
              {state.useEnhanced 
                ? 'Fetching comprehensive file data including components, styles, comments, and versions'
                : 'Fetching file information and pages'
              }
            </p>
            
            {state.useEnhanced && state.comprehensiveLoading && (
              <div className="progress-info">
                <div className="progress-items">
                  {Object.entries(state.apiProgress).map(([key, completed]) => (
                    <div key={key} className={`progress-item ${completed ? 'completed' : ''}`}>
                      {completed ? '✓' : '○'} {key}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {state.phase === 'comprehensive' && state.comprehensiveData && state.file && (
        <ComprehensiveDataView
          data={state.comprehensiveData}
          fileName={state.file.name}
          connectionMethod={state.connectionConfig?.method || 'token'}
          onBack={handleBack}
          loading={state.comprehensiveLoading}
          progress={state.apiProgress}
          error={state.error}
        />
      )}
      
      {state.phase === 'preview' && state.file && (
        <PageGrid
          pages={state.pages}
          fileName={state.file.name}
          onBack={handleBack}
          onViewLayers={handleViewLayers}
          onViewFrames={handleViewFrames}
        />
      )}

      {state.phase === 'layers' && state.file && state.currentPage && (
        <LayerView
          layers={state.layers}
          pageName={state.currentPage.name}
          fileName={state.file.name}
          onBack={handleBackToPages}
          loading={state.layersLoading}
          error={state.error}
        />
      )}

      {state.phase === 'frames' && state.file && state.currentPage && (
        <FrameView
          frames={state.frames}
          pageName={state.currentPage.name}
          fileName={state.file.name}
          onBack={handleBackToPages}
          loading={state.framesLoading}
          error={state.error}
        />
      )}
    </div>
  );
}

export default App;
