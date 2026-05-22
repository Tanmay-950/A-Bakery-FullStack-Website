// ─── authRoutes.js ───────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const {
  register, login, logout, getMe, updateProfile,
  updatePassword, forgotPassword, resetPassword,
  addAddress, deleteAddress, toggleWishlist,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/update-password', protect, updatePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/addresses', protect, addAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);
router.post('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;
