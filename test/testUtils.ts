import MockAdapter from "axios-mock-adapter";
import axios from "axios";

export function requireEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined) {
        throw new Error(`Missing required environment variable ${name}`);
    }
    return value;
}

export class MockRatedApi {
    axiosMock = new MockAdapter(axios);
    private poolIdToValidatorData: { [poolId: string]: any } = {};
    private defaultValidatorData: any[];
    private defaultPoolSummary: any;

    constructor(defaultValidatorCount: number, defaultOperatorCount: number) {
        this.defaultValidatorData = [
            {
                validatorCount: defaultValidatorCount,
            },
        ];
        this.defaultPoolSummary = {
            nodeOperatorCount: defaultOperatorCount,
            validatorCount: defaultValidatorCount,
        };
    }

    public mockSummaryEndpoint() {
        this.axiosMock.onGet(/.*\/summary/).reply(() => {
            return [200, this.defaultPoolSummary];
        });
    }

    public mockOperatorsEndpoint() {
        this.axiosMock.onGet("/eth/operators").reply((config) => {
            const data =
                this.poolIdToValidatorData[config.params.parentId] ??
                this.defaultValidatorData;
            return [
                200,
                {
                    data,
                },
            ];
        });
    }

    public setValidatorDataForPool(
        poolId: string,
        validatorData: any[] | undefined,
    ) {
        this.poolIdToValidatorData[poolId] = validatorData;
    }

    public unMockAll() {
        this.axiosMock.reset();
    }
}
