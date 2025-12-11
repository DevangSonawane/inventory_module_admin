import express from 'express';
import { body, param } from 'express-validator';
import { validate, parseInwardItems } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { requestLogger } from '../middleware/requestLogger.js';
import { orgContext } from '../middleware/orgContext.js';
import { roleGuard } from '../middleware/roleGuard.js';
import {
  addStock,
  getAllAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getLowStockAssets,
  getAllCompanies,
  addCompany,
  getAllAssetTypes,
  addAssetType,
  getDashboardStats
} from '../controllers/inventoryController.js';
import {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial
} from '../controllers/materialController.js';
import {
  getAllStockAreas,
  getStockAreaById,
  createStockArea,
  updateStockArea,
  deleteStockArea
} from '../controllers/stockAreaController.js';
import {
  createInward,
  getAllInwards,
  getInwardById,
  updateInward,
  deleteInward,
  markInwardAsCompleted
} from '../controllers/inwardController.js';
import {
  createMaterialRequest,
  getAllMaterialRequests,
  getMaterialRequestById,
  updateMaterialRequest,
  approveMaterialRequest,
  deleteMaterialRequest
} from '../controllers/materialRequestController.js';
import {
  getAvailableStockForAllocation,
  allocateItems,
  getAllocations,
  cancelAllocation
} from '../controllers/materialAllocationController.js';
import {
  createStockTransfer,
  getAllStockTransfers,
  getStockTransferById,
  updateStockTransfer,
  deleteStockTransfer
} from '../controllers/stockTransferController.js';
import {
  createConsumption,
  getAllConsumptions,
  getConsumptionById,
  updateConsumption,
  deleteConsumption
} from '../controllers/consumptionController.js';
import {
  getPersonStock,
  getPersonStockByTicket,
  searchPersonStockBySerial
} from '../controllers/personStockController.js';
import {
  createReturn,
  getAllReturns,
  getReturnById,
  approveReturn,
  rejectReturn,
  getAvailableItemsForReturn
} from '../controllers/returnController.js';
import {
  getStockLevels,
  getStockLevelByMaterial,
  getStockSummary
} from '../controllers/stockLevelController.js';
import {
  getTransactionHistory,
  getStockMovement,
  getConsumptionAnalysis,
  getStockValuation
} from '../controllers/reportController.js';
import {
  downloadDocument,
  deleteDocument,
  addDocumentsToInward
} from '../controllers/fileController.js';
import {
  getAuditLogs,
  getEntityHistory
} from '../controllers/auditController.js';
import {
  getNotifications,
  markNotificationRead,
  deleteNotification
} from '../controllers/notificationController.js';
import {
  globalSearch
} from '../controllers/searchController.js';
import {
  bulkMaterials,
  bulkInward
} from '../controllers/bulkController.js';
import {
  exportMaterials,
  exportInward,
  exportStockLevels,
  exportStockMovement,
  exportConsumptionAnalysis,
  exportStockValuation
} from '../controllers/exportController.js';
import {
  validateProductCode,
  validateSlipNumber
} from '../controllers/validationController.js';
import {
  getAllBusinessPartners,
  getBusinessPartnerById,
  createBusinessPartner,
  updateBusinessPartner,
  deleteBusinessPartner
} from '../controllers/businessPartnerController.js';
import {
  getAllPurchaseRequests,
  getPurchaseRequestById,
  createPurchaseRequest,
  updatePurchaseRequest,
  submitPurchaseRequest,
  approvePurchaseRequest,
  rejectPurchaseRequest,
  deletePurchaseRequest
} from '../controllers/purchaseRequestController.js';
import {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPOFromPR,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  sendPurchaseOrder,
  receivePurchaseOrder
} from '../controllers/purchaseOrderController.js';
import { uploadInwardDocuments } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication and org context
router.use(authenticate);
router.use(orgContext);

// Health check
router.get("/health", (req, res) => {
  res.json({ message: "Inventory routes OK" });
});

// ==================== ASSET ROUTES ====================

/**
 * @route   POST /api/inventory/add-stock
 * @desc    Add new stock to inventory (creates new asset or updates existing)
 * @access  Private (add authentication middleware as needed)
 */
router.post(
  '/add-stock',
  [
    body('company')
      .notEmpty()
      .withMessage('Company is required')
      .trim(),
    body('assetType')
      .notEmpty()
      .withMessage('Asset type is required')
      .trim(),
    body('batchQty')
      .notEmpty()
      .withMessage('Batch quantity is required')
      .isInt({ min: 1 })
      .withMessage('Batch quantity must be a positive integer'),
    body('threshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Threshold must be a non-negative integer'),
    body('orgId')
      .optional()
      .isUUID()
      .withMessage('Invalid organization ID'),
  ],
  validate,
  addStock
);

/**
 * @route   GET /api/inventory/assets
 * @desc    Get all assets with filtering, searching, and pagination
 * @access  Private
 * @query   page, limit, search, assetType, company, orgId, showInactive
 */
router.get('/assets', getAllAssets);

/**
 * @route   GET /api/inventory/assets/:id
 * @desc    Get single asset by ID
 * @access  Private
 */
router.get(
  '/assets/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid asset ID')
  ],
  validate,
  getAssetById
);

/**
 * @route   PUT /api/inventory/assets/:id
 * @desc    Update asset details
 * @access  Private
 */
router.put(
  '/assets/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid asset ID'),
    body('assetType')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Asset type cannot be empty'),
    body('company')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Company cannot be empty'),
    body('totalIn')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Total in must be a non-negative integer'),
    body('totalOut')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Total out must be a non-negative integer'),
    body('addToOut')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Add to out must be a positive integer'),
    body('threshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Threshold must be a non-negative integer'),
  ],
  validate,
  updateAsset
);

/**
 * @route   DELETE /api/inventory/assets/:id
 * @desc    Delete (soft delete) an asset
 * @access  Private
 */
router.delete(
  '/assets/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid asset ID')
  ],
  validate,
  deleteAsset
);

/**
 * @route   GET /api/inventory/low-stock
 * @desc    Get assets with low stock (balance <= threshold)
 * @access  Private
 */
router.get('/low-stock', getLowStockAssets);

/**
 * @route   GET /api/inventory/dashboard
 * @desc    Get dashboard statistics and analytics
 * @access  Private
 */
router.get('/dashboard', getDashboardStats);

// ==================== COMPANY ROUTES ====================

/**
 * @route   GET /api/inventory/companies
 * @desc    Get all companies
 * @access  Private
 */
router.get('/companies', getAllCompanies);

/**
 * @route   POST /api/inventory/companies
 * @desc    Add new company
 * @access  Private (Admin only)
 */
router.post(
  '/companies',
  [
    body('companyCode')
      .notEmpty()
      .withMessage('Company code is required')
      .trim()
      .isLength({ min: 2, max: 10 })
      .withMessage('Company code must be 2-10 characters'),
    body('companyName')
      .notEmpty()
      .withMessage('Company name is required')
      .trim(),
    body('orgId')
      .optional()
      .isUUID()
      .withMessage('Invalid organization ID'),
  ],
  validate,
  addCompany
);

// ==================== ASSET TYPE ROUTES ====================

/**
 * @route   GET /api/inventory/asset-types
 * @desc    Get all asset types
 * @access  Private
 */
router.get('/asset-types', getAllAssetTypes);

/**
 * @route   POST /api/inventory/asset-types
 * @desc    Add new asset type
 * @access  Private (Admin only)
 */
router.post(
  '/asset-types',
  [
    body('typeName')
      .notEmpty()
      .withMessage('Type name is required')
      .trim(),
    body('typeCode')
      .notEmpty()
      .withMessage('Type code is required')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('Type code must be 2-20 characters'),
    body('description')
      .optional()
      .trim(),
    body('orgId')
      .optional()
      .isUUID()
      .withMessage('Invalid organization ID'),
  ],
  validate,
  addAssetType
);

// ==================== MATERIAL ROUTES ====================

/**
 * @route   GET /api/inventory/materials
 * @desc    Get all materials with filtering and pagination
 * @access  Private
 */
router.get('/materials', getAllMaterials);

/**
 * @route   GET /api/inventory/materials/:id
 * @desc    Get single material by ID
 * @access  Private
 */
router.get(
  '/materials/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid material ID')
  ],
  validate,
  getMaterialById
);

/**
 * @route   POST /api/inventory/materials
 * @desc    Create new material
 * @access  Private
 */
router.post(
  '/materials',
  [
    body('materialName')
      .notEmpty()
      .withMessage('Material name is required')
      .trim(),
    body('productCode')
      .notEmpty()
      .withMessage('Product code is required')
      .trim(),
    body('materialType')
      .notEmpty()
      .withMessage('Material type is required')
      .trim(),
    body('uom')
      .optional()
      .trim(),
    body('orgId')
      .optional()
      .isUUID()
      .withMessage('Invalid organization ID'),
  ],
  validate,
  createMaterial
);

/**
 * @route   PUT /api/inventory/materials/:id
 * @desc    Update material
 * @access  Private
 */
router.put(
  '/materials/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid material ID'),
    body('materialName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Material name cannot be empty'),
    body('productCode')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Product code cannot be empty'),
  ],
  validate,
  updateMaterial
);

/**
 * @route   DELETE /api/inventory/materials/:id
 * @desc    Delete material (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/materials/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid material ID')
  ],
  validate,
  roleGuard('admin'),
  deleteMaterial
);

// ==================== STOCK AREA ROUTES ====================

/**
 * @route   GET /api/inventory/stock-areas
 * @desc    Get all stock areas
 * @access  Private
 */
router.get('/stock-areas', getAllStockAreas);

/**
 * @route   GET /api/inventory/stock-areas/:id
 * @desc    Get single stock area by ID
 * @access  Private
 */
router.get(
  '/stock-areas/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid stock area ID')
  ],
  validate,
  getStockAreaById
);

/**
 * @route   POST /api/inventory/stock-areas
 * @desc    Create new stock area
 * @access  Private
 */
router.post(
  '/stock-areas',
  [
    body('areaName')
      .notEmpty()
      .withMessage('Area name is required')
      .trim(),
    body('storeKeeperId')
      .optional()
      .isInt()
      .withMessage('Invalid store keeper ID'),
    body('orgId')
      .optional()
      .isUUID()
      .withMessage('Invalid organization ID'),
  ],
  validate,
  createStockArea
);

/**
 * @route   PUT /api/inventory/stock-areas/:id
 * @desc    Update stock area
 * @access  Private
 */
router.put(
  '/stock-areas/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid stock area ID'),
    body('areaName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Area name cannot be empty'),
  ],
  validate,
  updateStockArea
);

/**
 * @route   DELETE /api/inventory/stock-areas/:id
 * @desc    Delete stock area (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/stock-areas/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid stock area ID')
  ],
  validate,
  roleGuard('admin'),
  deleteStockArea
);

// ==================== INWARD ROUTES ====================

/**
 * @route   POST /api/inventory/inward
 * @desc    Create new inward entry with items
 * @access  Private
 */
router.post(
  '/inward',
  uploadInwardDocuments, // Multer middleware must come BEFORE validation to parse FormData
  parseInwardItems, // Parse items JSON string before validation
  [
    body('invoiceNumber')
      .notEmpty()
      .withMessage('Invoice number is required')
      .trim(),
    body('partyName')
      .notEmpty()
      .withMessage('Party name is required')
      .trim(),
    body('stockAreaId')
      .notEmpty()
      .isUUID()
      .withMessage('Valid stock area ID is required'),
    body('items')
      .custom((value) => {
        // Handle both JSON string (from FormData) and array
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) && parsed.length > 0;
          } catch {
            return false;
          }
        }
        return Array.isArray(value) && value.length > 0;
      })
      .withMessage('At least one item is required'),
    body('items.*.materialId')
      .notEmpty()
      .isUUID()
      .withMessage('Valid material ID is required for each item'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
  ],
  validate,
  createInward
);

/**
 * @route   GET /api/inventory/inward
 * @desc    Get all inward entries with filtering and pagination
 * @access  Private
 */
router.get('/inward', getAllInwards);

/**
 * @route   GET /api/inventory/inward/:id
 * @desc    Get single inward entry by ID with items
 * @access  Private
 */
router.get(
  '/inward/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid inward ID')
  ],
  validate,
  getInwardById
);

/**
 * @route   PUT /api/inventory/inward/:id
 * @desc    Update inward entry
 * @access  Private
 */
router.put(
  '/inward/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid inward ID'),
    body('stockAreaId')
      .optional()
      .isUUID()
      .withMessage('Invalid stock area ID'),
  ],
  validate,
  updateInward
);

/**
 * @route   PUT /api/inventory/inward/:id/complete
 * @desc    Mark inward entry as completed
 * @access  Private (Admin only)
 */
router.put('/inward/:id/complete', roleGuard('admin'), markInwardAsCompleted);

/**
 * @route   DELETE /api/inventory/inward/:id
 * @desc    Delete inward entry (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/inward/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid inward ID')
  ],
  validate,
  roleGuard('admin'),
  deleteInward
);

// ==================== MATERIAL REQUEST ROUTES ====================

/**
 * @route   POST /api/inventory/material-request
 * @desc    Create new material request
 * @access  Private
 */
router.post(
  '/material-request',
  [
    body('prNumbers')
      .isArray({ min: 1 })
      .withMessage('At least one PR number is required'),
    body('prNumbers.*.prNumber')
      .notEmpty()
      .trim()
      .withMessage('PR number is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.materialId')
      .notEmpty()
      .isUUID()
      .withMessage('Valid material ID is required for each item'),
    body('items.*.requestedQuantity')
      .isInt({ min: 1 })
      .withMessage('Requested quantity must be a positive integer'),
    body('ticketId')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Ticket ID must be 100 characters or less'),
    body('fromStockAreaId')
      .optional()
      .isUUID()
      .withMessage('Invalid source stock area ID'),
  ],
  validate,
  createMaterialRequest
);

/**
 * @route   GET /api/inventory/material-request
 * @desc    Get all material requests with filtering and pagination
 * @access  Private
 */
router.get('/material-request', getAllMaterialRequests);

/**
 * @route   GET /api/inventory/material-request/:id
 * @desc    Get single material request by ID
 * @access  Private
 */
router.get(
  '/material-request/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid material request ID')
  ],
  validate,
  getMaterialRequestById
);

/**
 * @route   PUT /api/inventory/material-request/:id
 * @desc    Update material request
 * @access  Private
 */
router.put(
  '/material-request/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid material request ID'),
    body('ticketId')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Ticket ID must be 100 characters or less'),
    body('fromStockAreaId')
      .optional()
      .isUUID()
      .withMessage('Invalid source stock area ID'),
  ],
  validate,
  updateMaterialRequest
);

/**
 * @route   POST /api/inventory/material-request/:id/approve
 * @desc    Approve or reject material request
 * @access  Private
 */
router.post(
  '/material-request/:id/approve',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid material request ID'),
    body('status')
      .isIn(['APPROVED', 'REJECTED'])
      .withMessage('Status must be APPROVED or REJECTED'),
    body('approvedItems')
      .optional()
      .isArray()
      .withMessage('Approved items must be an array'),
  ],
  validate,
  roleGuard('admin'),
  approveMaterialRequest
);

/**
 * @route   GET /api/inventory/material-request/:id/available-stock
 * @desc    Get available stock for allocation
 * @access  Private
 * @query   stockAreaId, materialId
 */
router.get(
  '/material-request/:id/available-stock',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid material request ID')
  ],
  validate,
  getAvailableStockForAllocation
);

/**
 * @route   GET /api/inventory/material-request/:id/allocations
 * @desc    Get allocations for a material request
 * @access  Private
 */
router.get(
  '/material-request/:id/allocations',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid material request ID')
  ],
  validate,
  getAllocations
);

/**
 * @route   POST /api/inventory/material-request/:id/allocate
 * @desc    Allocate items to material request
 * @access  Private
 */
router.post(
  '/material-request/:id/allocate',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid material request ID'),
    body('allocations')
      .isArray({ min: 1 })
      .withMessage('At least one allocation is required'),
    body('allocations.*.materialRequestItemId')
      .isUUID()
      .withMessage('Valid material request item ID is required'),
    body('allocations.*.inventoryMasterIds')
      .isArray({ min: 1 })
      .withMessage('At least one inventory item ID is required'),
  ],
  validate,
  allocateItems
);

/**
 * @route   DELETE /api/inventory/material-request/:id/allocations/:allocationId
 * @desc    Cancel allocation
 * @access  Private
 */
router.delete(
  '/material-request/:id/allocations/:allocationId',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid material request ID'),
    param('allocationId')
      .isUUID()
      .withMessage('Invalid allocation ID')
  ],
  validate,
  cancelAllocation
);

/**
 * @route   DELETE /api/inventory/material-request/:id
 * @desc    Delete material request (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/material-request/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid material request ID')
  ],
  validate,
  roleGuard('admin'),
  deleteMaterialRequest
);

// ==================== STOCK TRANSFER ROUTES ====================

/**
 * @route   POST /api/inventory/stock-transfer
 * @desc    Create new stock transfer
 * @access  Private
 */
router.post(
  '/stock-transfer',
  [
    body('fromStockAreaId')
      .notEmpty()
      .isUUID()
      .withMessage('Valid source stock area ID is required'),
    body('toStockAreaId')
      .optional()
      .isUUID()
      .withMessage('Invalid destination stock area ID'),
    body('toUserId')
      .optional()
      .isInt()
      .withMessage('Invalid destination user ID'),
    body().custom((value, { req }) => {
      const rawToStock =
        value.toStockAreaId ||
        value.to_stock_area_id ||
        value.fromStockAreaId ||
        value.from_stock_area_id;
      const toUser = value.toUserId || value.to_user_id;
      if (!rawToStock && !toUser) {
        throw new Error('Either destination stock area or technician is required');
      }

      // accept camelCase or snake_case; allow sentinel values
      if (rawToStock) {
        const incoming = typeof rawToStock === 'string' ? rawToStock.trim() : rawToStock;
        const allowed = ['PERSON', 'VAN'];
        const uuidRegex = /^[0-9a-fA-F-]{36}$/;
        const upper = typeof incoming === 'string' ? incoming.toUpperCase() : incoming;
        const ok = allowed.includes(upper) || uuidRegex.test(incoming);
        if (!ok) {
          throw new Error('Valid destination stock area ID is required');
        }
        req.body.toStockAreaId = allowed.includes(upper) ? upper : incoming;
      }
      return true;
    }),
    body('ticketId')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Ticket ID must be 100 characters or less'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.materialId')
      .notEmpty()
      .isUUID()
      .withMessage('Valid material ID is required for each item'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('materialRequestId')
      .optional()
      .isUUID()
      .withMessage('Invalid material request ID'),
    // Destination stock area is mandatory; destination user is optional (can have both)
  ],
  validate,
  createStockTransfer
);

/**
 * @route   GET /api/inventory/stock-transfer
 * @desc    Get all stock transfers with filtering and pagination
 * @access  Private
 */
router.get('/stock-transfer', getAllStockTransfers);

/**
 * @route   GET /api/inventory/stock-transfer/:id
 * @desc    Get single stock transfer by ID
 * @access  Private
 */
router.get(
  '/stock-transfer/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid stock transfer ID')
  ],
  validate,
  getStockTransferById
);

/**
 * @route   PUT /api/inventory/stock-transfer/:id
 * @desc    Update stock transfer
 * @access  Private
 */
router.put(
  '/stock-transfer/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid stock transfer ID'),
    body('fromStockAreaId')
      .optional()
      .isUUID()
      .withMessage('Invalid source stock area ID'),
    body('toStockAreaId')
      .optional()
      .isUUID()
      .withMessage('Invalid destination stock area ID'),
    body('toUserId')
      .optional()
      .isInt()
      .withMessage('Invalid destination user ID'),
  ],
  validate,
  updateStockTransfer
);

/**
 * @route   DELETE /api/inventory/stock-transfer/:id
 * @desc    Delete stock transfer (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/stock-transfer/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid stock transfer ID')
  ],
  validate,
  roleGuard('admin'),
  deleteStockTransfer
);

// ==================== CONSUMPTION ROUTES ====================

/**
 * @route   POST /api/inventory/consumption
 * @desc    Create new consumption record
 * @access  Private
 */
router.post(
  '/consumption',
  [
    body('externalSystemRefId')
      .notEmpty()
      .trim()
      .withMessage('External system reference ID is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.materialId')
      .notEmpty()
      .isUUID()
      .withMessage('Valid material ID is required for each item'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('stockAreaId')
      .optional()
      .isUUID()
      .withMessage('Invalid stock area ID'),
  ],
  validate,
  createConsumption
);

/**
 * @route   GET /api/inventory/consumption
 * @desc    Get all consumption records with filtering and pagination
 * @access  Private
 */
router.get('/consumption', getAllConsumptions);

/**
 * @route   GET /api/inventory/consumption/:id
 * @desc    Get single consumption record by ID
 * @access  Private
 */
router.get(
  '/consumption/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid consumption ID')
  ],
  validate,
  getConsumptionById
);

/**
 * @route   PUT /api/inventory/consumption/:id
 * @desc    Update consumption record
 * @access  Private
 */
router.put(
  '/consumption/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid consumption ID'),
    body('stockAreaId')
      .optional()
      .isUUID()
      .withMessage('Invalid stock area ID'),
  ],
  validate,
  updateConsumption
);

/**
 * @route   DELETE /api/inventory/consumption/:id
 * @desc    Delete consumption record (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/consumption/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid consumption ID')
  ],
  validate,
  roleGuard('admin'),
  deleteConsumption
);

// ==================== PERSON STOCK ROUTES ====================

/**
 * @route   GET /api/inventory/person-stock
 * @desc    Get person stock (technician's assigned inventory)
 * @access  Private
 * @query   userId, ticketId, materialId, status, page, limit, orgId
 */
router.get('/person-stock', getPersonStock);

/**
 * @route   GET /api/inventory/person-stock/ticket/:ticketId
 * @desc    Get person stock by ticket
 * @access  Private
 * @query   userId, status, orgId
 */
router.get(
  '/person-stock/ticket/:ticketId',
  [
    param('ticketId')
      .notEmpty()
      .trim()
      .withMessage('Ticket ID is required')
  ],
  validate,
  getPersonStockByTicket
);

/**
 * @route   GET /api/inventory/person-stock/search
 * @desc    Search person stock by serial number
 * @access  Private
 * @query   serialNumber, userId, ticketId
 */
router.get('/person-stock/search', searchPersonStockBySerial);

// ==================== RETURN ROUTES ====================

/**
 * @route   GET /api/inventory/returns/available-items
 * @desc    Get technician's items available for return
 * @access  Private
 * @query   technicianId, ticketId, materialId
 */
router.get('/returns/available-items', getAvailableItemsForReturn);

/**
 * @route   POST /api/inventory/returns
 * @desc    Create new return record
 * @access  Private
 */
router.post(
  '/returns',
  [
    body('technicianId')
      .optional()
      .isInt()
      .withMessage('Invalid technician ID'),
    body('returnDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid return date'),
    body('reason')
      .isIn(['UNUSED', 'FAULTY', 'CANCELLED'])
      .withMessage('Reason must be UNUSED, FAULTY, or CANCELLED'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.materialId')
      .isUUID()
      .withMessage('Valid material ID is required for each item'),
  ],
  validate,
  createReturn
);

/**
 * @route   GET /api/inventory/returns
 * @desc    Get all return records with filtering and pagination
 * @access  Private
 */
router.get('/returns', getAllReturns);

/**
 * @route   GET /api/inventory/returns/:id
 * @desc    Get single return record by ID
 * @access  Private
 */
router.get(
  '/returns/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid return ID')
  ],
  validate,
  getReturnById
);

/**
 * @route   PUT /api/inventory/returns/:id/approve
 * @desc    Approve return and transfer items to warehouse
 * @access  Private (Admin only)
 */
router.put(
  '/returns/:id/approve',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid return ID'),
    body('stockAreaId')
      .optional()
      .isUUID()
      .withMessage('Invalid stock area ID'),
  ],
  validate,
  roleGuard('admin'),
  approveReturn
);

/**
 * @route   PUT /api/inventory/returns/:id/reject
 * @desc    Reject return record
 * @access  Private (Admin only)
 */
router.put(
  '/returns/:id/reject',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid return ID'),
  ],
  validate,
  roleGuard('admin'),
  rejectReturn
);

// ==================== STOCK LEVEL ROUTES ====================

/**
 * @route   GET /api/inventory/stock-levels
 * @desc    Get stock levels for materials
 * @access  Private
 * @query   materialId, stockAreaId, materialType, orgId
 */
router.get('/stock-levels', getStockLevels);

/**
 * @route   GET /api/inventory/stock-levels/:materialId
 * @desc    Get stock level for specific material
 * @access  Private
 * @query   stockAreaId, orgId
 */
router.get(
  '/stock-levels/:materialId',
  [
    param('materialId')
      .isUUID()
      .withMessage('Invalid material ID')
  ],
  validate,
  getStockLevelByMaterial
);

/**
 * @route   GET /api/inventory/stock-summary
 * @desc    Get stock summary across all areas
 * @access  Private
 * @query   orgId
 */
router.get('/stock-summary', getStockSummary);

// ==================== REPORTS ROUTES ====================

/**
 * @route   GET /api/inventory/reports/transactions
 * @desc    Get transaction history report
 * @access  Private
 */
router.get('/reports/transactions', getTransactionHistory);

/**
 * @route   GET /api/inventory/reports/movement
 * @desc    Get stock movement report
 * @access  Private
 */
router.get('/reports/movement', getStockMovement);

/**
 * @route   GET /api/inventory/reports/consumption
 * @desc    Get consumption analysis report
 * @access  Private
 */
router.get('/reports/consumption', getConsumptionAnalysis);

/**
 * @route   GET /api/inventory/reports/valuation
 * @desc    Get stock valuation report
 * @access  Private
 */
router.get('/reports/valuation', getStockValuation);

// ==================== FILE/DOCUMENT ROUTES ====================

/**
 * @route   GET /api/inventory/documents/:filename
 * @desc    Download document/file
 * @access  Private
 */
router.get('/documents/:filename', downloadDocument);

/**
 * @route   DELETE /api/inventory/documents/:filename
 * @desc    Delete document
 * @access  Private
 */
router.delete('/documents/:filename', deleteDocument);

/**
 * @route   POST /api/inventory/inward/:inwardId/documents
 * @desc    Add documents to existing inward entry
 * @access  Private
 */
router.post(
  '/inward/:inwardId/documents',
  uploadInwardDocuments,
  addDocumentsToInward
);

// ==================== AUDIT TRAIL ROUTES ====================

/**
 * @route   GET /api/inventory/audit-logs
 * @desc    Get audit logs/history
 * @access  Private
 */
router.get('/audit-logs', getAuditLogs);

/**
 * @route   GET /api/inventory/history/:entityType/:entityId
 * @desc    Get history for specific entity
 * @access  Private
 */
router.get('/history/:entityType/:entityId', getEntityHistory);

// ==================== NOTIFICATION ROUTES ====================

/**
 * @route   GET /api/inventory/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/notifications', getNotifications);

/**
 * @route   PUT /api/inventory/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/notifications/:notificationId/read', markNotificationRead);

/**
 * @route   DELETE /api/inventory/notifications/:notificationId
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/notifications/:notificationId', deleteNotification);

// ==================== SEARCH ROUTES ====================

/**
 * @route   GET /api/inventory/search
 * @desc    Global search across all inventory entities
 * @access  Private (rate limited)
 */
router.get(
  '/search',
  rateLimit({ windowMs: 60_000, max: 60 }),
  requestLogger('search'),
  globalSearch
);

// ==================== BULK OPERATIONS ROUTES ====================

/**
 * @route   POST /api/inventory/bulk/materials
 * @desc    Bulk create/update materials
 * @access  Private (Admin only)
 */
router.post('/bulk/materials', roleGuard('admin'), bulkMaterials);

/**
 * @route   POST /api/inventory/bulk/inward
 * @desc    Bulk create inward entries
 * @access  Private (Admin only)
 */
router.post('/bulk/inward', roleGuard('admin'), bulkInward);

// ==================== EXPORT ROUTES ====================

/**
 * @route   GET /api/inventory/export/materials
 * @desc    Export materials to CSV/JSON
 * @access  Private (Admin only)
 */
router.get('/export/materials', roleGuard('admin'), exportMaterials);

/**
 * @route   GET /api/inventory/export/inward
 * @desc    Export inward entries to CSV/JSON
 * @access  Private (Admin only)
 */
router.get('/export/inward', roleGuard('admin'), exportInward);

/**
 * @route   GET /api/inventory/export/stock-levels
 * @desc    Export stock levels to CSV/JSON
 * @access  Private (Admin only)
 */
router.get('/export/stock-levels', roleGuard('admin'), exportStockLevels);

/**
 * @route   GET /api/inventory/export/stock-movement
 * @desc    Export stock movement report to CSV/JSON
 * @access  Private (Admin only)
 */
router.get('/export/stock-movement', roleGuard('admin'), exportStockMovement);

/**
 * @route   GET /api/inventory/export/consumption-analysis
 * @desc    Export consumption analysis report to CSV/JSON
 * @access  Private (Admin only)
 */
router.get('/export/consumption-analysis', roleGuard('admin'), exportConsumptionAnalysis);

/**
 * @route   GET /api/inventory/export/stock-valuation
 * @desc    Export stock valuation report to CSV/JSON
 * @access  Private (Admin only)
 */
router.get('/export/stock-valuation', roleGuard('admin'), exportStockValuation);

// ==================== BUSINESS PARTNERS ROUTES ====================

/**
 * @route   GET /api/inventory/business-partners
 * @desc    Get all business partners with filtering and pagination
 * @access  Private
 */
router.get('/business-partners', getAllBusinessPartners);

/**
 * @route   GET /api/inventory/business-partners/:id
 * @desc    Get single business partner by ID
 * @access  Private
 */
router.get(
  '/business-partners/:id',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Invalid business partner ID')
  ],
  validate,
  getBusinessPartnerById
);

/**
 * @route   POST /api/inventory/business-partners
 * @desc    Create new business partner
 * @access  Private
 */
router.post(
  '/business-partners',
  authenticate,
  [
    body('partnerName')
      .notEmpty()
      .trim()
      .withMessage('Partner name is required'),
    body('partnerType')
      .optional()
      .isIn(['VENDOR', 'SUPPLIER', 'CUSTOMER'])
      .withMessage('Invalid partner type'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('phone')
      .optional()
      .trim(),
    body('orgId')
      .optional()
      .isUUID()
      .withMessage('Invalid organization ID')
  ],
  validate,
  createBusinessPartner
);

/**
 * @route   PUT /api/inventory/business-partners/:id
 * @desc    Update business partner
 * @access  Private
 */
router.put(
  '/business-partners/:id',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Invalid business partner ID'),
    body('partnerName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Partner name cannot be empty'),
    body('partnerType')
      .optional()
      .isIn(['VENDOR', 'SUPPLIER', 'CUSTOMER'])
      .withMessage('Invalid partner type'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
  ],
  validate,
  updateBusinessPartner
);

/**
 * @route   DELETE /api/inventory/business-partners/:id
 * @desc    Delete business partner (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/business-partners/:id',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Invalid business partner ID')
  ],
  validate,
  roleGuard('admin'),
  deleteBusinessPartner
);

// ==================== PURCHASE REQUEST ROUTES ====================

/**
 * @route   GET /api/inventory/purchase-requests
 * @desc    Get all purchase requests with filtering and pagination
 * @access  Private
 */
router.get('/purchase-requests', getAllPurchaseRequests);

/**
 * @route   GET /api/inventory/purchase-requests/:id
 * @desc    Get single purchase request by ID with items
 * @access  Private
 */
router.get(
  '/purchase-requests/:id',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Invalid purchase request ID')
  ],
  validate,
  getPurchaseRequestById
);

/**
 * @route   POST /api/inventory/purchase-requests
 * @desc    Create new purchase request with items
 * @access  Private
 */
router.post(
  '/purchase-requests',
  authenticate,
  [
    body('prNumber')
      .optional()
      .trim(),
    body('requestedDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.materialId')
      .notEmpty()
      .isUUID()
      .withMessage('Valid material ID is required for each item'),
    body('items.*.requestedQuantity')
      .isInt({ min: 1 })
      .withMessage('Requested quantity must be a positive integer'),
    body('orgId')
      .optional()
      .isUUID()
      .withMessage('Invalid organization ID')
  ],
  validate,
  createPurchaseRequest
);

/**
 * @route   PUT /api/inventory/purchase-requests/:id
 * @desc    Update purchase request
 * @access  Private
 */
router.put(
  '/purchase-requests/:id',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Invalid purchase request ID'),
    body('requestedDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('items')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one item is required if provided')
  ],
  validate,
  updatePurchaseRequest
);

/**
 * @route   PUT /api/inventory/purchase-requests/:id/submit
 * @desc    Submit purchase request (DRAFT -> SUBMITTED)
 * @access  Private
 */
router.put(
  '/purchase-requests/:id/submit',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Invalid purchase request ID')
  ],
  validate,
  submitPurchaseRequest
);

/**
 * @route   PUT /api/inventory/purchase-requests/:id/approve
 * @desc    Approve purchase request
 * @access  Private (Admin only)
 */
router.put(
  '/purchase-requests/:id/approve',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Invalid purchase request ID')
  ],
  validate,
  roleGuard('admin'),
  approvePurchaseRequest
);

/**
 * @route   PUT /api/inventory/purchase-requests/:id/reject
 * @desc    Reject purchase request
 * @access  Private (Admin only)
 */
router.put(
  '/purchase-requests/:id/reject',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Invalid purchase request ID'),
    body('remarks')
      .notEmpty()
      .trim()
      .withMessage('Rejection remarks are required')
  ],
  validate,
  roleGuard('admin'),
  rejectPurchaseRequest
);

/**
 * @route   DELETE /api/inventory/purchase-requests/:id
 * @desc    Delete purchase request (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/purchase-requests/:id',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Invalid purchase request ID')
  ],
  validate,
  roleGuard('admin'),
  deletePurchaseRequest
);

// ==================== PURCHASE ORDER ROUTES ====================

/**
 * @route   GET /api/inventory/purchase-orders
 * @desc    Get all purchase orders with filtering and pagination
 * @access  Private
 */
router.get('/purchase-orders', getAllPurchaseOrders);

/**
 * @route   POST /api/inventory/purchase-orders/from-pr/:prId
 * @desc    Create purchase order from purchase request
 * @access  Private
 * @note    This route must come before /purchase-orders/:id to avoid route conflicts
 */
router.post(
  '/purchase-orders/from-pr/:prId',
  [
    param('prId')
      .isUUID()
      .withMessage('Invalid purchase request ID'),
    body('poNumber')
      .optional()
      .trim(),
    body('vendorId')
      .optional()
      .isUUID()
      .withMessage('Invalid vendor ID'),
    body('poDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('items')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one item is required if provided'),
    body('orgId')
      .optional()
      .isUUID()
      .withMessage('Invalid organization ID')
  ],
  validate,
  createPOFromPR
);

/**
 * @route   POST /api/inventory/purchase-orders
 * @desc    Create new purchase order (standalone)
 * @access  Private
 */
router.post(
  '/purchase-orders',
  [
    body('poNumber')
      .optional()
      .trim(),
    body('vendorId')
      .optional()
      .isUUID()
      .withMessage('Invalid vendor ID'),
    body('poDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.materialId')
      .notEmpty()
      .isUUID()
      .withMessage('Valid material ID is required for each item'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('items.*.unitPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a non-negative number'),
    body('orgId')
      .optional()
      .isUUID()
      .withMessage('Invalid organization ID')
  ],
  validate,
  createPurchaseOrder
);

/**
 * @route   GET /api/inventory/purchase-orders/:id
 * @desc    Get single purchase order by ID with items
 * @access  Private
 */
router.get(
  '/purchase-orders/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid purchase order ID')
  ],
  validate,
  getPurchaseOrderById
);

/**
 * @route   PUT /api/inventory/purchase-orders/:id
 * @desc    Update purchase order
 * @access  Private
 */
router.put(
  '/purchase-orders/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid purchase order ID'),
    body('vendorId')
      .optional()
      .isUUID()
      .withMessage('Invalid vendor ID'),
    body('poDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('status')
      .optional()
      .isIn(['DRAFT', 'SENT', 'RECEIVED', 'CANCELLED'])
      .withMessage('Invalid status'),
    body('items')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one item is required if provided')
  ],
  validate,
  updatePurchaseOrder
);

/**
 * @route   POST /api/inventory/purchase-orders/:id/send
 * @desc    Mark purchase order as SENT
 * @access  Private (Admin only)
 * @note    This route must come before /purchase-orders/:id to avoid route conflicts
 */
router.post(
  '/purchase-orders/:id/send',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid purchase order ID')
  ],
  validate,
  roleGuard('admin'),
  sendPurchaseOrder
);

/**
 * @route   POST /api/inventory/purchase-orders/:id/receive
 * @desc    Mark purchase order as RECEIVED
 * @access  Private (Admin only)
 * @note    This route must come before /purchase-orders/:id to avoid route conflicts
 */
router.post(
  '/purchase-orders/:id/receive',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid purchase order ID')
  ],
  validate,
  roleGuard('admin'),
  receivePurchaseOrder
);

/**
 * @route   DELETE /api/inventory/purchase-orders/:id
 * @desc    Delete purchase order (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/purchase-orders/:id',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Invalid purchase order ID')
  ],
  validate,
  roleGuard('admin'),
  deletePurchaseOrder
);

// ==================== VALIDATION ROUTES ====================

/**
 * @route   POST /api/inventory/validate/product-code
 * @desc    Validate if product code exists
 * @access  Private
 */
router.post('/validate/product-code', validateProductCode);

/**
 * @route   POST /api/inventory/validate/slip-number
 * @desc    Validate if slip number exists
 * @access  Private
 */
router.post('/validate/slip-number', validateSlipNumber);

export default router;