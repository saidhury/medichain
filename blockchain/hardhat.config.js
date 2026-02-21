require("@nomicfoundation/hardhat-toolbox");

const SEPOLIA_RPC = "https://eth-sepolia.g.alchemy.com/v2/w1BisTQxyM3nPwtHbLdoA";
// Or use Infura: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
// Or use public: "https://rpc.sepolia.org"

const PRIVATE_KEY = "8af956d58558f86eb9d893e128101001cae7372cb0f40a56855cf6dd15318383"; // Export from MetaMask (test account only!)

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC,
      accounts: [PRIVATE_KEY]
    },
    hardhat: {
      chainId: 1337
    }
  }
};