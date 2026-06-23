const hre = require("hardhat");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("crypto");

// Load Environment Configuration
dotenv.config({ path: path.join(__dirname, "../.env") });

const { deployContract } = require("./network_setup");
const { assignRoles } = require("./access_control");
const { issueDegree } = require("./issuer_module");
const { verifyDegree } = require("./verifier_module");
const { generateMetrics } = require("./report_generator");

const Degree = require("../models/degree");
const AuditLog = require("../models/auditLog");

async function runSimulation() {
  console.log("==========================================================================");
  console.log("   🎓 STARTING HYBRID BLOCKCHAIN DEGREE ATTESTATION SIMULATION SCENARIO  ");
  console.log("==========================================================================\n");

  // 1. Database Connection
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/blockchain_degree_db";
  console.log(`Connecting to database: ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log("MongoDB Connection Established.");

  // Clear previous simulation logs to ensure correct metrics report
  await Promise.all([
    Degree.deleteMany({}),
    AuditLog.deleteMany({})
  ]);
  console.log("Cleaned prior simulation database logs.");

  // 2. Fetch Accounts
  const signers = await hre.ethers.getSigners();
  const adminSigner = signers[0];
  const uni1Signer = signers[1];
  const uni2Signer = signers[2];
  const student1Signer = signers[3];
  const student2Signer = signers[4];
  const student3Signer = signers[5];
  const employer1Signer = signers[6];
  const employer2Signer = signers[7];
  const attackerSigner = signers[8];

  console.log("\n>>> Accounts Initialized:");
  console.log(`Admin/Owner:             ${adminSigner.address}`);
  console.log(`University 1 (IQRA):     ${uni1Signer.address}`);
  console.log(`University 2 (NUST):     ${uni2Signer.address}`);
  console.log(`Student 1 Account:       ${student1Signer.address}`);
  console.log(`Student 2 Account:       ${student2Signer.address}`);
  console.log(`Student 3 Account:       ${student3Signer.address}`);
  console.log(`Employer 1 (Google PK):  ${employer1Signer.address}`);
  console.log(`Employer 2 (Amazon Dev): ${employer2Signer.address}`);
  console.log(`Attacker Account:        ${attackerSigner.address}\n`);

  // 3. Deploy Contract
  console.log(">>> Step 1: Deploying smart contract on local network...");
  const contract = await deployContract();
  const contractAddress = await contract.getAddress();

  // 4. On-chain Role Authorization
  console.log("\n>>> Step 2: Assigning roles and authorizations on-chain...");
  await assignRoles(contractAddress, {
    universities: [uni1Signer.address, uni2Signer.address],
    students: [student1Signer.address, student2Signer.address, student3Signer.address],
    employers: [employer1Signer.address, employer2Signer.address]
  });

  // 5. Attest & Issue Exactly 5 Digital Degrees
  console.log("\n>>> Step 3: Attesting and Issuing 5 Digital Degrees...");
  const degreesToIssue = [
    { degreeSerialNumber: "IQRA-2026-S101", graduateName: "Ali Ahmed", programName: "BS Computer Science", graduationDate: "2026-06-01", cgpa: 3.8, universitySigner: uni1Signer, universityName: "IQRA University" },
    { degreeSerialNumber: "IQRA-2026-S102", graduateName: "Sara Khan", programName: "BS Software Engineering", graduationDate: "2026-06-02", cgpa: 3.5, universitySigner: uni1Signer, universityName: "IQRA University" },
    { degreeSerialNumber: "NUST-2026-N201", graduateName: "Zain Baloch", programName: "BS Information Technology", graduationDate: "2026-06-03", cgpa: 3.9, universitySigner: uni2Signer, universityName: "NUST University" },
    { degreeSerialNumber: "IQRA-2026-S103", graduateName: "Ali Ahmed", programName: "MS Data Science", graduationDate: "2026-06-04", cgpa: 3.7, universitySigner: uni1Signer, universityName: "IQRA University" },
    { degreeSerialNumber: "NUST-2026-N202", graduateName: "Sara Khan", programName: "MS Cybersecurity", graduationDate: "2026-06-05", cgpa: 3.6, universitySigner: uni2Signer, universityName: "NUST University" }
  ];

  const issuedDegrees = [];
  for (const item of degreesToIssue) {
    const doc = await issueDegree(contractAddress, item.universitySigner, item);
    issuedDegrees.push(doc);
  }
  console.log(`Issued: ${issuedDegrees.length} degrees stored in blockchain + off-chain database.`);

  // 6. Verification requests by Employers
  console.log("\n>>> Step 4: Performing 3 Successful Attestation Verifications...");
  const verifications = [
    { employerSigner: employer1Signer, employerName: "Google Pakistan", details: degreesToIssue[0] },
    { employerSigner: employer2Signer, employerName: "Amazon Dev", details: degreesToIssue[2] },
    { employerSigner: employer1Signer, employerName: "Google Pakistan", details: degreesToIssue[4] }
  ];

  for (const ver of verifications) {
    const res = await verifyDegree(contractAddress, ver.employerSigner, ver.details, ver.employerName);
    console.log(`Verification status for Serial ${ver.details.degreeSerialNumber}: ${res.verified ? "VERIFIED (Success)" : "FAILED"}`);
  }

  // 7. Simulating Fraud Attempt: Tampered verification details
  console.log("\n>>> Step 5: Simulating Tampered Credential Verification Rejection...");
  const tamperedDetails = {
    degreeSerialNumber: degreesToIssue[0].degreeSerialNumber,
    graduateName: degreesToIssue[0].graduateName,
    programName: degreesToIssue[0].programName,
    graduationDate: degreesToIssue[0].graduationDate,
    cgpa: 4.0 // Tampered! Original was 3.8
  };
  
  const fraudCheck = await verifyDegree(contractAddress, employer1Signer, tamperedDetails, "Google Pakistan");
  console.log(`Verification status for Tampered Data (Should be false): ${fraudCheck.verified}`);

  // 8. Simulating Fraud Attempt: Unauthorized university attempting degree attestation
  console.log("\n>>> Step 6: Simulating Unauthorized Attester Block Check...");
  const unauthorizedDegree = {
    degreeSerialNumber: "FAKE-2026-Z999",
    graduateName: "Intruder User",
    programName: "BS Malicious Intent",
    graduationDate: "2026-06-06",
    cgpa: 4.0
  };

  try {
    await issueDegree(contractAddress, attackerSigner, unauthorizedDegree);
    console.log("Warning: Unauthorized issuance bypassed guards!");
  } catch (error) {
    console.log(`Unauthorized issuance successfully BLOCKED by Smart Contract. Reverted: ${error.message.split("\n")[0]}`);
    
    // Log unauthorized attempt as a fraud attempt
    await AuditLog.create({
      eventType: 'fraud_attempt',
      actor: 'Unauthorized Attestation Guard',
      degreeHash: '0x' + crypto.randomBytes(32).toString('hex'),
      status: 'failed',
      details: `Blocked unauthorized attester ${attackerSigner.address} from issuing degree: ${unauthorizedDegree.degreeSerialNumber}`,
      executionTimeMs: 0
    });
  }

  // 9. Generate Report Summary
  console.log("\n>>> Step 7: Generating System Audit & Performance Report...");
  const metrics = await generateMetrics();
  console.log("\n==========================================================================");
  console.log("                       SIMULATION REPORT METRICS                          ");
  console.log("==========================================================================");
  console.log(JSON.stringify(metrics, null, 2));
  console.log("==========================================================================\n");

  await mongoose.connection.close();
  console.log("Database connection closed. Simulation exited successfully.");
}

if (require.main === module) {
  runSimulation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runSimulation };
