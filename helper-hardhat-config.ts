import { ethers } from "hardhat";

export const DEVELOPMENT_CHAINS = ["localhost", "hardhat"];

export const LOCK_INTERVAL = 60; 
export const TOKENS_PER_WITHDRAW = ethers.utils.parseEther("20");
export const ETHER_PER_WITHDRAW = ethers.utils.parseEther("0.01")
