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

## UMA Optimistic Oracle

The [dsETH Optimistic Oracle](https://etherscan.com) brings the dsETH methodology on chain. It defines a set of objective rules [link to IPFS](http://) that determine if proposed changes to dsETH's composition are valid. Anyone can challenge a re-weighting proposal and stop a rebalance from happening if any rules are violated. Successful challenges are rewarded!

## How the reference query script works

The `calculate-target-units` script fetches node operator and validator data from the [Rated API](https://api-docs.rated.network/getting-started/welcome) and performs calculations to arrive at % target weights for each token to be included in dsETH. From these % target weights, on-chain reference prices are then used to convert the weights into exact units of liquid staking token per 1 dsETH.

The output of the reference script is an array of `targetUnits`. These values can be used as inputs to call `proposeRebalance()` on the OptimisticRebalanceExtension contract, specifically in `oldComponentsAuctionParams` and `newComponentAuctionParams`. Or they can be used to verify an existing proposal is valid.

Note that new tokens being added to the index will be found by looking up a whitelist on the OptimisticRebalanceExtenstion contract (address: TBD). At the moment the new liquid staking tokens are hard-coded in the script.

# Usage 

## Prerequisites
Environment Variables:
1. [rated api](https://api-docs.rated.network/getting-started/welcome) token (`RATED_API_TOKEN`). 
2. Ethereum mainnet rpc url (`MAINNET_RPC_URL` env variable)

## Installation
`yarn install`

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


