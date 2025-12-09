import { get, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const notificationService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await get(`${API_ENDPOINTS.NOTIFICATIONS}${queryString ? `?${queryString}` : ''}`);
  },

  markAsRead: async (notificationId) => {
    return await put(API_ENDPOINTS.NOTIFICATION_READ(notificationId));
  },

  delete: async (notificationId) => {
    return await del(API_ENDPOINTS.NOTIFICATION_BY_ID(notificationId));
  },
};









