const hre = require("hardhat");

async function main() {
  // ==========================================
  // CONFIGURATION
  // ==========================================
  
  // 1. RPC URL (Same as before)
  const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/w1BisTQxyM3nPwtHbLdoA";

  // 2. The Contract Address
  const CONTRACT_ADDRESS = "0x369dB59e598Af7e37f5Ef5879b2eA0144904C7AE";

  // 3. YOUR PRIVATE KEY (The Patient)
  // Needed because the contract checks "msg.sender == patient" to allow reading the list
  const PATIENT_PRIVATE_KEY = "8af956d58558f86eb9d893e128101001cae7372cb0f40a56855cf6dd15318383"; 

  // ==========================================

  console.log("----------------------------------------");
  console.log("🔍 Checking Access Control List on Blockchain...");
  
  // Setup Provider & Wallet
  const provider = new hre.ethers.JsonRpcProvider(RPC_URL);
  const patientWallet = new hre.ethers.Wallet(PATIENT_PRIVATE_KEY, provider);
  
  console.log(`\nActing as Patient: ${patientWallet.address}`);
  console.log(`Contract:          ${CONTRACT_ADDRESS}`);

  // Connect to Contract
  // We only need the ABI for the specific function we are calling
  const abi = [
    "function getAuthorizedDoctors(address _patient) external view returns (address[] memory)",
    "function hasAccess(address _patient, address _doctor) external view returns (bool)"
  ];
  
  const contract = new hre.ethers.Contract(CONTRACT_ADDRESS, abi, patientWallet);

  try {
    // 1. Fetch the list of authorized doctors
    console.log("\nFetching authorized doctors list...");
    const doctors = await contract.getAuthorizedDoctors(patientWallet.address);

    console.log("----------------------------------------");
    if (doctors.length === 0) {
      console.log("❌ NO DOCTORS AUTHORIZED (Array is empty)");
    } else {
      console.log(`✅ FOUND ${doctors.length} AUTHORIZED DOCTOR(S):`);
      doctors.forEach((doc, index) => {
        console.log(`   [${index + 1}] ${doc}`);
      });
    }
    console.log("----------------------------------------");

    // 2. Double check specific permission for the doctor you just added
    const specificDoctor = "0xB95f4A099B862ca9088ECd09e43F380aeBb57dEE";
    const hasAccess = await contract.hasAccess(patientWallet.address, specificDoctor);
    console.log(`Specific check for 0xB95f...: ${hasAccess ? "✅ HAS ACCESS" : "❌ NO ACCESS"}`);

  } catch (error) {
    console.error("\n❌ FAILED TO READ DATA");
    console.error("Reason:", error.reason || error.message);
    // Common error: if the private key doesn't match the patient address being queried
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});