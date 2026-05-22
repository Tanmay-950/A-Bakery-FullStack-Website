const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 20,
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: 0,
  },
  maxDiscountAmount: { type: Number }, // Cap for percentage discounts
  minOrderAmount:    { type: Number, default: 0 },

  usageLimit:      { type: Number, default: null }, // null = unlimited
  usagePerUser:    { type: Number, default: 1 },
  usedCount:       { type: Number, default: 0 },

  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  excludedProducts:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  isActive:   { type: Boolean, default: true },
  isPublic:   { type: Boolean, default: true }, // visible on frontend
  validFrom:  { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },

  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Check if coupon is expired
CouponSchema.virtual('isExpired').get(function () {
  return this.validUntil < new Date();
});

// Check if limit reached
CouponSchema.virtual('isLimitReached').get(function () {
  return this.usageLimit !== null && this.usedCount >= this.usageLimit;
});

module.exports = mongoose.model('Coupon', CouponSchema);
