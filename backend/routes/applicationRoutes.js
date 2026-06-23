const express = require('express');
const router = express.Router();
const { submitApplication, getMyApplications } = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const { uploadDocuments } = require('../middleware/upload');

// Both routes protected for students
router.post('/submit', protect, uploadDocuments, submitApplication);
router.get('/my-applications', protect, getMyApplications);

module.exports = router;
