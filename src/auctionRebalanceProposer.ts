import { BigNumber, Contract, Signer } from "ethers";
import { RatedApiService } from "./ratedApiService";
import { AuctionConfig } from "./auctionConfig";
import { parseEther, toWei } from "./utils";
import {
    SET_TOKEN_ABI,
    SWETH_ABI,
    WSTETH_ABI,
    RETH_ABI,
    OSETH_PRICE_FEED_ABI,
    SFRXETH_ABI,
    ETHX_ABI,
    BOUNDED_STEPWISE_LINEAR_PRICE_ADAPTER_ABI,
    CHAINLINK_PRICE_FEED_ABI,
} from "./abis";
import {
    PoolIds,
    AuctionExecutionParams,
    ProposeRebalanceParams,
} from "./types";
import { stakingTokens, stakingTokenRateProviders } from "./addresses";

export class AuctionRebalanceProposer {
    private ratedApi: RatedApiService;

    constructor(
        private readonly setToken: string,
        private readonly ratedAccessToken: string,
        private readonly ratedApiUrl: string,
        private readonly auctionConfig: AuctionConfig,
        private readonly signer: Signer,
    ) {
        this.ratedApi = new RatedApiService(this.ratedApiUrl);
    }

    async getTargetUnits(): Promise<BigNumber[]> {
        const nodeOperatorCounts = await this.getNodeOperatorCounts();
        const nodeOperatorFactors =
            this.getNodeOperatorWeightFactors(nodeOperatorCounts);
        const validatorDistribution = await this.getValidatorDistribution();
        const protocolHHIScores = await this.getProtocolHHIScores(
            validatorDistribution,
        );
        const hhiFactors = this.getHHIWeightFactors(protocolHHIScores);
        const targetWeights = await this.getTargetWeights(
            nodeOperatorFactors,
            hhiFactors,
        );
        return this.calculateTargetUnits(targetWeights);
    }

    async getTargetWeights(
        nodeOperatorFactors: number[],
        hhiFactors: number[],
    ): Promise<number[]> {
        let targetWeights: number[] = [];
        const weightFactorSum =
            Object.keys(PoolIds).length +
            nodeOperatorFactors.reduce((a, b) => a + b) +
            hhiFactors.reduce((a, b) => a + b);
        for (let i = 0; i < Object.keys(PoolIds).length; i++) {
            targetWeights.push(
                (1 + nodeOperatorFactors[i] + hhiFactors[i]) / weightFactorSum,
            );
        }
        return targetWeights;
    }

    async getEthExchangeRates(): Promise<BigNumber[]> {
        let ethExchangeRates: BigNumber[] = [];

        for (const poolId of Object.values(PoolIds)) {
            switch (poolId) {
                case PoolIds.Lido:
                    // Get stETH per wstETH
                    const wstEthRateProvider = new Contract(
                        stakingTokenRateProviders[poolId],
                        WSTETH_ABI,
                        this.signer,
                    );
                    const stEthPerWstETH =
                        await wstEthRateProvider.stEthPerToken();

                    // Get ETH per stETH
                    const stEthPriceFeed =
                        "0x86392dC19c0b719886221c78AB11eb8Cf5c52812";
                    const stEthRateProvider = new Contract(
                        stEthPriceFeed,
                        CHAINLINK_PRICE_FEED_ABI,
                        this.signer,
                    );
                    const ethPerStEth = await stEthRateProvider.latestAnswer();

                    // Calculate ETH per wstETH
                    const ethPerWstETH = stEthPerWstETH
                        .mul(ethPerStEth)
                        .div(BigNumber.from(10).pow(18));
                    ethExchangeRates.push(ethPerWstETH);
                    break;
                case PoolIds.Rocketpool:
                    const rETHRateProvider = new Contract(
                        stakingTokenRateProviders[poolId],
                        RETH_ABI,
                        this.signer,
                    );
                    ethExchangeRates.push(
                        await rETHRateProvider.getExchangeRate(),
                    );
                    break;
                case PoolIds.StakeWise:
                    const osETHRateProvider = new Contract(
                        stakingTokenRateProviders[poolId],
                        OSETH_PRICE_FEED_ABI,
                        this.signer,
                    );
                    ethExchangeRates.push(await osETHRateProvider.getRate());
                    break;
                case PoolIds.Frax:
                    const sfrxETHRateProvider = new Contract(
                        stakingTokenRateProviders[poolId],
                        SFRXETH_ABI,
                        this.signer,
                    );
                    ethExchangeRates.push(
                        await sfrxETHRateProvider.pricePerShare(),
                    ); // Returns frxETH per sfrxETH, which is pegged to ETH price +/- 1%
                    break;
                case PoolIds.Swell:
                    const swETHRateProvider = new Contract(
                        stakingTokenRateProviders[poolId],
                        SWETH_ABI,
                        this.signer,
                    );
                    ethExchangeRates.push(await swETHRateProvider.getRate());
                    break;
                case PoolIds.Stader:
                    const ethXRateProvider = new Contract(
                        stakingTokenRateProviders[poolId],
                        ETHX_ABI,
                        this.signer,
                    );
                    ethExchangeRates.push(
                        await ethXRateProvider.getExchangeRate(),
                    );
                    break;
                default:
                    break;
            }
        }
        return ethExchangeRates;
    }

    async getSetTokenNavInWei(setToken: string): Promise<BigNumber> {
        const setTokenContract = new Contract(
            setToken,
            SET_TOKEN_ABI,
            this.signer,
        );
        const components: string[] = await setTokenContract.getComponents();
        const currentUnits: BigNumber[] = await Promise.all(
            Object.values(stakingTokens).map(async (addr) => {
                if (components.includes(addr))
                    return await setTokenContract.getDefaultPositionRealUnit(
                        addr,
                    );
                return BigNumber.from(0);
            }),
        );
        const componentPricesInWei = await this.getEthExchangeRates();

        return currentUnits.reduce(
            (a: BigNumber, b, i) =>
                a.add(
                    b
                        .mul(componentPricesInWei[i])
                        .div(BigNumber.from(10).pow(18)),
                ),
            BigNumber.from(0),
        );
    }

    async calculateTargetUnits(targetWeights: number[]): Promise<BigNumber[]> {
        const nav = await this.getSetTokenNavInWei(this.setToken);
        const componentPricesInWei = await this.getEthExchangeRates();

        return targetWeights.map((weight, i) =>
            nav.mul(toWei(weight)).div(componentPricesInWei[i]),
        );
    }

    async getProposeRebalanceParams(
        targetUnits: BigNumber[],
    ): Promise<ProposeRebalanceParams> {
        const componentPricesInWei = await this.getEthExchangeRates();
        const priceAdapter = new Contract(
            this.auctionConfig.priceAdapterAddress,
            BOUNDED_STEPWISE_LINEAR_PRICE_ADAPTER_ABI,
            this.signer,
        );
        const setTokenContract = new Contract(
            this.setToken,
            SET_TOKEN_ABI,
            this.signer,
        );
        const oldComponents: string[] = await setTokenContract.getComponents();
        let newComponents: string[] = [];
        let oldComponentsAuctionParams: AuctionExecutionParams[] = [];
        let newComponentsAuctionParams: AuctionExecutionParams[] = [];

        let i = 0;
        for (const addr of Object.values(stakingTokens)) {
            if (oldComponents.includes(addr)) {
                const currentUnits: BigNumber =
                    await setTokenContract.getDefaultPositionRealUnit(addr);
                const isDecreasing = targetUnits[i] < currentUnits; // When selling component, auction price is decreasing
                const params = await this.getAuctionExecutionParamsForComponent(
                    priceAdapter,
                    this.auctionConfig,
                    componentPricesInWei[i],
                    targetUnits[i],
                    isDecreasing,
                );
                oldComponentsAuctionParams.push(params);
            } else {
                newComponents.push(addr);
                const params = await this.getAuctionExecutionParamsForComponent(
                    priceAdapter,
                    this.auctionConfig,
                    componentPricesInWei[i],
                    targetUnits[i],
                    false,
                );
                newComponentsAuctionParams.push(params);
            }
            i++;
        }

        return {
            quoteAsset: this.auctionConfig.quoteAsset,
            oldComponents,
            newComponents,
            newComponentsAuctionParams,
            oldComponentsAuctionParams,
            shouldLockSetToken: false,
            rebalanceDuration: this.auctionConfig.rebalanceDuration,
            positionMultiplier: await setTokenContract.positionMultiplier(),
        };
    }

    // Calculate sqrt(NodeOperatorCount) for each liquid staking protocol
    // Divide by the sum of all protocols' sqrt(NodeOperatorCount) to get a Node Operator Weight Factor between 0 and 1
    getNodeOperatorWeightFactors(nodeOperatorCounts: number[]): number[] {
        const sqrtNodeOperatorTotal = nodeOperatorCounts.reduce(
            (a, b) => a + Math.sqrt(b),
            0,
        );
        return nodeOperatorCounts.map(
            (count) => Math.sqrt(count) / sqrtNodeOperatorTotal,
        );
    }

    // Divide each protocol's HHI score by the sum of scores to get a HHI Weight Factor between 0 and 1
    getHHIWeightFactors(protocolHHIScores: number[]) {
        const sumOfProtocolHHIScores = protocolHHIScores.reduce(
            (a, b) => a + b,
            0,
        );
        return protocolHHIScores.map(
            (score: number) => score / sumOfProtocolHHIScores,
        );
    }

    async getNodeOperatorCounts(): Promise<number[]> {
        let nodeOperatorCounts: number[] = [];

        for (const poolId of Object.values(PoolIds)) {
            if (poolId === PoolIds.Stader) {
                const permissionedNodeOpCount =
                    await this.ratedApi.getNodeOperatorCountForPool(
                        this.ratedAccessToken,
                        "Stader Permissioned",
                    );
                const permissionlessNodeOpCount =
                    await this.ratedApi.getNodeOperatorCountForPool(
                        this.ratedAccessToken,
                        "Stader Permissionless",
                    );
                nodeOperatorCounts.push(
                    permissionedNodeOpCount + permissionlessNodeOpCount,
                );
            } else if (poolId === PoolIds.Lido) {
                const curatedNodeOpCount =
                    await this.ratedApi.getNodeOperatorCountForPool(
                        this.ratedAccessToken,
                        "Lido Curated Module",
                    );
                const simpleDVTNodeOpCount =
                    await this.ratedApi.getNodeOperatorCountForPool(
                        this.ratedAccessToken,
                        "Lido SimpleDVT Module",
                    );
                nodeOperatorCounts.push(
                    curatedNodeOpCount + simpleDVTNodeOpCount,
                );
            } else {
                const nodeOperatorCount =
                    await this.ratedApi.getNodeOperatorCountForPool(
                        this.ratedAccessToken,
                        poolId,
                    );
                nodeOperatorCounts.push(nodeOperatorCount);
            }
        }
        console.log("node operator counts", nodeOperatorCounts);

        return nodeOperatorCounts;
    }

    // Returns a 2D array of validator counts for each node operator in each pool
    async getValidatorDistribution(): Promise<number[][]> {
        let validatorDistribution: number[][] = [];

        for (const poolId of Object.values(PoolIds)) {
            if (poolId === PoolIds.Frax) {
                validatorDistribution.push([1]); // Frax validators are all under one node operator
            } else if (poolId === PoolIds.Stader) {
                const permissionedValidatorCounts =
                    await this.getValidatorCountsByNodeOpForPool(
                        "Stader Permissioned",
                    );
                const permissionlessValidatorCounts =
                    await this.getValidatorCountsByNodeOpForPool(
                        "Stader Permissionless",
                    );
                validatorDistribution.push(
                    permissionedValidatorCounts.concat(
                        permissionlessValidatorCounts,
                    ),
                );
            } else if (poolId === PoolIds.Lido) {
                const curatedValidatorCounts =
                    await this.getValidatorCountsByNodeOpForPool(
                        "Lido Curated Module",
                    );
                const simpleDVTValidatorCounts =
                    await this.getValidatorCountsByNodeOpForPool(
                        "Lido SimpleDVT Module",
                    );
                validatorDistribution.push(
                    curatedValidatorCounts.concat(simpleDVTValidatorCounts),
                );
            } else {
                validatorDistribution.push(
                    await this.getValidatorCountsByNodeOpForPool(poolId),
                );
            }
        }
        console.log(
            "validator distribution",
            JSON.stringify(validatorDistribution),
        );

        return validatorDistribution;
    }

    // Returns array of protocol HHI Scores
    // Protocol HHI Score = 10000 - sum of (% validator share of each node operator) ^ 2
    async getProtocolHHIScores(
        validatorDistribution: number[][],
    ): Promise<number[]> {
        return validatorDistribution.map((nodeOpValidatorCounts: number[]) => {
            const totalValidatorsInPool = nodeOpValidatorCounts.reduce(
                (a, b) => a + b,
                0,
            );
            const sumOfNodeOperatorHHI = nodeOpValidatorCounts.reduce(
                (a, nodeOpCount) =>
                    a +
                    Math.pow((nodeOpCount / totalValidatorsInPool) * 100, 2),
                0,
            );

            return 10000 - sumOfNodeOperatorHHI;
        });
    }

    async getAuctionExecutionParamsForComponent(
        priceAdapter: Contract,
        config: AuctionConfig,
        priceInWei: BigNumber,
        targetUnit: BigNumber,
        isDecreasing: boolean,
    ): Promise<AuctionExecutionParams> {
        const initialPrice = isDecreasing
            ? priceInWei.add(config.initialPriceAdjustSellComponents)
            : priceInWei.sub(config.initialPriceAdjustSellComponents);
        const slope = isDecreasing
            ? config.slopeForSellComponents
            : config.slopeForBuyComponents;
        const maxPrice = priceInWei.add(config.maxPriceAboveMarketPrice);
        const minPrice = priceInWei.sub(config.minPriceBelowMarketPrice);

        const priceAdapterData = await priceAdapter.getEncodedData(
            initialPrice,
            slope,
            config.bucketSize,
            isDecreasing,
            maxPrice,
            minPrice,
        );

        return {
            targetUnit,
            priceAdapterName: "BoundedStepwiseLinearPriceAdapter",
            priceAdapterConfigData: priceAdapterData,
        };
    }

    async getValidatorCountsByNodeOpForPool(poolId: string): Promise<number[]> {
        const size = 1000;
        let from = 0;
        let validatorCounts: number[] = [];

        let page = await this.ratedApi.getPaginatedNodeOperators(
            this.ratedAccessToken,
            poolId,
            size,
            from,
        );
        page.data.forEach((nodeOperator: any) => {
            validatorCounts.push(nodeOperator.validatorCount);
        });

        // @ts-ignore
        while (page.next != null) {
            from += size;
            page = await this.ratedApi.getPaginatedNodeOperators(
                this.ratedAccessToken,
                poolId,
                size,
                from,
            );
            page.data.forEach((nodeOperator: any) => {
                validatorCounts.push(nodeOperator.validatorCount);
            });
        }

        return validatorCounts;
    }
}
