import React, { useState } from 'react';
import InputForm from './components/InputForm';
import PageGrid from './components/PageGrid';
import LayerView from './components/LayerView';
import FrameView from './components/FrameView';
import { figmaApiService } from './services/figmaApi';
import { FigmaFile, PageWithThumbnail, LayerWithThumbnail, FrameWithThumbnail, FigmaNode } from './types/figma';
import './App.css';

interface AppState {
  phase: 'input' | 'loading' | 'preview' | 'layers' | 'frames';
  token: string;
  fileId: string;
  file: FigmaFile | null;
  pages: PageWithThumbnail[];
  currentPage: PageWithThumbnail | null;
  layers: LayerWithThumbnail[];
  frames: FrameWithThumbnail[];
  layersLoading: boolean;
  framesLoading: boolean;
  error: string | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    phase: 'input',
    token: '',
    fileId: '',
    file: null,
    pages: [],
    currentPage: null,
    layers: [],
    frames: [],
    layersLoading: false,
    framesLoading: false,
    error: null,
  });

  const handleConnect = async (token: string, fileId: string) => {
    setState(prev => ({
      ...prev,
      phase: 'loading',
      token,
      fileId,
      error: null,
    }));

    try {
      // Set the token in the API service
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
      pages: [],
      currentPage: null,
      layers: [],
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
      const thumbnails = await figmaApiService.getLayerThumbnails(fileId, layerIds);
      
      // Count successful and failed thumbnails
      const successfulIds = Object.keys(thumbnails);
      const failedIds = layerIds.filter(id => !thumbnails[id]);
      
      console.log(`Thumbnail fetch results: ${successfulIds.length} successful, ${failedIds.length} failed`);
      
      setState(prev => ({
        ...prev,
        layers: prev.layers.map(layer => ({
          ...layer,
          loading: false,
          thumbnailUrl: thumbnails[layer.id] || undefined,
          error: thumbnails[layer.id] ? undefined : 'Thumbnail not available',
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
      const thumbnails = await figmaApiService.getFrameThumbnails(fileId, frameIds);
      
      // Count successful and failed thumbnails
      const successfulIds = Object.keys(thumbnails);
      const failedIds = frameIds.filter(id => !thumbnails[id]);
      
      console.log(`Thumbnail fetch results: ${successfulIds.length} successful, ${failedIds.length} failed`);
      
      setState(prev => ({
        ...prev,
        frames: prev.frames.map(frame => ({
          ...frame,
          loading: false,
          thumbnailUrl: thumbnails[frame.id] || undefined,
          error: thumbnails[frame.id] ? undefined : 'Thumbnail not available',
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
        <InputForm
          onConnect={handleConnect}
          loading={false}
          error={state.error}
        />
      )}
      
      {state.phase === 'loading' && (
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner large"></div>
            <h2>Connecting to Figma...</h2>
            <p>Fetching file information and pages</p>
          </div>
        </div>
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
