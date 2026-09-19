const Joi = require('joi');

const commentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(10000).required(),
});

module.exports = { commentSchema };
