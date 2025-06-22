import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Get the root element
const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

// Create root and render the app
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log that the renderer process has started
console.log('Scan Prep renderer process started');

// Handle hot module replacement in development
if (module.hot) {
  module.hot.accept('./App', async () => {
    const { default: NextApp } = await import('./App');
    root.render(
      <React.StrictMode>
        <NextApp />
      </React.StrictMode>
    );
  });
} 