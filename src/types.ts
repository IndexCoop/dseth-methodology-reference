import { BigNumber } from "ethers";

export enum PoolIds {
    Lido = "Lido",
    Rocketpool = "Rocketpool",
    Frax = "Frax",
    StakeWise = "StakeWise",
    Swell = "Swell",
    Stader = "Stader",
}

export enum SetTokens {
    dsEth = "dsEth",
}

export type AuctionExecutionParams = {
    targetUnit: BigNumber; // Target quantity of the component in Set, in precise units (10 ** 18).
    priceAdapterName: string; // Identifier for the price adapter to be used.
    priceAdapterConfigData: string; // Encoded data for configuring the chosen price adapter.
};

export type ProposeRebalanceParams = {
    quoteAsset: string;
    oldComponents: string[];
    newComponents: string[];
    newComponentsAuctionParams: AuctionExecutionParams[];
    oldComponentsAuctionParams: AuctionExecutionParams[];
    shouldLockSetToken: boolean;
    rebalanceDuration: number;
    positionMultiplier: number;
};
