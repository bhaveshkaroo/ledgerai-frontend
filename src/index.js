import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initSentry } from './utils/sentryConfig';
import { loadCompanySnapshot, getActiveCompanyId } from './utils/BusinessEngine';

// Initialize error monitoring before React renders
initSentry();

// Ensure active company data snapshot is loaded into LedgerEngine/InvoiceEngine/InventoryEngine on startup
try {
  loadCompanySnapshot(getActiveCompanyId());
} catch (_) {}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
