import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageWithThumbnail } from '../types/figma';
import PageGrid from './PageGrid';

const mockPages: PageWithThumbnail[] = [
  {
    id: 'page1',
    name: 'Test Page 1',
    type: 'CANVAS',
    children: [],
    thumbnailUrl: 'https://example.com/thumb1.png'
  },
  {
    id: 'page2',
    name: 'Test Page 2',
    type: 'CANVAS',
    children: [],
    loading: true
  }
];

const mockProps = {
  pages: mockPages,
  fileName: 'Test File',
  onBack: jest.fn(),
  onViewLayers: jest.fn(),
  onViewFrames: jest.fn()
};

test('renders page grid with pages', () => {
  render(<PageGrid {...mockProps} />);
  
  const fileTitle = screen.getByText(/Pages in "Test File"/i);
  const backButton = screen.getByText(/Back to Form/i);
  const page1 = screen.getByText('Test Page 1');
  const page2 = screen.getByText('Test Page 2');
  
  expect(fileTitle).toBeInTheDocument();
  expect(backButton).toBeInTheDocument();
  expect(page1).toBeInTheDocument();
  expect(page2).toBeInTheDocument();
});

test('shows action buttons on hover and calls handlers', () => {
  render(<PageGrid {...mockProps} />);
  
  const pageCard = screen.getByText('Test Page 1').closest('.page-card');
  expect(pageCard).toBeInTheDocument();
  
  if (pageCard) {
    // Check that overlay exists (even if not visible initially)
    const overlay = pageCard.querySelector('.page-hover-overlay');
    expect(overlay).toBeInTheDocument();
    
    // Check that action buttons exist within this specific page card
    const viewLayersButton = pageCard.querySelector('.page-action-button.primary');
    const viewFramesButton = pageCard.querySelector('.page-action-button:not(.primary)');
    
    expect(viewLayersButton).toBeInTheDocument();
    expect(viewFramesButton).toBeInTheDocument();
    expect(viewLayersButton?.textContent).toBe('View Layers');
    expect(viewFramesButton?.textContent).toBe('View Frames');
    
    // Test button clicks
    if (viewLayersButton) {
      fireEvent.click(viewLayersButton);
      expect(mockProps.onViewLayers).toHaveBeenCalledWith(mockPages[0]);
    }
    
    if (viewFramesButton) {
      fireEvent.click(viewFramesButton);
      expect(mockProps.onViewFrames).toHaveBeenCalledWith(mockPages[0]);
    }
  }
});

test('calls onBack when back button is clicked', () => {
  render(<PageGrid {...mockProps} />);
  
  const backButton = screen.getByText(/Back to Form/i);
  fireEvent.click(backButton);
  
  expect(mockProps.onBack).toHaveBeenCalled();
});

test('shows loading state for pages that are loading', () => {
  render(<PageGrid {...mockProps} />);
  
  const loadingText = screen.getByText(/Loading thumbnail/i);
  expect(loadingText).toBeInTheDocument();
});

test('renders empty state when no pages provided', () => {
  const emptyProps = { ...mockProps, pages: [] };
  render(<PageGrid {...emptyProps} />);
  
  const emptyText = screen.getByText(/No pages found/i);
  expect(emptyText).toBeInTheDocument();
});