import { ethers } from "hardhat";
import { Signer } from "ethers";
import { reset } from "@nomicfoundation/hardhat-network-helpers";
import { AuctionRebalanceProposer } from "../src/auctionRebalanceProposer";
import { DEFAULT_AUCTION_CONFIG } from "../src/auctionConfig";
import {  requireEnv } from "./testUtils";

describe("Calculate dsETH auction rebalance params", function () {
    const dsEthAddress = "0x341c05c0E9b33C0E38d64de76516b2Ce970bB3BE";
    const ratedAccessToken = process.env.RATED_API_ACCESS_TOKEN || "";
    const coingeckoApiKey = process.env.COINGECKO_API_KEY || "";
    const auctionConfig = DEFAULT_AUCTION_CONFIG;
    const testBlock = 18942693;
    const forkUrl = requireEnv("MAINNET_RPC_URL");
    let proposerSigner: Signer;
    let dsEthProposer: AuctionRebalanceProposer;

    before(async function () {
        await reset(forkUrl, testBlock);
        let proposerSigner = await ethers.getSigners().then((signers) => signers[0]);
        console.log("proposerSigner", proposerSigner);
        dsEthProposer = new AuctionRebalanceProposer(
            dsEthAddress,
            ratedAccessToken,
            coingeckoApiKey,
            auctionConfig,
            proposerSigner
        );
    });

    describe("Get LST:ETH exchange rates", function () {
        it("should return expected exchange rates", async function () {
            // TODO: assert expected values at BLOCK_NUMBER
            const lstEthExchangeRates = (await dsEthProposer.getEthExchangeRates()).toString();
            console.log("lstEthExchangeRates", lstEthExchangeRates);
        });

        it("should calculate dsETH Nav in terms of ETH", async function () {
            const nav = await dsEthProposer.getSetTokenNavInWei(dsEthAddress);
            console.log("nav", nav.toString());
            // TODO: assert expected values at BLOCK_NUMBER
        });
    });
});
