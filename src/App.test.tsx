import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders figma pages preview app', () => {
  render(<App />);
  const headingElement = screen.getByText(/Figma Pages Preview/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders input form initially', () => {
  render(<App />);
  const tokenInput = screen.getByPlaceholderText(/Enter your Figma access token/i);
  const fileIdInput = screen.getByPlaceholderText(/Enter file ID or paste Figma file URL/i);
  const connectButton = screen.getByText(/Connect & Preview Pages/i);
  
  expect(tokenInput).toBeInTheDocument();
  expect(fileIdInput).toBeInTheDocument();
  expect(connectButton).toBeInTheDocument();
});
