import React, { createContext, useContext, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getPersistentUserId } from '../utils/userId';

const SocketContext = createContext<Socket | null>(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Initialize the socket with persistent user identification and cloud-robust transport config
export const socket: Socket = io(BACKEND_URL, {
  auth: {
    userId: getPersistentUserId(),
  },
  transports: ['websocket', 'polling'], // Fallback gracefully if websocket drops
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    function onConnect() {
      console.log('Connected to socket server:', socket.id);
    }

    function onDisconnect() {
      console.log('Disconnected from socket server');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): Socket => {
  const socketInstance = useContext(SocketContext);
  if (!socketInstance) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return socketInstance;
};