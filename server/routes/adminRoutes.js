const express = require('express');
const router = express.Router();
const { getDashboardStats, getRevenueAnalytics, getAllUsers, updateUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

module.exports = router;
