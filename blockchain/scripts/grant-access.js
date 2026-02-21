const hre = require("hardhat");

async function main() {
  // ==========================================
  // HARDCODED CONFIGURATION
  // ==========================================
  
  // 1. RPC URL (Using a public Sepolia node)
  const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/w1BisTQxyM3nPwtHbLdoA";

  // 2. The Doctor's Address (from your logs)
  const DOCTOR_ADDRESS = "0xB95f4A099B862ca9088ECd09e43F380aeBb57dEE"; 

  // 3. The Contract Address (from your logs)
  const CONTRACT_ADDRESS = "0x369dB59e598Af7e37f5Ef5879b2eA0144904C7AE";

  // 4. YOUR PRIVATE KEY (The Patient)
  // ⚠️ PASTE YOUR PRIVATE KEY HERE (Must start with 0x or be just hex)
  // This account must have some Sepolia ETH to pay for gas!
  const PATIENT_PRIVATE_KEY = "8af956d58558f86eb9d893e128101001cae7372cb0f40a56855cf6dd15318383"; 

  // ==========================================

  console.log("----------------------------------------");
  console.log(`Connecting to RPC: ${RPC_URL}`);
  
  // 1. Manually create the provider (bypassing hardhat.config.js)
  const provider = new hre.ethers.JsonRpcProvider(RPC_URL);

  // 2. Create the Wallet
  const patientWallet = new hre.ethers.Wallet(PATIENT_PRIVATE_KEY, provider);
  console.log(`Acting as Patient: ${patientWallet.address}`);
  console.log(`Target Doctor:     ${DOCTOR_ADDRESS}`);

  // 3. Connect to the Contract
  // We get the ABI from the artifacts
  const artifact = await hre.artifacts.readArtifact("MedicalRecords");
  const contract = new hre.ethers.Contract(CONTRACT_ADDRESS, artifact.abi, patientWallet);

  // 4. Check if access is already granted
  try {
    console.log("Checking current access status...");
    const alreadyAccess = await contract.hasAccess(patientWallet.address, DOCTOR_ADDRESS);
    if (alreadyAccess) {
      console.log("⚠️  Access is ALREADY granted to this doctor.");
      return;
    }
  } catch (error) {
    console.log("Warning: Could not check existing access (network busy?), attempting to grant anyway...");
  }

  // 5. Send Transaction
  console.log("Sending 'grantAccess' transaction...");
  
  try {
    const tx = await contract.grantAccess(DOCTOR_ADDRESS);
    console.log(`Transaction sent! Hash: ${tx.hash}`);
    
    console.log("Waiting for block confirmation...");
    await tx.wait();
    
    console.log("----------------------------------------");
    console.log("✅ SUCCESS! Access granted.");
    console.log("----------------------------------------");
  } catch (error) {
    console.error("\n❌ TRANSACTION FAILED");
    console.error(error.reason || error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});