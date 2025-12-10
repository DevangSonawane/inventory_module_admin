import { get, put } from '../utils/apiClient.js';
import { API_BASE_URL } from '../utils/constants.js';

export const pagePermissionService = {
  // Get all available pages
  getAvailablePages: async () => {
    return await get(`${API_BASE_URL}/admin/page-permissions/pages`);
  },

  // Role permissions
  getRolePermissions: async (roleId) => {
    return await get(`${API_BASE_URL}/admin/page-permissions/roles/${roleId}`);
  },

  updateRolePermissions: async (roleId, pageIds) => {
    return await put(`${API_BASE_URL}/admin/page-permissions/roles/${roleId}`, { pageIds });
  },

  // User permissions
  getUserPermissions: async (userId) => {
    return await get(`${API_BASE_URL}/admin/page-permissions/users/${userId}`);
  },

  updateUserPermissions: async (userId, pageIds) => {
    return await put(`${API_BASE_URL}/admin/page-permissions/users/${userId}`, { pageIds });
  },

  // Get effective permissions for current user
  getMyEffectivePermissions: async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id && !user.user_id) return { success: true, data: [] };
    const userId = user.id || user.user_id;
    return await get(`${API_BASE_URL}/admin/page-permissions/users/${userId}/effective`);
  },
};

