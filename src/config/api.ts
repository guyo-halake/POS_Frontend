const defaultLocalApiUrl = 'http://127.0.0.1:5001';

export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultLocalApiUrl;

// Default to the local desktop backend so the app works from Electron and plain browser dev.
