const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorMiddleware');

const register = async ({ username, displayName, email, password }) => {
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  }).lean();

  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError('An account with this email already exists.', 409);
    }
    throw new AppError('This username is already taken.', 409);
  }

  const userCount = await User.countDocuments();
  const role = userCount === 0 ? 'admin' : 'user';

  const user = await User.create({ username, displayName, email, password, role });
  return user;
};

const login = async ({ login: loginField, password }) => {
  const isEmail = loginField.includes('@');
  const query = isEmail ? { email: loginField.toLowerCase() } : { username: loginField.toLowerCase() };

  const user = await User.findOne(query).select('+password');

  if (!user) {
    throw new AppError('Invalid credentials.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials.', 401);
  }

  return user;
};

const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
};

const setAuthCookie = (res, token) => {
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
};

const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
};

module.exports = { register, login, generateToken, setAuthCookie, clearAuthCookie };
