import React from 'react';
import { render, screen } from '@testing-library/react';
import { LayerWithThumbnail } from '../types/figma';
import LayerView from './LayerView';

const mockLayers: LayerWithThumbnail[] = [
  {
    id: 'layer1',
    name: 'Test Layer 1',
    type: 'RECTANGLE',
    visible: true,
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 100,
      height: 50
    }
  },
  {
    id: 'layer2',
    name: 'Test Layer 2',
    type: 'TEXT',
    visible: true,
    absoluteBoundingBox: {
      x: 10,
      y: 10,
      width: 200,
      height: 30
    }
  }
];

const mockProps = {
  layers: mockLayers,
  pageName: 'Test Page',
  fileName: 'Test File',
  onBack: jest.fn(),
  loading: false,
  error: null
};

test('renders layer view with layers', () => {
  render(<LayerView {...mockProps} />);
  
  const pageTitle = screen.getByText(/Layers in "Test Page"/i);
  const backButton = screen.getByText(/Back to Pages/i);
  
  expect(pageTitle).toBeInTheDocument();
  expect(backButton).toBeInTheDocument();
});

test('renders loading state', () => {
  const loadingProps = { ...mockProps, loading: true };
  render(<LayerView {...loadingProps} />);
  
  const loadingText = screen.getByText(/Fetching page layers/i);
  expect(loadingText).toBeInTheDocument();
});

test('renders error state', () => {
  const errorProps = { ...mockProps, error: 'Test error message' };
  render(<LayerView {...errorProps} />);
  
  const errorText = screen.getByText(/Failed to load layers/i);
  const errorMessage = screen.getByText(/Test error message/i);
  
  expect(errorText).toBeInTheDocument();
  expect(errorMessage).toBeInTheDocument();
});

test('renders layer cards when layers are provided', () => {
  render(<LayerView {...mockProps} />);
  
  const layer1 = screen.getByText('Test Layer 1');
  const layer2 = screen.getByText('Test Layer 2');
  
  expect(layer1).toBeInTheDocument();
  expect(layer2).toBeInTheDocument();
});

test('shows improved error state for failed thumbnails', () => {
  const layersWithError: LayerWithThumbnail[] = [
    {
      id: 'layer1',
      name: 'Failed Layer',
      type: 'RECTANGLE',
      visible: true,
      error: 'Network connection failed',
      absoluteBoundingBox: {
        x: 0,
        y: 0,
        width: 100,
        height: 50
      }
    }
  ];
  
  const errorProps = { ...mockProps, layers: layersWithError };
  render(<LayerView {...errorProps} />);
  
  const errorText = screen.getByText(/Preview unavailable/i);
  const errorDetail = screen.getByText(/Network connection failed/i);
  
  expect(errorText).toBeInTheDocument();
  expect(errorDetail).toBeInTheDocument();
});

test('renders filter tabs when multiple layer types are present', () => {
  render(<LayerView {...mockProps} />);
  
  const allTab = screen.getByText(/All \(2\)/i);
  const rectangleTab = screen.getByText(/Rectangle \(1\)/i);
  const textTab = screen.getByText(/Text \(1\)/i);
  
  expect(allTab).toBeInTheDocument();
  expect(rectangleTab).toBeInTheDocument();
  expect(textTab).toBeInTheDocument();
});