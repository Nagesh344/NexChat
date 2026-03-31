import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WSContext = createContext(null);

export const WSProvider = ({ children }) => {
  const { token } = useAuth();
  const wsRef = useRef(null);
  const listenersRef = useRef(new Map());
  const reconnectTimer = useRef(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:5000/ws'}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log('✅ WebSocket connected');
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const handlers = listenersRef.current.get(msg.type) || [];
        handlers.forEach((fn) => fn(msg));
        // Also call wildcard listeners
        const wildcards = listenersRef.current.get('*') || [];
        wildcards.forEach((fn) => fn(msg));
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('🔌 WebSocket disconnected. Reconnecting...');
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('WS error:', err);
      ws.close();
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      connect();
    } else {
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
    }

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [token, connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const on = useCallback((type, handler) => {
    if (!listenersRef.current.has(type)) listenersRef.current.set(type, []);
    listenersRef.current.get(type).push(handler);
    return () => {
      const handlers = listenersRef.current.get(type) || [];
      listenersRef.current.set(type, handlers.filter((h) => h !== handler));
    };
  }, []);

  return (
    <WSContext.Provider value={{ send, on, connected }}>
      {children}
    </WSContext.Provider>
  );
};

export const useWS = () => {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error('useWS must be used within WSProvider');
  return ctx;
};
