// @ts-nocheck
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
// require("./tasks/block-number");
require("hardhat-gas-reporter");
require("solidity-coverage");
// const ethers = require("ethers");
// const fs = require("fs-extra");
// var readlineSync = require("readline-sync");

/** @type import('hardhat/config').HardhatUserConfig */
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "https://goerli-rpc";
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY || "0xkey";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "apikey";
// const encryptedKeyJson = fs.readFileSync("./key.json", "utf8");
// const PRIVATE_KEY_PASSWORD = readlineSync.question("decrypt private key: ");
// const GOERLI_PRIVATE_KEY = ethers.Wallet.fromEncryptedJsonSync(
//     encryptedKeyJson,
//     PRIVATE_KEY_PASSWORD
// ).privateKey;

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [GOERLI_PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
            // accounts: (provided by hardhat),
        },
    },
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        // can add coinmarketcap api here for USD results
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
};
