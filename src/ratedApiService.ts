import axios, { AxiosResponse } from "axios";

export type NodeOperator = {
    poolId: string;
    validatorCount: number;
};

export type PoolSummary = {
    nodeOperatorCount: number;
    validatorCount: number;
};

export class RatedApiService {
    constructor(private baseUrl: string) {
        axios.defaults.baseURL = this.baseUrl;
    }

    async getAccessToken(username: string, password: string): Promise<string> {
        const params = new URLSearchParams({
            username: username,
            password: password,
        });
        try {
            const res = await axios.post("/auth/token", params);
            return res.data.accessToken;
        } catch (err) {
            console.error("error getting access token", err);
            throw new Error("Rated API: error authenticating");
        }
    }

    async getNodeOperatorCountForPool(
        accessToken: string,
        poolId: string,
        window: string = "1d"
    ): Promise<number> {
        const poolSummary = await this.getPoolSummary(
            accessToken,
            poolId,
            window
        );
        if (poolId === "Frax") {
            // Special case for Frax because API returns null value for node operator count
            return 1;
        }
        return poolSummary.data.nodeOperatorCount;
    }

    async getTotalValidatorCountForPool(
        accessToken: string,
        poolId: string,
        window: string = "1d"
    ): Promise<number> {
        const poolSummary = await this.getPoolSummary(
            accessToken,
            poolId,
            window
        );
        return poolSummary.data.validatorCount;
    }

    async getPoolSummary(
        accessToken: string,
        poolId: string,
        window: string = "1d"
    ): Promise<AxiosResponse> {
        try {
            return await axios.get(`/eth/operators/${poolId}/summary`, {
                params: {
                    window: window,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        } catch (err) {
            console.error("error getting pool summary", err);
            throw new Error(`Rated API: error getting pool summary: ${err}`);
        }
    }

    async getPaginatedNodeOperators(
        accessToken: string,
        poolId: string,
        size: number,
        from: number,
        window: string = "1d"
    ): Promise<AxiosResponse> {
        try {
            let res = await axios.get("/eth/operators", {
                params: {
                    idType: "nodeOperator",
                    window: "1d",
                    parentId: poolId,
                    size: size,
                    from: from,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return res.data;
        } catch (err) {
            console.error("error getting node operators", err);
            throw new Error(
                `Rated API: error getting node operators for ${poolId}`
            );
        }
    }
}
