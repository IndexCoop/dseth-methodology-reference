import MockAdapter from "axios-mock-adapter";
import axios from "axios";

const axiosMock = new MockAdapter(axios);

import { ethers } from "hardhat";
import { Signer } from "ethers";
import { reset } from "@nomicfoundation/hardhat-network-helpers";
import { AuctionRebalanceProposer } from "../src/auctionRebalanceProposer";
import { DEFAULT_AUCTION_CONFIG } from "../src/auctionConfig";
import { requireEnv } from "./testUtils";
import { expect } from "chai";

describe("Calculate dsETH auction rebalance params", function () {
    const dsEthAddress = "0x341c05c0E9b33C0E38d64de76516b2Ce970bB3BE";
    const ratedAccessToken = process.env.RATED_API_ACCESS_TOKEN || "TESTOKEN";
    const auctionConfig = DEFAULT_AUCTION_CONFIG;
    const testBlock = 18942693;
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
                const lstEthExchangeRates =
                    await dsEthProposer.getEthExchangeRates();
                expect(lstEthExchangeRates).to.have.lengthOf(numberOfPools);
            });
        });
        describe("#getSetTokenNavInWei", function () {
            it("should return correct value", async function () {
                const nav =
                    await dsEthProposer.getSetTokenNavInWei(dsEthAddress);
                // TODO: Tests for expected value at block number for each pool
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
            it("Should have one result for each pool", async function () {
                const operatorCounts =
                    await dsEthProposer.getNodeOperatorCounts();
                expect(operatorCounts.length).to.equal(numberOfPools);
            });
            it("Should return correct values", async function () {
                const operatorCounts =
                    await dsEthProposer.getNodeOperatorCounts();
                for (let i = 0; i < numberOfPools - 1; i++) {
                    expect(operatorCounts[i]).to.equal(defaultOperatorCount);
                }
                // Assumption: Stader is always last in the list
                expect(operatorCounts[numberOfPools - 1]).to.equal(
                    defaultOperatorCount * 2,
                );
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

            it("Should have one result for each pool", async function () {
                const validatorDistribution =
                    await dsEthProposer.getValidatorDistribution();
                expect(validatorDistribution.length).to.equal(numberOfPools);
            });

            it("Should return correct values", async function () {
                const validatorDistribution =
                    await dsEthProposer.getValidatorDistribution();
                // Assumption: Lido is always first in the list
                expect(validatorDistribution[0]).to.deep.equal(
                    poolIdToValidatorData["Lido"].map(
                        (data: any) => data.validatorCount,
                    ),
                );
                // Assumption: Stader is always last in the list
                expect(validatorDistribution[numberOfPools - 1]).to.deep.equal([
                    defaultValidatorCount,
                    defaultValidatorCount,
                ]);
                for (let i = 1; i < numberOfPools - 1; i++) {
                    expect(validatorDistribution[i]).to.deep.equal([
                        defaultValidatorCount,
                    ]);
                }
            });
        });

        context("#getTargetUnits", function () {
            it("Should have one result for each pool", async function () {
                const targetUnits = await dsEthProposer.getTargetUnits();
                expect(targetUnits.length).to.equal(numberOfPools);
            });
            it("Should return distinct values", async function () {
                const targetUnits = await dsEthProposer.getTargetUnits();
                for (let i = 0; i < numberOfPools - 1; i++) {
                    expect(targetUnits[i].eq(targetUnits[i + 1])).to.be.false;
                }
            });
            it("All values should be greater than 0.1 ether", async function () {
                const targetUnits = await dsEthProposer.getTargetUnits();
                for (let i = 0; i < numberOfPools - 1; i++) {
                    expect(targetUnits[i].gt(ethers.utils.parseEther("0.1"))).to
                        .be.true;
                }
            });
        });
    });
});
