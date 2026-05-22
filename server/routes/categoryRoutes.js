// ─── categoryRoutes.js ───────────────────────────────────────────────────────
const express = require('express');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const catRouter = express.Router();

catRouter.get('/', asyncHandler(async (req, res) => {
  const cats = await Category.find({ isActive: true }).sort('sortOrder');
  res.json({ success: true, categories: cats });
}));

catRouter.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const cat = await Category.create(req.body);
  res.status(201).json({ success: true, category: cat });
}));

catRouter.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, category: cat });
}));

catRouter.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category deleted' });
}));

module.exports = catRouter;
