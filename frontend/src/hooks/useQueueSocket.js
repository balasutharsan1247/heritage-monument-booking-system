import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.trim().replace(/\/+$/, '');
  }
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

export function useQueueSocket(monumentId, onQueueUpdated) {
  const [socketState, setSocketState] = useState('disconnected');
  const callbackRef = useRef(onQueueUpdated);

  useEffect(() => {
    callbackRef.current = onQueueUpdated;
  }, [onQueueUpdated]);

  useEffect(() => {
    if (!monumentId) return;
    const targetId = String(monumentId);

    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      setSocketState('connected');
      socket.emit('joinMonument', targetId);
    });

    socket.on('disconnect', () => {
      setSocketState('disconnected');
    });

    socket.on('connect_error', () => {
      setSocketState('reconnecting');
    });

    socket.io.on('reconnect', () => {
      setSocketState('connected');
      socket.emit('joinMonument', targetId);
    });

    socket.io.on('reconnect_attempt', () => {
      setSocketState('reconnecting');
    });

    socket.on('queueUpdated', (payload) => {
      if (String(payload?.monumentId) === targetId && callbackRef.current) {
        callbackRef.current();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [monumentId]);

  return { socketState };
}
