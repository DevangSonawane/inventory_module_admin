import { get } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const reportService = {
  getTransactionHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await get(`${API_ENDPOINTS.REPORTS_TRANSACTIONS}${queryString ? `?${queryString}` : ''}`);
  },

  getStockMovement: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await get(`${API_ENDPOINTS.REPORTS_MOVEMENT}${queryString ? `?${queryString}` : ''}`);
  },

  getConsumptionAnalysis: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await get(`${API_ENDPOINTS.REPORTS_CONSUMPTION}${queryString ? `?${queryString}` : ''}`);
  },

  getStockValuation: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await get(`${API_ENDPOINTS.REPORTS_VALUATION}${queryString ? `?${queryString}` : ''}`);
  },
};









