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
    // Check if there are files to upload
    const hasFiles = materialData.documents && materialData.documents.length > 0;
    
    if (hasFiles) {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append('materialName', materialData.materialName);
      formData.append('productCode', materialData.productCode);
      formData.append('materialType', materialData.materialType);
      if (materialData.uom) formData.append('uom', materialData.uom);
      if (materialData.description) formData.append('description', materialData.description);
      if (materialData.hsn) formData.append('hsn', materialData.hsn);
      if (materialData.gstPercentage !== undefined && materialData.gstPercentage !== null && materialData.gstPercentage !== '') {
        formData.append('gstPercentage', materialData.gstPercentage);
      }
      if (materialData.price !== undefined && materialData.price !== null && materialData.price !== '') {
        formData.append('price', materialData.price);
      }
      if (materialData.assetId) formData.append('assetId', materialData.assetId);
      if (materialData.materialProperty) formData.append('materialProperty', materialData.materialProperty);
      if (materialData.properties) {
        formData.append('properties', typeof materialData.properties === 'string' 
          ? materialData.properties 
          : JSON.stringify(materialData.properties));
      }
      if (materialData.orgId) formData.append('orgId', materialData.orgId);
      
      // Append files
      materialData.documents.forEach((file) => {
        formData.append('documents', file);
      });
      
      // Don't set Content-Type header - let browser set it with boundary
      return await post(API_ENDPOINTS.MATERIALS, formData);
    } else {
      // Regular JSON request
      return await post(API_ENDPOINTS.MATERIALS, {
        materialName: materialData.materialName,
        productCode: materialData.productCode,
        materialType: materialData.materialType,
        uom: materialData.uom || 'PIECE(S)',
        properties: materialData.properties,
        description: materialData.description,
        hsn: materialData.hsn,
        gstPercentage: materialData.gstPercentage,
        price: materialData.price,
        assetId: materialData.assetId,
        materialProperty: materialData.materialProperty,
        orgId: materialData.orgId,
      });
    }
  },

  // Update material
  update: async (id, materialData) => {
    // Check if there are files to upload
    const hasFiles = materialData.documents && materialData.documents.length > 0;
    
    if (hasFiles) {
      // Use FormData for file uploads
      const formData = new FormData();
      if (materialData.materialName) formData.append('materialName', materialData.materialName);
      if (materialData.productCode) formData.append('productCode', materialData.productCode);
      if (materialData.materialType) formData.append('materialType', materialData.materialType);
      if (materialData.uom) formData.append('uom', materialData.uom);
      if (materialData.description !== undefined) formData.append('description', materialData.description || '');
      if (materialData.hsn !== undefined) formData.append('hsn', materialData.hsn || '');
      if (materialData.gstPercentage !== undefined && materialData.gstPercentage !== null && materialData.gstPercentage !== '') {
        formData.append('gstPercentage', materialData.gstPercentage);
      }
      if (materialData.price !== undefined && materialData.price !== null && materialData.price !== '') {
        formData.append('price', materialData.price);
      }
      if (materialData.assetId !== undefined) formData.append('assetId', materialData.assetId || '');
      if (materialData.materialProperty !== undefined) formData.append('materialProperty', materialData.materialProperty || '');
      if (materialData.properties !== undefined) {
        formData.append('properties', typeof materialData.properties === 'string' 
          ? materialData.properties 
          : JSON.stringify(materialData.properties));
      }
      
      // Append files
      materialData.documents.forEach((file) => {
        formData.append('documents', file);
      });
      
      // Don't set Content-Type header - let browser set it with boundary
      return await put(API_ENDPOINTS.MATERIAL_BY_ID(id), formData);
    } else {
      // Regular JSON request
      return await put(API_ENDPOINTS.MATERIAL_BY_ID(id), {
        materialName: materialData.materialName,
        productCode: materialData.productCode,
        materialType: materialData.materialType,
        uom: materialData.uom,
        properties: materialData.properties,
        description: materialData.description,
        hsn: materialData.hsn,
        gstPercentage: materialData.gstPercentage,
        price: materialData.price,
        assetId: materialData.assetId,
        materialProperty: materialData.materialProperty,
      });
    }
  },

  // Delete material
  delete: async (id) => {
    return await del(API_ENDPOINTS.MATERIAL_BY_ID(id));
  },
};









