const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: String,
});

const ShippingAddressSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  phone:   { type: String, required: true },
  line1:   { type: String, required: true },
  line2:   String,
  city:    { type: String, required: true },
  state:   { type: String, required: true },
  pincode: { type: String, required: true },
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderItems: [OrderItemSchema],
  shippingAddress: ShippingAddressSchema,

  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod'],
    required: true,
  },
  paymentInfo: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paidAt: Date,
  },

  coupon: {
    code: String,
    discount: { type: Number, default: 0 },
  },

  // Pricing breakdown
  itemsPrice:    { type: Number, required: true },
  taxPrice:      { type: Number, required: true },  // GST 5%
  shippingPrice: { type: Number, required: true },
  discountAmount:{ type: Number, default: 0 },
  totalPrice:    { type: Number, required: true },

  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
  },

  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
  }],

  deliveryAgent: {
    name: String,
    phone: String,
    trackingUrl: String,
  },

  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,

  specialInstructions: String,
  isReviewed: { type: Boolean, default: false },

}, { timestamps: true });

// Virtual: order number
OrderSchema.virtual('orderNumber').get(function () {
  return `GP-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Index
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ 'paymentInfo.razorpayOrderId': 1 });

module.exports = mongoose.model('Order', OrderSchema);
