import { PoolIds } from "./types";

export const stakingTokens: Record<PoolIds, string> = {
    Lido: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", // wstETH
    Rocketpool: "0xae78736Cd615f374D3085123A210448E74Fc6393", // rETH
    StakeWise: "0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38", // osETH
    Frax: "0xac3E018457B222d93114458476f3E3416Abbe38F", // sfrxETH
    Swell: "0xf951E335afb289353dc249e82926178EaC7DEd78", // swETH
    Stader: "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b", // ETHx
};

export const stakingTokenRateProviders: Record<PoolIds, string> = {
    Lido: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", // wstETH
    Rocketpool: "0xae78736Cd615f374D3085123A210448E74Fc6393", // rETH
    StakeWise: "0x8023518b2192FB5384DAdc596765B3dD1cdFe471", // osETH
    Frax: "0xac3E018457B222d93114458476f3E3416Abbe38F", // sfrxETH
    Swell: "0xf951E335afb289353dc249e82926178EaC7DEd78", // swETH
    Stader: "0xcf5EA1b38380f6aF39068375516Daf40Ed70D299", // ETHx
};
