const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function deployContract() {
  const DegreeContract = await hre.ethers.getContractFactory("DegreeContract");
  const contract = await DegreeContract.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  const deployedInfo = {
    address: address,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, "deployed_address.json"),
    JSON.stringify(deployedInfo, null, 2)
  );
  
  console.log(`[Network Setup] Contract deployed successfully to address: ${address}`);
  return contract;
}

if (require.main === module) {
  deployContract()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployContract };
