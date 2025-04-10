import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Main.tsx is executing');

const rootElement = document.getElementById('root');
console.log('Root element found:', rootElement);

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);
console.log('Root created successfully');

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
