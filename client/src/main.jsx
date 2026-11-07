import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

const originalFetch = window.fetch;
window.fetch = (url, options) => {
  if (typeof url === 'string' && url.startsWith('/api')) {
    const isVercel = window.location.hostname.includes('vercel.app');
    const baseUrl = isVercel ? 'https://basic-lmsdev.onrender.com' : '';
    return originalFetch(baseUrl + url, options);
  }
  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
