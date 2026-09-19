const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidators');
const { generateCsrfToken } = require('../middlewares/csrfMiddleware');

router.get('/csrf-token', generateCsrfToken);

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

router.get('/me', protect, authController.getMe);

module.exports = router;
