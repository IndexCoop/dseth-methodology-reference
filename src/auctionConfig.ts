export type AuctionConfig = {
    priceAdapterName: string;
    priceAdapterAddress: string;
    quoteAsset: string;
    bucketSize: number;
    slopeForSellComponents: number;
    slopeForBuyComponents: number;
    shouldLockSetToken: boolean;
    rebalanceDuration: number;
    initialPricePctSellComponents: number;
    initialPricePctBuyComponents: number;
    maxPriceAsPercentOfMarketPrice: number;
    minPriceAsPercentOfMarketPrice: number;
};

export const DEFAULT_AUCTION_CONFIG: AuctionConfig = {
    priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
    priceAdapterAddress: "0x237F7BBe0b358415bE84AB6d279D4338C0d026bB",
    quoteAsset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    bucketSize: 600, // 10 minutes
    slopeForSellComponents: 0.00025, // decrease by 0.00025 WETH each bucket
    slopeForBuyComponents: 0.000015, // increase by 0.00001 WETH each bucket
    shouldLockSetToken: false,
    rebalanceDuration: 86400, // 1 days
    initialPricePctSellComponents: 1.01, // 2% above market price
    initialPricePctBuyComponents: 0.99, // 2% below market price
    maxPriceAsPercentOfMarketPrice: 1.01,
    minPriceAsPercentOfMarketPrice: 0.99,
};
