const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string()
    .trim()
    .lowercase()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters',
    }),
  displayName: Joi.string().trim().max(50).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
    }),
});

const loginSchema = Joi.object({
  login: Joi.string().trim().required().messages({
    'any.required': 'Email or username is required',
  }),
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
