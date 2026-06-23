const hre = require("hardhat");
const { computeDegreeHash } = require("./issuer_module");
const AuditLog = require("../models/auditLog");

async function verifyDegree(contractAddress, employerSigner, degreeDetails, employerName) {
  const startTime = Date.now();
  
  // 1. Generate the hash from the submitted details
  const degreeHash = computeDegreeHash(degreeDetails);
  
  console.log(`[Verifier Module] Verifying degree hash: ${degreeHash} on behalf of ${employerName}`);
  
  // 2. Connect to smart contract
  const DegreeContract = await hre.ethers.getContractFactory("DegreeContract");
  const contract = DegreeContract.attach(contractAddress).connect(employerSigner);
  
  try {
    // 3. Query on-chain data
    const onChainRecord = await contract.verifyDegree(degreeHash);
    const duration = Date.now() - startTime;
    
    // Scale on-chain values back to off-chain format
    const onChainSerialNumber = onChainRecord.serialNumber;
    const onChainGraduateName = onChainRecord.graduateName;
    const onChainProgramName = onChainRecord.programName;
    const onChainGraduationDate = new Date(Number(onChainRecord.graduationDate) * 1000).toISOString().split('T')[0];
    const onChainCgpa = Number(onChainRecord.cgpa) / 100;
    
    // Compare details
    const serialMatch = onChainSerialNumber === degreeDetails.degreeSerialNumber;
    const nameMatch = onChainGraduateName === degreeDetails.graduateName;
    const programMatch = onChainProgramName === degreeDetails.programName;
    const dateMatch = new Date(Number(onChainRecord.graduationDate) * 1000).toDateString() === new Date(degreeDetails.graduationDate).toDateString();
    const cgpaMatch = onChainCgpa === degreeDetails.cgpa;
    
    const isValid = serialMatch && nameMatch && programMatch && dateMatch && cgpaMatch;
    
    if (isValid) {
      console.log(`[Verifier Module] Authenticated successfully. All parameters match. Time: ${duration}ms`);
      
      // Log successful verification
      await AuditLog.create({
        eventType: 'verification',
        actor: employerName,
        degreeHash: degreeHash,
        status: 'success',
        details: `Successful attestation query for Serial: ${degreeDetails.degreeSerialNumber}`,
        executionTimeMs: duration
      });
      
      return {
        verified: true,
        degreeHash,
        onChainData: {
          serialNumber: onChainSerialNumber,
          graduateName: onChainGraduateName,
          programName: onChainProgramName,
          graduationDate: onChainGraduationDate,
          cgpa: onChainCgpa,
          university: onChainRecord.university
        }
      };
    } else {
      console.log(`[Verifier Module] Fraud Alert: Parameter discrepancy detected!`);
      const details = `Parameter mismatch. Submitted Serial: ${degreeDetails.degreeSerialNumber}, Name: ${degreeDetails.graduateName}, CGPA: ${degreeDetails.cgpa}. On-chain Serial: ${onChainSerialNumber}, Name: ${onChainGraduateName}, CGPA: ${onChainCgpa}`;
      
      await AuditLog.create({
        eventType: 'fraud_attempt',
        actor: employerName,
        degreeHash: degreeHash,
        status: 'failed',
        details: details,
        executionTimeMs: duration
      });
      
      return {
        verified: false,
        reason: 'Credential parameter discrepancy detected (tampering check failed)',
        details
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[Verifier Module] Fraud Alert: Unregistered degree hash. Rejection triggered. Error: ${error.message.split("\n")[0]}`);
    
    await AuditLog.create({
      eventType: 'fraud_attempt',
      actor: employerName,
      degreeHash: degreeHash,
      status: 'failed',
      details: `Attestation query failed. Hash not found on registry or invalid query. Submitted Serial: ${degreeDetails.degreeSerialNumber}`,
      executionTimeMs: duration
    });
    
    return {
      verified: false,
      reason: 'Degree attestation hash not found on blockchain registry',
      error: error.message
    };
  }
}

module.exports = { verifyDegree };
