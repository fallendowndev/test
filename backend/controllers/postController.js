const postService = require('../services/postService');
const uploadService = require('../services/uploadService');

const createPost = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files[0]) || null;
    let imagePath = null;
    let videoPath = null;

    if (file) {
      const filePath = uploadService.getFilePath(file);
      if (file.mimetype && file.mimetype.startsWith('video/')) {
        videoPath = filePath;
      } else {
        imagePath = filePath;
      }
    }

    const post = await postService.create(req.user._id, req.body, { imagePath, videoPath });

    res.status(201).json({
      success: true,
      data: { post },
    });
  } catch (err) {
    next(err);
  }
};

const getPost = async (req, res, next) => {
  try {
    const userId = req.user?._id || null;
    const post = await postService.getById(req.params.id, userId);

    res.status(200).json({
      success: true,
      data: { post },
    });
  } catch (err) {
    next(err);
  }
};

const getFeed = async (req, res, next) => {
  try {
    const userId = req.user?._id || null;
    const result = await postService.getFeed(req.query, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const post = await postService.update(req.params.id, req.user._id.toString(), req.body);

    res.status(200).json({
      success: true,
      data: { post },
    });
  } catch (err) {
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    await postService.remove(req.params.id, req.user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

const searchPosts = async (req, res, next) => {
  try {
    const { q, page, limit } = req.query;
    const result = await postService.search(q, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const votePost = async (req, res, next) => {
  try {
    const { value } = req.body;

    if (value !== 1 && value !== -1) {
      return res.status(400).json({
        success: false,
        message: 'Vote value must be 1 (upvote) or -1 (downvote).',
      });
    }

    const result = await postService.vote(req.params.id, req.user._id, value);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const removeVote = async (req, res, next) => {
  try {
    const result = await postService.removeVote(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPost, getPost, getFeed, updatePost, deletePost, searchPosts, votePost, removeVote };
