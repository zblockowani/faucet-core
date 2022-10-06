import { deployments, network } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import {
  DEVELOPMENT_CHAINS,
  ETHER_PER_WITHDRAW,
  LOCK_INTERVAL,
  TOKENS_PER_WITHDRAW,
} from "../helper-hardhat-config";
import verify from "../utils/verify";

const deploy: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();

  log("Faucet deployment...");

  const token = await get("UniqueToken");

  const args: any = [
    token.address,
    LOCK_INTERVAL,
    TOKENS_PER_WITHDRAW,
    ETHER_PER_WITHDRAW,
  ];

  const faucet = await deploy("Faucet", {
    from: deployer,
    args: args,
    log: true,
  });

  log(`Faucet was deployed at ${faucet.address}`);

  if (!DEVELOPMENT_CHAINS.includes(network.name)) {
    await verify(faucet.address, args);
  }
};

export default deploy;
