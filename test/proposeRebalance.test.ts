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
            const fraxEthExchangeRate = utils.parseEther(
                "1.070920905211974170",
            );
            const stakeWiseEthExchangeRate = utils.parseEther(
                "1.004232276619834910",
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
                    fraxEthExchangeRate,
                    stakeWiseEthExchangeRate,
                    staderEthExchangeRate,
                    swellEthExchangeRate,
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

                const expectedOperatorCounts = [2, 1, 1, 1, 2, 1];

                expect(operatorCounts).to.deep.equal(expectedOperatorCounts);
            });
        });

        context("#getNodeOperatorWeightFactors", function () {
            it("Should return correct values", async function () {
                const nodeOperatorCounts = [35, 2188, 5, 1, 14, 8];
                const nodeOperatorFactors =
                    await dsEthProposer.getNodeOperatorWeightFactors(
                        nodeOperatorCounts,
                    );
                const expectedNodeOperatorFactors = [
                    0.09465985956812165, 0.7484374191119378,
                    0.03577806393679255, 0.016000436613200376,
                    0.05986815184538941, 0.04525606892455801,
                ];

                expect(nodeOperatorFactors).to.deep.equal(
                    expectedNodeOperatorFactors,
                );
            });
        });

        context("#getValidatorDistribution", function () {
            before(function () {
                mockRatedApi.setValidatorDataForPool("Lido Curated Module", [
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
                    [100, 200, 1],
                    [1],
                    [1],
                    [1],
                    [1, 1],
                    [1],
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
            const lidoTargetUnits = utils.parseEther("0.189533925912150545");
            const rocketPoolTargetUnits = utils.parseEther(
                "0.136060339614722700",
            );
            const fraxTargetUnits = utils.parseEther("0.139089273170514623");
            const stakeWiseTargetUnits = utils.parseEther(
                "0.148325854283840534",
            );
            const staderTargetUnits = utils.parseEther("0.221356540457004603");
            const swellTargetUnits = utils.parseEther("0.142216018561812320");

            it("Should return the correct values", async function () {
                const targetUnits = await dsEthProposer.getTargetUnits();

                const expectedTargetUnits = [
                    lidoTargetUnits,
                    rocketPoolTargetUnits,
                    fraxTargetUnits,
                    stakeWiseTargetUnits,
                    staderTargetUnits,
                    swellTargetUnits,
                ];
                expect(targetUnits).to.deep.equal(expectedTargetUnits);
            });
        });

        context("#getProposeRebalanceParams", function () {
            const expectedQuoteAsset =
                "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

            const expectedOldComponents = [
                "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
                "0xae78736Cd615f374D3085123A210448E74Fc6393",
                "0xac3E018457B222d93114458476f3E3416Abbe38F",
                "0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38",
            ];

            const expectedNewComponents = [
                "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",
                "0xf951E335afb289353dc249e82926178EaC7DEd78",
            ];

            const expectedOldComponentsAuctionParams = [
                {
                    targetUnit: BigNumber.from("189533925912150545"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x000000000000000000000000000000000000000000000000101e622c74c4e3a80000000000000000000000000000000000000000000000000000e35fa931a00000000000000000000000000000000000000000000000000000000000000002580000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000101e622c74c4e3a80000000000000000000000000000000000000000000000000fd754479542e3a8",
                },
                {
                    targetUnit: BigNumber.from("136060339614722700"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x0000000000000000000000000000000000000000000000000f54e6a808f3674e0000000000000000000000000000000000000000000000000000e35fa931a000000000000000000000000000000000000000000000000000000000000000025800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000f54e6a808f3674e0000000000000000000000000000000000000000000000000f0dd8c32971674e",
                },
                {
                    targetUnit: BigNumber.from("139089273170514623"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x0000000000000000000000000000000000000000000000000f0033d61974121a0000000000000000000000000000000000000000000000000000e35fa931a000000000000000000000000000000000000000000000000000000000000000025800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000f0033d61974121a0000000000000000000000000000000000000000000000000eb925f139f2121a",
                },
                {
                    targetUnit: BigNumber.from("148325854283840534"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x0000000000000000000000000000000000000000000000000e1346e1c7a9361e0000000000000000000000000000000000000000000000000000e35fa931a000000000000000000000000000000000000000000000000000000000000000025800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000e1346e1c7a9361e0000000000000000000000000000000000000000000000000dcc38fce827361e",
                },
            ];

            const expectedNewComponentsAuctionParams = [
                {
                    targetUnit: BigNumber.from("221356540457004603"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x0000000000000000000000000000000000000000000000000dfd53e06d994acc00000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000000000000000000000000000000000000000025800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e4461c54d1b4acc0000000000000000000000000000000000000000000000000dfd53e06d994acc",
                },
                {
                    targetUnit: BigNumber.from("142216018561812320"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x0000000000000000000000000000000000000000000000000e657fc19720033d00000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000000000000000000000000000000000000000025800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000eac8da676a2033d0000000000000000000000000000000000000000000000000e657fc19720033d",
                },
            ];

            it("Should return the correct values", async function () {
                const targetUnits = await dsEthProposer.getTargetUnits();
                const proposeRebalanceParams =
                    await dsEthProposer.getProposeRebalanceParams(targetUnits);

                expect(proposeRebalanceParams.quoteAsset).to.equal(
                    expectedQuoteAsset,
                );
                expect(proposeRebalanceParams.oldComponents).to.deep.equal(
                    expectedOldComponents,
                );
                expect(proposeRebalanceParams.newComponents).to.deep.equal(
                    expectedNewComponents,
                );

                expect(
                    proposeRebalanceParams.oldComponentsAuctionParams,
                ).to.deep.equal(expectedOldComponentsAuctionParams);

                expect(
                    proposeRebalanceParams.newComponentsAuctionParams,
                ).to.deep.equal(expectedNewComponentsAuctionParams);

                expect(proposeRebalanceParams.shouldLockSetToken).to.be.false;
                expect(proposeRebalanceParams.rebalanceDuration).to.equal(
                    86400,
                );
                expect(proposeRebalanceParams.positionMultiplier).to.deep.equal(
                    utils.parseEther("0.997957208803707410"),
                );
            });
        });
    });
});
