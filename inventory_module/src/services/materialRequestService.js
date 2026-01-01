import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

const normalizeMaterialRequestResponse = (response = {}, fallback = {}) => {
  const payload = response.data || {};
  const pagination = payload.pagination || fallback.pagination || {};

  return {
    ...response,
    data: {
      materialRequests: payload.materialRequests || payload.requests || [],
      pagination: {
        totalItems: pagination.totalItems || 0,
        totalPages: pagination.totalPages || 0,
        currentPage: pagination.currentPage || fallback.page || 1,
        itemsPerPage: pagination.itemsPerPage || fallback.limit || 10,
      },
    },
  };
};

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
    
    const response = await get(url);
    return normalizeMaterialRequestResponse(response, params);
  },

  // Get material request by ID
  getById: async (id) => {
    return await get(API_ENDPOINTS.MATERIAL_REQUEST_BY_ID(id));
  },

  // Create material request
  create: async (requestData) => {
    const prNumbers = (requestData.prNumbers || []).map(pr => ({
      prNumber: pr.prNumber,
      prDate: pr.prDate,
      pr_number: pr.prNumber,
      pr_date: pr.prDate,
    }))

    const items = (requestData.items || []).map(item => ({
      itemId: item.itemId || item.id,
      materialId: item.materialId,
      requestedQuantity: item.requestedQuantity,
      uom: item.uom,
      remarks: item.remarks,
      item_id: item.itemId || item.id,
      material_id: item.materialId,
      requested_quantity: item.requestedQuantity,
      approved_quantity: item.approvedQuantity,
    }))

    // Helper to convert empty strings to undefined for optional fields
    const cleanOptionalField = (value) => (value === '' || value === null ? undefined : value)

    const payload = {
      // Meta
      ticketId: cleanOptionalField(requestData.ticketId),
      ticket_id: cleanOptionalField(requestData.ticketId),
      fromStockAreaId: cleanOptionalField(requestData.fromStockAreaId),
      from_stock_area_id: cleanOptionalField(requestData.fromStockAreaId),
      requestDate: requestData.requestDate,
      request_date: requestData.requestDate,
      requestorId: cleanOptionalField(requestData.requestorId),
      requestor_id: cleanOptionalField(requestData.requestorId),
      groupId: cleanOptionalField(requestData.groupId),
      group_id: cleanOptionalField(requestData.groupId),
      teamId: cleanOptionalField(requestData.teamId),
      team_id: cleanOptionalField(requestData.teamId),
      serviceArea: cleanOptionalField(requestData.serviceArea),
      service_area: cleanOptionalField(requestData.serviceArea),
      // PRs & items
      prNumbers,
      pr_numbers: prNumbers,
      items,
      // Optional fields
      remarks: cleanOptionalField(requestData.remarks),
      orgId: requestData.orgId,
      status: requestData.status,
    }

    return await post(API_ENDPOINTS.MATERIAL_REQUEST, payload);
  },

  // Update material request
  update: async (id, requestData) => {
    const prNumbers = (requestData.prNumbers || []).map(pr => ({
      prNumber: pr.prNumber,
      prDate: pr.prDate,
      pr_number: pr.prNumber,
      pr_date: pr.prDate,
    }))

    const items = (requestData.items || []).map(item => ({
      itemId: item.itemId || item.id,
      materialId: item.materialId,
      requestedQuantity: item.requestedQuantity,
      uom: item.uom,
      remarks: item.remarks,
      item_id: item.itemId || item.id,
      material_id: item.materialId,
      requested_quantity: item.requestedQuantity,
      approved_quantity: item.approvedQuantity,
    }))

    // Helper to convert empty strings to undefined for optional fields
    const cleanOptionalField = (value) => (value === '' || value === null ? undefined : value)

    const payload = {
      ticketId: cleanOptionalField(requestData.ticketId),
      ticket_id: cleanOptionalField(requestData.ticketId),
      fromStockAreaId: cleanOptionalField(requestData.fromStockAreaId),
      from_stock_area_id: cleanOptionalField(requestData.fromStockAreaId),
      requestDate: requestData.requestDate,
      request_date: requestData.requestDate,
      requestorId: cleanOptionalField(requestData.requestorId),
      requestor_id: cleanOptionalField(requestData.requestorId),
      groupId: cleanOptionalField(requestData.groupId),
      group_id: cleanOptionalField(requestData.groupId),
      teamId: cleanOptionalField(requestData.teamId),
      team_id: cleanOptionalField(requestData.teamId),
      serviceArea: cleanOptionalField(requestData.serviceArea),
      service_area: cleanOptionalField(requestData.serviceArea),
      prNumbers,
      pr_numbers: prNumbers,
      items,
      remarks: cleanOptionalField(requestData.remarks),
      status: requestData.status,
      orgId: requestData.orgId,
    }

    return await put(API_ENDPOINTS.MATERIAL_REQUEST_BY_ID(id), payload);
  },

  // Approve or reject material request
  approve: async (id, approvalData) => {
    return await post(API_ENDPOINTS.MATERIAL_REQUEST_APPROVE(id), {
      status: approvalData.status,
      approvedItems: approvalData.approvedItems,
      remarks: approvalData.remarks,
    });
  },

  // Reject material request (uses approve endpoint with REJECTED status)
  reject: async (id, rejectionData) => {
    return await post(API_ENDPOINTS.MATERIAL_REQUEST_APPROVE(id), {
      status: 'REJECTED',
      approvedItems: [],
      remarks: rejectionData.reason || rejectionData.remarks || 'Rejected by admin',
    });
  },

  // Delete material request
  delete: async (id) => {
    return await del(API_ENDPOINTS.MATERIAL_REQUEST_BY_ID(id));
  },

  // Bulk delete material requests
  bulkDelete: async (ids) => {
    return await post(`${API_ENDPOINTS.MATERIAL_REQUEST}/bulk-delete`, { ids });
  },
};









