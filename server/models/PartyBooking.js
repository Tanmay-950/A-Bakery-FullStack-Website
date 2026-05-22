const mongoose = require('mongoose');

const PartyBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  name:  { type: String, required: [true, 'Name is required'] },
  phone: { type: String, required: [true, 'Phone is required'] },
  email: { type: String },

  decorationType: {
    type: String,
    required: true,
    enum: ['birthday', 'anniversary', 'baby_shower', 'balloon', 'wedding', 'corporate', 'other'],
  },

  eventDate: { type: Date, required: [true, 'Event date is required'] },
  eventTime: String,

  venue: {
    address: String,
    city: String,
    pincode: String,
    area: Number, // sq ft approx
  },

  theme: String,
  colorScheme: [String],
  guestCount: Number,
  budget: Number,

  requirements: { type: String, maxlength: 1000 },
  referenceImages: [{ public_id: String, url: String }],

  status: {
    type: String,
    enum: ['pending', 'contacted', 'quote_sent', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },

  quotedAmount: Number,
  finalAmount: Number,
  advancePaid: Number,

  adminNotes: String,
  assignedTeam: String,

}, { timestamps: true });

module.exports = mongoose.model('PartyBooking', PartyBookingSchema);
