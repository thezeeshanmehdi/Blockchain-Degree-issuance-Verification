const express = require('express');
const router = express.Router();
const { verifyDegree } = require('../controllers/verificationController');

router.get('/:hash', verifyDegree);

module.exports = router;
