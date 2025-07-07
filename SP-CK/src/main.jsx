import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import './App.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Không tìm thấy root element để gắn ứng dụng React");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);