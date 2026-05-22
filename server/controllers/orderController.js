const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { asyncHandler } = require('../middleware/errorHandler');
const sendEmail = require('../utils/sendEmail');

const GST_RATE = 0.05; // 5%
const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_CHARGE = 49;

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, couponCode, specialInstructions } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ success: false, message: 'No order items provided' });
  }

  // Validate products and build order items
  const validatedItems = [];
  let itemsPrice = 0;

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
    }
    if (!product.isAvailable) {
      return res.status(400).json({ success: false, message: `${product.name} is currently unavailable` });
    }

    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    validatedItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '',
      price,
      quantity: item.quantity,
      variant: item.variant || '',
    });
    itemsPrice += price * item.quantity;
  }

  // Coupon validation
  let discountAmount = 0;
  let appliedCoupon = {};

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid coupon code' });
    }
    if (coupon.isExpired) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    if (coupon.isLimitReached) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    if (itemsPrice < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order of ₹${coupon.minOrderAmount} required for this coupon`,
      });
    }
    if (coupon.usedBy.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You have already used this coupon' });
    }

    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((itemsPrice * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    appliedCoupon = { code: coupon.code, discount: discountAmount };

    // Mark coupon used
    coupon.usedCount += 1;
    coupon.usedBy.push(req.user.id);
    await coupon.save();
  }

  const priceAfterDiscount = Math.max(0, itemsPrice - discountAmount);
  const taxPrice = Math.round(priceAfterDiscount * GST_RATE);
  const shippingPrice = priceAfterDiscount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const totalPrice = priceAfterDiscount + taxPrice + shippingPrice;

  const order = await Order.create({
    user: req.user.id,
    orderItems: validatedItems,
    shippingAddress,
    paymentMethod,
    coupon: appliedCoupon,
    itemsPrice,
    taxPrice,
    shippingPrice,
    discountAmount,
    totalPrice,
    specialInstructions,
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000), // 45 min
    statusHistory: [{ status: 'pending', note: 'Order placed' }],
  });

  // Send confirmation email (non-blocking)
  try {
    const user = req.user;
    await sendEmail({
      to: user.email,
      subject: `🎉 Order Confirmed! ${order.orderNumber}`,
      template: 'orderConfirmation',
      data: {
        name: user.name,
        orderNumber: order.orderNumber || order._id,
        items: validatedItems,
        totalPrice,
        paymentMethod,
      },
    });
  } catch (err) {
    console.warn('Order confirmation email failed:', err.message);
  }

  res.status(201).json({ success: true, message: 'Order placed successfully! 🎉', order });
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user.id })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v'),
    Order.countDocuments({ user: req.user.id }),
  ]);

  res.json({ success: true, total, page: parseInt(page), orders });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('orderItems.product', 'name images');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Users can only see their own orders (admin can see all)
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
  }

  res.json({ success: true, order });
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, date } = req.query;
  const query = {};

  if (status) query.orderStatus = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    query.createdAt = { $gte: start, $lt: end };
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, total, page: parseInt(page), orders });
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, deliveryAgent } = req.body;

  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.orderStatus = status;
  order.statusHistory.push({ status, note: note || `Order ${status}`, timestamp: new Date() });

  if (status === 'delivered') {
    order.deliveredAt = new Date();
    order.paymentInfo.status = order.paymentMethod === 'cod' ? 'paid' : order.paymentInfo.status;
  }

  if (status === 'cancelled') {
    order.cancelledAt = new Date();
    order.cancellationReason = note;
  }

  if (deliveryAgent) {
    order.deliveryAgent = deliveryAgent;
  }

  await order.save();

  // Send status update email
  try {
    await sendEmail({
      to: order.user.email,
      subject: `📦 Order Update: ${status.replace(/_/g, ' ').toUpperCase()}`,
      template: 'orderStatus',
      data: {
        name: order.user.name,
        status,
        orderId: order._id,
        note,
      },
    });
  } catch (err) {
    console.warn('Order status email failed:', err.message);
  }

  res.json({ success: true, message: `Order status updated to ${status}`, order });
});

// @desc    Cancel order (User)
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  if (order.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const cancellableStatuses = ['pending', 'confirmed'];
  if (!cancellableStatuses.includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled at this stage. Contact support.',
    });
  }

  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = req.body.reason || 'Cancelled by customer';
  order.statusHistory.push({ status: 'cancelled', note: order.cancellationReason });

  await order.save();
  res.json({ success: true, message: 'Order cancelled successfully', order });
});
