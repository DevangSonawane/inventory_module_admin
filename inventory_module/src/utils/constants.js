// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// API Endpoints
export const API_ENDPOINTS = {
  // Health
  HEALTH: '/health',
  INVENTORY_HEALTH: '/inventory/health',
  
  // Auth
  AUTH: '/auth',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_PROFILE: '/auth/profile',
  AUTH_CHANGE_PASSWORD: '/auth/change-password',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  
  // Materials
  MATERIALS: '/inventory/materials',
  MATERIAL_BY_ID: (id) => `/inventory/materials/${id}`,
  
  // Stock Areas
  STOCK_AREAS: '/inventory/stock-areas',
  STOCK_AREA_BY_ID: (id) => `/inventory/stock-areas/${id}`,
  
  // Inward
  INWARD: '/inventory/inward',
  INWARD_BY_ID: (id) => `/inventory/inward/${id}`,
  
  // Material Requests
  MATERIAL_REQUEST: '/inventory/material-request',
  MATERIAL_REQUEST_BY_ID: (id) => `/inventory/material-request/${id}`,
  MATERIAL_REQUEST_APPROVE: (id) => `/inventory/material-request/${id}/approve`,
  
  // Stock Transfer
  STOCK_TRANSFER: '/inventory/stock-transfer',
  STOCK_TRANSFER_BY_ID: (id) => `/inventory/stock-transfer/${id}`,
  
  // Consumption
  CONSUMPTION: '/inventory/consumption',
  CONSUMPTION_BY_ID: (id) => `/inventory/consumption/${id}`,
  
  // Stock Levels
  STOCK_LEVELS: '/inventory/stock-levels',
  STOCK_LEVEL_BY_MATERIAL: (id) => `/inventory/stock-levels/${id}`,
  STOCK_SUMMARY: '/inventory/stock-summary',
  
  // Reports
  REPORTS_TRANSACTIONS: '/inventory/reports/transactions',
  REPORTS_MOVEMENT: '/inventory/reports/movement',
  REPORTS_CONSUMPTION: '/inventory/reports/consumption',
  REPORTS_VALUATION: '/inventory/reports/valuation',
  
  // Files/Documents
  DOCUMENTS: '/inventory/documents',
  DOCUMENT_BY_FILENAME: (filename) => `/inventory/documents/${filename}`,
  INWARD_DOCUMENTS: (id) => `/inventory/inward/${id}/documents`,
  PURCHASE_ORDER_DOCUMENTS: (id) => `/inventory/purchase-orders/${id}/documents`,
  
  // Audit
  AUDIT_LOGS: '/inventory/audit-logs',
  ENTITY_HISTORY: (entityType, entityId) => `/inventory/history/${entityType}/${entityId}`,
  
  // Notifications
  NOTIFICATIONS: '/inventory/notifications',
  NOTIFICATION_READ: (id) => `/inventory/notifications/${id}/read`,
  NOTIFICATION_BY_ID: (id) => `/inventory/notifications/${id}`,
  
  // Search
  SEARCH: '/inventory/search',
  
  // Bulk Operations
  BULK_MATERIALS: '/inventory/bulk/materials',
  BULK_INWARD: '/inventory/bulk/inward',
  
  // Export
  EXPORT_MATERIALS: '/inventory/export/materials',
  EXPORT_INWARD: '/inventory/export/inward',
  EXPORT_STOCK_LEVELS: '/inventory/export/stock-levels',
  
  // Validation
  VALIDATE_PRODUCT_CODE: '/inventory/validate/product-code',
  VALIDATE_SLIP_NUMBER: '/inventory/validate/slip-number',
  
  // Purchase Requests
  PURCHASE_REQUESTS: '/inventory/purchase-requests',
  PURCHASE_REQUEST_BY_ID: (id) => `/inventory/purchase-requests/${id}`,
  PURCHASE_REQUEST_GENERATE_PR_NUMBER: '/inventory/purchase-requests/generate-pr-number',
  PURCHASE_REQUEST_SUBMIT: (id) => `/inventory/purchase-requests/${id}/submit`,
  PURCHASE_REQUEST_APPROVE: (id) => `/inventory/purchase-requests/${id}/approve`,
  PURCHASE_REQUEST_REJECT: (id) => `/inventory/purchase-requests/${id}/reject`,
  
  // Purchase Orders
  PURCHASE_ORDERS: '/inventory/purchase-orders',
  PURCHASE_ORDER_BY_ID: (id) => `/inventory/purchase-orders/${id}`,
  PURCHASE_ORDER_FROM_PR: (prId) => `/inventory/purchase-orders/from-pr/${prId}`,
  PURCHASE_ORDER_SEND: (id) => `/inventory/purchase-orders/${id}/send`,
  PURCHASE_ORDER_RECEIVE: (id) => `/inventory/purchase-orders/${id}/receive`,
  
  // Business Partners
  BUSINESS_PARTNERS: '/inventory/business-partners',
  BUSINESS_PARTNER_BY_ID: (id) => `/inventory/business-partners/${id}`,
  
  // Person Stock
  PERSON_STOCK: '/inventory/person-stock',
  PERSON_STOCK_BY_TICKET: (ticketId) => `/inventory/person-stock/ticket/${ticketId}`,
  PERSON_STOCK_SEARCH: '/inventory/person-stock/search',
  
  // Returns
  RETURNS: '/inventory/returns',
  RETURNS_AVAILABLE_ITEMS: '/inventory/returns/available-items',
  RETURN_BY_ID: (id) => `/inventory/returns/${id}`,
  RETURN_APPROVE: (id) => `/inventory/returns/${id}/approve`,
  RETURN_REJECT: (id) => `/inventory/returns/${id}/reject`,
  
  // Material Allocation
  MATERIAL_ALLOCATION_AVAILABLE_STOCK: (id) => `/inventory/material-request/${id}/available-stock`,
  MATERIAL_ALLOCATION: (id) => `/inventory/material-request/${id}/allocations`,
  MATERIAL_ALLOCATION_ALLOCATE: (id) => `/inventory/material-request/${id}/allocate`,
  MATERIAL_ALLOCATION_CANCEL: (mrId, allocId) => `/inventory/material-request/${mrId}/allocations/${allocId}`,
};

// Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

