import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const consumptionService = {
  // Get all consumption records
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.externalSystemRefId) queryParams.append('externalSystemRefId', params.externalSystemRefId);
    if (params.stockAreaId) queryParams.append('stockAreaId', params.stockAreaId);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.orgId) queryParams.append('orgId', params.orgId);
    if (params.showInactive) queryParams.append('showInactive', params.showInactive);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.CONSUMPTION}?${queryString}` : API_ENDPOINTS.CONSUMPTION;
    return await get(url);
  },

  // Get consumption record by ID
  getById: async (id) => {
    return await get(API_ENDPOINTS.CONSUMPTION_BY_ID(id));
  },

  // Create consumption record
  create: async (consumptionData) => {
    return await post(API_ENDPOINTS.CONSUMPTION, {
      externalSystemRefId: consumptionData.externalSystemRefId,
      customerData: consumptionData.customerData,
      consumptionDate: consumptionData.consumptionDate,
      stockAreaId: consumptionData.stockAreaId,
      items: consumptionData.items,
      remarks: consumptionData.remarks,
      orgId: consumptionData.orgId,
    });
  },

  // Update consumption record
  update: async (id, consumptionData) => {
    return await put(API_ENDPOINTS.CONSUMPTION_BY_ID(id), {
      externalSystemRefId: consumptionData.externalSystemRefId,
      customerData: consumptionData.customerData,
      consumptionDate: consumptionData.consumptionDate,
      stockAreaId: consumptionData.stockAreaId,
      items: consumptionData.items,
      remarks: consumptionData.remarks,
    });
  },

  // Delete consumption record
  delete: async (id) => {
    return await del(API_ENDPOINTS.CONSUMPTION_BY_ID(id));
  },
};









