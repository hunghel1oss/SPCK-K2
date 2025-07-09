import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { HistoryProvider } from './context/HistoryContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HistoryProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HistoryProvider>
  </React.StrictMode>,
);