import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const teamService = {
  // Get all teams
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.groupId) queryParams.append('groupId', params.groupId);
    if (params.orgId) queryParams.append('orgId', params.orgId);
    if (params.showInactive) queryParams.append('showInactive', params.showInactive);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.ADMIN_TEAMS}?${queryString}` : API_ENDPOINTS.ADMIN_TEAMS;
    return await get(url);
  },

  // Get teams by group ID
  getByGroup: async (groupId) => {
    return await get(API_ENDPOINTS.ADMIN_TEAMS_BY_GROUP(groupId));
  },

  // Get team by ID
  getById: async (id) => {
    return await get(API_ENDPOINTS.ADMIN_TEAM_BY_ID(id));
  },

  // Create team
  create: async (teamData) => {
    return await post(API_ENDPOINTS.ADMIN_TEAMS, {
      teamName: teamData.teamName,
      groupId: teamData.groupId,
      description: teamData.description,
      orgId: teamData.orgId,
    });
  },

  // Update team
  update: async (id, teamData) => {
    return await put(API_ENDPOINTS.ADMIN_TEAM_BY_ID(id), {
      teamName: teamData.teamName,
      groupId: teamData.groupId,
      description: teamData.description,
      isActive: teamData.isActive,
    });
  },

  // Delete team
  delete: async (id) => {
    return await del(API_ENDPOINTS.ADMIN_TEAM_BY_ID(id));
  },
};

