const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['issuance', 'verification', 'fraud_attempt'],
    required: true
  },
  actor: {
    type: String, // e.g. Name/Email of University, Student, or Employer
    required: true
  },
  degreeHash: {
    type: String
  },
  status: {
    type: String, // 'success', 'failed'
    required: true
  },
  details: {
    type: String
  },
  executionTimeMs: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
