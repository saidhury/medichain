const hre = require("hardhat");

async function main() {
  console.log("Deploying MedicalRecords contract...");
  
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const medicalRecords = await MedicalRecords.deploy();

  await medicalRecords.waitForDeployment();

  const address = await medicalRecords.getAddress();
  
  console.log(`MedicalRecords deployed to: ${address}`);
  console.log(`Transaction hash: ${medicalRecords.deploymentTransaction().hash}`);

  // Wait for block confirmations for verification
  console.log("Waiting for block confirmations...");
  await medicalRecords.deploymentTransaction().wait(5);
  
  console.log("Deployment confirmed!");
  
  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: address,
    deployer: await medicalRecords.runner.address,
    timestamp: new Date().toISOString(),
    network: hre.network.name
  };
  
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to deployment-info.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});