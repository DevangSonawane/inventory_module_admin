import { post, get, put } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const authService = {
  // Login
  login: async (identifier, password) => {
    return await post(API_ENDPOINTS.AUTH_LOGIN, {
      identifier,
      password,
    });
  },

  // Logout
  logout: async () => {
    try {
      const response = await post(API_ENDPOINTS.AUTH_LOGOUT);
      // Clear tokens and remember me flag from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      return response;
    } catch (error) {
      // Clear tokens and remember me flag even if API call fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    return await get(API_ENDPOINTS.AUTH_PROFILE);
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    return await post(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, {
      oldPassword,
      newPassword,
    });
  },

  // Forgot password
  forgotPassword: async (identifier) => {
    return await post(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, {
      identifier,
    });
  },

  // Update profile
  updateProfile: async (profileData) => {
    // Use the profile endpoint - we'll update via PUT to /auth/profile
    // If backend doesn't support this, we'll need to add it
    return await put(API_ENDPOINTS.AUTH_PROFILE, profileData);
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    return await post(API_ENDPOINTS.AUTH_RESET_PASSWORD || '/auth/reset-password', {
      token,
      newPassword,
    });
  },
};

