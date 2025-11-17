// API Configuration
// URL local para desarrollo (ApiWeb en localhost:3001/api)
export const API_BASE_URL = 'http://192.168.1.50:3001/api';

// URL para datos de sensores (backend en localhost:3005/api)
export const SENSORS_API_BASE_URL = 'http://192.168.1.50:3005/api';

// Alternative: Use environment variable if needed para otros entornos
// export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
// export const SENSORS_API_BASE_URL = process.env.EXPO_PUBLIC_SENSORS_API_URL || 'http://localhost:3005/api';

// API Timeout (in milliseconds)
export const API_TIMEOUT = 30000; // 30 seconds

// API Headers
export const getAuthHeaders = (token: string) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
};
