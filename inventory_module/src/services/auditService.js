import { get } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const auditService = {
  getAuditLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await get(`${API_ENDPOINTS.AUDIT_LOGS}${queryString ? `?${queryString}` : ''}`);
  },

  getEntityHistory: async (entityType, entityId) => {
    return await get(API_ENDPOINTS.ENTITY_HISTORY(entityType, entityId));
  },
};









