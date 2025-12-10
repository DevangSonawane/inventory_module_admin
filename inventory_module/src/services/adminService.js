import { get, put } from '../utils/apiClient.js';
import { API_BASE_URL } from '../utils/constants.js';

export const adminService = {
  // Get system settings
  getSettings: async () => {
    return await get(`${API_BASE_URL}/admin/settings`);
  },

  // Update system settings
  updateSettings: async (settings) => {
    return await put(`${API_BASE_URL}/admin/settings`, settings);
  },
};

