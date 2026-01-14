import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const ConnectionContext = createContext(null);

export const ConnectionProvider = ({ children }) => {
  const defaultEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:5000';
  const [apiEndpoint, setApiEndpoint] = useState(defaultEndpoint);
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [lastError, setLastError] = useState(null);
  const [crops, setCrops] = useState([]);

  const retryRef = useRef(0);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  const doConnect = useCallback(async (force = false) => {
    // If already connected and not forced, skip
    if (status === 'connected' && !force) return;
    setStatus('connecting');
    console.log('[CONNECT] attempting', apiEndpoint);

    try {
      const health = await fetch(`${apiEndpoint}/health`);
      if (!health.ok) throw new Error('Health check failed');
      console.log('[CONNECT] health ok');

      // fetch crops list (non-blocking if fails)
      try {
        const res = await fetch(`${apiEndpoint}/api/crops`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) setCrops(json);
        }
      } catch (e) {
        // ignore crop fetch errors
      }

      setLastError(null);
      setStatus('connected');
      retryRef.current = 0;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    } catch (err) {
      setLastError(err.message || String(err));
      setStatus('disconnected');
      // exponential backoff
      const delay = Math.min(30000, Math.pow(2, retryRef.current) * 1000);
      retryRef.current += 1;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => doConnect(false), delay);
    }
  }, [apiEndpoint, status]);

  useEffect(() => {
    isMountedRef.current = true;
    // Force an immediate connection attempt on load/reload
    doConnect(true);
    const handleOnline = () => {
      doConnect(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') doConnect(true);
    };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [doConnect]);

  // expose helpers
  const connect = (opts = {}) => {
    // opts.manual true will force immediate retry
    doConnect(!!opts.manual);
  };

  const fetchWeather = async (lat, lon) => {
    const res = await fetch(`${apiEndpoint}/api/weather?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Weather fetch failed');
    return res.json();
  };

  const getCrop = async (cropName) => {
    try {
      const res = await fetch(`${apiEndpoint}/api/crops/${encodeURIComponent(cropName)}`);
      if (!res.ok) throw new Error('Crop fetch failed');
      return res.json();
    } catch (e) {
      throw e;
    }
  };

  const simulate = async (payload) => {
    const res = await fetch(`${apiEndpoint}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Simulation failed: ${txt}`);
    }
    return res.json();
  };

  const value = {
    apiEndpoint,
    setApiEndpoint,
    status,
    lastError,
    connect,
    crops,
    fetchWeather,
    getCrop,
    simulate
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within ConnectionProvider');
  return ctx;
};
