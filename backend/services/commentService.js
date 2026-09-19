const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { AppError } = require('../middlewares/errorMiddleware');

const createComment = async (postId, userId, content) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  const comment = await Comment.create({
    post: postId,
    author: userId,
    content,
    parentComment: null,
  });

  post.commentCount += 1;
  await post.save();

  return comment.populate('author', 'username displayName avatar');
};

const createReply = async (parentCommentId, userId, content) => {
  const parentComment = await Comment.findById(parentCommentId);

  if (!parentComment) {
    throw new AppError('Parent comment not found.', 404);
  }

  if (parentComment.deletedAt) {
    throw new AppError('Cannot reply to a deleted comment.', 400);
  }

  const comment = await Comment.create({
    post: parentComment.post,
    author: userId,
    content,
    parentComment: parentCommentId,
  });

  await Post.findByIdAndUpdate(parentComment.post, { $inc: { commentCount: 1 } });

  return comment.populate('author', 'username displayName avatar');
};

const getCommentTree = async (postId, page = 1, limit = 50) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

  const post = await Post.findById(postId).lean();
  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  const allComments = await Comment.find({ post: postId })
    .populate('author', 'username displayName avatar')
    .sort({ createdAt: 1 })
    .lean();

  const commentMap = {};
  const topLevel = [];

  allComments.forEach((comment) => {
    comment.replies = [];

    if (comment.deletedAt) {
      comment.content = null;
      comment.author = null;
      comment.isDeleted = true;
    } else {
      comment.isDeleted = false;
    }

    commentMap[comment._id.toString()] = comment;
  });

  allComments.forEach((comment) => {
    if (comment.parentComment) {
      const parentId = comment.parentComment.toString();
      if (commentMap[parentId]) {
        commentMap[parentId].replies.push(comment);
      } else {
        topLevel.push(comment);
      }
    } else {
      topLevel.push(comment);
    }
  });

  const totalTopLevel = topLevel.length;
  const start = (page - 1) * limit;
  const paginatedTopLevel = topLevel.slice(start, start + limit);

  return {
    comments: paginatedTopLevel,
    page,
    pages: Math.ceil(totalTopLevel / limit),
    totalTopLevel,
    totalComments: allComments.length,
  };
};

const update = async (commentId, userId, content) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError('Comment not found.', 404);
  }

  if (comment.deletedAt) {
    throw new AppError('Cannot edit a deleted comment.', 400);
  }

  if (comment.author.toString() !== userId) {
    throw new AppError('You are not authorized to edit this comment.', 403);
  }

  comment.content = content;
  await comment.save();

  return comment.populate('author', 'username displayName avatar');
};

const softDelete = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError('Comment not found.', 404);
  }

  if (comment.author.toString() !== userId) {
    throw new AppError('You are not authorized to delete this comment.', 403);
  }

  if (comment.deletedAt) {
    throw new AppError('Comment is already deleted.', 400);
  }

  const hasReplies = await Comment.exists({ parentComment: commentId });

  if (hasReplies) {
    comment.deletedAt = new Date();
    comment.content = '[deleted]';
    await comment.save();
  } else {
    await Comment.deleteOne({ _id: commentId });
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
  }

  return { deleted: true };
};

module.exports = { createComment, createReply, getCommentTree, update, softDelete };
