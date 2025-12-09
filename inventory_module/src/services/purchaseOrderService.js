import { get, post, put, del } from '../utils/apiClient.js';
import { API_BASE_URL } from '../utils/constants.js';

export const purchaseOrderService = {
  // Get all purchase orders
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.vendorId) queryParams.append('vendorId', params.vendorId);
    if (params.orgId) queryParams.append('orgId', params.orgId);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE_URL}/inventory/purchase-orders?${queryString}` : `${API_BASE_URL}/inventory/purchase-orders`;
    return await get(url);
  },

  // Get purchase order by ID
  getById: async (id) => {
    return await get(`${API_BASE_URL}/inventory/purchase-orders/${id}`);
  },

  // Create purchase order from PR
  createFromPR: async (prId, poData) => {
    return await post(`${API_BASE_URL}/inventory/purchase-orders/from-pr/${prId}`, poData);
  },

  // Create purchase order (standalone)
  create: async (poData) => {
    return await post(`${API_BASE_URL}/inventory/purchase-orders`, poData);
  },

  // Update purchase order
  update: async (id, poData) => {
    return await put(`${API_BASE_URL}/inventory/purchase-orders/${id}`, poData);
  },

  // Send purchase order
  send: async (id) => {
    return await post(`${API_BASE_URL}/inventory/purchase-orders/${id}/send`);
  },

  // Receive purchase order
  receive: async (id) => {
    return await post(`${API_BASE_URL}/inventory/purchase-orders/${id}/receive`);
  },

  // Delete purchase order
  delete: async (id) => {
    return await del(`${API_BASE_URL}/inventory/purchase-orders/${id}`);
  },
};
