const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { protect } = require('../middlewares/authMiddleware');
const { createLimiter } = require('../middlewares/rateLimitMiddleware');
const Joi = require('joi');
const { validate } = require('../middlewares/validationMiddleware');

const reportSchema = Joi.object({
  targetType: Joi.string().valid('post', 'comment').required(),
  targetId: Joi.string().required(),
  reason: Joi.string().trim().min(1).max(1000).required(),
});

router.post('/', protect, createLimiter, validate(reportSchema), async (req, res, next) => {
  try {
    const { targetType, targetId, reason } = req.body;

    const existing = await Report.findOne({
      reporter: req.user._id,
      targetType,
      targetId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already reported this content.',
      });
    }

    await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
