const mongoose = require('mongoose');

const CustomCakeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Guest info (if not logged in)
  guestName: String,
  guestPhone: String,
  guestEmail: String,

  flavor: {
    type: String,
    required: [true, 'Flavor is required'],
    enum: ['chocolate', 'vanilla', 'redvelvet', 'butterscotch', 'blackforest', 'strawberry', 'fruit', 'custom'],
  },
  weight: {
    type: String,
    required: [true, 'Weight is required'],
    enum: ['0.5', '1', '1.5', '2', '2.5', '3', '4', '5'],
  },
  tiers: { type: Number, default: 1, min: 1, max: 5 },
  messageOnCake: { type: String, maxlength: 100 },
  theme: { type: String, maxlength: 100 },
  referenceImages: [{
    public_id: String,
    url: String,
  }],
  specialInstructions: { type: String, maxlength: 500 },

  deliveryDate: { type: Date, required: [true, 'Delivery date is required'] },
  deliveryTime: String,

  shippingAddress: {
    name: String,
    phone: String,
    line1: String,
    city: String,
    state: String,
    pincode: String,
  },

  quotedPrice: { type: Number },
  finalPrice: { type: Number },

  status: {
    type: String,
    enum: ['pending', 'quote_sent', 'confirmed', 'in_progress', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
  },

  adminNotes: String,
  paymentMethod: { type: String, enum: ['razorpay', 'cod', 'advance'], default: 'cod' },
  isPaid: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('CustomCakeOrder', CustomCakeSchema);
