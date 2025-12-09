import { get, post, put, del } from '../utils/apiClient.js';
import { API_BASE_URL } from '../utils/constants.js';

export const purchaseRequestService = {
  // Get all purchase requests
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.orgId) queryParams.append('orgId', params.orgId);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE_URL}/inventory/purchase-requests?${queryString}` : `${API_BASE_URL}/inventory/purchase-requests`;
    return await get(url);
  },

  // Get purchase request by ID
  getById: async (id) => {
    return await get(`${API_BASE_URL}/inventory/purchase-requests/${id}`);
  },

  // Create purchase request
  create: async (prData) => {
    return await post(`${API_BASE_URL}/inventory/purchase-requests`, prData);
  },

  // Update purchase request
  update: async (id, prData) => {
    return await put(`${API_BASE_URL}/inventory/purchase-requests/${id}`, prData);
  },

  // Submit purchase request
  submit: async (id) => {
    return await put(`${API_BASE_URL}/inventory/purchase-requests/${id}/submit`);
  },

  // Approve purchase request
  approve: async (id) => {
    return await put(`${API_BASE_URL}/inventory/purchase-requests/${id}/approve`);
  },

  // Reject purchase request
  reject: async (id, remarks) => {
    return await put(`${API_BASE_URL}/inventory/purchase-requests/${id}/reject`, { remarks });
  },

  // Delete purchase request
  delete: async (id) => {
    return await del(`${API_BASE_URL}/inventory/purchase-requests/${id}`);
  },
};
