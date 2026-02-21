const hre = require("hardhat");

async function main() {
  console.log("Deploying MedicalRecords...");
  
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const contract = await MedicalRecords.deploy();
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("Contract deployed to:", address);
  console.log("Save this address for your frontend!");
  
  // Wait for a few block confirmations
  console.log("Waiting for confirmations...");
  await contract.deploymentTransaction().wait(5);
  
  console.log("Deployment confirmed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});