const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/errorHandler');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const options = {
    amount: Math.round(order.totalPrice * 100), // Razorpay expects paise
    currency: 'INR',
    receipt: `gp_${order._id.toString().slice(-8)}`,
    notes: {
      orderId: order._id.toString(),
      customerName: req.user.name,
      customerEmail: req.user.email,
    },
  };

  const razorpayOrder = await razorpay.orders.create(options);

  // Save razorpay order ID
  order.paymentInfo.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.json({
    success: true,
    razorpayOrder,
    key: process.env.RAZORPAY_KEY_ID,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    name: 'Ghochu Pizza',
    description: `Order ${order._id}`,
    prefill: {
      name: req.user.name,
      email: req.user.email,
      contact: req.user.phone || '',
    },
  });
});

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed. Invalid signature.',
    });
  }

  // Update order
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.paymentInfo = {
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    status: 'paid',
    paidAt: new Date(),
  };
  order.orderStatus = 'confirmed';
  order.statusHistory.push({ status: 'confirmed', note: 'Payment verified via Razorpay' });

  await order.save();

  res.json({
    success: true,
    message: 'Payment verified successfully! 🎉',
    order,
  });
});

// @desc    Razorpay webhook (for server-to-server notifications)
// @route   POST /api/payments/webhook
// @access  Public (Razorpay)
exports.webhook = asyncHandler(async (req, res) => {
  const webhookSignature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (webhookSignature !== expectedSignature) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const paymentId = payload.payment.entity.id;
    const razorpayOrderId = payload.payment.entity.order_id;

    const order = await Order.findOne({ 'paymentInfo.razorpayOrderId': razorpayOrderId });
    if (order && order.paymentInfo.status !== 'paid') {
      order.paymentInfo.status = 'paid';
      order.paymentInfo.razorpayPaymentId = paymentId;
      order.paymentInfo.paidAt = new Date();
      order.orderStatus = 'confirmed';
      await order.save();
    }
  }

  if (event === 'payment.failed') {
    const razorpayOrderId = payload.payment.entity.order_id;
    const order = await Order.findOne({ 'paymentInfo.razorpayOrderId': razorpayOrderId });
    if (order) {
      order.paymentInfo.status = 'failed';
      await order.save();
    }
  }

  res.status(200).json({ success: true });
});

// @desc    Get Razorpay key (for frontend)
// @route   GET /api/payments/key
// @access  Private
exports.getRazorpayKey = asyncHandler(async (req, res) => {
  res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
});
