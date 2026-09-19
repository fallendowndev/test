const Post = require('../models/Post');
const Vote = require('../models/Vote');
const Comment = require('../models/Comment');
const { AppError } = require('../middlewares/errorMiddleware');

const create = async (userId, { title, content }, imagePath) => {
  const postData = {
    author: userId,
    title,
    content,
  };

  if (imagePath) {
    postData.image = imagePath;
  }

  const post = await Post.create(postData);
  return post.populate('author', 'username displayName avatar');
};

const getById = async (postId, userId = null) => {
  const post = await Post.findById(postId)
    .populate('author', 'username displayName avatar createdAt bio')
    .lean();

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  if (userId) {
    const vote = await Vote.findOne({ user: userId, post: postId }).lean();
    post.userVote = vote ? vote.value : 0;
  } else {
    post.userVote = 0;
  }

  return post;
};

const getFeed = async ({ sort = 'latest', page = 1, limit = 20 }, userId = null) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const sortOptions = sort === 'popular'
    ? { score: -1, createdAt: -1 }
    : { createdAt: -1 };

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find()
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar')
      .lean(),
    Post.countDocuments(),
  ]);

  if (userId && posts.length > 0) {
    const postIds = posts.map((p) => p._id);
    const votes = await Vote.find({ user: userId, post: { $in: postIds } }).lean();
    const voteMap = {};
    votes.forEach((v) => { voteMap[v.post.toString()] = v.value; });
    posts.forEach((p) => { p.userVote = voteMap[p._id.toString()] || 0; });
  } else {
    posts.forEach((p) => { p.userVote = 0; });
  }

  return {
    posts,
    page,
    pages: Math.ceil(total / limit),
    total,
  };
};

const update = async (postId, userId, data) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  if (post.author.toString() !== userId) {
    throw new AppError('You are not authorized to edit this post.', 403);
  }

  if (data.title) post.title = data.title;
  if (data.content) post.content = data.content;

  await post.save();
  return post.populate('author', 'username displayName avatar');
};

const remove = async (postId, userId) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  if (post.author.toString() !== userId) {
    throw new AppError('You are not authorized to delete this post.', 403);
  }

  await Promise.all([
    Comment.deleteMany({ post: postId }),
    Vote.deleteMany({ post: postId }),
    Post.deleteOne({ _id: postId }),
  ]);

  return { deleted: true };
};

const search = async (query, page = 1, limit = 20) => {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return { posts: [], page: 1, pages: 0, total: 0 };
  }

  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { $text: { $search: query.trim() } };

  const [posts, total] = await Promise.all([
    Post.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar')
      .lean(),
    Post.countDocuments(filter),
  ]);

  return {
    posts,
    page,
    pages: Math.ceil(total / limit),
    total,
  };
};

const vote = async (postId, userId, value) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  await Vote.findOneAndUpdate(
    { user: userId, post: postId },
    { value },
    { upsert: true, returnDocument: 'after' }
  );

  const result = await Vote.aggregate([
    { $match: { post: post._id } },
    { $group: { _id: null, total: { $sum: '$value' } } },
  ]);

  const newScore = result.length > 0 ? result[0].total : 0;
  post.score = newScore;
  await post.save();

  return { score: newScore, userVote: value };
};

const removeVote = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  await Vote.findOneAndDelete({ user: userId, post: postId });

  const result = await Vote.aggregate([
    { $match: { post: post._id } },
    { $group: { _id: null, total: { $sum: '$value' } } },
  ]);

  const newScore = result.length > 0 ? result[0].total : 0;
  post.score = newScore;
  await post.save();

  return { score: newScore, userVote: 0 };
};

const getByUser = async (userId, page = 1, limit = 20) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar')
      .lean(),
    Post.countDocuments({ author: userId }),
  ]);

  return {
    posts,
    page,
    pages: Math.ceil(total / limit),
    total,
  };
};

module.exports = { create, getById, getFeed, update, remove, search, vote, removeVote, getByUser };
