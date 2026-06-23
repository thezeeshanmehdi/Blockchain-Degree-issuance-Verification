const hre = require("hardhat");

async function assignRoles(contractAddress, rolesConfig) {
  const DegreeContract = await hre.ethers.getContractFactory("DegreeContract");
  const contract = DegreeContract.attach(contractAddress);
  
  console.log(`[Access Control] Configuring roles on contract at ${contractAddress}`);
  
  if (rolesConfig.universities) {
    for (const address of rolesConfig.universities) {
      console.log(`Authorizing University Address: ${address}`);
      const tx = await contract.authorizeUniversity(address);
      await tx.wait();
    }
  }
  
  if (rolesConfig.students) {
    for (const address of rolesConfig.students) {
      console.log(`Registering Student Address: ${address}`);
      const tx = await contract.registerStudent(address);
      await tx.wait();
    }
  }
  
  if (rolesConfig.employers) {
    for (const address of rolesConfig.employers) {
      console.log(`Registering Employer Address: ${address}`);
      const tx = await contract.registerEmployer(address);
      await tx.wait();
    }
  }
  
  console.log("[Access Control] All roles configured successfully on-chain.");
}

module.exports = { assignRoles };
