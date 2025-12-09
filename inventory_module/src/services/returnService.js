import { get, post, put } from '../utils/apiClient.js';
import { API_BASE_URL } from '../utils/constants.js';

export const returnService = {
  // Get available items for return
  getAvailableItems: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.technicianId) queryParams.append('technicianId', params.technicianId);
    if (params.ticketId) queryParams.append('ticketId', params.ticketId);
    if (params.materialId) queryParams.append('materialId', params.materialId);

    const queryString = queryParams.toString();
    const url = queryString 
      ? `${API_BASE_URL}/inventory/returns/available-items?${queryString}`
      : `${API_BASE_URL}/inventory/returns/available-items`;
    return await get(url);
  },

  // Get all returns
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.technicianId) queryParams.append('technicianId', params.technicianId);
    if (params.orgId) queryParams.append('orgId', params.orgId);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE_URL}/inventory/returns?${queryString}` : `${API_BASE_URL}/inventory/returns`;
    return await get(url);
  },

  // Get return by ID
  getById: async (id) => {
    return await get(`${API_BASE_URL}/inventory/returns/${id}`);
  },

  // Create return
  create: async (returnData) => {
    return await post(`${API_BASE_URL}/inventory/returns`, returnData);
  },

  // Approve return
  approve: async (id, stockAreaId) => {
    return await put(`${API_BASE_URL}/inventory/returns/${id}/approve`, { stockAreaId });
  },

  // Reject return
  reject: async (id) => {
    return await put(`${API_BASE_URL}/inventory/returns/${id}/reject`);
  },
};
