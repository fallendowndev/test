require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');

const connectDB = require('./db/connect');
const { errorHandler } = require('./middlewares/errorMiddleware');
const { generalLimiter } = require('./middlewares/rateLimitMiddleware');
const { validateCsrfToken } = require('./middlewares/csrfMiddleware');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
}));

app.use('/api', generalLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.use(cookieParser());

const sanitizeNoSql = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeNoSql(obj[key]);
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeNoSql(req.body);
  if (req.params) sanitizeNoSql(req.params);
  if (req.query) sanitizeNoSql(req.query);
  next();
});

app.use(hpp());

app.use(compression());

app.use('/api', validateCsrfToken);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', (req, res, next) => {
  const postController = require('./controllers/postController');
  return postController.searchPosts(req, res, next);
});
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

app.use(errorHandler);

const start = async () => {
  await connectDB();
  const port = parseInt(process.env.PORT, 10) || 5000;
  const nodeEnv = process.env.NODE_ENV || 'development';
  app.listen(port, () => {
    console.log(`Server running on port ${port} in ${nodeEnv} mode`);
  });
};

start();
