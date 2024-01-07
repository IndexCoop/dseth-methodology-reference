import MockAdapter from "axios-mock-adapter";
import axios from "axios";

const axiosMock = new MockAdapter(axios);

import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { reset } from "@nomicfoundation/hardhat-network-helpers";
import { AuctionRebalanceProposer } from "../src/auctionRebalanceProposer";
import { DEFAULT_AUCTION_CONFIG } from "../src/auctionConfig";
import { requireEnv } from "./testUtils";
import { expect } from "chai";

describe("Calculate dsETH auction rebalance params", function () {
    const dsEthAddress = "0x341c05c0E9b33C0E38d64de76516b2Ce970bB3BE";
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
            it("should return one value for each pool", async function () {
                const lstEthExchangeRates = await dsEthProposer.getEthExchangeRates();

                const expectedLstEthExchangeRates = [
                    BigNumber.from("1151473696985310120"),
                    BigNumber.from("1094761417991677774"),
                    BigNumber.from("1004232276619834910"),
                    BigNumber.from("1070920905211974170"),
                    BigNumber.from("1047375758619640637"),
                    BigNumber.from("1018054114977401548")
                ];

                expect(lstEthExchangeRates).to.deep.equal(expectedLstEthExchangeRates);
            });
        });

        describe("#getSetTokenNavInWei", function () {
            it("should return correct value", async function () {
                const nav = await dsEthProposer.getSetTokenNavInWei(dsEthAddress);

                const expectedNav = BigNumber.from("1039410708579791328");

                expect(nav).to.deep.equal(expectedNav);
            });
        });
    });

    describe("Rated API integration", function () {
        function mockRatedEndpoint(
            path: string | RegExp,
            responseFunction: (params: any) => [number, any],
        ) {
            axiosMock.onGet(path).reply(responseFunction);
        }

        const defaultOperatorCount = 1;
        const defaultValidatorCount = 1;
        const defaultValidatorData = [
            {
                validatorCount: defaultValidatorCount,
            },
        ];
        let poolIdToValidatorData: { [poolId: string]: any } = {};
        const defaultPoolSummary = {
            nodeOperatorCount: defaultOperatorCount,
            validatorCount: defaultValidatorCount,
        };

        before(function () {
            mockRatedEndpoint(/.*\/summary/, (config: any) => {
                return [200, defaultPoolSummary];
            });
            mockRatedEndpoint("/eth/operators", (config: any) => {
                const data =
                    poolIdToValidatorData[config.params.parentId] ??
                    defaultValidatorData;
                return [
                    200,
                    {
                        data,
                    },
                ];
            });
        });

        context("#getNodeOperatorCounts", function () {
            it("Should return correct values", async function () {
                const operatorCounts = await dsEthProposer.getNodeOperatorCounts();

                const expectedOperatorCounts = [1, 1, 1, 1, 1, 2];

                expect(operatorCounts).to.deep.equal(expectedOperatorCounts);
            });
        });

        context("#getValidatorDistribution", function () {
            before(function () {
                poolIdToValidatorData["Lido"] = [
                    {
                        validatorCount: 100,
                    },
                    {
                        validatorCount: 200,
                    },
                ];
            });

            it("Should return correct values", async function () {
                const validatorDistribution = await dsEthProposer.getValidatorDistribution();

                const expectedValidatorDistribution = [
                    [100, 200],
                    [1],
                    [1],
                    [1],
                    [1],
                    [1, 1],
                ];

                expect(validatorDistribution).to.deep.equal(expectedValidatorDistribution);
            });
        });

        context("#getTargetUnits", function () {
            it("Should return the correct values", async function () {
                const targetUnits = await dsEthProposer.getTargetUnits();

                const expectedTargetUnits = [
                    BigNumber.from("183524947187164250"),
                    BigNumber.from("137182714490521918"),
                    BigNumber.from("149549408574172648"),
                    BigNumber.from("140236634011607713"),
                    BigNumber.from("143389172227472443"),
                    BigNumber.from("223325247302630300")
                ];

                expect(targetUnits).to.deep.equal(expectedTargetUnits);
            });
        });
    });
});
