import { get } from '../utils/apiClient.js';
import { API_BASE_URL } from '../utils/constants.js';

export const roleService = {
  getAll: async () => {
    return await get(`${API_BASE_URL}/role`);
  },
};

