/* =============================================
   routes/admin.js
   GET/PATCH/DELETE /api/admin/enquiries
   All routes protected by X-Admin-Secret header
   ============================================= */

'use strict';

const express = require('express');
const router  = express.Router();

const db                        = require('../config/db');
const { EnquiryModel }          = require('../models/Enquiry');
const { requireAdminSecret }    = require('../middleware/validate');

// Apply admin auth to ALL routes in this router
router.use(requireAdminSecret);

/* =============================================
   GET /api/admin/enquiries
   Paginated, filterable list of all enquiries
   Query params: status, page, limit
   ============================================= */
router.get('/enquiries', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip     = (pageNum - 1) * limitNum;

    if (db.isMongoConnected) {
      // --- MongoDB ---
      const filter = {};
      if (status && ['new', 'read', 'replied'].includes(status)) {
        filter.status = status;
      }

      const [enquiries, total] = await Promise.all([
        EnquiryModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        EnquiryModel.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        data: {
          enquiries,
          pagination: {
            total,
            page:  pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
          },
        },
      });

    } else {
      // --- JSON File fallback ---
      let all = db.readJsonDb();

      // Filter by status
      if (status && ['new', 'read', 'replied'].includes(status)) {
        all = all.filter(e => e.status === status);
      }

      // Sort newest first
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const total     = all.length;
      const paginated = all.slice(skip, skip + limitNum);

      return res.json({
        success: true,
        data: {
          enquiries: paginated,
          pagination: {
            total,
            page:  pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    }

  } catch (err) {
    console.error('Admin GET /enquiries error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch enquiries.' });
  }
});

/* =============================================
   GET /api/admin/enquiries/:id
   Fetch a single enquiry by ID
   ============================================= */
router.get('/enquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (db.isMongoConnected) {
      const enquiry = await EnquiryModel.findById(id).lean();
      if (!enquiry) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }
      return res.json({ success: true, data: enquiry });

    } else {
      const all = db.readJsonDb();
      const enquiry = all.find(e => e.id === id);
      if (!enquiry) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }
      return res.json({ success: true, data: enquiry });
    }

  } catch (err) {
    console.error('Admin GET /enquiries/:id error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch enquiry.' });
  }
});

/* =============================================
   PATCH /api/admin/enquiries/:id/status
   Update status: new | read | replied
   Body: { status: "read" }
   ============================================= */
router.patch('/enquiries/:id/status', async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!status || !['new', 'read', 'replied'].includes(status)) {
      return res.status(422).json({
        success: false,
        message: 'Invalid status. Must be one of: new, read, replied.',
      });
    }

    if (db.isMongoConnected) {
      const enquiry = await EnquiryModel.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).lean();

      if (!enquiry) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }
      return res.json({ success: true, message: `Status updated to "${status}".`, data: enquiry });

    } else {
      const all = db.readJsonDb();
      const idx = all.findIndex(e => e.id === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }

      all[idx].status    = status;
      all[idx].updatedAt = new Date().toISOString();
      db.writeJsonDb(all);

      return res.json({ success: true, message: `Status updated to "${status}".`, data: all[idx] });
    }

  } catch (err) {
    console.error('Admin PATCH status error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

/* =============================================
   DELETE /api/admin/enquiries/:id
   Permanently delete an enquiry
   ============================================= */
router.delete('/enquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (db.isMongoConnected) {
      const enquiry = await EnquiryModel.findByIdAndDelete(id);
      if (!enquiry) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }
      return res.json({ success: true, message: 'Enquiry deleted successfully.' });

    } else {
      const all     = db.readJsonDb();
      const newList = all.filter(e => e.id !== id);

      if (newList.length === all.length) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }

      db.writeJsonDb(newList);
      return res.json({ success: true, message: 'Enquiry deleted successfully.' });
    }

  } catch (err) {
    console.error('Admin DELETE error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to delete enquiry.' });
  }
});

/* =============================================
   GET /api/admin/stats
   Quick stats dashboard numbers
   { total, new, read, replied, todayCount }
   ============================================= */
router.get('/stats', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (db.isMongoConnected) {
      const [total, newCount, readCount, repliedCount, todayCount] = await Promise.all([
        EnquiryModel.countDocuments({}),
        EnquiryModel.countDocuments({ status: 'new'     }),
        EnquiryModel.countDocuments({ status: 'read'    }),
        EnquiryModel.countDocuments({ status: 'replied' }),
        EnquiryModel.countDocuments({ createdAt: { $gte: todayStart } }),
      ]);

      return res.json({
        success: true,
        data: { total, new: newCount, read: readCount, replied: repliedCount, todayCount },
      });

    } else {
      const all = db.readJsonDb();

      return res.json({
        success: true,
        data: {
          total:      all.length,
          new:        all.filter(e => e.status === 'new'    ).length,
          read:       all.filter(e => e.status === 'read'   ).length,
          replied:    all.filter(e => e.status === 'replied').length,
          todayCount: all.filter(e => new Date(e.createdAt) >= todayStart).length,
        },
      });
    }

  } catch (err) {
    console.error('Admin GET /stats error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

module.exports = router;
