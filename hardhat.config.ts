import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import * as dotenv from "dotenv";
dotenv.config();

// WARNING: THIS IS A PUBLICLY KNOWN PRIVATE KEY. DO NOT USE IT FOR ANYTHING OTHER THAN TESTING.
// FUNDS SENT TO THIS ADDRESS WILL BE LOST.
const hardhatPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
    solidity: "0.8.19",
    networks: {
        mainnet: {
            url: process.env.MAINNET_RPC_URL,
            accounts: [process.env.PRIVATE_KEY ?? hardhatPrivateKey],
        }
    },
};

export default config;
