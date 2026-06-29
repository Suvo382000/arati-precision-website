/* =============================================
   server.js — Main entry point
   ARATI PRECISION INDUSTRIES — Backend API
   ============================================= */

'use strict';

// Load environment variables from .env file
require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');

const db          = require('./config/db');
const enquiryRoutes = require('./routes/enquiry');
const adminRoutes   = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 5000;

/* =============================================
   SECURITY MIDDLEWARE
   ============================================= */

// Helmet sets secure HTTP headers (XSS, clickjacking, etc.)
app.use(helmet());

// CORS — allow requests from the configured frontend URL
const allowedOrigins = [
  process.env.FRONTEND_URL,            // set this in Render env vars
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:3000',
  'null',                              // file:// opened directly in browser
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Allow any netlify.app subdomain automatically
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin "${origin}" not allowed`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Admin-Secret'],
  credentials: true,
}));

/* =============================================
   REQUEST PARSING
   ============================================= */
app.use(express.json({ limit: '10kb' }));        // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form data

/* =============================================
   LOGGING
   ============================================= */
// Use 'dev' format in development, 'combined' (Apache-style) in production
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* =============================================
   RATE LIMITING
   ============================================= */

// Strict rate limit for the enquiry POST endpoint: 10 requests per 15 minutes per IP
const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many enquiries submitted from this IP. Please try again after 15 minutes.',
  },
});

// Looser limit for the admin API: 200 requests per 15 minutes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

/* =============================================
   HEALTH CHECK
   GET /api/health → { status: "ok", ... }
   ============================================= */
app.get('/api/health', (req, res) => {
  res.json({
    success:    true,
    status:     'ok',
    company:    'ARATI PRECISION INDUSTRIES',
    timestamp:  new Date().toISOString(),
    database:   db.isMongoConnected ? 'mongodb' : 'json-file',
    environment: process.env.NODE_ENV || 'development',
  });
});

/* =============================================
   ROUTES
   ============================================= */
app.use('/api/enquiry', enquiryLimiter, enquiryRoutes);
app.use('/api/admin',   adminLimiter,   adminRoutes);

/* =============================================
   404 HANDLER
   Catches any route that hasn't been handled above
   ============================================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route "${req.method} ${req.originalUrl}" not found.`,
  });
});

/* =============================================
   GLOBAL ERROR HANDLER
   Catches errors thrown from any route or middleware
   ============================================= */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // CORS errors have a specific message format
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  console.error('❌ Unhandled error:', err.stack || err.message);

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred.'
      : err.message,
  });
});

/* =============================================
   STARTUP
   ============================================= */
async function startServer() {
  // 1. Connect to database (MongoDB or fallback)
  await db.connect();

  // 2. Start HTTP server
  app.listen(PORT, () => {
    // Company banner
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       ⚙  ARATI PRECISION INDUSTRIES  ⚙          ║');
    console.log('║         Precision Engineering Excellence          ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  🚀  Server running on port ${PORT}                  ║`);
    console.log(`║  🌐  http://localhost:${PORT}/api/health             ║`);
    console.log(`║  🗄️   DB Mode: ${db.isMongoConnected ? 'MongoDB         ' : 'JSON File Fallback'}          ║`);
    console.log(`║  🔧  Environment: ${process.env.NODE_ENV || 'development'}              ║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('\nAvailable endpoints:');
    console.log(`  GET   http://localhost:${PORT}/api/health`);
    console.log(`  POST  http://localhost:${PORT}/api/enquiry`);
    console.log(`  GET   http://localhost:${PORT}/api/admin/enquiries`);
    console.log(`  GET   http://localhost:${PORT}/api/admin/stats`);
    console.log('');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app; // exported for testing purposes
