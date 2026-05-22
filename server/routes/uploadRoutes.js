const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadProductImage, uploadAvatar, cloudinary } = require('../config/cloudinary');
const { asyncHandler } = require('../middleware/errorHandler');

// Upload product images (Admin)
router.post('/product', protect, authorize('admin'),
  uploadProductImage.array('images', 5),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const images = req.files.map(f => ({ public_id: f.filename, url: f.path }));
    res.json({ success: true, images });
  })
);

// Upload avatar
router.post('/avatar', protect,
  uploadAvatar.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const User = require('../models/User');

    // Delete old avatar from Cloudinary
    const user = await User.findById(req.user.id);
    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    user.avatar = { public_id: req.file.filename, url: req.file.path };
    await user.save();

    res.json({ success: true, avatar: user.avatar });
  })
);

// Delete image (Admin)
router.delete('/:publicId', protect, authorize('admin'), asyncHandler(async (req, res) => {
  await cloudinary.uploader.destroy(req.params.publicId);
  res.json({ success: true, message: 'Image deleted' });
}));

module.exports = router;
