import { ethers } from "hardhat";
import { MockRatedApi } from "../test/testUtils";

import { AuctionRebalanceProposer } from "../src/auctionRebalanceProposer";
import { eligibleSetTokens } from "../src/addresses";
import { DEFAULT_AUCTION_CONFIG } from "../src/auctionConfig";
import { getEnvVars } from "../src/utils";
import { displayTargetUnits } from "./utils";
import { setupMockRatedApi, getDefaultSigner } from "./utils";

async function main() {
    let mockedRatedApi = process.env.MOCK_RATED_API == "true";
    if (mockedRatedApi) {
        setupMockRatedApi();
    }

    const proposerSigner = await getDefaultSigner();
    const { ratedAccessToken, ratedApiUrl } = getEnvVars();

    console.log("Calculating target units for dsEth");
    console.log("Rated API URL: ", mockedRatedApi ? "LOCAL MOCK" : ratedApiUrl);

    const dsEthProposer = new AuctionRebalanceProposer(
        eligibleSetTokens.dsEth,
        ratedAccessToken,
        ratedApiUrl,
        DEFAULT_AUCTION_CONFIG,
        proposerSigner,
    );

    let targetUnits = await dsEthProposer.getTargetUnits();
    displayTargetUnits(targetUnits);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
