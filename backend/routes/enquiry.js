/* =============================================
   routes/enquiry.js
   POST /api/enquiry — Save enquiry & send emails
   ============================================= */

'use strict';

const express    = require('express');
const nodemailer = require('nodemailer');
const router     = express.Router();

const db                        = require('../config/db');
const { EnquiryModel, EnquiryRecord, SUBJECT_LABELS } = require('../models/Enquiry');
const { validateEnquiry }       = require('../middleware/validate');

/* ---- Nodemailer transporter (created lazily) ---- */
let transporter = null;

function getTransporter() {
  // Only create if EMAIL_USER and EMAIL_PASS are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

/* ---- Email Templates ---- */

/**
 * Acknowledgement email sent to the customer.
 */
function customerEmailHtml(data) {
  const productLabel = SUBJECT_LABELS[data.subject] || data.subject;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background:#f5f5f5; margin:0; padding:20px; }
    .container { max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
    .header { background:#1e3a5f; padding:30px; text-align:center; }
    .logo-text { font-size:22px; font-weight:bold; color:#d4af37; letter-spacing:2px; }
    .logo-sub  { color:#c0c0c0; font-size:13px; margin-top:4px; }
    .body      { padding:30px; color:#333; }
    .body h2   { color:#1e3a5f; }
    .detail-box{ background:#f9f9f9; border-left:4px solid #d4af37; padding:15px 20px; margin:20px 0; border-radius:4px; }
    .detail-box p { margin:6px 0; font-size:14px; }
    .detail-box strong { display:inline-block; width:110px; color:#555; }
    .footer    { background:#1e3a5f; padding:20px; text-align:center; color:#aaa; font-size:12px; }
    .footer a  { color:#d4af37; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">⚙ ARATI PRECISION INDUSTRIES</div>
      <div class="logo-sub">Precision Engineering Excellence</div>
    </div>
    <div class="body">
      <h2>Thank You for Your Enquiry, ${data.name}!</h2>
      <p>We have received your enquiry and our team will get back to you within <strong>24 hours</strong>.</p>
      <p>Here is a summary of what you submitted:</p>
      <div class="detail-box">
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
        <p><strong>Product:</strong> ${productLabel}</p>
        <p><strong>Message:</strong> ${data.message}</p>
        <p><strong>Reference ID:</strong> ${data.id || data._id}</p>
      </div>
      <p>If you have any urgent requirements, please feel free to call us directly.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>Team Arati Precision Industries</strong></p>
    </div>
    <div class="footer">
      &copy; 2025 ARATI PRECISION INDUSTRIES | 63/35 Brindabone Mullicke Lane, Howrah - 711101, West Bengal<br/>
      <a href="mailto:aratipi2025@gmail.com">aratipi2025@gmail.com</a> | +91 98040 64119
    </div>
  </div>
</body>
</html>`;
}

/**
 * Notification email sent to the admin with full enquiry details.
 */
function adminEmailHtml(data) {
  const productLabel = SUBJECT_LABELS[data.subject] || data.subject;
  const received     = new Date(data.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background:#f5f5f5; margin:0; padding:20px; }
    .container { max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
    .header    { background:#d4af37; padding:20px 30px; }
    .header h2 { margin:0; color:#1e3a5f; font-size:18px; }
    .badge     { display:inline-block; background:#1e3a5f; color:#fff; font-size:12px; padding:3px 10px; border-radius:12px; margin-top:6px; }
    .body      { padding:30px; color:#333; }
    table      { width:100%; border-collapse:collapse; font-size:14px; }
    td         { padding:10px 12px; border-bottom:1px solid #eee; vertical-align:top; }
    td:first-child { font-weight:bold; color:#555; width:130px; background:#fafafa; }
    .message-cell { white-space:pre-wrap; }
    .footer    { background:#1e3a5f; padding:15px; text-align:center; color:#aaa; font-size:11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🔔 New Enquiry Received</h2>
      <span class="badge">ARATI PRECISION — Admin Panel</span>
    </div>
    <div class="body">
      <table>
        <tr><td>Name</td><td>${data.name}</td></tr>
        <tr><td>Email</td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
        <tr><td>Phone</td><td>${data.phone || '—'}</td></tr>
        <tr><td>Product Interest</td><td>${productLabel}</td></tr>
        <tr><td>Message</td><td class="message-cell">${data.message}</td></tr>
        <tr><td>Reference ID</td><td>${data.id || data._id}</td></tr>
        <tr><td>IP Address</td><td>${data.ipAddress || '—'}</td></tr>
        <tr><td>Received At</td><td>${received}</td></tr>
      </table>
    </div>
    <div class="footer">ARATI PRECISION INDUSTRIES — Internal Notification</div>
  </div>
</body>
</html>`;
}

/* ---- POST /api/enquiry ---- */
router.post('/', validateEnquiry, async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Capture client IP (works behind proxies too)
  const ipAddress =
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    '';

  let savedEnquiry;

  try {
    /* ---- 1. Save enquiry ---- */
    if (db.isMongoConnected) {
      // MongoDB path
      const enquiry = new EnquiryModel({ name, email, phone, subject, message, ipAddress });
      savedEnquiry  = await enquiry.save();
    } else {
      // JSON file fallback path
      const record = new EnquiryRecord({ name, email, phone, subject, message, ipAddress });
      const all    = db.readJsonDb();
      all.push(record.toJSON());
      db.writeJsonDb(all);
      savedEnquiry = record.toJSON();
    }
  } catch (saveErr) {
    console.error('❌ Error saving enquiry:', saveErr.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to save enquiry. Please try again later.',
    });
  }

  /* ---- 2. Send emails (best-effort — never block the response) ---- */
  const mailer = getTransporter();

  if (mailer) {
    const enquiryData = {
      ...savedEnquiry,
      id: savedEnquiry.id || savedEnquiry._id?.toString(),
      createdAt: savedEnquiry.createdAt || new Date().toISOString(),
    };

    // Customer acknowledgement
    const customerMail = {
      from:    `"ARATI PRECISION INDUSTRIES" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: `Enquiry Received — Ref #${enquiryData.id} | ARATI PRECISION INDUSTRIES`,
      html:    customerEmailHtml(enquiryData),
    };

    // Admin notification
    const adminMail = {
      from:    `"ARATI PRECISION — Enquiry Bot" <${process.env.EMAIL_USER}>`,
      to:      process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `[NEW ENQUIRY] ${name} — ${SUBJECT_LABELS[subject] || subject}`,
      html:    adminEmailHtml(enquiryData),
    };

    // Fire both emails in parallel, but don't await — we already saved the enquiry
    Promise.all([
      mailer.sendMail(customerMail),
      mailer.sendMail(adminMail),
    ])
      .then(() => console.log(`📧 Emails sent for enquiry ${enquiryData.id}`))
      .catch(emailErr => console.error('⚠️  Email send failed (enquiry was saved):', emailErr.message));

  } else {
    console.log('ℹ️  Email not configured — skipping email for enquiry', savedEnquiry.id || savedEnquiry._id);
  }

  /* ---- 3. Respond to client ---- */
  return res.status(201).json({
    success: true,
    message: "Enquiry received! We'll contact you within 24 hours.",
    data: {
      id: savedEnquiry.id || savedEnquiry._id?.toString(),
    },
  });
});

module.exports = router;
