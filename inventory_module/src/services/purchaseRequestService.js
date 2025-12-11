import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

const normalizePurchaseRequestResponse = (response = {}, fallback = {}) => {
  const payload = response.data || {};
  const pagination = payload.pagination || fallback.pagination || {};

  return {
    ...response,
    data: {
      purchaseRequests: payload.purchaseRequests || payload.requests || [],
      pagination: {
        totalItems: pagination.totalItems || 0,
        totalPages: pagination.totalPages || 0,
        currentPage: pagination.currentPage || fallback.page || 1,
        itemsPerPage: pagination.itemsPerPage || fallback.limit || 10,
      },
    },
  };
};

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
    const url = queryString
      ? `${API_ENDPOINTS.PURCHASE_REQUESTS}?${queryString}`
      : API_ENDPOINTS.PURCHASE_REQUESTS;

    const response = await get(url);
    return normalizePurchaseRequestResponse(response, params);
  },

  // Get purchase request by ID
  getById: async (id) => {
    return await get(API_ENDPOINTS.PURCHASE_REQUEST_BY_ID(id));
  },

  // Create purchase request
  create: async (prData) => {
    return await post(API_ENDPOINTS.PURCHASE_REQUESTS, prData);
  },

  // Update purchase request
  update: async (id, prData) => {
    return await put(API_ENDPOINTS.PURCHASE_REQUEST_BY_ID(id), prData);
  },

  // Submit purchase request
  submit: async (id) => {
    return await put(API_ENDPOINTS.PURCHASE_REQUEST_SUBMIT(id));
  },

  // Approve purchase request
  approve: async (id) => {
    return await put(API_ENDPOINTS.PURCHASE_REQUEST_APPROVE(id));
  },

  // Reject purchase request
  reject: async (id, remarks) => {
    return await put(API_ENDPOINTS.PURCHASE_REQUEST_REJECT(id), { remarks });
  },

  // Delete purchase request
  delete: async (id) => {
    return await del(API_ENDPOINTS.PURCHASE_REQUEST_BY_ID(id));
  },
};
