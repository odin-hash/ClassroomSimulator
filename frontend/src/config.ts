export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://future-classroom-backend.onrender.com');
