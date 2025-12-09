import { post } from '../utils/apiClient.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export const validationService = {
  validateProductCode: async (productCode, orgId, excludeMaterialId) => {
    return await post(API_ENDPOINTS.VALIDATE_PRODUCT_CODE, {
      productCode,
      orgId,
      excludeMaterialId,
    });
  },

  validateSlipNumber: async (slipNumber, type, excludeId) => {
    return await post(API_ENDPOINTS.VALIDATE_SLIP_NUMBER, {
      slipNumber,
      type,
      excludeId,
    });
  },
};









