const Joi = require('joi');

const createPostSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300).required(),
  content: Joi.string().trim().max(40000).allow('', null).optional(),
  link: Joi.string().trim().uri().max(2000).allow('', null).optional(),
  postType: Joi.string().valid('text', 'media', 'link').optional(),
});

const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300),
  content: Joi.string().trim().max(40000).allow('', null),
  link: Joi.string().trim().uri().max(2000).allow('', null),
  postType: Joi.string().valid('text', 'media', 'link'),
}).min(1);

module.exports = { createPostSchema, updatePostSchema };
