import { AuctionRebalanceProposer } from "../src/auctionRebalanceProposer";
import { eligibleSetTokens } from "../src/addresses";
import { DEFAULT_AUCTION_CONFIG } from "../src/auctionConfig";
import { getEnvVars } from "../src/utils";
import {
    displayTargetUnits,
    setupMockRatedApi,
    getDefaultSigner,
} from "./utils";

async function main() {
    let mockedRatedApi = process.env.MOCK_RATED_API == "true";
    if (mockedRatedApi) {
        setupMockRatedApi();
    }

    const proposerSigner = await getDefaultSigner();
    const { ratedAccessToken, ratedApiUrl } = getEnvVars();

    console.log("Rated API URL: ", mockedRatedApi ? "LOCAL MOCK" : ratedApiUrl);

    const dsEthProposer = new AuctionRebalanceProposer(
        eligibleSetTokens.dsEth,
        ratedAccessToken,
        ratedApiUrl,
        DEFAULT_AUCTION_CONFIG,
        proposerSigner
    );

    console.log("Calculating target units for dsEth");
    let targetUnits = await dsEthProposer.getTargetUnits();
    displayTargetUnits(targetUnits);

    console.log("Getting rebalance proposal params for dsEth");
    const params = await dsEthProposer.getProposeRebalanceParams(targetUnits);

    console.log("Propose rebalance params: ", params);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
