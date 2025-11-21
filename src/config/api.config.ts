export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const getApiUrl = (endpoint: string) => {
  const baseURL = API_CONFIG.baseURL;
  return `${baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};
