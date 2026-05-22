const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [120, 'Product name cannot exceed 120 characters'],
  },
  slug: { type: String, unique: true },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  shortDesc: { type: String, maxlength: 200 },

  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    default: 0,
  },

  images: [{
    public_id: String,
    url: { type: String, required: true },
    alt: String,
  }],

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },

  tags: [String],

  variants: [{
    name: String,       // e.g. "500g", "1kg", "2kg"
    price: Number,
    stock: Number,
  }],

  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },

  badge: {
    type: String,
    enum: ['bestseller', 'hot', 'premium', 'trending', 'spicy', 'loved', 'special', 'new', ''],
    default: '',
  },

  stock: { type: Number, default: 100, min: 0 },

  // Aggregated from reviews
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },

  preparationTime: { type: Number, default: 30 }, // minutes

  nutritionInfo: {
    calories: Number,
    protein: String,
    carbs: String,
    fat: String,
  },

  allergens: [String],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual for discount percentage
ProductSchema.virtual('discountPercent').get(function () {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Virtual: effective price
ProductSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

// Pre-save: generate slug
ProductSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true }) + '-' + Date.now();
  }
  next();
});

// Index for search
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, isAvailable: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ ratings: -1 });

module.exports = mongoose.model('Product', ProductSchema);
