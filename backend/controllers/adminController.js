const Application = require('../models/application');
const Degree = require('../models/degree');
const { computeDegreeHash, recordOnPrivateBlockchain, publishHashToPublicBlockchain } = require('../services/blockchainService');
const { generateDegreePDF } = require('../services/pdfService');
const { performOCR, runPolicyChecks } = require('../services/ocrService');
const path = require('path');
const { generateMetrics } = require('../blockchain/report_generator');

// @desc    Get all applications
// @route   GET /api/admin/applications
// @access  Private (Admin)
exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('student', 'name email')
      .sort('-createdAt')
      .lean();
      
    for (let i = 0; i < applications.length; i++) {
      if (applications[i].status === 'approved') {
        const degree = await Degree.findOne({ application: applications[i]._id });
        if (degree) {
          applications[i].pdfUrl = degree.pdfUrl;
        }
      }
    }
      
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single application by ID
// @route   GET /api/admin/applications/:id
// @access  Private (Admin)
exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student', 'name email')
      .lean();
      
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status === 'approved') {
      const degree = await Degree.findOne({ application: application._id });
      if (degree) {
        application.pdfUrl = degree.pdfUrl;
      }
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manually re-run OCR & policy verification
// @route   POST /api/admin/applications/:id/ocr
// @access  Private (Admin)
exports.reRunOCR = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    app.status = 'processing';
    await app.save();

    const rootDir = path.join(__dirname, '../');
    const cnicFrontPath = path.join(rootDir, app.documents.cnicFront);
    const matricPath = path.join(rootDir, app.documents.matricMarksheet);
    const interPath = path.join(rootDir, app.documents.interMarksheet);
    const receiptPath = path.join(rootDir, app.documents.paymentReceipt);

    // Re-run OCR calls
    const cnicData = await performOCR(cnicFrontPath, 'cnic_front');
    const matricData = await performOCR(matricPath, 'matric');
    const interData = await performOCR(interPath, 'inter');
    const receiptData = await performOCR(receiptPath, 'receipt');

    app.ocrData = {
      cnicExpiry: cnicData.expiryDate ? new Date(cnicData.expiryDate) : null,
      matricPercentage: matricData.percentage || null,
      interPercentage: interData.percentage || null,
      paymentTransactionId: receiptData.transactionId || null,
      paymentAmount: receiptData.amountPaid || null,
      rawTextSummary: `CNIC Expiry: ${cnicData.expiryDate || 'N/A'}, Matric %: ${matricData.percentage || 'N/A'}, Inter %: ${interData.percentage || 'N/A'}, TxID: ${receiptData.transactionId || 'N/A'}, Amt: ${receiptData.amountPaid || 'N/A'}`
    };

    const verificationResults = runPolicyChecks(app);
    app.verificationFlags = verificationResults;
    app.status = 'pending';
    app.processedAt = new Date();

    await app.save();

    res.status(200).json({
      success: true,
      message: 'OCR policy check completed successfully',
      data: app
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve application and issue hybrid blockchain degree
// @route   POST /api/admin/applications/:id/approve
// @access  Private (Admin)
exports.approveApplication = async (req, res) => {
  try {
    const { cgpa } = req.body;
    const inputCgpa = cgpa ? Number(cgpa) : 3.5; // Default if not specified

    const app = await Application.findById(req.params.id).populate('student');
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (app.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Application is already approved' });
    }

    // 1. Generate unique degree serial number (IQRA-<Year>-<RandomHex>)
    const year = new Date().getFullYear();
    const uniqueSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const degreeSerialNumber = `IQRA-${year}-${uniqueSuffix}`;

    // 2. Prepare degree details to compute hash
    const degreeDetails = {
      degreeSerialNumber,
      graduateName: app.fullName,
      programName: app.program,
      graduationDate: new Date(),
      cgpa: inputCgpa
    };

    // 3. Compute Cryptographic SHA-256 Hash for Public Verification
    const degreeHash = computeDegreeHash(degreeDetails);

    // 4. Secure full sensitive data on Private Ledger (AWS)
    const privateBlockchainResult = await recordOnPrivateBlockchain({
      ...degreeDetails,
      studentId: app.student._id,
      dob: app.dob,
      rollNumber: app.rollNumber
    });

    // 5. Publish Degree Hash onto the Public Blockchain
    const publicBlockchainResult = await publishHashToPublicBlockchain(degreeHash, degreeDetails);

    // 6. Create the Degree object
    const degree = new Degree({
      application: app._id,
      student: app.student._id,
      degreeSerialNumber,
      graduateName: degreeDetails.graduateName,
      programName: degreeDetails.programName,
      graduationDate: degreeDetails.graduationDate,
      cgpa: degreeDetails.cgpa,
      degreeHash,
      blockchain: {
        privateTxId: privateBlockchainResult.privateTxId,
        publicTxId: publicBlockchainResult.publicTxId,
        publicContractAddress: publicBlockchainResult.publicContractAddress
      },
      qrCodeData: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${degreeHash}`
    });

    // 7. Generate PDF with embedded QR Code
    const pdfRelativePath = await generateDegreePDF(degree);
    degree.pdfUrl = pdfRelativePath;
    await degree.save();

    // 8. Update Application Status
    app.status = 'approved';
    await app.save();

    res.status(200).json({
      success: true,
      message: 'Application approved, hybrid blockchain degree issued, and PDF certificate generated.',
      data: degree
    });
  } catch (error) {
    console.error('[Admin Controller] Approval Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject student application
// @route   POST /api/admin/applications/:id/reject
// @access  Private (Admin)
exports.rejectApplication = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Please provide a rejection reason' });
    }

    const app = await Application.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    app.status = 'rejected';
    app.verificationFlags.rejectionReason = rejectionReason;
    await app.save();

    res.status(200).json({
      success: true,
      message: 'Application successfully rejected',
      data: app
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get system auditing and metrics dashboard reporting data
// @route   GET /api/admin/metrics
// @access  Private (Admin)
exports.getAuditMetrics = async (req, res) => {
  try {
    const metrics = await generateMetrics();
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
