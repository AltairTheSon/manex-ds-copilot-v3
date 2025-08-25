import React, { useState } from 'react';
import InputForm from './components/InputForm';
import PageGrid from './components/PageGrid';
import { figmaApiService } from './services/figmaApi';
import { FigmaFile, PageWithThumbnail } from './types/figma';
import './App.css';

interface AppState {
  phase: 'input' | 'loading' | 'preview';
  token: string;
  fileId: string;
  file: FigmaFile | null;
  pages: PageWithThumbnail[];
  error: string | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    phase: 'input',
    token: '',
    fileId: '',
    file: null,
    pages: [],
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
        />
      )}
    </div>
  );
}

export default App;
