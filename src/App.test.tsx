import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders comprehensive figma data retrieval app', () => {
  render(<App />);
  const headingElement = screen.getByText(/Comprehensive Figma Data Retrieval/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders enhanced input form initially', () => {
  render(<App />);
  const tokenInput = screen.getByPlaceholderText(/Enter your Figma access token/i);
  const fileIdInput = screen.getByPlaceholderText(/Enter file ID or paste Figma file URL/i);
  const connectButton = screen.getByText(/Connect & Retrieve Data via API/i);
  
  expect(tokenInput).toBeInTheDocument();
  expect(fileIdInput).toBeInTheDocument();
  expect(connectButton).toBeInTheDocument();
});
