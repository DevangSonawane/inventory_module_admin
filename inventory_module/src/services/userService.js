import { get } from '../utils/apiClient.js';
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
};
