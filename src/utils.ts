import { BigNumber, ethers } from "ethers";

export function parseEther(ether: string): BigNumber {
    return ethers.utils.parseEther(ether);
}

/**
 * Converts a number to Wei to another denomination of Eth.
 * Note: will loose precision if fraction part is greater than the decimals.
 * @param valueToConvert
 * @param power default = 18
 * @returns converted number as BigNum
 */
export const toWei = (
    valueToConvert: number | string,
    power: number = 18
): BigNumber => {
    // parseUnits only accepts strings
    let value =
        typeof valueToConvert === "number"
            ? valueToConvert.toString()
            : valueToConvert;

    const splits = value.split(".");
    const integerPart = splits[0];
    let fractionalPart = splits[1];

    if (!fractionalPart) {
        return ethers.utils.parseUnits(integerPart, power);
    }

    if (fractionalPart.length > power) {
        // Fractional components must not exceed decimals
        fractionalPart = fractionalPart.substring(0, power);
    }

    value = integerPart + "." + fractionalPart;
    return ethers.utils.parseUnits(value, power);
};

export function getEnvVars() {
    return {
        ratedAccessToken: requireEnvVar("RATED_API_ACCESS_TOKEN"),
        ratedApiUrl: requireEnvVar(
            "RATED_API_URL",
            "https://api.rated.network/v0"
        ),
    };
}

function requireEnvVar(
    name: string,
    defaultValue: string | undefined = undefined
): string {
    const value = process.env[name];
    if (value !== undefined) {
        return value;
    }
    if (defaultValue !== undefined) {
        return defaultValue;
    }
    throw new Error(
        `Missing required environment variable without default ${name}`
    );
}
