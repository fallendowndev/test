const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const Report = require('../models/Report');
const { AppError } = require('../middlewares/errorMiddleware');

const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalVotes,
      totalReports,
      pendingReports,
      recentUsers,
      recentPosts,
      recentReports,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Vote.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('-password'),
      Post.find().sort({ createdAt: -1 }).limit(5).populate('author', 'username displayName avatar'),
      Report.find().sort({ createdAt: -1 }).limit(5).populate('reporter', 'username displayName avatar'),
    ]);

    const uptimeSeconds = Math.floor(process.uptime());
    const memory = process.memoryUsage();

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          totalPosts,
          totalComments,
          totalVotes,
          totalReports,
          pendingReports,
        },
        system: {
          uptimeSeconds,
          nodeVersion: process.version,
          memoryRssMb: Math.round(memory.rss / 1024 / 1024),
          memoryHeapMb: Math.round(memory.heapUsed / 1024 / 1024),
          environment: process.env.NODE_ENV || 'development',
        },
        recentUsers,
        recentPosts,
        recentReports,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { role, search } = req.query;

    const filter = {};
    if (role && ['user', 'admin'].includes(role)) {
      filter.role = role;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ username: regex }, { email: regex }, { displayName: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    if (id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot remove admin rights from yourself.' });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { returnDocument: 'after' }).select('-password');
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const userPosts = await Post.find({ author: id }).select('_id');
    const postIds = userPosts.map((p) => p._id);

    await Promise.all([
      Vote.deleteMany({ post: { $in: postIds } }),
      Comment.deleteMany({ post: { $in: postIds } }),
      Comment.deleteMany({ author: id }),
      Vote.deleteMany({ user: id }),
      Post.deleteMany({ author: id }),
      Report.deleteMany({ reporter: id }),
      User.findByIdAndDelete(id),
    ]);

    res.status(200).json({
      success: true,
      message: 'User and all associated content deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const filter = {};
    if (search && search.trim()) {
      filter.title = new RegExp(search.trim(), 'i');
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username displayName avatar'),
      Post.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        posts,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      throw new AppError('Post not found.', 404);
    }

    await Promise.all([
      Comment.deleteMany({ post: id }),
      Vote.deleteMany({ post: id }),
      Report.deleteMany({ targetType: 'post', targetId: id }),
      Post.findByIdAndDelete(id),
    ]);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully by administrator.',
    });
  } catch (err) {
    next(err);
  }
};

const getReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reporter', 'username displayName avatar'),
      Report.countDocuments(filter),
    ]);

    const enrichedReports = await Promise.all(
      reports.map(async (rep) => {
        const rObj = rep.toObject();
        if (rep.targetType === 'post') {
          const post = await Post.findById(rep.targetId).select('title author content').populate('author', 'username');
          rObj.target = post;
        } else if (rep.targetType === 'comment') {
          const comment = await Comment.findById(rep.targetId).select('content author post deletedAt').populate('author', 'username');
          rObj.target = comment;
        }
        return rObj;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        reports: enrichedReports,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const report = await Report.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });
    if (!report) {
      throw new AppError('Report not found.', 404);
    }

    res.status(200).json({
      success: true,
      data: { report },
    });
  } catch (err) {
    next(err);
  }
};

const deleteReportTarget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);
    if (!report) {
      throw new AppError('Report not found.', 404);
    }

    if (report.targetType === 'post') {
      await Promise.all([
        Comment.deleteMany({ post: report.targetId }),
        Vote.deleteMany({ post: report.targetId }),
        Post.findByIdAndDelete(report.targetId),
      ]);
    } else if (report.targetType === 'comment') {
      await Comment.findByIdAndUpdate(report.targetId, {
        deletedAt: new Date(),
        content: '[deleted by administrator]',
      });
    }

    report.status = 'resolved';
    await report.save();

    res.status(200).json({
      success: true,
      message: 'Reported content removed and report marked as resolved.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getPosts,
  deletePost,
  getReports,
  updateReport,
  deleteReportTarget,
};
