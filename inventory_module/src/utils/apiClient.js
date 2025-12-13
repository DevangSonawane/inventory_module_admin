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

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 1, // Only 1 retry for token refresh (401 errors)
  maxNetworkRetries: 0, // No automatic retries for network errors
  retryDelay: 1000, // 1 second delay between retries
  retryableStatusCodes: [500, 502, 503, 504], // Only retry server errors (not used for now)
  retryableNetworkErrors: false, // Don't retry network errors automatically
  maxRetryTime: 10000, // Maximum 10 seconds total retry time
};

// Helper function to check if device is online
const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine !== false;
};

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Initialize retry counter if not exists
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // Check if device is offline - don't retry
    if (!isOnline()) {
      return Promise.reject({
        ...error,
        isOffline: true,
        message: 'You are offline. Please check your internet connection.',
      });
    }

    // Handle 401 Unauthorized - Token expired or invalid
    // Only retry once for 401 errors
    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      originalRequest._retryCount < RETRY_CONFIG.maxRetries &&
      !originalRequest._isRefreshRequest
    ) {
      originalRequest._retryCount += 1;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Mark refresh request to prevent infinite loop
          const refreshConfig = {
            ...originalRequest,
            _isRefreshRequest: true,
          };

          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            { timeout: 10000 } // 10 second timeout for refresh
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;
          
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Retry original request with new token (only once)
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          originalRequest._isRefreshRequest = false; // Reset flag for the retry
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

    // For network errors (no response) - don't retry automatically
    // This prevents excessive retries during network failures
    if (!error.response && error.request) {
      // Network error - return immediately without retry
      return Promise.reject({
        ...error,
        isNetworkError: true,
        message: 'Network error. Please check your connection.',
      });
    }

    // Handle other errors - no automatic retries
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









