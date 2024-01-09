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
                "0xf951E335afb289353dc249e82926178EaC7DEd78",
                "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",
            ];

            const expectedOldComponentsAuctionParams = [
                {
                    targetUnit: utils.parseEther("0.183524947187164250"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x0000000000000000000000000000000000e2337a27533a7627f4566878f0000000000000000000000000000000000000000038c5a42e02d16ef8f60ba5c40000000000000000000000000000000000000000000000000000000000000000025800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000e2337a27533a7627f4566878f000000000000000000000000000000000000000d954988022c9bcd10de49692500000",
                },
                {
                    targetUnit: utils.parseEther("0.137182714490521918"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x0000000000000000000000000000000000d70f6c5da473e6993f13aba414000000000000000000000000000000000000000035f9d4ec55726c12622711fb0000000000000000000000000000000000000000000000000000000000000000025800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000d70f6c5da473e6993f13aba41400000000000000000000000000000000000000cea06318b71a05b65fbd90d4dc0000",
                },
                {
                    targetUnit: utils.parseEther("0.149549408574172648"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x0000000000000000000000000000000000c546b930ea509d96eda0c452f400000000000000000000000000000000000000003183317db84c73d994fd2e430000000000000000000000000000000000000000000000000000000000000000025800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000c546b930ea509d96eda0c452f400000000000000000000000000000000000000bd8a39754584ab7cee5935187c0000",
                },
                {
                    targetUnit: utils.parseEther("0.140236634011607713"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x0000000000000000000000000000000000d2607c993077218982d9cbdf5c000000000000000000000000000000000000000034ccec125e7c44a707be31290000000000000000000000000000000000000000000000000000000000000000025800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000d2607c993077218982d9cbdf5c00000000000000000000000000000000000000ca2077b651b3b6cf69a41430f40000",
                },
            ];

            const expectedNewComponentsAuctionParams = [
                {
                    targetUnit: utils.parseEther("0.143389172227472443"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x0000000000000000000000000000000000c5aed1cff46c3417ec9f3f46da000000000000000000000000000000000000000019d1decccb49b11f56490b664000000000000000000000000000000000000000000000000000000000000000025800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cdc0676ff3f33b71b79612d6ce00000000000000000000000000000000000000c5aed1cff46c3417ec9f3f46da0000",
                },
                {
                    targetUnit: utils.parseEther("0.223325247302630300"),
                    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
                    priceAdapterConfigData:
                        "0x0000000000000000000000000000000000c0261076565acf87e2aa029c1800000000000000000000000000000000000000001918d3213835a82ad36ad7970000000000000000000000000000000000000000000000000000000000000000025800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c7fdd270b7eb941544bb65fb4800000000000000000000000000000000000000c0261076565acf87e2aa029c180000",
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
                    259200,
                );
                expect(proposeRebalanceParams.positionMultiplier).to.deep.equal(
                    utils.parseEther("0.997957208803707410"),
                );
            });
        });
    });
});
