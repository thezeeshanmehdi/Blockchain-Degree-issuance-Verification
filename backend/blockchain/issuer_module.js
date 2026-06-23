const hre = require("hardhat");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Degree = require("../models/degree");
const AuditLog = require("../models/auditLog");

function computeDegreeHash(details) {
  const dataString = JSON.stringify({
    serialNumber: details.degreeSerialNumber,
    name: details.graduateName,
    program: details.programName,
    date: details.graduationDate,
    cgpa: details.cgpa
  });
  return "0x" + crypto.createHash("sha256").update(dataString).digest("hex");
}

async function issueDegree(contractAddress, universitySigner, degreeDetails) {
  const startTime = Date.now();
  
  // 1. Generate unique degree hash
  const degreeHash = computeDegreeHash(degreeDetails);
  
  // 2. Format details for smart contract
  const dateUnix = Math.round(new Date(degreeDetails.graduationDate).getTime() / 1000);
  const cgpaScaled = Math.round(degreeDetails.cgpa * 100);
  
  console.log(`[Issuer Module] Preparing issuance transaction for Serial: ${degreeDetails.degreeSerialNumber}`);
  
  // 3. Connect to Smart Contract
  const DegreeContract = await hre.ethers.getContractFactory("DegreeContract");
  const contract = DegreeContract.attach(contractAddress).connect(universitySigner);
  
  // 4. Submit Attestation transaction on-chain
  const tx = await contract.issueDegree(
    degreeHash,
    degreeDetails.degreeSerialNumber,
    degreeDetails.graduateName,
    degreeDetails.programName,
    dateUnix,
    cgpaScaled
  );
  
  console.log(`[Issuer Module] Transaction submitted. Hash: ${tx.hash}`);
  const receipt = await tx.wait();
  const duration = Date.now() - startTime;
  
  console.log(`[Issuer Module] Attested on-chain in ${duration}ms. Block: ${receipt.blockNumber}`);
  
  // 5. Store Metadata and transaction credentials off-chain in MongoDB
  const degree = await Degree.create({
    application: degreeDetails.applicationObjectId || new mongoose.Types.ObjectId(),
    student: degreeDetails.studentObjectId || new mongoose.Types.ObjectId(),
    degreeSerialNumber: degreeDetails.degreeSerialNumber,
    graduateName: degreeDetails.graduateName,
    programName: degreeDetails.programName,
    graduationDate: new Date(degreeDetails.graduationDate),
    cgpa: degreeDetails.cgpa,
    degreeHash: degreeHash,
    blockchain: {
      publicTxId: receipt.hash,
      publicContractAddress: contractAddress,
      privateTxId: `aws-qldb-tx-${crypto.randomBytes(16).toString("hex")}` // Simulated AWS Private Ledger QLDB ID
    }
  });
  
  // 6. Log transaction to Audit Logs database
  await AuditLog.create({
    eventType: 'issuance',
    actor: degreeDetails.universityName || 'Authorized University',
    degreeHash: degreeHash,
    status: 'success',
    details: `Issued degree ${degreeDetails.degreeSerialNumber} to ${degreeDetails.graduateName}`,
    executionTimeMs: duration
  });
  
  return degree;
}

module.exports = { issueDegree, computeDegreeHash };
