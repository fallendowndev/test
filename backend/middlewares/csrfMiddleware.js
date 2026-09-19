const crypto = require('crypto');

const generateCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');

  res.cookie('csrf-token', token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, data: { csrfToken: token } });
};

const validateCsrfToken = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const headerToken = req.headers['x-csrf-token'];
  const cookieToken = req.cookies?.['csrf-token'];

  if (!headerToken || !cookieToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing.',
    });
  }

  if (headerToken.length !== cookieToken.length) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token.',
    });
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(headerToken),
    Buffer.from(cookieToken)
  );

  if (!valid) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token.',
    });
  }

  next();
};

module.exports = { generateCsrfToken, validateCsrfToken };
