const mongoose = require('mongoose');

const degreeSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  degreeSerialNumber: {
    type: String,
    required: true,
    unique: true
  },
  graduateName: {
    type: String,
    required: true
  },
  programName: {
    type: String,
    required: true
  },
  graduationDate: {
    type: Date,
    default: Date.now
  },
  cgpa: {
    type: Number,
    required: true
  },
  
  // Cryptographic identity
  degreeHash: {
    type: String,
    required: true,
    unique: true
  },
  
  blockchain: {
    privateTxId: { type: String },      // Private AWS Datastore Transaction ID
    publicTxId: { type: String },       // Public Blockchain transaction ID
    publicContractAddress: { type: String }
  },
  
  pdfUrl: {
    type: String
  },
  qrCodeData: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Degree', degreeSchema);
