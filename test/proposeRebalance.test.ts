import { MockRatedApi, requireEnv } from "./testUtils";

const defaultValidatorCount = 1;
const defaultOperatorCount = 1;
const mockRatedApi = new MockRatedApi(
    defaultValidatorCount,
    defaultOperatorCount,
);

import { ethers } from "hardhat";
import { BigNumber, utils } from "ethers";
import { reset } from "@nomicfoundation/hardhat-network-helpers";
import { AuctionRebalanceProposer } from "../src/auctionRebalanceProposer";
import { DEFAULT_AUCTION_CONFIG } from "../src/auctionConfig";
import { expect } from "chai";
import { eligibleSetTokens } from "../src/addresses";

describe("Calculate dsETH auction rebalance params", function () {
    const dsEthAddress = eligibleSetTokens.dsEth;
    const ratedAccessToken = process.env.RATED_API_ACCESS_TOKEN || "TESTOKEN";
    const auctionConfig = DEFAULT_AUCTION_CONFIG;
    const testBlock = 18958133;
    const forkUrl = requireEnv("MAINNET_RPC_URL");
    const ratedApiUrl =
        process.env.RATED_API_URL || "https://api.rated.network/v0";
    let dsEthProposer: AuctionRebalanceProposer;
    const numberOfPools = 6;

    before(async function () {
        await reset(forkUrl, testBlock);
        let proposerSigner = await ethers
            .getSigners()
            .then((signers) => signers[0]);
        dsEthProposer = new AuctionRebalanceProposer(
            dsEthAddress,
            ratedAccessToken,
            ratedApiUrl,
            auctionConfig,
            proposerSigner,
        );
    });

    describe("On-chain price queries", function () {
        describe("#getEthExchangeRates", function () {
            const lidoEthExchangeRate = utils.parseEther(
                "1.151473696985310120",
            );
            const rocketPoolEthExchangeRate = utils.parseEther(
                "1.094761417991677774",
            );
            const stakeWiseEthExchangeRate = utils.parseEther(
                "1.004232276619834910",
            );
            const fraxEthExchangeRate = utils.parseEther(
                "1.070920905211974170",
            );
            const swellEthExchangeRate = utils.parseEther(
                "1.047375758619640637",
            );
            const staderEthExchangeRate = utils.parseEther(
                "1.018054114977401548",
            );

            it("should return one value for each pool", async function () {
                const lstEthExchangeRates =
                    await dsEthProposer.getEthExchangeRates();

                const expectedLstEthExchangeRates = [
                    lidoEthExchangeRate,
                    rocketPoolEthExchangeRate,
                    stakeWiseEthExchangeRate,
                    fraxEthExchangeRate,
                    swellEthExchangeRate,
                    staderEthExchangeRate,
                ];

                expect(lstEthExchangeRates).to.deep.equal(
                    expectedLstEthExchangeRates,
                );
            });
        });

        describe("#getSetTokenNavInWei", function () {
            it("should return correct value", async function () {
                const nav =
                    await dsEthProposer.getSetTokenNavInWei(dsEthAddress);

                const expectedNav = utils.parseEther("1.039410708579791328");

                expect(nav).to.deep.equal(expectedNav);
            });
        });
    });

    describe("Rated API integration", function () {
        before(function () {
            mockRatedApi.mockSummaryEndpoint();
            mockRatedApi.mockOperatorsEndpoint();
        });

        context("#getNodeOperatorCounts", function () {
            it("Should return correct values", async function () {
                const operatorCounts =
                    await dsEthProposer.getNodeOperatorCounts();

                const expectedOperatorCounts = [1, 1, 1, 1, 1, 2];

                expect(operatorCounts).to.deep.equal(expectedOperatorCounts);
            });
        });

        context("#getNodeOperatorWeightFactors", function () {
            it("Should return correct values", async function () {
                const nodeOperatorCounts = [35, 2188, 5, 1, 8, 14];
                const nodeOperatorFactors =
                    await dsEthProposer.getNodeOperatorWeightFactors(
                        nodeOperatorCounts,
                    );
                const expectedNodeOperatorFactors = [
                    0.09465985956812165, 0.7484374191119378,
                    0.03577806393679255, 0.016000436613200376,
                    0.04525606892455801, 0.05986815184538941,
                ];

                expect(nodeOperatorFactors).to.deep.equal(
                    expectedNodeOperatorFactors,
                );
            });
        });

        context("#getValidatorDistribution", function () {
            before(function () {
                mockRatedApi.setValidatorDataForPool("Lido", [
                    {
                        validatorCount: 100,
                    },
                    {
                        validatorCount: 200,
                    },
                ]);
            });

            it("Should return correct values", async function () {
                const validatorDistribution =
                    await dsEthProposer.getValidatorDistribution();

                const expectedValidatorDistribution = [
                    [100, 200],
                    [1],
                    [1],
                    [1],
                    [1],
                    [1, 1],
                ];

                expect(validatorDistribution).to.deep.equal(
                    expectedValidatorDistribution,
                );
            });
        });

        context("#getHHIWeightFactors", function () {
            const validatorDistribution = [
                [100, 200],
                [10, 1],
                [1, 1, 1],
                [1],
                [1],
                [1, 1],
            ];

            it("Should calculate the correct protocol HHI scores", async function () {
                const protocolHHIScores =
                    await dsEthProposer.getProtocolHHIScores(
                        validatorDistribution,
                    );

                const expectedProtocolHHIScores = [
                    4444.444444444445, 1652.8925619834718, 6666.666666666668, 0,
                    0, 5000,
                ];

                expect(protocolHHIScores).to.deep.equal(
                    expectedProtocolHHIScores,
                );
            });

            it("Should calculate the correct HHI weight factors", async function () {
                const protocolHHIScores =
                    await dsEthProposer.getProtocolHHIScores(
                        validatorDistribution,
                    );
                const hhiFactors =
                    await dsEthProposer.getHHIWeightFactors(protocolHHIScores);
                const expectedHHIFactors = [
                    0.2501938485396743, 0.09304729904368055,
                    0.37529077280951145, 0, 0, 0.28146807960713355,
                ];

                expect(hhiFactors).to.deep.equal(expectedHHIFactors);
            });
        });

        context("#getTargetUnits", function () {
            const lidoTargetUnits = utils.parseEther("0.183524947187164250");
            const rocketPoolTargetUnits = utils.parseEther(
                "0.137182714490521918",
            );
            const stakeWiseTargetUnits = utils.parseEther(
                "0.149549408574172648",
            );
            const fraxTargetUnits = utils.parseEther("0.140236634011607713");
            const swellTargetUnits = utils.parseEther("0.143389172227472443");
            const staderTargetUnits = utils.parseEther("0.223325247302630300");

            it("Should return the correct values", async function () {
                const targetUnits = await dsEthProposer.getTargetUnits();

                const expectedTargetUnits = [
                    lidoTargetUnits,
                    rocketPoolTargetUnits,
                    stakeWiseTargetUnits,
                    fraxTargetUnits,
                    swellTargetUnits,
                    staderTargetUnits,
                ];

                expect(targetUnits).to.deep.equal(expectedTargetUnits);
            });
        });
    });
});
