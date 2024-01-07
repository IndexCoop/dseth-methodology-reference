import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
    solidity: "0.8.19",
};

export default config;
