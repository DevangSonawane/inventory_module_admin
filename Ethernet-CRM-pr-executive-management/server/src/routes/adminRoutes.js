import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { 
  getAvailablePages,
  getRolePermissions,
  updateRolePermissions,
  getUserPermissions,
  updateUserPermissions,
  getUserEffectivePermissions,
} from '../controllers/pagePermissionController.js';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(roleGuard('admin'));

// Settings routes
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Page Permissions routes
router.get('/page-permissions/pages', getAvailablePages);
router.get('/page-permissions/roles/:roleId', getRolePermissions);
router.put('/page-permissions/roles/:roleId', updateRolePermissions);
router.get('/page-permissions/users/:userId', getUserPermissions);
router.put('/page-permissions/users/:userId', updateUserPermissions);
router.get('/page-permissions/users/:userId/effective', getUserEffectivePermissions);

export default router;

