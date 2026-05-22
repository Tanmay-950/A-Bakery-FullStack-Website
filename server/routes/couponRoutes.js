// ─── couponRoutes.js ─────────────────────────────────────────────────────────
const express = require('express');
const couponRouter = express.Router();
const Coupon = require('../models/Coupon');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Validate coupon
couponRouter.post('/validate', protect, asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
  if (coupon.validUntil < new Date()) return res.status(400).json({ success: false, message: 'Coupon has expired' });
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
  if (coupon.usedBy.includes(req.user.id)) return res.status(400).json({ success: false, message: 'Already used this coupon' });
  if (orderAmount < coupon.minOrderAmount) return res.status(400).json({ success: false, message: `Min order ₹${coupon.minOrderAmount} required` });

  let discount = coupon.discountType === 'percentage'
    ? Math.round((orderAmount * coupon.discountValue) / 100)
    : coupon.discountValue;

  if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);

  res.json({ success: true, coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, discount, description: coupon.description } });
}));

// Get public coupons
couponRouter.get('/public', asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isPublic: true, isActive: true, validUntil: { $gt: new Date() } }).select('code description discountType discountValue minOrderAmount validUntil');
  res.json({ success: true, coupons });
}));

// Admin CRUD
couponRouter.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json({ success: true, coupons });
}));

couponRouter.post('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
}));

couponRouter.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, coupon });
}));

couponRouter.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Coupon deleted' });
}));

module.exports = couponRouter;
