import { BigNumber, providers, utils } from "ethers";
import { ethers } from "hardhat";
import { MockRatedApi } from "../test/testUtils";
import { AuctionRebalanceProposer } from "../src/auctionRebalanceProposer";
import { eligibleSetTokens } from "../src/addresses";

export function displayTargetUnits(targetUnits: BigNumber[]) {
    console.log("Target Units:");
    console.log("Lido: " + utils.formatEther(targetUnits[0]));
    console.log("RocketPool: " + utils.formatEther(targetUnits[1]));
    console.log("Frax: " + utils.formatEther(targetUnits[2]));
    console.log("Stakewise: " + utils.formatEther(targetUnits[3]));
    console.log("Swell: " + utils.formatEther(targetUnits[4]));
    console.log("Stader: " + utils.formatEther(targetUnits[5]));
}

export function setupMockRatedApi() {
    const mockRatedApi = new MockRatedApi(1, 1);
    mockRatedApi.mockSummaryEndpoint();
    mockRatedApi.mockOperatorsEndpoint();
    return mockRatedApi;
}

export async function getDefaultSigner() {
    let defaultSigner = await ethers.getSigners().then((signers) => signers[0]);
    let provider = defaultSigner.provider as providers.JsonRpcProvider;
    let block = await provider.getBlock("latest");
    console.log("Current block: ", {
        number: block.number,
        timestamp: block.timestamp,
        hash: block.hash,
    });

    return defaultSigner;
}
