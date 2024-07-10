# dsETH Rebalance Proposal Guidelines

## Overview

The Diversified Staked Ethereum Index (dsETH) is an index token of the leading Ethereum liquid staking tokens. This index is uniquely structured, basing its token weightings on the degree of decentralization exhibited by each component token. This distinctive approach ensures that the index not only reflects market performance but also aligns with the decentralization ethos of the Ethereum ecosystem. To maintain relevance and accuracy, dsETH undergoes a methodical reweighting and rebalancing process semi-annually, ensuring that its composition accurately reflects the evolving landscape of Ethereum's staking tokens every six months.

This document serves as a guideline for dsETH rebalance proposals and their verification within the UMA Optimistic Oracle V3 dispute arbitration system. The dsETH rebalance proposer is responsible for providing both reweighting parameters, such as the selection of underlying components and their respective weightings, and Dutch auction rebalancing parameters, including the duration of the auction, starting prices, and the rate at which these prices change. This structured approach ensures that each proposal undergoes a mandatory challenge period for validation, followed by the initiation of Dutch auctions, all aimed at maintaining the accuracy and integrity of dsETH's composition.

## Reweighting Guidelines

### Token Inclusion Guidelines

Liquid staking tokens must meet the following inclusion criteria to be considered as components within the index:

-   liquid staking tokens must be available on Ethereum main net
-   liquid staking tokens must have a minimum of $25m secondary market liquidity on Ethereum main net
-   liquid staking tokens must have a commission rate of 15% or less charged by the issuer
-   staking protocols must be audited and reviewed by security professionals to determine that security best practices have been followed
-   staking protocols must also be in operation for a minimum of six months so that the decentralized finance community can arrive at a consensus regarding its safety
-   staking protocols must be open-source
-   staking protocols must have an active bug bounty program
-   no single client can account for two-thirds (2/3) of a liquid staking protocol’s consensus client distribution

### Target Weight Guidelines

Each liquid staking token meeting the inclusion criteria starts with an equal weight of `1`. This weight is then adjusted by adding the Node Operator Factor and the Herfindahl-Hirschman Index (HHI) Factor, resulting in the 'ultimate weight' for each protocol. The percentage allocation for each protocol is calculated by dividing its ultimate weight by the sum of ultimate weights across all protocols. An example calculation is provided below:

| Token   | Initial Weight | Node Operator Factor | HHI Factor | Ultimate Weight | Final Allocation |
| ------- | -------------- | -------------------- | ---------- | --------------- | ---------------- |
| sETH2   | 1              | 0.036                | 0.279      | 1.314           | 21.91%           |
| rETH    | 1              | 0.861                | 0.366      | 2.227           | 37.12%           |
| wstETH  | 1              | 0.087                | 0.355      | 1.442           | 24.04%           |
| sfrxETH | 1              | 0.016                | 0.000      | 1.016           | 16.93%           |
| Total   | -              | 0.984                | 1.000      | 6.000           | 100.00%          |

Any changes to the dsETH methodology must be approved by an $INDEX token vote. The full methodology can also be found on the [Index Coop governance forum](https://gov.indexcoop.com/t/iip-171-launch-the-diversified-staked-eth-index-dseth/4389).

#### Node Operator Factor

The liquid staking tokens that meet all of the token inclusion criteria are equally weighted before adding a Node Operator Factor, which benefits staking protocols with more active node operators. The steps for calculating the Node Operator Factor for each component are:

1. per staking protocol, identify the number of unique, active node operators
2. per staking protocol, take the square root of active node operators from Step 1
3. sum the square roots of all staking protocols from Step 2
4. per staking protocol, divide the square root of active node operators from Step 2 by the sum of the square roots from Step 3
5. The resulting value from Step 4 represents the Node Operator Factor for each staking protocol

#### Herfindahl-Hirschman Index

Next, an HHI (or Herfindahl-Hirschman Index) Factor is then added, which measures the concentration of stake and broader competition amongst active node operators within each protocol. The steps for calculating the HHI Factor for each component are:

1. per staking protocol, identify the number of validators supported by each active node operator
2. per staking protocol, divide the number of validators run by each node operator by the total number of validators supporting the entire protocol; multiply the quotient by 100, then square the result
3. sum the outputs from Step 2; this represents the initial HHI value for the specific staking protocol
4. per staking protocol, subtract the sum from Step 3 from 10,000
5. sum the differences for each staking protocol from Step 4
6. per staking protocol, divide the difference from Step 4 by the sum from Step 5
7. The resulting value from Step 6 represents the HHI Factor for each staking protocol

### Reference Price Guidelines

Reference prices for each liquid staking token are used to convert Target Weights into Target Units and center the Dutch auction price curves. These reference prices should be denominated in ETH and remain within 1% of the on-chain exchange rates at the time the rebalance is proposed. Valid exchange rates can be sourced from oracle price feed contracts or directly from the liquid staking token contracts themselves.

### Target Unit Guidelines

Target Units are calculated based on the current weighting and value of the index, alongside the target weighting of the index. This calculation is required for the rebalance proposal.

The steps for calculating Target Units given a set of Target Weights and reference prices are:

1. For each component in dsETH, read the value of getDefaultPositionRealUnit from the dsETH token contract and multiply this value by the component’s reference price.
2. Sum the values from step 1. This gives the net asset value (NAV) of dsETH in terms of ETH.
3. For each liquid staking token t to be included in the new composition:
   Target Unit(t) = [dsETH NAV] \* [Target Weight(t)] / Reference Price(t)

Each component's proposed Target Unit should individually have a deviation of no more than 2% from its calculated Target Unit, based on the ETH reference prices and Target Weights.

## Proposal Guidelines

### Contract Addresses

-   dsETH: `0x341c05c0E9b33C0E38d64de76516b2Ce970bB3BE`
-   OptimisticAuctionExtensionV1: `0xf0D343Fd94ac44EF6b8baaE8dB3917d985c2cEc7`
-   BoundedStepwiseLinearPriceAdapter: `0x237F7BBe0b358415bE84AB6d279D4338C0d026bB`

### Proposal Submission Endpoint

Proposals are submitted through the `proposeRebalance()` function of the OptimisticAuctionExtensionV1 contract. The required arguments include:

-   `_quoteAsset`: ERC20 token used as the quote asset in auctions.
-   `_oldComponents`: ERC20 token used as the quote asset in auctions.
-   `_newComponents`: Addresses of new components to be added.
-   `_newComponentsAuctionParams`: `AuctionExecutionParams` for new components, indexed corresponding to `_newComponents`.
-   `_oldComponentsAuctionParams`: `AuctionExecutionParams` for existing components, indexed corresponding to the current component positions. Set to 0 for components being removed.
-   `_rebalanceDuration`: Duration of the rebalance in seconds.
-   `_positionMultiplier`: Position multiplier at the time target units were calculated.

### Fixed Rebalance Parameters

Every proposal must adhere to these fixed parameters:

-   `_quoteAsset`: Must be WETH - `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
-   `_rebalanceDuration`: Must be 1 day (`86400` seconds)

### Dynamic Rebalance Parameters

These parameters must be accurate at the time of proposal:

-   `_oldComponents`: Must match dsETH's `getComponents()` result at proposal time.
-   `_newComponents`: Must be whitelisted in Optimistic Extension’s `getAllowedAssets()` result.
-   `_positionMultiplier`: Must match dsETH's `positionMultiplier()` result.

### Auction Execution Parameters

These parameters must comply with target unit and price curve guidelines:

-   `_targetUnit`: Must be valid as per Target Unit guidelines.
-   `_priceAdapterName`: Must be set for the linear price adapter.
-   `_priceAdapterConfigData`: Must align with the Price Curve Parameters.

### Price Curve Parameters

These parameters must be closely aligned with valid target units and reference prices:

-   `_initialPrice`: Align with max price if `_isDecreasing` is true, or with min price otherwise.
-   `_slope`: Set to at most 0.001 WETH (`1000000000000000`).
-   `_bucketSize`: Should be 10 minutes (`600` seconds).
-   `_isDecreasing`: True if the component’s target unit is below the value of `getDefaultPositionRealUnit()` result at proposal time, false otherwise.
-   `_maxPrice`: Must be within 2% of the valid reference price.
-   `_minPrice`: Must be within 2% of the valid reference price.

### Reference

For proposers and disputers seeking a reference point, a specific script has been created and is available at [Index Coop's dsETH Methodology Reference](https://github.com/IndexCoop/dseth-methodology-reference). This script, which utilizes the Rated API for source data, is designed to output the latest methodology results and rebalance proposals. However, it's important to note that this script serves only as a reference tool. Proposal guidelines and dispute resolution processes should still adhere strictly to this publication.
