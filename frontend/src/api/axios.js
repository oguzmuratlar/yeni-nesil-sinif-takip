import axios from 'axios';

// Production'da aynı origin kullan, development'ta .env'den al
const getBaseUrl = () => {
  // Eğer custom domain kullanılıyorsa (production), aynı origin'i kullan
  if (window.location.hostname !== 'localhost' && 
      !window.location.hostname.includes('preview.emergentagent.com')) {
    return window.location.origin + '/api';
  }
  // Preview veya development ortamında .env'den al
  return (process.env.REACT_APP_BACKEND_URL || '') + '/api';
};

const API_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
