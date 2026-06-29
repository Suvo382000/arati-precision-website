/* =============================================
   models/Enquiry.js
   Enquiry data model for ARATI PRECISION INDUSTRIES
   - Mongoose schema for MongoDB
   - Plain JS class for JSON file fallback
   ============================================= */

'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/* ============ Mongoose Schema ============ */

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [150, 'Email cannot exceed 150 characters'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Product/subject selection is required'],
      trim: true,
      enum: {
        values: [
          'gears',
          'shafts',
          'bushes',
          'jig-fixtures',
          'gauges',
          'dies-tools',
          'high-precision',
          'other',
        ],
        message: 'Invalid product selection: {VALUE}',
      },
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    // Admin workflow status
    status: {
      type: String,
      enum: ['new', 'read', 'replied'],
      default: 'new',
    },
    // Requester IP address (for spam tracking)
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Virtual: human-readable product label
const SUBJECT_LABELS = {
  'gears':         'Gears',
  'shafts':        'Shafts',
  'bushes':        'Bushes',
  'jig-fixtures':  'Jig Fixtures',
  'gauges':        'Gauges',
  'dies-tools':    'Conventional Tools & Die Making',
  'high-precision':'High Precision Jobs',
  'other':         'Other / General Enquiry',
};

enquirySchema.virtual('subjectLabel').get(function () {
  return SUBJECT_LABELS[this.subject] || this.subject;
});

// Ensure virtuals are included when converting to JSON
enquirySchema.set('toJSON', { virtuals: true });

const EnquiryModel = mongoose.model('Enquiry', enquirySchema);

/* ============ Plain JS Class (JSON fallback) ============ */

class EnquiryRecord {
  /**
   * @param {object} data - Validated enquiry data
   */
  constructor(data) {
    this.id         = uuidv4();               // unique ID
    this.name       = (data.name  || '').trim();
    this.email      = (data.email || '').trim().toLowerCase();
    this.phone      = (data.phone || '').trim();
    this.subject    = (data.subject || '').trim();
    this.message    = (data.message || '').trim();
    this.status     = 'new';
    this.ipAddress  = data.ipAddress || '';
    this.createdAt  = new Date().toISOString();
    this.updatedAt  = new Date().toISOString();
  }

  /** Human-readable product label */
  get subjectLabel() {
    return SUBJECT_LABELS[this.subject] || this.subject;
  }

  /** Convert to plain object (for JSON storage) */
  toJSON() {
    return {
      id:         this.id,
      name:       this.name,
      email:      this.email,
      phone:      this.phone,
      subject:    this.subject,
      subjectLabel: SUBJECT_LABELS[this.subject] || this.subject,
      message:    this.message,
      status:     this.status,
      ipAddress:  this.ipAddress,
      createdAt:  this.createdAt,
      updatedAt:  this.updatedAt,
    };
  }
}

module.exports = {
  EnquiryModel,   // Mongoose model — use when MongoDB is connected
  EnquiryRecord,  // Plain class  — use when falling back to JSON file
  SUBJECT_LABELS,
};
