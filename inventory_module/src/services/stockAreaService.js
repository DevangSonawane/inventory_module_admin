import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const stockAreaService = {
  // Get all stock areas
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.orgId) queryParams.append('orgId', params.orgId);
    if (params.showInactive) queryParams.append('showInactive', params.showInactive);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.STOCK_AREAS}?${queryString}` : API_ENDPOINTS.STOCK_AREAS;
    return await get(url);
  },

  // Get stock area by ID
  getById: async (id) => {
    return await get(API_ENDPOINTS.STOCK_AREA_BY_ID(id));
  },

  // Create stock area
  create: async (stockAreaData) => {
    return await post(API_ENDPOINTS.STOCK_AREAS, {
      areaName: stockAreaData.areaName,
      locationCode: stockAreaData.locationCode,
      address: stockAreaData.address,
      capacity: stockAreaData.capacity,
      storeKeeperId: stockAreaData.storeKeeperId,
      description: stockAreaData.description,
      pinCode: stockAreaData.pinCode,
      orgId: stockAreaData.orgId,
    });
  },

  // Update stock area
  update: async (id, stockAreaData) => {
    return await put(API_ENDPOINTS.STOCK_AREA_BY_ID(id), {
      areaName: stockAreaData.areaName,
      locationCode: stockAreaData.locationCode,
      address: stockAreaData.address,
      capacity: stockAreaData.capacity,
      storeKeeperId: stockAreaData.storeKeeperId,
      description: stockAreaData.description,
      pinCode: stockAreaData.pinCode,
    });
  },

  // Delete stock area
  delete: async (id) => {
    return await del(API_ENDPOINTS.STOCK_AREA_BY_ID(id));
  },
};









