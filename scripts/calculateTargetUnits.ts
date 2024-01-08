import { ethers } from "hardhat";
import { MockRatedApi } from "../test/testUtils";


import { AuctionRebalanceProposer } from "../src/auctionRebalanceProposer";
import { eligibleSetTokens } from "../src/addresses";
import { DEFAULT_AUCTION_CONFIG } from "../src/auctionConfig";
import { getEnvVars } from "../src/utils";
import { displayTargetUnits } from "./utils";

async function main() {

    let mockedRatedApi = process.env.MOCK_RATED_API == "true";
    if (mockedRatedApi) {
        const mockRatedApi = new MockRatedApi(1, 1);
        mockRatedApi.mockSummaryEndpoint();
        mockRatedApi.mockOperatorsEndpoint();
    }

    console.log("Calculating target units for dsEth");


    let proposerSigner = await ethers
        .getSigners()
        .then((signers) => signers[0]);
    const { ratedAccessToken, ratedApiUrl } = getEnvVars();
    console.log("Rated API URL: ", mockedRatedApi ? "LOCAL MOCK" : ratedApiUrl);
    let block = await ethers.getDefaultProvider().getBlock("latest");
    console.log("Current block: ", {number: block.number, timestamp: block.timestamp, hash: block.hash});


    const dsEthProposer = new AuctionRebalanceProposer(
        eligibleSetTokens.dsEth,
        ratedAccessToken,
        ratedApiUrl,
        DEFAULT_AUCTION_CONFIG,
        proposerSigner
    );

    let targetUnits = await dsEthProposer.getTargetUnits();
    displayTargetUnits(targetUnits);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
