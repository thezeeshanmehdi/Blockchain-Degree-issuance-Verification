const express = require('express');
const router = express.Router();
const { getApplications, getApplicationById, reRunOCR, approveApplication, rejectApplication, getAuditMetrics } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and restricted to admin
router.use(protect);
router.use(authorize('admin'));

router.get('/metrics', getAuditMetrics);
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationById);
router.post('/applications/:id/ocr', reRunOCR);
router.post('/applications/:id/approve', approveApplication);
router.post('/applications/:id/reject', rejectApplication);

module.exports = router;
