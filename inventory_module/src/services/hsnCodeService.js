import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const hsnCodeService = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.showInactive) queryParams.append('showInactive', params.showInactive);
    if (params.orgId) queryParams.append('orgId', params.orgId);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.HSN_CODES}?${queryString}` : API_ENDPOINTS.HSN_CODES;
    return await get(url);
  },

  getById: async (id) => {
    return await get(API_ENDPOINTS.HSN_CODE_BY_ID(id));
  },

  create: async (hsnCodeData) => {
    return await post(API_ENDPOINTS.HSN_CODES, hsnCodeData);
  },

  update: async (id, hsnCodeData) => {
    return await put(API_ENDPOINTS.HSN_CODE_BY_ID(id), hsnCodeData);
  },

  delete: async (id) => {
    return await del(API_ENDPOINTS.HSN_CODE_BY_ID(id));
  },
};

