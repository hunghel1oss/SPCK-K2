import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { HistoryProvider } from './context/HistoryContext.jsx';
import { FriendsProvider } from './context/FriendsContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    // THAY ĐỔI THỨ TỰ Ở ĐÂY
    <HistoryProvider>
      <AuthProvider>
        <FriendsProvider>
          <App />
        </FriendsProvider>
      </AuthProvider>
    </HistoryProvider>
);