import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { HistoryProvider } from './context/HistoryContext';
// 1. IMPORT FriendsProvider TẠI ĐÂY
import { FriendsProvider } from './context/FriendsContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HistoryProvider>
      <AuthProvider>
        <FriendsProvider>
          <App />
        </FriendsProvider>
      </AuthProvider>
    </HistoryProvider>
  </React.StrictMode>,
);