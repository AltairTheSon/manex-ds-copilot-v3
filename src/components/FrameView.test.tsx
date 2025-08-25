import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FrameWithThumbnail } from '../types/figma';
import FrameView from './FrameView';

const mockFrames: FrameWithThumbnail[] = [
  {
    id: 'frame1',
    name: 'Test Frame 1',
    type: 'FRAME',
    children: [],
    thumbnailUrl: 'https://example.com/frame1.png',
    absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 300 }
  },
  {
    id: 'frame2',
    name: 'Test Frame 2',
    type: 'FRAME',
    children: [],
    loading: true,
    absoluteBoundingBox: { x: 100, y: 100, width: 150, height: 250 }
  }
];

const mockProps = {
  frames: mockFrames,
  pageName: 'Test Page',
  fileName: 'Test File',
  onBack: jest.fn(),
  loading: false,
  error: null
};

test('renders frame view with frames', () => {
  render(<FrameView {...mockProps} />);
  
  const pageTitle = screen.getByText(/Frames in "Test Page"/i);
  const backButton = screen.getByText(/Back to Pages/i);
  const frame1 = screen.getByText('Test Frame 1');
  const frame2 = screen.getByText('Test Frame 2');
  
  expect(pageTitle).toBeInTheDocument();
  expect(backButton).toBeInTheDocument();
  expect(frame1).toBeInTheDocument();
  expect(frame2).toBeInTheDocument();
});

test('calls onBack when back button is clicked', () => {
  render(<FrameView {...mockProps} />);
  
  const backButton = screen.getByText(/Back to Pages/i);
  fireEvent.click(backButton);
  
  expect(mockProps.onBack).toHaveBeenCalled();
});

test('shows loading state', () => {
  const loadingProps = { ...mockProps, loading: true };
  render(<FrameView {...loadingProps} />);
  
  const loadingText = screen.getByText(/Fetching page frames/i);
  expect(loadingText).toBeInTheDocument();
});

test('shows error state', () => {
  const errorProps = { ...mockProps, error: 'Test error message' };
  render(<FrameView {...errorProps} />);
  
  const errorText = screen.getByText(/Failed to load frames/i);
  const errorMessage = screen.getByText('Test error message');
  expect(errorText).toBeInTheDocument();
  expect(errorMessage).toBeInTheDocument();
});

test('shows loading state for individual frames', () => {
  render(<FrameView {...mockProps} />);
  
  const loadingText = screen.getByText(/Loading\.\.\./i);
  expect(loadingText).toBeInTheDocument();
});

test('renders empty state when no frames provided', () => {
  const emptyProps = { ...mockProps, frames: [] };
  render(<FrameView {...emptyProps} />);
  
  const emptyText = screen.getByText(/No frames found/i);
  expect(emptyText).toBeInTheDocument();
});

test('displays frame dimensions correctly', () => {
  render(<FrameView {...mockProps} />);
  
  const dimensions1 = screen.getByText('200 × 300');
  const dimensions2 = screen.getByText('150 × 250');
  
  expect(dimensions1).toBeInTheDocument();
  expect(dimensions2).toBeInTheDocument();
});