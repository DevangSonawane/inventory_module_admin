import { get, post, del } from '../utils/apiClient.js';
import { API_BASE_URL } from '../utils/constants.js';

export const materialAllocationService = {
  // Get available stock for allocation
  getAvailableStock: async (materialRequestId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.stockAreaId) queryParams.append('stockAreaId', params.stockAreaId);
    if (params.materialId) queryParams.append('materialId', params.materialId);

    const queryString = queryParams.toString();
    const url = queryString 
      ? `${API_BASE_URL}/inventory/material-request/${materialRequestId}/available-stock?${queryString}`
      : `${API_BASE_URL}/inventory/material-request/${materialRequestId}/available-stock`;
    return await get(url);
  },

  // Get allocations for a material request
  getAllocations: async (materialRequestId) => {
    return await get(`${API_BASE_URL}/inventory/material-request/${materialRequestId}/allocations`);
  },

  // Allocate items to material request
  allocate: async (materialRequestId, allocations) => {
    return await post(`${API_BASE_URL}/inventory/material-request/${materialRequestId}/allocate`, {
      allocations,
    });
  },

  // Cancel allocation
  cancelAllocation: async (materialRequestId, allocationId) => {
    return await del(`${API_BASE_URL}/inventory/material-request/${materialRequestId}/allocations/${allocationId}`);
  },
};
