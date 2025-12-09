import express from 'express';
import { body, validationResult } from 'express-validator';
import Role from '../models/Role.js';

const router = express.Router();

router.post('/', 
  body('name').notEmpty().withMessage('Role name is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, description } = req.body;

      // Check if role already exists
      const existing = await Role.findOne({ where: { name } });
      if (existing) return res.status(400).json({ message: 'Role already exists' });

      const role = await Role.create({ name, description });
      res.status(201).json(role);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
});
router.get('/', async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'name', 'description', 'is_active']
    });
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
