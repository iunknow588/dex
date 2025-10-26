import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // 启用IR-based编译器以获得更好的优化
    },
  },

  networks: {
    // 本地开发网络
    hardhat: {
      chainId: 1337,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        accountsBalance: "1000000000000000000000", // 1000 ETH
      },
    },

    // Injective EVM测试网
    injective_testnet: {
      url: "https://testnet.tm.injective.network:443",
      chainId: 888,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 5000000000, // 5 gwei
    },

    // Injective EVM主网
    injective_mainnet: {
      url: "https://tm.injective.network:443",
      chainId: 1,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 5000000000, // 5 gwei
    },

    // Ethereum主网（用于跨链测试）
    mainnet: {
      url: process.env.ETHEREUM_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },

    // Goerli测试网
    goerli: {
      url: process.env.GOERLI_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },

  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",
      injective_testnet: "placeholder", // Injective没有Etherscan
      injective_mainnet: "placeholder",
    },
    customChains: [
      {
        network: "injective_testnet",
        chainId: 888,
        urls: {
          apiURL: "https://explorer.injective.network/api",
          browserURL: "https://explorer.injective.network",
        },
      },
      {
        network: "injective_mainnet",
        chainId: 1,
        urls: {
          apiURL: "https://explorer.injective.network/api",
          browserURL: "https://explorer.injective.network",
        },
      },
    ],
  },

  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },

  mocha: {
    timeout: 40000,
  },
};

export default config;
