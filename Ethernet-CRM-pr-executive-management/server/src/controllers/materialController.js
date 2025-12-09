import Material from '../models/Material.js';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';

/**
 * Get all materials with filtering and pagination
 * GET /api/inventory/materials
 */
export const getAllMaterials = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      materialType = '',
      orgId = '',
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
        { material_name: { [Op.like]: `%${search}%` } },
        { product_code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Material type filter
    if (materialType && materialType !== 'All Types' && materialType !== '') {
      whereClause.material_type = materialType;
    }

    const { count, rows: materials } = await Material.findAndCountAll({
      where: whereClause,
      limit: limitNumber,
      offset: offset,
      order: [['material_name', 'ASC']],
      distinct: true,
    });

    const totalMaterials = typeof count === 'number' ? count : 0;

    return res.status(200).json({
      success: true,
      data: {
        materials,
        pagination: {
          currentPage: pageNumber,
          totalPages: limitNumber ? Math.max(Math.ceil(totalMaterials / limitNumber), 1) : 1,
          totalItems: totalMaterials,
          itemsPerPage: limitNumber
        }
      }
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch materials',
      error: error.message
    });
  }
};

/**
 * Get single material by ID
 * GET /api/inventory/materials/:id
 */
export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await Material.findOne({
      where: req.withOrg
        ? req.withOrg({ material_id: id, is_active: true })
        : { material_id: id, is_active: true }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch material',
      error: error.message
    });
  }
};

/**
 * Create new material
 * POST /api/inventory/materials
 */
export const createMaterial = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { materialName, productCode, materialType, uom, properties, description, orgId } = req.body;

    // Check if material with same product code already exists
    const existingMaterial = await Material.findOne({
      where: {
        product_code: productCode,
        org_id: orgId || null
      }
    });

    if (existingMaterial) {
      return res.status(400).json({
        success: false,
        message: 'Material with this product code already exists'
      });
    }

    const material = await Material.create({
      material_name: materialName,
      product_code: productCode,
      material_type: materialType,
      uom: uom || 'PIECE(S)',
      properties: properties || null,
      description: description || null,
      org_id: req.orgId || orgId || null,
      is_active: true
    });

    return res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: material
    });
  } catch (error) {
    console.error('Error creating material:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create material',
      error: error.message
    });
  }
};

/**
 * Update material
 * PUT /api/inventory/materials/:id
 */
export const updateMaterial = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { materialName, productCode, materialType, uom, properties, description } = req.body;

    const material = await Material.findOne({
      where: req.withOrg
        ? req.withOrg({ material_id: id, is_active: true })
        : { material_id: id, is_active: true }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    // Check if product code is being changed and if new code already exists
    if (productCode && productCode !== material.product_code) {
      const existingMaterial = await Material.findOne({
        where: req.withOrg
          ? req.withOrg({ product_code: productCode, material_id: { [Op.ne]: id } })
          : {
              product_code: productCode,
              org_id: material.org_id,
              material_id: { [Op.ne]: id }
            }
      });

      if (existingMaterial) {
        return res.status(400).json({
          success: false,
          message: 'Material with this product code already exists'
        });
      }
    }

    await material.update({
      material_name: materialName || material.material_name,
      product_code: productCode || material.product_code,
      material_type: materialType || material.material_type,
      uom: uom || material.uom,
      properties: properties !== undefined ? properties : material.properties,
      description: description !== undefined ? description : material.description
    });

    return res.status(200).json({
      success: true,
      message: 'Material updated successfully',
      data: material
    });
  } catch (error) {
    console.error('Error updating material:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update material',
      error: error.message
    });
  }
};

/**
 * Delete material (soft delete)
 * DELETE /api/inventory/materials/:id
 */
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await Material.findOne({
      where: req.withOrg
        ? req.withOrg({ material_id: id, is_active: true })
        : { material_id: id, is_active: true }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    await material.update({
      is_active: false
    });

    return res.status(200).json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete material',
      error: error.message
    });
  }
};











