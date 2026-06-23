const Degree = require("../models/degree");
const AuditLog = require("../models/auditLog");

async function generateMetrics() {
  try {
    const totalDegrees = await Degree.countDocuments();
    const verificationsCount = await AuditLog.countDocuments({ eventType: "verification" });
    const fraudCount = await AuditLog.countDocuments({ eventType: "fraud_attempt" });
    
    // Average transaction execution times using MongoDB Aggregation
    const avgTimes = await AuditLog.aggregate([
      {
        $group: {
          _id: "$eventType",
          avgTimeMs: { $avg: "$executionTimeMs" }
        }
      }
    ]);
    
    // Transform average times array to key-value object
    const timeMetrics = {};
    avgTimes.forEach(item => {
      timeMetrics[item._id] = Math.round(item.avgTimeMs || 0);
    });
    
    const report = {
      summary: {
        totalDegreesIssued: totalDegrees,
        totalVerificationRequests: verificationsCount,
        fraudAttemptsBlocked: fraudCount
      },
      performance: {
        averageIssuanceTimeMs: timeMetrics.issuance || 0,
        averageVerificationTimeMs: timeMetrics.verification || 0,
        averageFraudDetectionTimeMs: timeMetrics.fraud_attempt || 0
      },
      generatedAt: new Date().toISOString()
    };
    
    return report;
  } catch (error) {
    console.error("[Report Generator] Error compiling reporting metrics:", error);
    throw error;
  }
}

module.exports = { generateMetrics };
