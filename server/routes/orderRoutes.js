const express = require('express');
const router = express.Router();
const {
  createOrder, getMyOrders, getOrder,
  getAllOrders, updateOrderStatus, cancelOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');


// Public guest order endpoint for demo/frontend checkout without login
router.post('/guest', async (req, res) => {
  const order = {
    _id: `guest_${Date.now()}`,
    orderNumber: `GP-GUEST-${Date.now().toString().slice(-6)}`,
    ...req.body,
    orderStatus: req.body.status || 'confirmed',
    createdAt: new Date().toISOString(),
  };
  res.status(201).json({ success: true, message: 'Guest order received successfully!', order });
});

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
