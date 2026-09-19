const User = require('../models/User');
const postService = require('../services/postService');
const uploadService = require('../services/uploadService');
const { AppError } = require('../middlewares/errorMiddleware');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email')
      .lean();

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const Post = require('../models/Post');
    const postCount = await Post.countDocuments({ author: user._id });

    res.status(200).json({
      success: true,
      data: {
        user: { ...user, postCount },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getUserPosts = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const { page, limit } = req.query;
    const result = await postService.getByUser(user._id, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['displayName', 'bio'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided.',
      });
    }

    const avatarPath = uploadService.getFilePath(req.file);

    const currentUser = await User.findById(req.user._id);
    if (currentUser.avatar) {
      await uploadService.deleteFile(currentUser.avatar);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { returnDocument: 'after' }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, getUserPosts, updateProfile, updateAvatar };
