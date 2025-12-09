import { post } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const bulkService = {
  bulkMaterials: async (materials) => {
    return await post(API_ENDPOINTS.BULK_MATERIALS, { materials });
  },

  bulkInward: async (inwardEntries) => {
    return await post(API_ENDPOINTS.BULK_INWARD, { inwardEntries });
  },
};









