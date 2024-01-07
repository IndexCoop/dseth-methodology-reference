import { BigNum, ethers } from "ethers";

export function parseEther(ether: string): BigNum {
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
    power: number = 18,
): BigNum => {
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
