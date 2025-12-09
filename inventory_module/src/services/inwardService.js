import { get, post, put, del, upload } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const inwardService = {
  // Get all inward entries
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.stockAreaId) queryParams.append('stockAreaId', params.stockAreaId);
    if (params.partyName) queryParams.append('partyName', params.partyName);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.status) queryParams.append('status', params.status);
    if (params.orgId) queryParams.append('orgId', params.orgId);
    if (params.showInactive) queryParams.append('showInactive', params.showInactive);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.INWARD}?${queryString}` : API_ENDPOINTS.INWARD;
    return await get(url);
  },

  // Get inward entry by ID
  getById: async (id) => {
    return await get(API_ENDPOINTS.INWARD_BY_ID(id));
  },

  // Create inward entry
  create: async (inwardData, files = []) => {
    const formData = new FormData();
    
    // Add JSON data
    formData.append('date', inwardData.date || new Date().toISOString().split('T')[0]);
    formData.append('invoiceNumber', inwardData.invoiceNumber);
    formData.append('partyName', inwardData.partyName);
    if (inwardData.purchaseOrder) formData.append('purchaseOrder', inwardData.purchaseOrder);
    if (inwardData.poId) formData.append('poId', inwardData.poId);
    formData.append('stockAreaId', inwardData.stockAreaId);
    if (inwardData.vehicleNumber) formData.append('vehicleNumber', inwardData.vehicleNumber);
    if (inwardData.remark) formData.append('remark', inwardData.remark);
    if (inwardData.orgId) formData.append('orgId', inwardData.orgId);
    
    // Add items as JSON string
    formData.append('items', JSON.stringify(inwardData.items));
    
    // Add files
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('documents', file);
      });
    }

    return await upload(API_ENDPOINTS.INWARD, formData);
  },

  // Update inward entry
  update: async (id, inwardData) => {
    return await put(API_ENDPOINTS.INWARD_BY_ID(id), {
      date: inwardData.date,
      invoiceNumber: inwardData.invoiceNumber,
      partyName: inwardData.partyName,
      purchaseOrder: inwardData.purchaseOrder,
      poId: inwardData.poId,
      stockAreaId: inwardData.stockAreaId,
      vehicleNumber: inwardData.vehicleNumber,
      remark: inwardData.remark,
      status: inwardData.status,
      items: inwardData.items,
      documents: inwardData.documents,
    });
  },

  // Delete inward entry
  delete: async (id) => {
    return await del(API_ENDPOINTS.INWARD_BY_ID(id));
  },
};









