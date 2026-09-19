const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/:username', userController.getProfile);
router.get('/:username/posts', userController.getUserPosts);

router.patch('/me/profile', protect, userController.updateProfile);
router.patch('/me/avatar', protect, upload.single('avatar'), userController.updateAvatar);
router.patch('/me/banner', protect, upload.single('banner'), userController.updateBanner);

module.exports = router;
