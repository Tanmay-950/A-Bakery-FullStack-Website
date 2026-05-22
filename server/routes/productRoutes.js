const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, getFeaturedProducts, getByCategory, toggleAvailability,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { uploadProductImage } = require('../config/cloudinary');

router.get('/featured', getFeaturedProducts);
router.get('/category/:slug', getByCategory);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', protect, authorize('admin'), uploadProductImage.array('images', 5), createProduct);
router.put('/:id', protect, authorize('admin'), uploadProductImage.array('images', 5), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.patch('/:id/toggle', protect, authorize('admin'), toggleAvailability);

module.exports = router;
