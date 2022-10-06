import { network } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { DEVELOPMENT_CHAINS } from "../helper-hardhat-config";
import verify from "../utils/verify";

const deploy: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("Token deployment...");

  const token = await deploy("UniqueToken", {
    from: deployer,
    args: [],
    log: true,
  });

  log(`Token was deployed at ${token.address}`);

  if (!DEVELOPMENT_CHAINS.includes(network.name)) {
    await verify(token.address, []);
  }
};

export default deploy;
