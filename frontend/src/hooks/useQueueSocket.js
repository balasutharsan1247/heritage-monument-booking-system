import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export function useQueueSocket(monumentId, onQueueUpdated) {
  const [socketState, setSocketState] = useState('disconnected');
  const callbackRef = useRef(onQueueUpdated);

  useEffect(() => {
    callbackRef.current = onQueueUpdated;
  }, [onQueueUpdated]);

  useEffect(() => {
    if (!monumentId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setSocketState('connected');
      socket.emit('joinMonument', monumentId);
    });

    socket.on('disconnect', () => {
      setSocketState('disconnected');
    });

    socket.on('connect_error', () => {
      setSocketState('reconnecting');
    });

    socket.io.on("reconnect", () => {
      setSocketState('connected');
    });

    socket.io.on("reconnect_attempt", () => {
      setSocketState('reconnecting');
    });

    socket.on('queueUpdated', (payload) => {
      // payload: { monumentId: '...' }
      if (payload.monumentId === monumentId && callbackRef.current) {
        callbackRef.current();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [monumentId]);

  return { socketState };
}
