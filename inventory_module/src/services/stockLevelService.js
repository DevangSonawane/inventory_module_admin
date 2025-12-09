import { get } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const stockLevelService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await get(`${API_ENDPOINTS.STOCK_LEVELS}${queryString ? `?${queryString}` : ''}`);
  },

  getByMaterial: async (materialId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await get(`${API_ENDPOINTS.STOCK_LEVEL_BY_MATERIAL(materialId)}${queryString ? `?${queryString}` : ''}`);
  },

  getSummary: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await get(`${API_ENDPOINTS.STOCK_SUMMARY}${queryString ? `?${queryString}` : ''}`);
  },
};









