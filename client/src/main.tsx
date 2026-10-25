import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { SocketProvider } from './context/SocketContext.tsx';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SocketProvider>
      <App />
    </SocketProvider>
  </React.StrictMode>
);