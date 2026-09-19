const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect, optionalAuth } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { createLimiter } = require('../middlewares/rateLimitMiddleware');
const { createPostSchema, updatePostSchema } = require('../validators/postValidators');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', optionalAuth, postController.getFeed);
router.get('/:id', optionalAuth, postController.getPost);

router.post(
  '/',
  protect,
  createLimiter,
  upload.any(),
  validate(createPostSchema),
  postController.createPost
);

router.patch(
  '/:id',
  protect,
  validate(updatePostSchema),
  postController.updatePost
);

router.delete('/:id', protect, postController.deletePost);

router.post('/:id/vote', protect, postController.votePost);
router.delete('/:id/vote', protect, postController.removeVote);

module.exports = router;
