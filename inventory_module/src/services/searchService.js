import { get } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const searchService = {
  global: async (query, params = {}) => {
    const searchParams = { q: query, ...params };
    const queryString = new URLSearchParams(searchParams).toString();
    return await get(`${API_ENDPOINTS.SEARCH}?${queryString}`);
  },
};









