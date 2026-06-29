/* =============================================
   middleware/validate.js
   Request validation middleware using express-validator
   ============================================= */

'use strict';

const { body, validationResult } = require('express-validator');

/* ---- Validation rules for the enquiry form ---- */
const validateEnquiry = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters.')
    .matches(/^[+\d\s\-().]*$/).withMessage('Phone number contains invalid characters.'),

  body('subject')
    .trim()
    .notEmpty().withMessage('Please select a product of interest.')
    .isIn([
      'gears',
      'shafts',
      'bushes',
      'jig-fixtures',
      'gauges',
      'dies-tools',
      'high-precision',
      'other',
    ]).withMessage('Invalid product selection.'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required.')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters.'),

  /* ---- Error collection middleware ---- */
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Map errors to a flat { field: message } object for easy frontend consumption
      const errorMap = {};
      errors.array().forEach(err => {
        if (!errorMap[err.path]) {
          errorMap[err.path] = err.msg;
        }
      });

      return res.status(422).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors:  errorMap,
      });
    }

    next();
  },
];

/* ---- Admin secret key check ---- */
function requireAdminSecret(req, res, next) {
  const secret = req.headers['x-admin-secret'];

  if (!secret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Missing X-Admin-Secret header.',
    });
  }

  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Invalid admin secret.',
    });
  }

  next();
}

module.exports = { validateEnquiry, requireAdminSecret };
