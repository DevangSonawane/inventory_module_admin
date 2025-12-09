import { get, post, put, del } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const materialService = {
  // Get all materials
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.materialType) queryParams.append('materialType', params.materialType);
    if (params.orgId) queryParams.append('orgId', params.orgId);
    if (params.showInactive) queryParams.append('showInactive', params.showInactive);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_ENDPOINTS.MATERIALS}?${queryString}` : API_ENDPOINTS.MATERIALS;
    return await get(url);
  },

  // Get material by ID
  getById: async (id) => {
    return await get(API_ENDPOINTS.MATERIAL_BY_ID(id));
  },

  // Create material
  create: async (materialData) => {
    return await post(API_ENDPOINTS.MATERIALS, {
      materialName: materialData.materialName,
      productCode: materialData.productCode,
      materialType: materialData.materialType,
      uom: materialData.uom || 'PIECE(S)',
      properties: materialData.properties,
      description: materialData.description,
      orgId: materialData.orgId,
    });
  },

  // Update material
  update: async (id, materialData) => {
    return await put(API_ENDPOINTS.MATERIAL_BY_ID(id), {
      materialName: materialData.materialName,
      productCode: materialData.productCode,
      materialType: materialData.materialType,
      uom: materialData.uom,
      properties: materialData.properties,
      description: materialData.description,
    });
  },

  // Delete material
  delete: async (id) => {
    return await del(API_ENDPOINTS.MATERIAL_BY_ID(id));
  },
};









