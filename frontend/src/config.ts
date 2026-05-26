const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) ||
  (isLocal ? 'http://localhost:8000' : 'https://future-classroom-backend.onrender.com');

export const WS_BASE_URL =
  (import.meta.env.VITE_WS_URL as string) ||
  (isLocal ? 'ws://localhost:8000' : 'wss://future-classroom-backend.onrender.com');
