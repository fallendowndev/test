const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters'],
  },
  content: {
    type: String,
    default: '',
    maxlength: [40000, 'Content cannot exceed 40000 characters'],
  },
  image: {
    type: String,
    default: null,
  },
  video: {
    type: String,
    default: null,
  },
  link: {
    type: String,
    default: null,
  },
  postType: {
    type: String,
    enum: ['text', 'media', 'link'],
    default: 'text',
  },
  score: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

postSchema.index({ createdAt: -1 });
postSchema.index({ score: -1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Post', postSchema);
