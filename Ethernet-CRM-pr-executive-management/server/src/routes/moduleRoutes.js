import Module from '../models/Module.js';
import express from 'express'
import { body } from 'express-validator';
import { validationResult } from 'express-validator';

const ModuleRouter = express.Router();

ModuleRouter.post('/', 
  body('name').notEmpty().withMessage('Module name is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, description } = req.body;

      // Check if module already exists
      const existing = await Module.findOne({ where: { name } });
      if (existing) return res.status(400).json({ message: 'Module already exists' });

      const module = await Module.create({ name, description });
      res.status(201).json(module);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
});
ModuleRouter.get('/', async (req, res) => {
  try {
    const roles = await Module.findAll();
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});
export default  ModuleRouter;
