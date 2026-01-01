import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const materialTypeService = {
  // Get all material types
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.orgId) queryParams.append('orgId', params.orgId);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.MATERIAL_TYPES}?${queryString}` : API_ENDPOINTS.MATERIAL_TYPES;
    return await get(url);
  },

  // Get material type by ID
  getById: async (id) => {
    return await get(`${API_ENDPOINTS.MATERIAL_TYPES}/${id}`);
  },

  // Create material type
  create: async (typeData) => {
    return await post(API_ENDPOINTS.MATERIAL_TYPES, {
      typeName: typeData.typeName,
      typeCode: typeData.typeCode,
      description: typeData.description,
      orgId: typeData.orgId,
    });
  },

  // Update material type
  update: async (id, typeData) => {
    return await put(`${API_ENDPOINTS.MATERIAL_TYPES}/${id}`, {
      typeName: typeData.typeName,
      typeCode: typeData.typeCode,
      description: typeData.description,
    });
  },

  // Delete material type
  delete: async (id) => {
    return await del(`${API_ENDPOINTS.MATERIAL_TYPES}/${id}`);
  },
};

