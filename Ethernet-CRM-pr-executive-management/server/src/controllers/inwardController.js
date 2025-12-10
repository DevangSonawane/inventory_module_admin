import InwardEntry from '../models/InwardEntry.js';
import InwardItem from '../models/InwardItem.js';
import Material from '../models/Material.js';
import StockArea from '../models/StockArea.js';
import InventoryMaster from '../models/InventoryMaster.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { generateGRN } from '../utils/slipGenerator.js';

/**
 * Create new inward entry with items
 * POST /api/inventory/inward
 */
export const createInward = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Parse FormData fields (multer puts them in req.body as strings)
    // Note: items is already parsed by parseInwardItems middleware
    const {
      date,
      invoiceNumber,
      partyName,
      purchaseOrder,
      poId, // Purchase Order UUID
      stockAreaId,
      vehicleNumber,
      slipNumber,
      remark,
      items, // Array of items (already parsed by middleware)
      documents // Array of document file paths/URLs
    } = req.body;

    // Get uploaded files from multer (only files with fieldname 'documents')
    const uploadedFiles = (req.files || []).filter(file => file.fieldname === 'documents');
    if (uploadedFiles.length > 0) {
      documents = uploadedFiles.map(file => `/uploads/inward/${file.filename}`);
    }

    const userId = req.user?.id || req.user?.user_id;

    // Validate stock area exists
    const stockArea = await StockArea.findOne({
      where: req.withOrg
        ? req.withOrg({ area_id: stockAreaId, is_active: true })
        : { area_id: stockAreaId, is_active: true }
    });

    if (!stockArea) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid stock area'
      });
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Use provided slip number if given, otherwise generate
    let slipNumberValue = (slipNumber || '').trim();
    if (slipNumberValue) {
      const existingSlip = await InwardEntry.findOne({
        where: req.withOrg
          ? req.withOrg({ slip_number: slipNumberValue })
          : { slip_number: slipNumberValue }
      });
      if (existingSlip) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Slip number already exists'
        });
      }
    } else {
      // Generate unique slip number
      slipNumberValue = generateGRN();
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        const existing = await InwardEntry.findOne({
          where: req.withOrg
            ? req.withOrg({ slip_number: slipNumberValue })
            : { slip_number: slipNumberValue }
        });
        if (!existing) {
          isUnique = true;
        } else {
          slipNumberValue = generateGRN();
          attempts++;
        }
      }
    }

    // Create inward entry with DRAFT status by default
    const inwardEntry = await InwardEntry.create({
      date: date || new Date().toISOString().split('T')[0],
      invoice_number: invoiceNumber,
      party_name: partyName,
      purchase_order: purchaseOrder || null,
      po_id: poId || null,
      stock_area_id: stockAreaId,
      vehicle_number: vehicleNumber || null,
      slip_number: slipNumberValue,
      status: 'DRAFT', // Start as DRAFT, will be marked COMPLETED after verification
      remark: remark || null,
      documents: documents || null,
      org_id: req.orgId || null,
      created_by: userId,
      updated_by: userId,
      is_active: true
    }, { transaction });

    // Validate and create items
    const createdItems = [];
    for (const item of items) {
      const { materialId, quantity, price, serialNumber, macId, remarks } = item;

      // Validate material exists
      const material = await Material.findOne({
        where: req.withOrg
          ? req.withOrg({ material_id: materialId, is_active: true })
          : { material_id: materialId, is_active: true }
      });

      if (!material) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Material with ID ${materialId} not found`
        });
      }

      const itemQuantity = parseInt(quantity) || 1;
      const inwardItem = await InwardItem.create({
        inward_id: inwardEntry.inward_id,
        material_id: materialId,
        quantity: itemQuantity,
        price: price ? parseFloat(price) : null,
        serial_number: serialNumber || null,
        mac_id: macId || null,
        remarks: remarks || null
      }, { transaction });

      createdItems.push(inwardItem);

      // Note: Inventory records are NOT created here for DRAFT entries
      // They will be created when the entry is marked as COMPLETED
      // This ensures inventory is only updated after verification
    }

    // Update Purchase Order status to RECEIVED if poId is provided
    if (poId) {
      try {
        const purchaseOrder = await PurchaseOrder.findOne({
          where: req.withOrg
            ? req.withOrg({ po_id: poId, is_active: true })
            : { po_id: poId, is_active: true },
          transaction
        });

        if (purchaseOrder && purchaseOrder.status === 'SENT') {
          await purchaseOrder.update(
            { status: 'RECEIVED' },
            { transaction }
          );
        }
      } catch (poError) {
        // Log error but don't fail the inward entry creation
        console.error('Error updating Purchase Order status:', poError);
      }
    }

    await transaction.commit();

    // Fetch complete inward entry with items and relations
    const completeInward = await InwardEntry.findOne({
      where: { inward_id: inwardEntry.inward_id },
      include: [
        {
          model: InwardItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        },
        {
          model: StockArea,
          as: 'stockArea'
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Inward entry created successfully',
      data: completeInward
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating inward entry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create inward entry',
      error: error.message
    });
  }
};

/**
 * Get all inward entries with filtering and pagination
 * GET /api/inventory/inward
 */
export const getAllInwards = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      stockAreaId = '',
      partyName = '',
      dateFrom = '',
      dateTo = '',
      status = '',
      showInactive = false
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 50, 1);
    const offset = (pageNumber - 1) * limitNumber;

    // Build where clause
    const whereClause = req.withOrg ? req.withOrg({}) : {};

    if (!showInactive || showInactive === 'false') {
      whereClause.is_active = true;
    }

    if (stockAreaId) {
      whereClause.stock_area_id = stockAreaId;
    }

    if (partyName) {
      whereClause.party_name = { [Op.like]: `%${partyName}%` };
    }

    if (status) {
      whereClause.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) {
        whereClause.date[Op.gte] = dateFrom;
      }
      if (dateTo) {
        whereClause.date[Op.lte] = dateTo;
      }
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { invoice_number: { [Op.like]: `%${search}%` } },
        { party_name: { [Op.like]: `%${search}%` } },
        { slip_number: { [Op.like]: `%${search}%` } },
        { purchase_order: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: inwards } = await InwardEntry.findAndCountAll({
      where: whereClause,
      limit: limitNumber,
      offset: offset,
      order: [['date', 'DESC'], ['created_at', 'DESC']],
      include: [
        {
          model: StockArea,
          as: 'stockArea',
          attributes: ['area_id', 'area_name', 'location_code']
        }
      ],
      distinct: true,
    });

    const totalInwards = typeof count === 'number' ? count : 0;

    return res.status(200).json({
      success: true,
      data: {
        inwards,
        pagination: {
          currentPage: pageNumber,
          totalPages: limitNumber ? Math.max(Math.ceil(totalInwards / limitNumber), 1) : 1,
          totalItems: totalInwards,
          itemsPerPage: limitNumber
        }
      }
    });
  } catch (error) {
    console.error('Error fetching inward entries:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch inward entries',
      error: error.message
    });
  }
};

/**
 * Get single inward entry by ID with items
 * GET /api/inventory/inward/:id
 */
export const getInwardById = async (req, res) => {
  try {
    const { id } = req.params;

    const inward = await InwardEntry.findOne({
      where: req.withOrg
        ? req.withOrg({
          inward_id: id,
          is_active: true
        })
        : {
          inward_id: id,
          is_active: true
        },
      include: [
        {
          model: InwardItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        },
        {
          model: StockArea,
          as: 'stockArea'
        }
      ]
    });

    if (!inward) {
      return res.status(404).json({
        success: false,
        message: 'Inward entry not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: inward
    });
  } catch (error) {
    console.error('Error fetching inward entry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch inward entry',
      error: error.message
    });
  }
};

/**
 * Update inward entry
 * PUT /api/inventory/inward/:id
 */
export const updateInward = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const {
      date,
      invoiceNumber,
      partyName,
      purchaseOrder,
      stockAreaId,
      vehicleNumber,
      slipNumber,
      remark,
      status,
      items, // Optional: update items
      documents
    } = req.body;

    const userId = req.user?.id || req.user?.user_id;

    const inward = await InwardEntry.findOne({
      where: req.withOrg
        ? req.withOrg({
          inward_id: id,
          is_active: true
        })
        : {
          inward_id: id,
          is_active: true
        }
    }, { transaction });

    if (!inward) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Inward entry not found'
      });
    }

    // Validate stock area if provided
    if (stockAreaId && stockAreaId !== inward.stock_area_id) {
      const stockArea = await StockArea.findOne({
        where: req.withOrg
          ? req.withOrg({ area_id: stockAreaId, is_active: true })
          : { area_id: stockAreaId, is_active: true }
      });

      if (!stockArea) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid stock area'
        });
      }
    }

    // If slip number is provided and changed, ensure uniqueness
    let newSlipNumber = inward.slip_number;
    if (slipNumber && slipNumber !== inward.slip_number) {
      const existingSlip = await InwardEntry.findOne({
        where: req.withOrg
          ? req.withOrg({ slip_number: slipNumber })
          : { slip_number: slipNumber }
      });

      if (existingSlip) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Slip number already exists'
        });
      }

      newSlipNumber = slipNumber;
    }

    // Update inward entry
    await inward.update({
      date: date || inward.date,
      invoice_number: invoiceNumber || inward.invoice_number,
      party_name: partyName || inward.party_name,
      purchase_order: purchaseOrder !== undefined ? purchaseOrder : inward.purchase_order,
      stock_area_id: stockAreaId || inward.stock_area_id,
      vehicle_number: vehicleNumber !== undefined ? vehicleNumber : inward.vehicle_number,
      slip_number: newSlipNumber,
      remark: remark !== undefined ? remark : inward.remark,
      status: status || inward.status,
      documents: documents !== undefined ? documents : inward.documents,
      updated_by: userId
    }, { transaction });

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await InwardItem.destroy({
        where: { inward_id: id },
        transaction
      });

      // Create new items
      for (const item of items) {
        const { materialId, quantity, price, serialNumber, macId, remarks } = item;

        const material = await Material.findOne({
          where: req.withOrg
            ? req.withOrg({ material_id: materialId, is_active: true })
            : { material_id: materialId, is_active: true }
        });

        if (!material) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Material with ID ${materialId} not found`
          });
        }

        await InwardItem.create({
          inward_id: id,
          material_id: materialId,
          quantity: parseInt(quantity) || 1,
          price: price ? parseFloat(price) : null,
          serial_number: serialNumber || null,
          mac_id: macId || null,
          remarks: remarks || null
        }, { transaction });
      }
    }

    await transaction.commit();

    // Fetch updated inward entry
    const updatedInward = await InwardEntry.findOne({
      where: { inward_id: id },
      include: [
        {
          model: InwardItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        },
        {
          model: StockArea,
          as: 'stockArea'
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Inward entry updated successfully',
      data: updatedInward
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating inward entry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update inward entry',
      error: error.message
    });
  }
};

/**
 * Delete inward entry (soft delete)
 * DELETE /api/inventory/inward/:id
 */
export const deleteInward = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.user_id;

    const inward = await InwardEntry.findOne({
      where: req.withOrg
        ? req.withOrg({
          inward_id: id,
          is_active: true
        })
        : {
          inward_id: id,
          is_active: true
        }
    });

    if (!inward) {
      return res.status(404).json({
        success: false,
        message: 'Inward entry not found'
      });
    }

    await inward.update({
      is_active: false,
      updated_by: userId
    });

    return res.status(200).json({
      success: true,
      message: 'Inward entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inward entry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete inward entry',
      error: error.message
    });
  }
};

/**
 * Mark inward entry as completed
 * PUT /api/inventory/inward/:id/complete
 * Business Logic:
 * - Entry must be in DRAFT status
 * - Must have at least one item
 * - All items must have valid materials
 * - Inventory must be updated successfully
 */
export const markInwardAsCompleted = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.user_id;

    // Find inward entry
    const inward = await InwardEntry.findOne({
      where: req.withOrg
        ? req.withOrg({
          inward_id: id,
          is_active: true
        })
        : {
          inward_id: id,
          is_active: true
        },
      include: [
        {
          model: InwardItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        }
      ],
      transaction
    });

    if (!inward) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Inward entry not found'
      });
    }

    // Check if already completed
    if (inward.status === 'COMPLETED') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Inward entry is already completed'
      });
    }

    // Check if cancelled
    if (inward.status === 'CANCELLED') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot complete a cancelled inward entry'
      });
    }

    // Business logic validation: Must have at least one item
    if (!inward.items || inward.items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot complete inward entry without items'
      });
    }

    // Validate all items have valid materials
    for (const item of inward.items) {
      if (!item.material || !item.material.is_active) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Item with material ${item.material_id} is invalid or inactive`
        });
      }
    }

    // Update inventory master for all items (if not already done)
    // This ensures stock is properly recorded when marking as completed
    for (const item of inward.items) {
      const itemQuantity = parseInt(item.quantity) || 1;
      
      // If serialized item, create individual records
      if (item.serial_number) {
        // Check if serial already exists
        const existingSerial = await InventoryMaster.findOne({
          where: {
            serial_number: item.serial_number,
            is_active: true,
            ...(req.orgId ? { org_id: req.orgId } : {})
          },
          transaction
        });

        if (existingSerial) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Serial number ${item.serial_number} already exists in inventory`
          });
        }

        // Check if inventory record already exists for this inward item
        const existingInventory = await InventoryMaster.findOne({
          where: {
            inward_item_id: item.item_id,
            is_active: true,
            ...(req.orgId ? { org_id: req.orgId } : {})
          },
          transaction
        });

        if (!existingInventory) {
          await InventoryMaster.create({
            material_id: item.material_id,
            serial_number: item.serial_number,
            mac_id: item.mac_id || null,
            current_location_type: 'WAREHOUSE',
            location_id: inward.stock_area_id,
            status: 'AVAILABLE',
            inward_item_id: item.item_id,
            org_id: inward.org_id || null
          }, { transaction });
        }
      } else {
        // Non-serialized item - check if inventory records exist
          const existingCount = await InventoryMaster.count({
            where: {
              inward_item_id: item.item_id,
              is_active: true,
              ...(req.orgId ? { org_id: req.orgId } : {})
            },
            transaction
          });

        // Create missing records (one per unit)
        const recordsToCreate = itemQuantity - existingCount;
        if (recordsToCreate > 0) {
          for (let i = 0; i < recordsToCreate; i++) {
            await InventoryMaster.create({
              material_id: item.material_id,
              serial_number: null,
              mac_id: null,
              current_location_type: 'WAREHOUSE',
              location_id: inward.stock_area_id,
              status: 'AVAILABLE',
              inward_item_id: item.item_id,
              org_id: inward.org_id || null
            }, { transaction });
          }
        }
      }
    }

    // Update status to COMPLETED
    await inward.update({
      status: 'COMPLETED',
      updated_by: userId
    }, { transaction });

    await transaction.commit();

    // Fetch updated inward with all relations
    const updatedInward = await InwardEntry.findOne({
      where: { inward_id: id },
      include: [
        {
          model: InwardItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            }
          ]
        },
        {
          model: StockArea,
          as: 'stockArea'
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Inward entry marked as completed successfully',
      data: { inward: updatedInward }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error marking inward as completed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark inward entry as completed',
      error: error.message
    });
  }
};










