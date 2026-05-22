const Product = require('../models/Product');
const Review = require('../models/Review');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all products (with filters, search, pagination)
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    keyword, category, minPrice, maxPrice, rating,
    sort, page = 1, limit = 12, isVeg, isFeatured,
  } = req.query;

  const query = { isAvailable: true };

  // Text search
  if (keyword) {
    query.$text = { $search: keyword };
  }

  // Category filter
  if (category) {
    const Category = require('../models/Category');
    const cat = await Category.findOne({ slug: category });
    if (cat) query.category = cat._id;
  }

  // Price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Rating filter
  if (rating) {
    query.ratings = { $gte: Number(rating) };
  }

  // Veg filter
  if (isVeg !== undefined) {
    query.isVeg = isVeg === 'true';
  }

  // Featured filter
  if (isFeatured === 'true') {
    query.isFeatured = true;
  }

  // Sorting
  let sortOption = '-createdAt';
  if (sort === 'price_asc') sortOption = 'price';
  else if (sort === 'price_desc') sortOption = '-price';
  else if (sort === 'rating') sortOption = '-ratings';
  else if (sort === 'popular') sortOption = '-numReviews';
  else if (sort === 'newest') sortOption = '-createdAt';

  const pageNum = parseInt(page, 10);
  const limitNum = Math.min(parseInt(limit, 10), 50); // max 50 per page
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug emoji')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .select('-__v'),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    count: products.length,
    products,
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug emoji')
    .populate({ path: 'createdBy', select: 'name' });

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Get reviews
  const reviews = await Review.find({ product: product._id, isApproved: true })
    .populate('user', 'name avatar')
    .sort('-createdAt')
    .limit(10);

  res.json({ success: true, product, reviews });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isAvailable: true })
    .populate('category', 'name slug emoji')
    .sort('-ratings')
    .limit(8);

  res.json({ success: true, count: products.length, products });
});

// @desc    Create product
// @route   POST /api/products
// @access  Admin
exports.createProduct = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;

  // Handle uploaded images
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map(file => ({
      public_id: file.filename,
      url: file.path,
      alt: req.body.name,
    }));
  }

  const product = await Product.create(req.body);
  await product.populate('category', 'name slug emoji');

  res.status(201).json({ success: true, message: 'Product created successfully', product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
exports.updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Handle new images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(file => ({
      public_id: file.filename,
      url: file.path,
      alt: req.body.name || product.name,
    }));
    req.body.images = [...(product.images || []), ...newImages];
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  }).populate('category', 'name slug emoji');

  res.json({ success: true, message: 'Product updated', product });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Delete associated reviews
  await Review.deleteMany({ product: product._id });
  await product.deleteOne();

  res.json({ success: true, message: 'Product deleted successfully' });
});

// @desc    Get products by category slug
// @route   GET /api/products/category/:slug
// @access  Public
exports.getByCategory = asyncHandler(async (req, res) => {
  const Category = require('../models/Category');
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  const products = await Product.find({ category: category._id, isAvailable: true })
    .sort('-ratings')
    .limit(20);

  res.json({ success: true, category, count: products.length, products });
});

// @desc    Toggle product availability (Admin)
// @route   PATCH /api/products/:id/toggle
// @access  Admin
exports.toggleAvailability = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  product.isAvailable = !product.isAvailable;
  await product.save();

  res.json({
    success: true,
    message: `Product ${product.isAvailable ? 'activated' : 'deactivated'}`,
    isAvailable: product.isAvailable,
  });
});
