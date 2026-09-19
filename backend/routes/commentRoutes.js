const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { createLimiter } = require('../middlewares/rateLimitMiddleware');
const { commentSchema } = require('../validators/commentValidators');

router.get('/posts/:postId/comments', optionalAuth, commentController.getComments);

router.post(
  '/posts/:postId/comments',
  protect,
  createLimiter,
  validate(commentSchema),
  commentController.createComment
);

router.post(
  '/comments/:commentId/replies',
  protect,
  createLimiter,
  validate(commentSchema),
  commentController.createReply
);

router.patch(
  '/comments/:commentId',
  protect,
  validate(commentSchema),
  commentController.updateComment
);

router.delete(
  '/comments/:commentId',
  protect,
  commentController.deleteComment
);

router.post(
  '/comments/:commentId/like',
  protect,
  commentController.toggleLike
);

router.post(
  '/comments/:commentId/pin',
  protect,
  commentController.togglePin
);

module.exports = router;
