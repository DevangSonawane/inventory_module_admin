import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const groupService = {
  // Get all groups
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.orgId) queryParams.append('orgId', params.orgId);
    if (params.showInactive) queryParams.append('showInactive', params.showInactive);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.ADMIN_GROUPS}?${queryString}` : API_ENDPOINTS.ADMIN_GROUPS;
    return await get(url);
  },

  // Get group by ID
  getById: async (id) => {
    return await get(API_ENDPOINTS.ADMIN_GROUP_BY_ID(id));
  },

  // Create group
  create: async (groupData) => {
    return await post(API_ENDPOINTS.ADMIN_GROUPS, {
      groupName: groupData.groupName,
      description: groupData.description,
      orgId: groupData.orgId,
    });
  },

  // Update group
  update: async (id, groupData) => {
    return await put(API_ENDPOINTS.ADMIN_GROUP_BY_ID(id), {
      groupName: groupData.groupName,
      description: groupData.description,
      isActive: groupData.isActive,
    });
  },

  // Delete group
  delete: async (id) => {
    return await del(API_ENDPOINTS.ADMIN_GROUP_BY_ID(id));
  },
};

