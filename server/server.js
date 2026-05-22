const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = require('./config/db');
connectDB();

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());   // Prevent NoSQL injection
app.use(xss());             // Prevent XSS attacks

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests, please try again after 15 minutes.' }
});

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests from this IP.' }
});

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Rate Limiters ───────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/products',     require('./routes/productRoutes'));
app.use('/api/categories',   require('./routes/categoryRoutes'));
app.use('/api/orders',       require('./routes/orderRoutes'));
app.use('/api/payments',     require('./routes/paymentRoutes'));
app.use('/api/reviews',      require('./routes/reviewRoutes'));
app.use('/api/custom-cakes', require('./routes/customCakeRoutes'));
app.use('/api/bookings',     require('./routes/bookingRoutes'));
app.use('/api/coupons',      require('./routes/couponRoutes'));
app.use('/api/admin',        require('./routes/adminRoutes'));
app.use('/api/upload',       require('./routes/uploadRoutes'));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🍕 Ghochu Pizza API is running!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ─── Serve Frontend in Production ────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// ─── Global Error Handler ────────────────────────────────────────────────────
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🍕 Ghochu Pizza Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;
