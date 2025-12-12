/**
 * API Response Normalization Utility
 * Ensures consistent response handling across all services
 */

/**
 * Normalize pagination data from various response formats
 */
export const normalizePagination = (pagination = {}, fallback = {}) => {
  return {
    totalItems: pagination.totalItems || pagination.total || pagination.count || 0,
    totalPages: pagination.totalPages || pagination.pages || 0,
    currentPage: pagination.currentPage || pagination.page || fallback.page || 1,
    itemsPerPage: pagination.itemsPerPage || pagination.limit || pagination.perPage || fallback.limit || 10,
    hasNextPage: pagination.hasNextPage !== undefined 
      ? pagination.hasNextPage 
      : (pagination.currentPage || 1) < (pagination.totalPages || 0),
    hasPrevPage: pagination.hasPrevPage !== undefined 
      ? pagination.hasPrevPage 
      : (pagination.currentPage || 1) > 1
  };
};

/**
 * Normalize API response data
 * Handles different response formats from backend
 */
export const normalizeResponse = (response = {}, options = {}) => {
  const {
    dataKey = 'data',
    listKey = null,
    singleItem = false,
    fallbackPagination = {}
  } = options;

  // Handle direct data response
  if (response && !response.data && !response.success) {
    return {
      success: true,
      data: response,
      pagination: normalizePagination({}, fallbackPagination)
    };
  }

  // Extract data from response
  const responseData = response.data || response;
  const pagination = responseData.pagination || response.pagination || {};

  // Handle list responses
  if (listKey && Array.isArray(responseData[listKey])) {
    return {
      success: response.success !== false,
      data: responseData[listKey],
      pagination: normalizePagination(pagination, fallbackPagination),
      ...(responseData.meta && { meta: responseData.meta })
    };
  }

  // Handle single item responses
  if (singleItem) {
    return {
      success: response.success !== false,
      data: responseData[dataKey] || responseData,
      pagination: normalizePagination({}, fallbackPagination)
    };
  }

  // Handle nested data structures
  if (responseData[dataKey]) {
    return {
      success: response.success !== false,
      data: responseData[dataKey],
      pagination: normalizePagination(pagination, fallbackPagination),
      ...(responseData.meta && { meta: responseData.meta })
    };
  }

  // Default: return as-is with normalized pagination
  return {
    success: response.success !== false,
    data: responseData,
    pagination: normalizePagination(pagination, fallbackPagination),
    ...(response.meta && { meta: response.meta })
  };
};

/**
 * Normalize error response
 */
export const normalizeError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    return {
      success: false,
      message: data?.message || 'An error occurred',
      errors: data?.errors || [],
      code: data?.code || 'ERROR',
      status: status || 500
    };
  }

  if (error.request) {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      errors: [],
      code: 'NETWORK_ERROR',
      status: 0
    };
  }

  return {
    success: false,
    message: error.message || 'An unexpected error occurred',
    errors: [],
    code: 'UNKNOWN_ERROR',
    status: 0
  };
};

/**
 * Handle empty/null responses
 */
export const handleEmptyResponse = (response, defaultValue = null) => {
  if (!response || !response.data) {
    return defaultValue;
  }

  if (Array.isArray(response.data) && response.data.length === 0) {
    return defaultValue;
  }

  if (typeof response.data === 'object' && Object.keys(response.data).length === 0) {
    return defaultValue;
  }

  return response.data;
};

/**
 * Extract data from response (handles various formats)
 */
export const extractData = (response) => {
  if (!response) return null;

  // Direct data
  if (response.data && !response.success) {
    return response.data;
  }

  // Standard API response
  if (response.data) {
    return response.data;
  }

  // Direct object
  if (typeof response === 'object' && !Array.isArray(response)) {
    return response;
  }

  return response;
};
