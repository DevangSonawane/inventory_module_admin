import PurchaseOrder from '../models/PurchaseOrder.js';
import PurchaseOrderItem from '../models/PurchaseOrderItem.js';
import PurchaseRequest from '../models/PurchaseRequest.js';
import PurchaseRequestItem from '../models/PurchaseRequestItem.js';
import Material from '../models/Material.js';
import BusinessPartner from '../models/BusinessPartner.js';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Generate PO number
 */
const generatePONumber = () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PO-${year}-${month}-${random}`;
};

/**
 * Get all purchase orders with filtering and pagination
 * GET /api/inventory/purchase-orders
 */
export const getAllPurchaseOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = '',
      vendorId = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = req.withOrg ? req.withOrg({ is_active: true }) : { is_active: true };

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendor_id = vendorId;
    }

    if (search) {
      where[Op.or] = [
        { po_number: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['po_date', 'DESC'], ['created_at', 'DESC']],
      include: [
        {
          model: PurchaseRequest,
          as: 'purchaseRequest',
          attributes: ['pr_id', 'pr_number'],
          required: false
        },
        {
          model: BusinessPartner,
          as: 'vendor',
          attributes: ['partner_id', 'partner_name'],
          required: false
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: {
        purchaseOrders: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / parseInt(limit)),
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
      error: error.message
    });
  }
};

/**
 * Get single purchase order by ID with items
 * GET /api/inventory/purchase-orders/:id
 */
export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findOne({
      where: req.withOrg
        ? req.withOrg({ po_id: id, is_active: true })
        : { po_id: id, is_active: true },
      include: [
        {
          model: PurchaseOrderItem,
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
          model: PurchaseRequest,
          as: 'purchaseRequest',
          attributes: ['pr_id', 'pr_number'],
          required: false
        },
        {
          model: BusinessPartner,
          as: 'vendor',
          required: false
        }
      ]
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { purchaseOrder }
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order',
      error: error.message
    });
  }
};

/**
 * Create purchase order from purchase request
 * POST /api/inventory/purchase-orders/from-pr/:prId
 */
export const createPOFromPR = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { prId } = req.params;
    const {
      poNumber,
      vendorId,
      poDate,
      items, // Override items from PR if needed
      remarks,
      orgId
    } = req.body;

    // Get the purchase request
    const purchaseRequest = await PurchaseRequest.findOne({
      where: { pr_id: prId, is_active: true },
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

    if (!purchaseRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found'
      });
    }

    if (purchaseRequest.status !== 'APPROVED') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only APPROVED purchase requests can be converted to purchase orders'
      });
    }

    // Validate vendor if provided
    if (vendorId) {
      const vendor = await BusinessPartner.findOne({
        where: { partner_id: vendorId, is_active: true }
      });
      if (!vendor) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid vendor ID'
        });
      }
    }

    // Generate PO number if not provided
    let finalPONumber = poNumber;
    if (!finalPONumber) {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        finalPONumber = generatePONumber();
        const existing = await PurchaseOrder.findOne({
          where: { po_number: finalPONumber }
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
          message: 'Failed to generate unique PO number'
        });
      }
    }

    // Use items from PR or provided items
    const itemsToUse = items && Array.isArray(items) && items.length > 0 
      ? items 
      : purchaseRequest.items.map(item => ({
          materialId: item.material_id,
          quantity: item.requested_quantity,
          uom: item.uom,
          unitPrice: null,
          remarks: item.remarks
        }));

    // Create purchase order
    let totalAmount = 0;
    const purchaseOrder = await PurchaseOrder.create({
      po_number: finalPONumber,
      pr_id: prId,
      vendor_id: vendorId || null,
      po_date: poDate || new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      total_amount: 0,
      remarks: remarks || null,
      org_id: orgId || null,
      is_active: true
    }, { transaction });

    // Create items
    const createdItems = [];
    for (const item of itemsToUse) {
      const { materialId, quantity, unitPrice, uom, remarks: itemRemarks } = item;

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

      const qty = parseInt(quantity) || 1;
      const price = unitPrice ? parseFloat(unitPrice) : null;
      const itemTotal = price ? qty * price : 0;
      totalAmount += itemTotal;

      const poItem = await PurchaseOrderItem.create({
        po_id: purchaseOrder.po_id,
        material_id: materialId,
        quantity: qty,
        unit_price: price,
        total_amount: itemTotal,
        uom: uom || material.uom || 'PIECE(S)',
        remarks: itemRemarks || null
      }, { transaction });

      createdItems.push(poItem);
    }

    // Update total amount
    await purchaseOrder.update({ total_amount: totalAmount }, { transaction });

    await transaction.commit();

    // Fetch created PO with items
    const createdPO = await PurchaseOrder.findOne({
      where: { po_id: purchaseOrder.po_id },
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        },
        {
          model: PurchaseRequest,
          as: 'purchaseRequest'
        },
        {
          model: BusinessPartner,
          as: 'vendor'
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: { purchaseOrder: createdPO }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating purchase order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
};

/**
 * Create new purchase order (standalone, not from PR)
 * POST /api/inventory/purchase-orders
 */
export const createPurchaseOrder = async (req, res) => {
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
      poNumber,
      vendorId,
      poDate,
      items,
      remarks,
      orgId
    } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Validate vendor if provided
    if (vendorId) {
      const vendor = await BusinessPartner.findOne({
        where: { partner_id: vendorId, is_active: true }
      });
      if (!vendor) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid vendor ID'
        });
      }
    }

    // Generate PO number if not provided
    let finalPONumber = poNumber;
    if (!finalPONumber) {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        finalPONumber = generatePONumber();
        const existing = await PurchaseOrder.findOne({
          where: { po_number: finalPONumber }
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
          message: 'Failed to generate unique PO number'
        });
      }
    }

    // Create purchase order
    let totalAmount = 0;
    const purchaseOrder = await PurchaseOrder.create({
      po_number: finalPONumber,
      pr_id: null,
      vendor_id: vendorId || null,
      po_date: poDate || new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      total_amount: 0,
      remarks: remarks || null,
      org_id: req.orgId || orgId || null,
      is_active: true
    }, { transaction });

    // Create items
    for (const item of items) {
      const { materialId, quantity, unitPrice, uom, remarks: itemRemarks } = item;

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

      const qty = parseInt(quantity) || 1;
      const price = unitPrice ? parseFloat(unitPrice) : null;
      const itemTotal = price ? qty * price : 0;
      totalAmount += itemTotal;

      await PurchaseOrderItem.create({
        po_id: purchaseOrder.po_id,
        material_id: materialId,
        quantity: qty,
        unit_price: price,
        total_amount: itemTotal,
        uom: uom || material.uom || 'PIECE(S)',
        remarks: itemRemarks || null
      }, { transaction });
    }

    // Update total amount
    await purchaseOrder.update({ total_amount: totalAmount }, { transaction });

    await transaction.commit();

    // Fetch created PO
    const createdPO = await PurchaseOrder.findOne({
      where: { po_id: purchaseOrder.po_id },
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        },
        {
          model: BusinessPartner,
          as: 'vendor'
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: { purchaseOrder: createdPO }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating purchase order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
};

/**
 * Update purchase order
 * PUT /api/inventory/purchase-orders/:id
 */
export const updatePurchaseOrder = async (req, res) => {
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
      vendorId,
      poDate,
      items,
      remarks,
      status
    } = req.body;

    const purchaseOrder = await PurchaseOrder.findOne({
      where: req.withOrg
        ? req.withOrg({ po_id: id, is_active: true })
        : { po_id: id, is_active: true }
    });

    if (!purchaseOrder) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Only allow updates if status is DRAFT
    if (purchaseOrder.status !== 'DRAFT' && status !== purchaseOrder.status) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT purchase orders can be updated'
      });
    }

    // Update PO fields
    if (vendorId !== undefined) {
      if (vendorId) {
        const vendor = await BusinessPartner.findOne({
          where: { partner_id: vendorId, is_active: true }
        });
        if (!vendor) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Invalid vendor ID'
          });
        }
      }
      purchaseOrder.vendor_id = vendorId || null;
    }
    if (poDate !== undefined) purchaseOrder.po_date = poDate;
    if (remarks !== undefined) purchaseOrder.remarks = remarks;
    if (status !== undefined) purchaseOrder.status = status;
    await purchaseOrder.save({ transaction });

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await PurchaseOrderItem.destroy({
        where: { po_id: id },
        transaction
      });

      // Recalculate total
      let totalAmount = 0;

      // Create new items
      for (const item of items) {
        const { materialId, quantity, unitPrice, uom, remarks: itemRemarks } = item;

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

        const qty = parseInt(quantity) || 1;
        const price = unitPrice ? parseFloat(unitPrice) : null;
        const itemTotal = price ? qty * price : 0;
        totalAmount += itemTotal;

        await PurchaseOrderItem.create({
          po_id: id,
          material_id: materialId,
          quantity: qty,
          unit_price: price,
          total_amount: itemTotal,
          uom: uom || material.uom || 'PIECE(S)',
          remarks: itemRemarks || null
        }, { transaction });
      }

      // Update total amount
      await purchaseOrder.update({ total_amount: totalAmount }, { transaction });
    }

    await transaction.commit();

    // Fetch updated PO
    const updatedPO = await PurchaseOrder.findOne({
      where: { po_id: id },
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        },
        {
          model: BusinessPartner,
          as: 'vendor'
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Purchase order updated successfully',
      data: { purchaseOrder: updatedPO }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating purchase order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update purchase order',
      error: error.message
    });
  }
};

/**
 * Delete purchase order (soft delete)
 * DELETE /api/inventory/purchase-orders/:id
 */
export const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findOne({
      where: req.withOrg
        ? req.withOrg({ po_id: id, is_active: true })
        : { po_id: id, is_active: true }
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Only allow deletion if status is DRAFT
    if (purchaseOrder.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT purchase orders can be deleted'
      });
    }

    await purchaseOrder.update({ is_active: false });

    return res.status(200).json({
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete purchase order',
      error: error.message
    });
  }
};

/**
 * Mark Purchase Order as SENT (when email/PO is sent to vendor)
 * POST /api/inventory/purchase-orders/:id/send
 */
export const sendPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findOne({
      where: req.withOrg
        ? req.withOrg({ po_id: id, is_active: true })
        : { po_id: id, is_active: true }
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Only allow sending if status is DRAFT
    if (purchaseOrder.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Purchase order is already ${purchaseOrder.status}. Only DRAFT orders can be sent.`
      });
    }

    await purchaseOrder.update({
      status: 'SENT'
    });

    const updatedPO = await PurchaseOrder.findOne({
      where: { po_id: id },
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        },
        {
          model: BusinessPartner,
          as: 'vendor'
        },
        {
          model: PurchaseRequest,
          as: 'purchaseRequest',
          required: false
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Purchase order marked as SENT',
      data: { purchaseOrder: updatedPO }
    });
  } catch (error) {
    console.error('Error sending purchase order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send purchase order',
      error: error.message
    });
  }
};

/**
 * Mark Purchase Order as RECEIVED (when goods are received)
 * POST /api/inventory/purchase-orders/:id/receive
 */
export const receivePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findOne({
      where: req.withOrg
        ? req.withOrg({ po_id: id, is_active: true })
        : { po_id: id, is_active: true }
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Only allow receiving if status is SENT
    if (purchaseOrder.status !== 'SENT') {
      return res.status(400).json({
        success: false,
        message: `Purchase order status is ${purchaseOrder.status}. Only SENT orders can be marked as RECEIVED.`
      });
    }

    await purchaseOrder.update({
      status: 'RECEIVED'
    });

    const updatedPO = await PurchaseOrder.findOne({
      where: { po_id: id },
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        },
        {
          model: BusinessPartner,
          as: 'vendor'
        },
        {
          model: PurchaseRequest,
          as: 'purchaseRequest',
          required: false
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Purchase order marked as RECEIVED',
      data: { purchaseOrder: updatedPO }
    });
  } catch (error) {
    console.error('Error receiving purchase order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark purchase order as received',
      error: error.message
    });
  }
};

