import PurchaseRequest from '../models/PurchaseRequest.js';
import PurchaseRequestItem from '../models/PurchaseRequestItem.js';
import Material from '../models/Material.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Generate PR number
 */
const generatePRNumber = () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PR-${year}-${month}-${random}`;
};

/**
 * Get all purchase requests with filtering and pagination
 * GET /api/inventory/purchase-requests
 */
export const getAllPurchaseRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = req.withOrg ? req.withOrg({ is_active: true }) : { is_active: true };

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { pr_number: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['requested_date', 'DESC'], ['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: {
        purchaseRequests: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / parseInt(limit)),
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase requests',
      error: error.message
    });
  }
};

/**
 * Get single purchase request by ID with items
 * GET /api/inventory/purchase-requests/:id
 */
export const getPurchaseRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseRequest = await PurchaseRequest.findOne({
      where: req.withOrg
        ? req.withOrg({ pr_id: id, is_active: true })
        : { pr_id: id, is_active: true },
      include: [
        {
          model: PurchaseRequestItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material',
              attributes: ['material_id', 'material_name', 'product_code', 'material_type', 'uom']
            }
          ]
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    if (!purchaseRequest) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { purchaseRequest }
    });
  } catch (error) {
    console.error('Error fetching purchase request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase request',
      error: error.message
    });
  }
};

/**
 * Create new purchase request with items
 * POST /api/inventory/purchase-requests
 */
export const createPurchaseRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg || err.message
        }))
      });
    }

    const {
      prNumber,
      requestedDate,
      items,
      remarks,
      orgId
    } = req.body;

    const userId = req.user?.id || req.user?.user_id;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Generate PR number if not provided
    let finalPRNumber = prNumber;
    if (!finalPRNumber) {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        finalPRNumber = generatePRNumber();
        const existing = await PurchaseRequest.findOne({
          where: { pr_number: finalPRNumber }
        });
        if (!existing) {
          isUnique = true;
        } else {
          attempts++;
        }
      }
      if (!isUnique) {
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          message: 'Failed to generate unique PR number'
        });
      }
    }

    // Create purchase request
    const purchaseRequest = await PurchaseRequest.create({
      pr_number: finalPRNumber,
      requested_by: userId,
      requested_date: requestedDate || new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      remarks: remarks || null,
      org_id: orgId || null,
      is_active: true
    }, { transaction });

    // Create items
    const createdItems = [];
    for (const item of items) {
      const { materialId, requestedQuantity, uom, remarks: itemRemarks } = item;

      // Validate material exists
      const material = await Material.findOne({
        where: { material_id: materialId, is_active: true }
      });

      if (!material) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Material with ID ${materialId} not found`
        });
      }

      const prItem = await PurchaseRequestItem.create({
        pr_id: purchaseRequest.pr_id,
        material_id: materialId,
        requested_quantity: parseInt(requestedQuantity) || 1,
        uom: uom || material.uom || 'PIECE(S)',
        remarks: itemRemarks || null
      }, { transaction });

      createdItems.push(prItem);
    }

    await transaction.commit();

    // Fetch created PR with items
    const createdPR = await PurchaseRequest.findOne({
      where: { pr_id: purchaseRequest.pr_id },
      include: [
        {
          model: PurchaseRequestItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Purchase request created successfully',
      data: { purchaseRequest: createdPR }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating purchase request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create purchase request',
      error: error.message
    });
  }
};

/**
 * Update purchase request
 * PUT /api/inventory/purchase-requests/:id
 */
export const updatePurchaseRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg || err.message
        }))
      });
    }

    const { id } = req.params;
    const {
      requestedDate,
      items,
      remarks
    } = req.body;

    const purchaseRequest = await PurchaseRequest.findOne({
      where: { pr_id: id, is_active: true }
    });

    if (!purchaseRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found'
      });
    }

    // Only allow updates if status is DRAFT
    if (purchaseRequest.status !== 'DRAFT') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT purchase requests can be updated'
      });
    }

    // Update PR fields
    if (requestedDate !== undefined) {
      purchaseRequest.requested_date = requestedDate;
    }
    if (remarks !== undefined) {
      purchaseRequest.remarks = remarks;
    }
    await purchaseRequest.save({ transaction });

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await PurchaseRequestItem.destroy({
        where: { pr_id: id },
        transaction
      });

      // Create new items
      for (const item of items) {
        const { materialId, requestedQuantity, uom, remarks: itemRemarks } = item;

        const material = await Material.findOne({
          where: { material_id: materialId, is_active: true }
        });

        if (!material) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Material with ID ${materialId} not found`
          });
        }

        await PurchaseRequestItem.create({
          pr_id: id,
          material_id: materialId,
          requested_quantity: parseInt(requestedQuantity) || 1,
          uom: uom || material.uom || 'PIECE(S)',
          remarks: itemRemarks || null
        }, { transaction });
      }
    }

    await transaction.commit();

    // Fetch updated PR
    const updatedPR = await PurchaseRequest.findOne({
      where: { pr_id: id },
      include: [
        {
          model: PurchaseRequestItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Purchase request updated successfully',
      data: { purchaseRequest: updatedPR }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating purchase request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update purchase request',
      error: error.message
    });
  }
};

/**
 * Submit purchase request (DRAFT -> SUBMITTED)
 * PUT /api/inventory/purchase-requests/:id/submit
 */
export const submitPurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseRequest = await PurchaseRequest.findOne({
      where: { pr_id: id, is_active: true }
    });

    if (!purchaseRequest) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found'
      });
    }

    if (purchaseRequest.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT purchase requests can be submitted'
      });
    }

    await purchaseRequest.update({ status: 'SUBMITTED' });

    return res.status(200).json({
      success: true,
      message: 'Purchase request submitted successfully',
      data: { purchaseRequest }
    });
  } catch (error) {
    console.error('Error submitting purchase request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit purchase request',
      error: error.message
    });
  }
};

/**
 * Approve purchase request
 * PUT /api/inventory/purchase-requests/:id/approve
 */
export const approvePurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const userId = req.user?.id || req.user?.user_id;

    const purchaseRequest = await PurchaseRequest.findOne({
      where: { pr_id: id, is_active: true }
    });

    if (!purchaseRequest) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found'
      });
    }

    if (purchaseRequest.status !== 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: 'Only SUBMITTED purchase requests can be approved'
      });
    }

    await purchaseRequest.update({
      status: 'APPROVED',
      approved_by: userId,
      approval_date: new Date(),
      remarks: remarks || purchaseRequest.remarks
    });

    return res.status(200).json({
      success: true,
      message: 'Purchase request approved successfully',
      data: { purchaseRequest }
    });
  } catch (error) {
    console.error('Error approving purchase request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve purchase request',
      error: error.message
    });
  }
};

/**
 * Reject purchase request
 * PUT /api/inventory/purchase-requests/:id/reject
 */
export const rejectPurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const userId = req.user?.id || req.user?.user_id;

    if (!remarks) {
      return res.status(400).json({
        success: false,
        message: 'Rejection remarks are required'
      });
    }

    const purchaseRequest = await PurchaseRequest.findOne({
      where: req.withOrg
        ? req.withOrg({ pr_id: id, is_active: true })
        : { pr_id: id, is_active: true }
    });

    if (!purchaseRequest) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found'
      });
    }

    if (purchaseRequest.status !== 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: 'Only SUBMITTED purchase requests can be rejected'
      });
    }

    await purchaseRequest.update({
      status: 'REJECTED',
      approved_by: userId,
      approval_date: new Date(),
      remarks: remarks
    });

    return res.status(200).json({
      success: true,
      message: 'Purchase request rejected successfully',
      data: { purchaseRequest }
    });
  } catch (error) {
    console.error('Error rejecting purchase request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject purchase request',
      error: error.message
    });
  }
};

/**
 * Delete purchase request (soft delete)
 * DELETE /api/inventory/purchase-requests/:id
 */
export const deletePurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseRequest = await PurchaseRequest.findOne({
      where: { pr_id: id, is_active: true }
    });

    if (!purchaseRequest) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found'
      });
    }

    // Only allow deletion if status is DRAFT
    if (purchaseRequest.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT purchase requests can be deleted'
      });
    }

    await purchaseRequest.update({ is_active: false });

    return res.status(200).json({
      success: true,
      message: 'Purchase request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting purchase request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete purchase request',
      error: error.message
    });
  }
};

