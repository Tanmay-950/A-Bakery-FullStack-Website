// bookingRoutes.js
const express = require('express');
const bookingRouter = express.Router();
const PartyBooking = require('../models/PartyBooking');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

bookingRouter.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.user) body.user = req.user.id;
  const booking = await PartyBooking.create(body);
  res.status(201).json({ success: true, message: 'Booking confirmed! Team will contact you within 1 hour.', booking });
}));

bookingRouter.get('/my', protect, asyncHandler(async (req, res) => {
  const bookings = await PartyBooking.find({ user: req.user.id }).sort('-createdAt');
  res.json({ success: true, bookings });
}));

bookingRouter.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const [bookings, total] = await Promise.all([
    PartyBooking.find(query).populate('user', 'name email phone').sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit)),
    PartyBooking.countDocuments(query),
  ]);
  res.json({ success: true, total, bookings });
}));

bookingRouter.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const booking = await PartyBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  res.json({ success: true, booking });
}));

module.exports = bookingRouter;
