import { get, post, put, del } from '../utils/apiClient.js';
import { API_BASE_URL } from '../utils/constants.js';

export const businessPartnerService = {
  // Get all business partners
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.partnerType) queryParams.append('partnerType', params.partnerType);
    if (params.orgId) queryParams.append('orgId', params.orgId);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE_URL}/inventory/business-partners?${queryString}` : `${API_BASE_URL}/inventory/business-partners`;
    return await get(url);
  },

  // Get business partner by ID
  getById: async (id) => {
    return await get(`${API_BASE_URL}/inventory/business-partners/${id}`);
  },

  // Create business partner
  create: async (partnerData) => {
    return await post(`${API_BASE_URL}/inventory/business-partners`, partnerData);
  },

  // Update business partner
  update: async (id, partnerData) => {
    return await put(`${API_BASE_URL}/inventory/business-partners/${id}`, partnerData);
  },

  // Delete business partner
  delete: async (id) => {
    return await del(`${API_BASE_URL}/inventory/business-partners/${id}`);
  },
};
