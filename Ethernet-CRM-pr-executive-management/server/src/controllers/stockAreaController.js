import StockArea from '../models/StockArea.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';

/**
 * Get all stock areas
 * GET /api/inventory/stock-areas
 */
export const getAllStockAreas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
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

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { area_name: { [Op.like]: `%${search}%` } },
        { location_code: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: stockAreas } = await StockArea.findAndCountAll({
      where: whereClause,
      limit: limitNumber,
      offset: offset,
      order: [['area_name', 'ASC']],
      distinct: true,
      include: [
        {
          model: User,
          as: 'storeKeeper',
          attributes: ['id', 'name', 'employeCode', 'email'],
          required: false
        }
      ]
    });

    const totalStockAreas = typeof count === 'number' ? count : 0;

    return res.status(200).json({
      success: true,
      data: {
        stockAreas,
        pagination: {
          currentPage: pageNumber,
          totalPages: limitNumber ? Math.max(Math.ceil(totalStockAreas / limitNumber), 1) : 1,
          totalItems: totalStockAreas,
          itemsPerPage: limitNumber
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stock areas:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stock areas',
      error: error.message
    });
  }
};

/**
 * Get single stock area by ID
 * GET /api/inventory/stock-areas/:id
 */
export const getStockAreaById = async (req, res) => {
  try {
    const { id } = req.params;

    const stockArea = await StockArea.findOne({
      where: req.withOrg
        ? req.withOrg({
          area_id: id,
          is_active: true
        })
        : {
          area_id: id,
          is_active: true
        }
    });

    if (!stockArea) {
      return res.status(404).json({
        success: false,
        message: 'Stock area not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: stockArea
    });
  } catch (error) {
    console.error('Error fetching stock area:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stock area',
      error: error.message
    });
  }
};

/**
 * Create new stock area
 * POST /api/inventory/stock-areas
 */
export const createStockArea = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { areaName, locationCode, address, capacity, storeKeeperId } = req.body;

    const stockArea = await StockArea.create({
      area_name: areaName,
      location_code: locationCode || null,
      address: address || null,
      capacity: capacity || null,
      store_keeper_id: storeKeeperId || null,
      org_id: req.orgId || null,
      is_active: true
    });

    return res.status(201).json({
      success: true,
      message: 'Stock area created successfully',
      data: stockArea
    });
  } catch (error) {
    console.error('Error creating stock area:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create stock area',
      error: error.message
    });
  }
};

/**
 * Update stock area
 * PUT /api/inventory/stock-areas/:id
 */
export const updateStockArea = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { areaName, locationCode, address, capacity, storeKeeperId } = req.body;

    const stockArea = await StockArea.findOne({
      where: req.withOrg
        ? req.withOrg({
          area_id: id,
          is_active: true
        })
        : {
          area_id: id,
          is_active: true
        }
    });

    if (!stockArea) {
      return res.status(404).json({
        success: false,
        message: 'Stock area not found'
      });
    }

    await stockArea.update({
      area_name: areaName || stockArea.area_name,
      location_code: locationCode !== undefined ? locationCode : stockArea.location_code,
      address: address !== undefined ? address : stockArea.address,
      capacity: capacity !== undefined ? capacity : stockArea.capacity,
      store_keeper_id: storeKeeperId !== undefined ? storeKeeperId : stockArea.store_keeper_id
    });

    return res.status(200).json({
      success: true,
      message: 'Stock area updated successfully',
      data: stockArea
    });
  } catch (error) {
    console.error('Error updating stock area:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update stock area',
      error: error.message
    });
  }
};

/**
 * Delete stock area (soft delete)
 * DELETE /api/inventory/stock-areas/:id
 */
export const deleteStockArea = async (req, res) => {
  try {
    const { id } = req.params;

    const stockArea = await StockArea.findOne({
      where: req.withOrg
        ? req.withOrg({
          area_id: id,
          is_active: true
        })
        : {
          area_id: id,
          is_active: true
        }
    });

    if (!stockArea) {
      return res.status(404).json({
        success: false,
        message: 'Stock area not found'
      });
    }

    await stockArea.update({
      is_active: false
    });

    return res.status(200).json({
      success: true,
      message: 'Stock area deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stock area:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete stock area',
      error: error.message
    });
  }
};











