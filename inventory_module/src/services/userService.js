import { get, post, put, del } from '../utils/apiClient.js';
import { API_BASE_URL } from '../utils/constants.js';

export const userService = {
  // Get all users
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE_URL}/users?${queryString}` : `${API_BASE_URL}/users`;
    return await get(url);
  },

  // Get user by ID
  getById: async (id) => {
    return await get(`${API_BASE_URL}/users/${id}`);
  },

  // Create user
  create: async (userData) => {
    // Try the standard users endpoint first, fallback to executive management
    try {
      const payload = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'user',
        isActive: userData.isActive !== false,
      };
      
      if (userData.employeCode) payload.employeCode = userData.employeCode;
      if (userData.phoneNumber) payload.phoneNumber = userData.phoneNumber;
      
      return await post(`${API_BASE_URL}/users`, payload);
    } catch (error) {
      // Fallback to executive management endpoint if standard endpoint fails
      const payload = {
        name: userData.name,
        employeCode: userData.employeCode,
        phoneNumber: userData.phoneNumber,
        email: userData.email,
        password: userData.password,
        roleId: userData.role === 'admin' ? 2 : 1,
        moduleIds: [],
        isActive: userData.isActive !== false,
      };
      return await post(`${API_BASE_URL}/leads/em/users`, payload);
    }
  },

  // Update user
  update: async (id, userData) => {
    return await put(`${API_BASE_URL}/users/${id}`, userData);
  },

  // Delete user
  delete: async (id) => {
    return await del(`${API_BASE_URL}/users/${id}`);
  },

  // Reset user password (if endpoint exists)
  resetPassword: async (id, newPassword) => {
    return await post(`${API_BASE_URL}/users/${id}/reset-password`, { newPassword });
  },
};
