import { get } from '../utils/apiClient.js';
import { API_BASE_URL } from '../utils/constants.js';

export const personStockService = {
  // Get person stock
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.ticketId) queryParams.append('ticketId', params.ticketId);
    if (params.materialId) queryParams.append('materialId', params.materialId);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.orgId) queryParams.append('orgId', params.orgId);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE_URL}/inventory/person-stock?${queryString}` : `${API_BASE_URL}/inventory/person-stock`;
    return await get(url);
  },

  // Get person stock by ticket
  getByTicket: async (ticketId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.status) queryParams.append('status', params.status);
    if (params.orgId) queryParams.append('orgId', params.orgId);

    const queryString = queryParams.toString();
    const url = queryString 
      ? `${API_BASE_URL}/inventory/person-stock/ticket/${ticketId}?${queryString}`
      : `${API_BASE_URL}/inventory/person-stock/ticket/${ticketId}`;
    return await get(url);
  },

  // Search person stock by serial number
  searchBySerial: async (serialNumber, params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('serialNumber', serialNumber);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.ticketId) queryParams.append('ticketId', params.ticketId);

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/inventory/person-stock/search?${queryString}`;
    return await get(url);
  },
};
