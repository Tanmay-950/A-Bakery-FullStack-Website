// ─── paymentRoutes.js ────────────────────────────────────────────────────────
const express = require('express');
const payRouter = express.Router();
const { createRazorpayOrder, verifyPayment, webhook, getRazorpayKey } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

payRouter.post('/create-order', protect, createRazorpayOrder);
payRouter.post('/verify', protect, verifyPayment);
payRouter.post('/webhook', webhook);
payRouter.get('/key', protect, getRazorpayKey);

module.exports = payRouter;
