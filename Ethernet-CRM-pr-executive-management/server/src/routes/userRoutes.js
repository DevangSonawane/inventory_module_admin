import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
];

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', authorize('admin'), getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', authorize('admin'), updateUserValidation, validate, updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;