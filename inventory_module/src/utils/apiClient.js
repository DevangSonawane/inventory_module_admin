import axios from 'axios';
import { API_BASE_URL, HTTP_STATUS } from './constants.js';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  // Production: enable credentials for CORS
  withCredentials: import.meta.env.MODE === 'production',
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;
          
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const errorObj = {
      message: data?.message || 'An error occurred',
      status,
      errors: data?.errors || [],
      response: error.response, // Keep full response for debugging
      data: data // Keep full data for debugging
    };
    
    // If validation errors exist, format them
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const errorMessages = data.errors.map(err => err.message || err.msg || JSON.stringify(err)).join(', ');
      errorObj.message = errorMessages || errorObj.message;
    }
    
    return errorObj;
  } else if (error.request) {
    // Request made but no response received
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      errors: [],
      request: error.request
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      errors: [],
      originalError: error
    };
  }
};

// Helper function for GET requests
export const get = async (url, config = {}) => {
  try {
    const response = await apiClient.get(url, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper function for POST requests
export const post = async (url, data = {}, config = {}) => {
  try {
    const response = await apiClient.post(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper function for PUT requests
export const put = async (url, data = {}, config = {}) => {
  try {
    const response = await apiClient.put(url, data, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper function for DELETE requests
export const del = async (url, config = {}) => {
  try {
    const response = await apiClient.delete(url, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper function for file uploads (multipart/form-data)
export const upload = async (url, formData, config = {}) => {
  try {
    const response = await apiClient.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export default apiClient;









