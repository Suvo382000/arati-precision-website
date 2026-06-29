/* =============================================
   config/db.js
   Database configuration for ARATI PRECISION INDUSTRIES
   Supports MongoDB (primary) with JSON file fallback
   ============================================= */

'use strict';

const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');

// Path to JSON fallback database
const DATA_DIR  = path.join(__dirname, '..', 'data');
const JSON_FILE = path.join(DATA_DIR, 'enquiries.json');

// Track MongoDB connection state
let isMongoConnected = false;

/**
 * Connect to MongoDB.
 * If the connection fails (or URI is not set), we fall back silently
 * to the local JSON file database — the app still runs normally.
 */
async function connect() {
  const uri = process.env.MONGODB_URI;

  // Ensure local data directory exists for JSON fallback
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data/ directory for JSON fallback database');
  }

  // Seed the JSON file if it doesn't exist yet
  if (!fs.existsSync(JSON_FILE)) {
    fs.writeFileSync(JSON_FILE, JSON.stringify([], null, 2), 'utf8');
    console.log('📄 Created data/enquiries.json fallback database');
  }

  // If no MongoDB URI provided, skip connection attempt
  if (!uri) {
    console.log('⚠️  MONGODB_URI not set — using JSON file database (data/enquiries.json)');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // fail fast if Mongo is not running
    });
    isMongoConnected = true;
    console.log('✅ MongoDB connected:', mongoose.connection.host);
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed — falling back to JSON file database');
    console.warn('   Reason:', err.message);
    isMongoConnected = false;
  }
}

/* ---- JSON File Database Helpers ---- */

/**
 * Read all enquiries from the JSON file.
 * @returns {Array}
 */
function readJsonDb() {
  try {
    const raw = fs.readFileSync(JSON_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Write the full enquiries array to the JSON file.
 * @param {Array} data
 */
function writeJsonDb(data) {
  fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  connect,
  get isMongoConnected() { return isMongoConnected; },
  readJsonDb,
  writeJsonDb,
  JSON_FILE,
};
