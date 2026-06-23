const Application = require('../models/application');
const Degree = require('../models/degree');
const { performOCR, runPolicyChecks } = require('../services/ocrService');
const path = require('path');

// Helper to get relative path for static serving
const getRelativePath = (fileObj) => {
  if (!fileObj || !fileObj[0]) return null;
  return `/uploads/${path.basename(fileObj[0].path)}`;
};

// @desc    Submit student application documents
// @route   POST /api/applications/submit
// @access  Private (Student)
exports.submitApplication = async (req, res) => {
  try {
    const { fullName, rollNumber, program, dob, contactNumber, paymentMethod, transactionId, amountPaid } = req.body;
    
    // Validate that files exist
    if (!req.files || !req.files.cnicFront || !req.files.cnicBack || !req.files.matricMarksheet || !req.files.interMarksheet || !req.files.paymentReceipt) {
      return res.status(400).json({
        success: false,
        message: 'All 5 required documents must be uploaded!'
      });
    }

    // Create the Application record
    const application = new Application({
      student: req.user.id,
      fullName,
      rollNumber,
      program,
      dob,
      contactNumber,
      documents: {
        cnicFront: getRelativePath(req.files.cnicFront),
        cnicBack: getRelativePath(req.files.cnicBack),
        matricMarksheet: getRelativePath(req.files.matricMarksheet),
        interMarksheet: getRelativePath(req.files.interMarksheet),
        paymentReceipt: getRelativePath(req.files.paymentReceipt)
      },
      paymentDetails: {
        method: paymentMethod,
        transactionId: transactionId,
        amountPaid: Number(amountPaid)
      },
      status: 'pending'
    });

    await application.save();

    // Trigger OCR & Policy Verification asynchronously in background
    triggerBackgroundOCR(application._id);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. OCR and policy check running in background.',
      data: application
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current student's application history
// @route   GET /api/applications/my-applications
// @access  Private (Student)
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user.id }).sort('-createdAt').lean();
    
    // For each approved application, append the corresponding degree's pdfUrl
    for (let i = 0; i < applications.length; i++) {
      if (applications[i].status === 'approved') {
        const degree = await Degree.findOne({ application: applications[i]._id });
        if (degree) {
          applications[i].pdfUrl = degree.pdfUrl;
          applications[i].degreeHash = degree.degreeHash;
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

// Background OCR Runner
async function triggerBackgroundOCR(applicationId) {
  try {
    const app = await Application.findById(applicationId);
    if (!app) return;

    app.status = 'processing';
    await app.save();

    console.log(`[Background OCR] Starting OCR processing for Application ID: ${app._id}`);

    // Resolve paths to absolute paths for fs reading inside OCR service
    const rootDir = path.join(__dirname, '../');
    const cnicFrontPath = path.join(rootDir, app.documents.cnicFront);
    const matricPath = path.join(rootDir, app.documents.matricMarksheet);
    const interPath = path.join(rootDir, app.documents.interMarksheet);
    const receiptPath = path.join(rootDir, app.documents.paymentReceipt);

    // Run OCR operations (some parallel or sequential, sequential is safer for token rate limits)
    let cnicData = {};
    let matricData = {};
    let interData = {};
    let receiptData = {};

    try {
      cnicData = await performOCR(cnicFrontPath, 'cnic_front');
    } catch (e) { console.error('CNIC OCR Error', e); }

    try {
      matricData = await performOCR(matricPath, 'matric');
    } catch (e) { console.error('Matric OCR Error', e); }

    try {
      interData = await performOCR(interPath, 'inter');
    } catch (e) { console.error('Inter OCR Error', e); }

    try {
      receiptData = await performOCR(receiptPath, 'receipt');
    } catch (e) { console.error('Receipt OCR Error', e); }

    // Map extracted data to Mongoose schema formats
    app.ocrData = {
      cnicExpiry: cnicData.expiryDate ? new Date(cnicData.expiryDate) : null,
      matricPercentage: matricData.percentage || null,
      interPercentage: interData.percentage || null,
      paymentTransactionId: receiptData.transactionId || null,
      paymentAmount: receiptData.amountPaid || null,
      rawTextSummary: `CNIC Expiry: ${cnicData.expiryDate || 'N/A'}, Matric %: ${matricData.percentage || 'N/A'}, Inter %: ${interData.percentage || 'N/A'}, TxID: ${receiptData.transactionId || 'N/A'}, Amt: ${receiptData.amountPaid || 'N/A'}`
    };

    // Run university policies validation
    const verificationResults = runPolicyChecks(app);
    app.verificationFlags = verificationResults;
    app.status = 'pending'; // Remain pending for Admin's review but now processed
    app.processedAt = new Date();

    await app.save();
    console.log(`[Background OCR] Completed OCR processing for Application ID: ${app._id}. Policy Passed: ${verificationResults.policyPassed}`);

  } catch (error) {
    console.error('[Background OCR] System error in background worker:', error.message);
  }
}
