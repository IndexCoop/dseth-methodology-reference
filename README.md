[![CI](https://github.com/IndexCoop/optimistic-auction-query/actions/workflows/ci.yml/badge.svg)](https://github.com/IndexCoop/optimistic-auction-query/actions/workflows/ci.yml/badge.svg)

# Reference Scripts for Optimistic Rebalance Auctions
This repo contains logic for triggering / verifying auction rebalances on Index Tokens that have the [OptimistiAuctionRebalanceExtension](https://github.com/IndexCoop/index-coop-smart-contracts/blob/ckoopmann/optimistic-auction-rebalance-extension/contracts/adapters/OptimisticAuctionRebalanceExtensionV1.sol).  (currently only dsEth)


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
`prettier -w **/*.ts`

# Repo Structure
The repository is split into the following directories
- `src`: Contains the core calculation logic and SDK
- `scripts`: Contains hardhat scripts that use different parts of the SDK
- `tests`: Contains hardhat based tests


