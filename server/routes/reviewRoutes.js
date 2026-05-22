const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Create review
router.post('/', protect, asyncHandler(async (req, res) => {
  const { product, rating, comment, title, orderId } = req.body;

  // Check if user already reviewed this product
  const existing = await Review.findOne({ user: req.user.id, product });
  if (existing) {
    return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
  }

  // Check verified purchase
  let isVerifiedPurchase = false;
  if (orderId) {
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      'orderItems.product': product,
      orderStatus: 'delivered',
    });
    isVerifiedPurchase = !!order;
  }

  const review = await Review.create({
    user: req.user.id,
    product,
    order: orderId,
    rating,
    comment,
    title,
    isVerifiedPurchase,
  });

  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, message: 'Review submitted!', review });
}));

// Get product reviews
router.get('/product/:productId', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
  const reviews = await Review.find({ product: req.params.productId, isApproved: true })
    .populate('user', 'name avatar')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ product: req.params.productId, isApproved: true });

  // Rating distribution
  const distribution = await Review.aggregate([
    { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId) } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  res.json({ success: true, total, reviews, distribution });
}));

// Delete review
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted' });
}));

module.exports = router;
