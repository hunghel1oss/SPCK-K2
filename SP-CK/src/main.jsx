import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { HistoryProvider } from './context/HistoryContext.jsx';
import { FriendsProvider } from './context/FriendsContext.jsx';
import { ChatProvider } from './context/ChatContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    <AuthProvider>
      <HistoryProvider>
        <FriendsProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </FriendsProvider>
      </HistoryProvider>
    </AuthProvider>
);