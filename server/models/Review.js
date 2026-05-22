const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: [1000, 'Review cannot exceed 1000 characters'],
  },
  images: [{
    public_id: String,
    url: String,
  }],
  isVerifiedPurchase: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: true },
}, { timestamps: true });

// One review per user per product
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to update product ratings
ReviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, numReviews: { $sum: 1 } } },
  ]);

  const Product = require('./Product');
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratings: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].numReviews,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { ratings: 0, numReviews: 0 });
  }
};

ReviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.product);
});

ReviewSchema.post('remove', function () {
  this.constructor.calcAverageRatings(this.product);
});

module.exports = mongoose.model('Review', ReviewSchema);
