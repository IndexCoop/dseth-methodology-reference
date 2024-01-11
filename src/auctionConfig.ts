import { BigNumber, ethers } from "ethers";

export type AuctionConfig = {
    priceAdapterName: string;
    priceAdapterAddress: string;
    quoteAsset: string;
    bucketSize: number;
    slopeForSellComponents: BigNumber;
    slopeForBuyComponents: BigNumber;
    shouldLockSetToken: boolean;
    rebalanceDuration: number;
    initialPriceAdjustSellComponents: BigNumber;
    initialPriceAdjustBuyComponents: BigNumber;
    maxPriceAboveMarketPrice: BigNumber;
    minPriceBelowMarketPrice: BigNumber;
};

export const DEFAULT_AUCTION_CONFIG: AuctionConfig = {
    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
    priceAdapterAddress: "0x237F7BBe0b358415bE84AB6d279D4338C0d026bB",
    quoteAsset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    bucketSize: 600, // 10 minutes
    slopeForSellComponents: ethers.utils.parseEther("0.00025"), // decrease by 0.00025 WETH each bucket
    slopeForBuyComponents: ethers.utils.parseEther("0.0001"), // increase by 0.00001 WETH each bucket
    shouldLockSetToken: false,
    rebalanceDuration: 86400, // 1 days
    initialPriceAdjustSellComponents: ethers.utils.parseEther("0.01"), // 1% above market price
    initialPriceAdjustBuyComponents: ethers.utils.parseEther("0.01"), // 1% below market price
    maxPriceAboveMarketPrice: ethers.utils.parseEther("0.01"),
    minPriceBelowMarketPrice: ethers.utils.parseEther("0.01"),
};
