import RolePagePermission from '../models/RolePagePermission.js';
import UserPagePermission from '../models/UserPagePermission.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { Op } from 'sequelize';

/**
 * Get all available pages (for reference)
 * GET /api/v1/admin/page-permissions/pages
 */
export const getAvailablePages = async (req, res) => {
  try {
    const pages = [
      // Inventory Section
      { id: 'inventory-stock', label: 'Inventory Stock', section: 'inventory' },
      { id: 'add-inward', label: 'Add Inward', section: 'inventory' },
      { id: 'inward-list', label: 'Inward List', section: 'inventory' },
      { id: 'material-request', label: 'Material Request', section: 'inventory' },
      { id: 'stock-transfer', label: 'Stock Transfer', section: 'inventory' },
      { id: 'person-stock', label: 'Person Stock', section: 'inventory' },
      { id: 'record-consumption', label: 'Record Consumption', section: 'inventory' },
      { id: 'return-stock', label: 'Return Stock', section: 'inventory' },
      
      // Management Section
      { id: 'purchase-request', label: 'Purchase Requests', section: 'management' },
      { id: 'purchase-order', label: 'Purchase Orders', section: 'management' },
      { id: 'business-partner', label: 'Business Partners', section: 'management' },
      { id: 'material-management', label: 'Material Management', section: 'management' },
      { id: 'stock-area-management', label: 'Stock Area Management', section: 'management' },
      { id: 'stock-levels', label: 'Stock Levels', section: 'management' },
      
      // Reports Section
      { id: 'reports', label: 'Reports', section: 'reports' },
      { id: 'audit-trail', label: 'Audit Trail', section: 'reports' },
      
      // Other Section
      { id: 'notifications', label: 'Notifications', section: 'other' },
      { id: 'bulk-operations', label: 'Bulk Operations', section: 'other' },
      
      // Settings (always available)
      { id: 'settings', label: 'Settings', section: 'other' },
    ];

    return res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error('Error fetching available pages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch available pages',
      error: error.message,
    });
  }
};

/**
 * Get role permissions
 * GET /api/v1/admin/page-permissions/roles/:roleId
 */
export const getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;

    const permissions = await RolePagePermission.findAll({
      where: { role_id: roleId },
      attributes: ['page_id'],
    });

    const pageIds = permissions.map(p => p.page_id);

    return res.status(200).json({
      success: true,
      data: pageIds,
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch role permissions',
      error: error.message,
    });
  }
};

/**
 * Update role permissions
 * PUT /api/v1/admin/page-permissions/roles/:roleId
 */
export const updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { pageIds } = req.body; // Array of page IDs

    // Validate role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Delete existing permissions
    await RolePagePermission.destroy({
      where: { role_id: roleId },
    });

    // Create new permissions
    if (pageIds && pageIds.length > 0) {
      await RolePagePermission.bulkCreate(
        pageIds.map(pageId => ({
          role_id: roleId,
          page_id: pageId,
        }))
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Role permissions updated successfully',
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update role permissions',
      error: error.message,
    });
  }
};

/**
 * Get user permissions
 * GET /api/v1/admin/page-permissions/users/:userId
 */
export const getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    const permissions = await UserPagePermission.findAll({
      where: { user_id: userId },
      attributes: ['page_id'],
    });

    const pageIds = permissions.map(p => p.page_id);

    return res.status(200).json({
      success: true,
      data: pageIds,
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user permissions',
      error: error.message,
    });
  }
};

/**
 * Update user permissions
 * PUT /api/v1/admin/page-permissions/users/:userId
 */
export const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { pageIds } = req.body; // Array of page IDs

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete existing permissions
    await UserPagePermission.destroy({
      where: { user_id: userId },
    });

    // Create new permissions
    if (pageIds && pageIds.length > 0) {
      await UserPagePermission.bulkCreate(
        pageIds.map(pageId => ({
          user_id: userId,
          page_id: pageId,
        }))
      );
    }

    return res.status(200).json({
      success: true,
      message: 'User permissions updated successfully',
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user permissions',
      error: error.message,
    });
  }
};

/**
 * Get effective permissions for a user (user permissions OR role permissions)
 * GET /api/v1/admin/page-permissions/users/:userId/effective
 */
export const getUserEffectivePermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has specific permissions
    const userPermissions = await UserPagePermission.findAll({
      where: { user_id: userId },
      attributes: ['page_id'],
    });

    let pageIds = [];

    if (userPermissions.length > 0) {
      // User has specific permissions, use those
      pageIds = userPermissions.map(p => p.page_id);
    } else if (user.role_id) {
      // Use role permissions
      const rolePermissions = await RolePagePermission.findAll({
        where: { role_id: user.role_id },
        attributes: ['page_id'],
      });
      pageIds = rolePermissions.map(p => p.page_id);
    }
    // If no permissions set, return empty array (will allow all in frontend)

    return res.status(200).json({
      success: true,
      data: pageIds,
      source: userPermissions.length > 0 ? 'user' : (user.role_id ? 'role' : 'none'),
    });
  } catch (error) {
    console.error('Error fetching effective permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch effective permissions',
      error: error.message,
    });
  }
};

