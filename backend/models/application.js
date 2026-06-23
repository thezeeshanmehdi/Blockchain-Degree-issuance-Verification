const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: [true, 'Please add full name']
  },
  rollNumber: {
    type: String,
    required: [true, 'Please add roll number']
  },
  program: {
    type: String,
    required: [true, 'Please add degree program']
  },
  dob: {
    type: Date,
    required: [true, 'Please add date of birth']
  },
  contactNumber: {
    type: String,
    required: [true, 'Please add contact number']
  },
  
  // File Paths on Server or Cloud Storage (we store relative local paths)
  documents: {
    cnicFront: { type: String, required: true },
    cnicBack: { type: String, required: true },
    matricMarksheet: { type: String, required: true },
    interMarksheet: { type: String, required: true },
    paymentReceipt: { type: String, required: true }
  },
  
  paymentDetails: {
    method: { 
      type: String, 
      enum: ['Crypto', '1Link', 'Visa', 'Mastercard'], 
      required: true 
    },
    transactionId: { type: String, required: true },
    amountPaid: { type: Number, required: true }
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // OCR Extraction Results (populated by AI OCR Service)
  ocrData: {
    cnicExpiry: { type: Date },
    matricPercentage: { type: Number },
    interPercentage: { type: Number },
    paymentTransactionId: { type: String },
    paymentAmount: { type: Number },
    rawTextSummary: { type: String }
  },
  
  // Verification Checks (System Policies)
  verificationFlags: {
    cnicValid: { type: Boolean, default: false },
    matricValid: { type: Boolean, default: false },
    interValid: { type: Boolean, default: false },
    paymentValid: { type: Boolean, default: false },
    policyPassed: { type: Boolean, default: false },
    rejectionReason: { type: String }
  },
  
  processedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
