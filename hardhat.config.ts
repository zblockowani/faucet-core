import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-deploy";
import "@typechain/hardhat";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    rinkeby: {
      url: "https://kovan.infura.io/v3/b963d4c608d542a8b332b7759834cdae",
      accounts: [
        "ac1d01fb74e9a9567438e46ce293fa69598ad83d1ede5a33c077aa35bdbf33b4",
      ],
      chainId: 42,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  etherscan: {
    apiKey: "M3BAWYD3HJUK9XF5WJ8MQR9374YGU5KY9Z",
  },
};

export default config;
