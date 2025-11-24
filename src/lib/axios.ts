import axios from 'axios';
import { API_CONFIG } from '@/config/api.config';

// En desarrollo usamos el proxy de Vite (baseURL vacío). En producción
// utilizamos la URL absoluta definida en `VITE_API_BASE_URL`.
const axiosInstance = axios.create({
  baseURL: import.meta.env.DEV ? '' : API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // No usamos cookies para auth; usamos token en headers
});

// Interceptor para agregar el token en cada petición
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Django REST Framework TokenAuthentication usa "Token" no "Bearer"
      config.headers.Authorization = `Token ${token}`;
    }
    console.log('Request URL:', config.baseURL + config.url);
    console.log('Authorization header:', config.headers.Authorization);
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
