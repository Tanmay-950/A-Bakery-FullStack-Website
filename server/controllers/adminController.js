const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const CustomCakeOrder = require('../models/CustomCakeOrder');
const PartyBooking = require('../models/PartyBooking');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalOrders, totalUsers, totalProducts,
    todayOrders, monthOrders, lastMonthOrders,
    totalRevenue, monthRevenue, lastMonthRevenue,
    pendingOrders, preparingOrders, deliveredToday,
    customCakesPending, bookingsPending,
  ] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isAvailable: true }),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.countDocuments({ orderStatus: 'pending' }),
    Order.countDocuments({ orderStatus: 'preparing' }),
    Order.countDocuments({ orderStatus: 'delivered', deliveredAt: { $gte: startOfToday } }),
    CustomCakeOrder.countDocuments({ status: 'pending' }),
    PartyBooking.countDocuments({ status: 'pending' }),
  ]);

  const revenueTotal = totalRevenue[0]?.total || 0;
  const revenueMonth = monthRevenue[0]?.total || 0;
  const revenueLastMonth = lastMonthRevenue[0]?.total || 0;
  const revenueGrowth = revenueLastMonth > 0
    ? Math.round(((revenueMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : 100;

  res.json({
    success: true,
    stats: {
      totalOrders, totalUsers, totalProducts,
      todayOrders, monthOrders,
      totalRevenue: revenueTotal,
      monthRevenue: revenueMonth,
      revenueGrowth,
      pendingOrders, preparingOrders, deliveredToday,
      customCakesPending, bookingsPending,
    },
  });
});

// @desc    Get revenue analytics (last 30 days by day)
// @route   GET /api/admin/revenue
// @access  Admin
exports.getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const days = Math.min(parseInt(period), 365);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const dailyRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, orderStatus: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const categoryRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, orderStatus: { $ne: 'cancelled' } } },
    { $unwind: '$orderItems' },
    {
      $lookup: {
        from: 'products',
        localField: 'orderItems.product',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: '$productInfo' },
    {
      $lookup: {
        from: 'categories',
        localField: 'productInfo.category',
        foreignField: '_id',
        as: 'categoryInfo',
      },
    },
    { $unwind: '$categoryInfo' },
    {
      $group: {
        _id: '$categoryInfo.name',
        revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        count: { $sum: '$orderItems.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const topProducts = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        quantity: { $sum: '$orderItems.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  res.json({ success: true, dailyRevenue, categoryRevenue, topProducts });
});

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) query.role = role;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password -resetPasswordToken -emailVerifyToken -otp')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  res.json({ success: true, total, users });
});

// @desc    Update user role / status (Admin)
// @route   PUT /api/admin/users/:id
// @access  Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;
  const updates = {};
  if (role) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  res.json({ success: true, message: 'User updated', user });
});
