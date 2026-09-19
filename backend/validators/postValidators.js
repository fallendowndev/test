const Joi = require('joi');

const createPostSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300).required(),
  content: Joi.string().trim().min(1).max(40000).required(),
});

const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300),
  content: Joi.string().trim().min(1).max(40000),
}).min(1);

module.exports = { createPostSchema, updatePostSchema };
