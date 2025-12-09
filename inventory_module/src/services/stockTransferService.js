import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const stockTransferService = {
  // Get all stock transfers
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.fromStockAreaId) queryParams.append('fromStockAreaId', params.fromStockAreaId);
    if (params.toStockAreaId) queryParams.append('toStockAreaId', params.toStockAreaId);
    if (params.status) queryParams.append('status', params.status);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.orgId) queryParams.append('orgId', params.orgId);
    if (params.showInactive) queryParams.append('showInactive', params.showInactive);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.STOCK_TRANSFER}?${queryString}` : API_ENDPOINTS.STOCK_TRANSFER;
    return await get(url);
  },

  // Get stock transfer by ID
  getById: async (id) => {
    return await get(API_ENDPOINTS.STOCK_TRANSFER_BY_ID(id));
  },

  // Create stock transfer
  create: async (transferData) => {
    return await post(API_ENDPOINTS.STOCK_TRANSFER, {
      fromStockAreaId: transferData.fromStockAreaId,
      toStockAreaId: transferData.toStockAreaId,
      toUserId: transferData.toUserId,
      ticketId: transferData.ticketId,
      materialRequestId: transferData.materialRequestId,
      transferDate: transferData.transferDate,
      items: transferData.items,
      remarks: transferData.remarks,
      orgId: transferData.orgId,
    });
  },

  // Update stock transfer
  update: async (id, transferData) => {
    return await put(API_ENDPOINTS.STOCK_TRANSFER_BY_ID(id), {
      fromStockAreaId: transferData.fromStockAreaId,
      toStockAreaId: transferData.toStockAreaId,
      toUserId: transferData.toUserId,
      ticketId: transferData.ticketId,
      materialRequestId: transferData.materialRequestId,
      transferDate: transferData.transferDate,
      status: transferData.status,
      items: transferData.items,
      remarks: transferData.remarks,
    });
  },

  // Delete stock transfer
  delete: async (id) => {
    return await del(API_ENDPOINTS.STOCK_TRANSFER_BY_ID(id));
  },
};









