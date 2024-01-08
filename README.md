[![CI](https://github.com/IndexCoop/optimistic-auction-query/actions/workflows/ci.yml/badge.svg)](https://github.com/IndexCoop/optimistic-auction-query/actions/workflows/ci.yml/badge.svg)

# Reference Scripts for Optimistic Rebalance Auctions
Logic for triggering / verifying auction rebalances on supported Index Tokens.  (currently only dsEth)

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
