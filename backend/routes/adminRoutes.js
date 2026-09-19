const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');

router.use(protect, requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/posts', adminController.getPosts);
router.delete('/posts/:id', adminController.deletePost);
router.get('/reports', adminController.getReports);
router.patch('/reports/:id', adminController.updateReport);
router.delete('/reports/:id/target', adminController.deleteReportTarget);

module.exports = router;
