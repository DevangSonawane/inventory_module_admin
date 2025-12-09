import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const materialRequestService = {
  // Get all material requests
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.requestedBy) queryParams.append('requestedBy', params.requestedBy);
    if (params.orgId) queryParams.append('orgId', params.orgId);
    if (params.showInactive) queryParams.append('showInactive', params.showInactive);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.MATERIAL_REQUEST}?${queryString}` : API_ENDPOINTS.MATERIAL_REQUEST;
    return await get(url);
  },

  // Get material request by ID
  getById: async (id) => {
    return await get(API_ENDPOINTS.MATERIAL_REQUEST_BY_ID(id));
  },

  // Create material request
  create: async (requestData) => {
    return await post(API_ENDPOINTS.MATERIAL_REQUEST, {
      prNumbers: requestData.prNumbers,
      items: requestData.items,
      remarks: requestData.remarks,
      orgId: requestData.orgId,
    });
  },

  // Update material request
  update: async (id, requestData) => {
    return await put(API_ENDPOINTS.MATERIAL_REQUEST_BY_ID(id), {
      prNumbers: requestData.prNumbers,
      items: requestData.items,
      remarks: requestData.remarks,
      status: requestData.status,
    });
  },

  // Approve or reject material request
  approve: async (id, approvalData) => {
    return await post(API_ENDPOINTS.MATERIAL_REQUEST_APPROVE(id), {
      status: approvalData.status,
      approvedItems: approvalData.approvedItems,
      remarks: approvalData.remarks,
    });
  },

  // Delete material request
  delete: async (id) => {
    return await del(API_ENDPOINTS.MATERIAL_REQUEST_BY_ID(id));
  },
};









