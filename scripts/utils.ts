import { BigNumber, utils } from "ethers";

export function displayTargetUnits(targetUnits: BigNumber[]) {
    console.log("Target Units:");
    console.log("Lido: " + utils.formatEther(targetUnits[0]));
    console.log("RocketPool: " + utils.formatEther(targetUnits[1]));
    console.log("StakeWise: " + utils.formatEther(targetUnits[2]));
    console.log("Frax: " + utils.formatEther(targetUnits[3]));
    console.log("Swell: " + utils.formatEther(targetUnits[4]));
    console.log("Stader: " + utils.formatEther(targetUnits[5]));
}
