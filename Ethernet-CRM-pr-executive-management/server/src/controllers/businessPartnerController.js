import BusinessPartner from '../models/BusinessPartner.js';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';

/**
 * Get all business partners with filtering and pagination
 * GET /api/inventory/business-partners
 */
export const getAllBusinessPartners = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      partnerType = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = req.withOrg ? req.withOrg({ is_active: true }) : { is_active: true };

    if (partnerType) {
      where.partner_type = partnerType;
    }

    if (search) {
      where[Op.or] = [
        { partner_name: { [Op.like]: `%${search}%` } },
        { contact_person: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await BusinessPartner.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['partner_name', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        businessPartners: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / parseInt(limit)),
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching business partners:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch business partners',
      error: error.message
    });
  }
};

/**
 * Get single business partner by ID
 * GET /api/inventory/business-partners/:id
 */
export const getBusinessPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const businessPartner = await BusinessPartner.findOne({
      where: req.withOrg
        ? req.withOrg({ partner_id: id, is_active: true })
        : { partner_id: id, is_active: true }
    });

    if (!businessPartner) {
      return res.status(404).json({
        success: false,
        message: 'Business partner not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { businessPartner }
    });
  } catch (error) {
    console.error('Error fetching business partner:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch business partner',
      error: error.message
    });
  }
};

/**
 * Create new business partner
 * POST /api/inventory/business-partners
 */
export const createBusinessPartner = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
      partnerName,
      partnerType,
      contactPerson,
      email,
      phone,
      address,
      orgId
    } = req.body;

    const businessPartner = await BusinessPartner.create({
      partner_name: partnerName,
      partner_type: partnerType || 'VENDOR',
      contact_person: contactPerson || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      org_id: req.orgId || orgId || null,
      is_active: true
    });

    return res.status(201).json({
      success: true,
      message: 'Business partner created successfully',
      data: { businessPartner }
    });
  } catch (error) {
    console.error('Error creating business partner:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create business partner',
      error: error.message
    });
  }
};

/**
 * Update business partner
 * PUT /api/inventory/business-partners/:id
 */
export const updateBusinessPartner = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
      partnerName,
      partnerType,
      contactPerson,
      email,
      phone,
      address
    } = req.body;

    const businessPartner = await BusinessPartner.findOne({
      where: req.withOrg
        ? req.withOrg({ partner_id: id, is_active: true })
        : { partner_id: id, is_active: true }
    });

    if (!businessPartner) {
      return res.status(404).json({
        success: false,
        message: 'Business partner not found'
      });
    }

    await businessPartner.update({
      partner_name: partnerName !== undefined ? partnerName : businessPartner.partner_name,
      partner_type: partnerType !== undefined ? partnerType : businessPartner.partner_type,
      contact_person: contactPerson !== undefined ? contactPerson : businessPartner.contact_person,
      email: email !== undefined ? email : businessPartner.email,
      phone: phone !== undefined ? phone : businessPartner.phone,
      address: address !== undefined ? address : businessPartner.address
    });

    return res.status(200).json({
      success: true,
      message: 'Business partner updated successfully',
      data: { businessPartner }
    });
  } catch (error) {
    console.error('Error updating business partner:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update business partner',
      error: error.message
    });
  }
};

/**
 * Delete business partner (soft delete)
 * DELETE /api/inventory/business-partners/:id
 */
export const deleteBusinessPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const businessPartner = await BusinessPartner.findOne({
      where: { partner_id: id, is_active: true }
    });

    if (!businessPartner) {
      return res.status(404).json({
        success: false,
        message: 'Business partner not found'
      });
    }

    await businessPartner.update({ is_active: false });

    return res.status(200).json({
      success: true,
      message: 'Business partner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting business partner:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete business partner',
      error: error.message
    });
  }
};

