import { post, del, upload } from '../utils/apiClient.js';
import { API_ENDPOINTS, API_BASE_URL } from '../utils/constants.js';

export const fileService = {
  downloadUrl: (filename) => {
    return `${API_BASE_URL.replace('/api/v1', '')}${API_ENDPOINTS.DOCUMENT_BY_FILENAME(filename)}`;
  },

  delete: async (filename) => {
    return await del(API_ENDPOINTS.DOCUMENT_BY_FILENAME(filename));
  },

  addToInward: async (inwardId, files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    
    return await post(API_ENDPOINTS.INWARD_DOCUMENTS(inwardId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  addToPurchaseOrder: async (poId, files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    
    return await upload(`${API_BASE_URL}${API_ENDPOINTS.PURCHASE_ORDER_DOCUMENTS(poId)}`, formData);
  },
};









