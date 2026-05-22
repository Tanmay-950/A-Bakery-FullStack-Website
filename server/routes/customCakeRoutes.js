const express = require('express');
const router = express.Router();
const CustomCakeOrder = require('../models/CustomCakeOrder');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadCakeRef } = require('../config/cloudinary');
const sendEmail = require('../utils/sendEmail');

// Place custom cake order
router.post('/', optionalAuth, uploadCakeRef.array('referenceImages', 3), asyncHandler(async (req, res) => {
  const body = { ...req.body };

  if (req.user) {
    body.user = req.user.id;
  } else {
    if (!body.guestName || !body.guestPhone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }
  }

  if (req.files && req.files.length > 0) {
    body.referenceImages = req.files.map(f => ({ public_id: f.filename, url: f.path }));
  }

  const order = await CustomCakeOrder.create(body);

  // Notify admin
  try {
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: '🎂 New Custom Cake Order!',
      html: `<p>New custom cake order received from ${body.guestName || req.user?.name}. Order ID: ${order._id}</p>`,
    });
  } catch (e) {}

  res.status(201).json({
    success: true,
    message: 'Custom cake order placed! We\'ll contact you within 2 hours. 🎉',
    order,
  });
}));

// Get my custom cake orders
router.get('/my', protect, asyncHandler(async (req, res) => {
  const orders = await CustomCakeOrder.find({ user: req.user.id }).sort('-createdAt');
  res.json({ success: true, orders });
}));

// Get all (admin)
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const orders = await CustomCakeOrder.find(query)
    .populate('user', 'name email phone')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const total = await CustomCakeOrder.countDocuments(query);
  res.json({ success: true, total, orders });
}));

// Update status (admin)
router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const order = await CustomCakeOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
}));

module.exports = router;
