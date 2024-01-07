import { ethers, network } from "hardhat";

export function requireEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined) {
        throw new Error(`Missing required environment variable ${name}`);
    }
    return value;
}
