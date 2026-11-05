import React, { createContext, useContext, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Initialize the socket once outside the React render loop
export const socket: Socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'], // Allow fallback
  autoConnect: true,
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