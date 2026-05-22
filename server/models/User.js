const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const AddressSchema = new mongoose.Schema({
  label:    { type: String, default: 'Home' },
  name:     { type: String, required: true },
  phone:    { type: String, required: true },
  line1:    { type: String, required: true },
  line2:    { type: String },
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pincode:  { type: String, required: true },
  isDefault:{ type: Boolean, default: false },
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [60, 'Name cannot exceed 60 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  avatar: {
    public_id: String,
    url: { type: String, default: '' },
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  addresses: [AddressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Email verification
  emailVerifyToken: String,
  emailVerifyExpire: Date,

  // OTP
  otp: String,
  otpExpire: Date,

  lastLogin: Date,
}, { timestamps: true });

// ─── Pre-save: Hash password ──────────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};

UserSchema.methods.getEmailVerifyToken = function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

UserSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

module.exports = mongoose.model('User', UserSchema);
