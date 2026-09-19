const commentService = require('../services/commentService');

const createComment = async (req, res, next) => {
  try {
    const comment = await commentService.createComment(
      req.params.postId,
      req.user._id,
      req.body.content
    );

    res.status(201).json({
      success: true,
      data: { comment },
    });
  } catch (err) {
    next(err);
  }
};

const createReply = async (req, res, next) => {
  try {
    const comment = await commentService.createReply(
      req.params.commentId,
      req.user._id,
      req.body.content
    );

    res.status(201).json({
      success: true,
      data: { comment },
    });
  } catch (err) {
    next(err);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const userId = req.user ? req.user._id : null;
    const result = await commentService.getCommentTree(req.params.postId, userId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const comment = await commentService.update(
      req.params.commentId,
      req.user._id.toString(),
      req.body.content
    );

    res.status(200).json({
      success: true,
      data: { comment },
    });
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    await commentService.softDelete(req.params.commentId, req.user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

const toggleLike = async (req, res, next) => {
  try {
    const result = await commentService.toggleLike(req.params.commentId, req.user._id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const togglePin = async (req, res, next) => {
  try {
    const result = await commentService.togglePin(req.params.commentId, req.user._id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createComment,
  createReply,
  getComments,
  updateComment,
  deleteComment,
  toggleLike,
  togglePin,
};
