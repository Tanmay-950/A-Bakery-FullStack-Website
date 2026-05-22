const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// Helper to send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();

  const cookieOptions = {
    expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  const userObj = user.toObject();
  delete userObj.password;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({ success: true, message, token, user: userObj });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email is already registered' });
  }

  const user = await User.create({ name, email, password, phone });

  // Send welcome email (non-blocking)
  try {
    await sendEmail({
      to: user.email,
      subject: '🎂 Welcome to Ghochu Pizza!',
      template: 'welcome',
      data: { name: user.name },
    });
  } catch (err) {
    console.warn('Welcome email failed:', err.message);
  }

  sendTokenResponse(user, 201, res, 'Account created successfully! Welcome to Ghochu Pizza 🎉');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, `Welcome back, ${user.name}! 🍕`);
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('wishlist', 'name images price ratings');
  res.json({ success: true, user });
});

// @desc    Update profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone'];
  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true, runValidators: true,
  });

  res.json({ success: true, message: 'Profile updated', user });
});

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with that email' });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: '🔑 Reset Your Ghochu Pizza Password',
      template: 'resetPassword',
      data: { name: user.name, resetUrl },
    });
    res.json({ success: true, message: 'Password reset link sent to your email' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ success: false, message: 'Email could not be sent. Please try again.' });
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successfully');
});

// @desc    Add or update address
// @route   POST /api/auth/addresses
// @access  Private
exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (req.body.isDefault) {
    user.addresses.forEach(a => (a.isDefault = false));
  }

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({ success: true, message: 'Address added', addresses: user.addresses });
});

// @desc    Delete address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
  await user.save();

  res.json({ success: true, message: 'Address deleted', addresses: user.addresses });
});

// @desc    Toggle wishlist
// @route   POST /api/auth/wishlist/:productId
// @access  Private
exports.toggleWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const productId = req.params.productId;
  const inWishlist = user.wishlist.some(id => id.toString() === productId);

  if (inWishlist) {
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  } else {
    user.wishlist.push(productId);
  }

  await user.save();
  res.json({
    success: true,
    message: inWishlist ? 'Removed from wishlist' : 'Added to wishlist',
    inWishlist: !inWishlist,
    wishlist: user.wishlist,
  });
});
