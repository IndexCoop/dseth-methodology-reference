[![CI](https://github.com/IndexCoop/optimistic-auction-query/actions/workflows/ci.yml/badge.svg)](https://github.com/IndexCoop/optimistic-auction-query/actions/workflows/ci.yml/badge.svg)

# Reference query for calculating new dsETH weights and target units
Instructions and executable code for generating valid dsETH rebalance parameters.

# Background

[The Diversified Staked Ethereum Index (dsETH)](https://indexcoop.com/products/diversified-staked-ethereum-index) follows a [methodology for periodically re-weighting its holdings](https://gov.indexcoop.com/t/iip-171-launch-the-diversified-staked-eth-index-dseth/4389#h-60-methodology-15).

To encourage public verification that the methodology is being followed correctly, we use UMA Optimistic Oracle V3’s dispute arbitration system. This adds a challenge period where reweighting proposals can be validated prior to taking effect. After the challenge period, a Dutch auction begins to incentivize traders to rebalance dsETH's holdings towards the new target composition. Dutch auction parameters are included in the dsETH re-weighting proposal, and can be verified by the UMA oracle alongside the new weights.

## Overview of dsETH's methodology

At a high level the dsETH methodology states that:
1) Every six months, dsETH is to be rebalanced into a new composition to reflect changes in the Ethereum liquid staking ecosystem
2) New liquid staking tokens can be added if they meet token inclusion criteria
3) New weights for each components can be calculated based on each liquid staking protocols' node operator and validator data.

## UMA Optimistic Oracle and Rebalance Proposals

The [UMA Optimistic Oracle](https://docs.uma.xyz/) brings the dsETH methodology on chain. It defines [guidelines] (https://ipfs.io/ipfs/QmdHftq7GK552HHVoLdU41DTzxSyFhhPnPoEEuySKM7nWK?filename=guidelines.md) to assert wether a re-weighting proposal is valid. In addition to instructions for validating the dsETH methodology, the guidelines document also specify auction parameter values related to rebalance execution.

Anyone can [dispute a re-weighting proposal](https://docs.uma.xyz/using-uma/disputing-oracle-data) does not follow the guidelines, and prevent a rebalance from happening while the dispute goes through arbitration. Successful disputes are rewarded!

## How the Calculate Auction Rebalance parameters reference script works

The `calculate-auction-rebalance-params` script calculates Target Weights according to the methodology and outputs all the parameters needed to submit<sup>*</sup> or verify a re-weighting proposal. The output of this script can be directly compared to the data in the assertion transaction sent to the dsETH Optimistic Oracle, viewable in [UMA's Oracle dApp](https://oracle.uma.xyz/). 

Note that because this script uses live API calls to Rated, the numerical values for Target Units will not be exactly the same as the submitted proposal. The Optimistic Oracle guidelines states there can be up to a 2% deviation in calculated Target Unit values without triggering a valid dispute.

<sup>*</sup>Proposals are created by submitting a `proposeRebalance()` transaction on dsETH's [OptimisticAuctionRebalanceExtensionV1 contract](https://etherscan.io/address/0x4677f9eac72e10469949d73d8ef71883ce510732#code)

# Usage 

## Prerequisites
Environment Variables:
1. [rated api](https://api-docs.rated.network/getting-started/welcome) token (`RATED_API_TOKEN`). [Sign up](https://www.rated.network/signUp) for a free API key.
2. Ethereum mainnet rpc url (`MAINNET_RPC_URL` env variable)

Be aware that Rated's free API plan is only sufficient to run 1 or 2 calculations. There is a MOCK_RATED_API environment variable that can be set to "true" for testing.

## Installation
`yarn install`

## Calculate Auction Rebalance Params
To output all the parameters for verifying a re-weighting proposal run:
`yarn calculate-auction-rebalance-params`

## Calculate target units 
To calculate the composition of a dsETH set token to be targeted in the auction run:
`yarn calculate-target-units`

## Run tests:
`yarn hardhat test`

## Lint code
This repo uses [prettier](https://prettier.io/docs/en/install.html) (latest version) to enforce consistent formatting:
`yarn prettier -w **/*.ts`

# Repo Structure
The repository is split into the following directories
- `src`: Contains the core calculation logic and SDK
- `scripts`: Contains hardhat scripts that use different parts of the SDK
- `tests`: Contains hardhat based tests

## Appendix: How the Calculate Target Units reference query script works

The `calculate-target-units` script fetches node operator and validator data from the [Rated API](https://api-docs.rated.network/getting-started/welcome) and performs calculations to arrive at % target weights for each token to be included in dsETH. From these % target weights, on-chain reference prices are then used to convert the weights into exact units of liquid staking token per 1 dsETH.

The output of the reference script is an array of `targetUnits`. These values can be used as inputs to call `proposeRebalance()` on the OptimisticRebalanceExtension contract, specifically in `oldComponentsAuctionParams` and `newComponentAuctionParams`. Or they can be used to verify an existing proposal is valid.

Note that new tokens being added to the index are found by looking up a whitelist on the [OptimisticRebalanceExtenstionV1 contract](https://etherscan.io/address/0x4677f9eac72e10469949d73d8ef71883ce510732#readContract#F9) and comparing to the current dsETH components. In this script the new liquid staking tokens are hard-coded.
