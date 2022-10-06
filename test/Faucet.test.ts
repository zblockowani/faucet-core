import { expect, use } from "chai";
import { deployContract, MockProvider, solidity } from "ethereum-waffle";
import { Wallet } from "ethers";
import { UniqueToken } from "../typechain-types/UniqueToken";
import { UniqueToken__factory } from "../typechain-types/factories/UniqueToken__factory";
import { Faucet } from "../typechain-types/Faucet";
import { Faucet__factory } from "../typechain-types/factories/Faucet__factory";
import { ethers } from "hardhat";

use(solidity);

describe("Faucet", () => {
  let token: UniqueToken;
  let faucet: Faucet;
  let provider: MockProvider;
  let deployer: Wallet, user1: Wallet, user2: Wallet;

  const lockInterval = 60; // 1 minutes;
  const tokensPerWithdraw = ethers.utils.parseEther("1");
  const etherPerWithdraw = ethers.utils.parseEther("20");

  beforeEach(async () => {
    provider = new MockProvider();
    [deployer, user1, user2] = provider.getWallets();

    token = (await deployContract(
      deployer,
      UniqueToken__factory
    )) as UniqueToken;
    faucet = (await deployContract(deployer, Faucet__factory, [
      token.address,
      lockInterval,
      tokensPerWithdraw,
      etherPerWithdraw,
    ])) as Faucet;
  });

  it("Should be deployed", async () => {
    expect(await provider.getBalance(faucet.address)).to.be.equal(0);
    expect(await token.balanceOf(faucet.address)).to.be.equal(0);
    expect(await faucet.getLockInterval()).to.be.equal(60);
    expect(await faucet.getTokensPerWithdraw()).to.be.equal(tokensPerWithdraw);
    expect(await faucet.getEtherPerWithdraw()).to.be.equal(etherPerWithdraw);
  });

  it("Should revert when claim and no tokens in contract", async () => {
    await expect(faucet.connect(user1).claimTokens()).to.be.reverted;
  });

  it("Should claim tokens", async () => {
    await token.transfer(faucet.address, ethers.utils.parseEther("100"));
    const currentTime = (await provider.getBlock(provider.getBlockNumber()))
      .timestamp;

    await expect(faucet.connect(user1).claimTokens())
      .to.emit(faucet, "TokensClaimed")
      .withArgs(user1.address, tokensPerWithdraw);
    expect(await token.balanceOf(user1.address)).to.be.equal(tokensPerWithdraw);
    expect(await faucet.getNextPossibleTokenWithdraw(user1.address)).to.be.gte(
      currentTime + lockInterval
    );
  });

  it("Should revert when lock for tokens", async () => {
    await token.transfer(faucet.address, ethers.utils.parseEther("100"));
    await faucet.connect(user1).claimTokens();

    await expect(faucet.connect(user1).claimTokens()).to.be.reverted;
  });

  it("Should be possible to claim tokens by another user when a first is blocked", async () => {
    await token.transfer(faucet.address, ethers.utils.parseEther("100"));
    await faucet.connect(user1).claimTokens();

    const currentTime = (await provider.getBlock(provider.getBlockNumber()))
      .timestamp;

    await expect(faucet.connect(user2).claimTokens())
      .to.emit(faucet, "TokensClaimed")
      .withArgs(user2.address, tokensPerWithdraw);
    expect(await token.balanceOf(user2.address)).to.be.equal(tokensPerWithdraw);
    expect(await faucet.getNextPossibleTokenWithdraw(user2.address)).to.be.gte(
      currentTime + lockInterval
    );
  });

  it("Should claim tokens again after lock time passed", async () => {
    await token.transfer(faucet.address, ethers.utils.parseEther("100"));
    await faucet.connect(user1).claimTokens();

    let currentTime = (await provider.getBlock(provider.getBlockNumber()))
      .timestamp;
    await provider.send("evm_mine", [currentTime + lockInterval]);

    currentTime = (await provider.getBlock(provider.getBlockNumber()))
      .timestamp;

    await expect(faucet.connect(user1).claimTokens())
      .to.emit(faucet, "TokensClaimed")
      .withArgs(user1.address, tokensPerWithdraw);
    expect(await token.balanceOf(user1.address)).to.be.equal(
      tokensPerWithdraw.mul(2)
    );
    expect(await faucet.getNextPossibleTokenWithdraw(user1.address)).to.be.gte(
      currentTime + lockInterval
    );
  });

  it("Should revert when no ether in contract", async () => {
    await expect(faucet.connect(user1).claimEther()).to.be.reverted;
  });

  it("Should claim ether", async () => {
    await deployer.sendTransaction({
      to: faucet.address,
      value: ethers.utils.parseEther("100"),
    });

    const previousBalance = await provider.getBalance(user1.address);

    const currentTime = (await provider.getBlock(provider.getBlockNumber()))
      .timestamp;

    await expect(faucet.connect(user1).claimEther())
      .to.emit(faucet, "EtherClaimed")
      .withArgs(user1.address, etherPerWithdraw);

    expect(await provider.getBalance(user1.address)).to.be.gt(
      previousBalance.add(etherPerWithdraw).sub(ethers.utils.parseEther("0.01")) // greater than previous balance + claimed ether - ~transaftion fee
    );
    expect(await faucet.getNextPossibleEtherWithdraw(user1.address)).to.be.gte(
      currentTime + lockInterval
    );
  });

  it("Should revert when lock for ether", async () => {
    await deployer.sendTransaction({
      to: faucet.address,
      value: ethers.utils.parseEther("100"),
    });
    await faucet.connect(user1).claimEther();

    await expect(faucet.connect(user1).claimEther()).to.be.reverted;
  });

  it("Should be possible to claim ether by another user when a first is blocked", async () => {
    await deployer.sendTransaction({
      to: faucet.address,
      value: ethers.utils.parseEther("100"),
    });
    await faucet.connect(user1).claimEther();

    const currentTime = (await provider.getBlock(provider.getBlockNumber()))
      .timestamp;

    const previousBalance = await provider.getBalance(user2.address);

    await expect(faucet.connect(user2).claimEther())
      .to.emit(faucet, "EtherClaimed")
      .withArgs(user2.address, etherPerWithdraw);
    expect(await provider.getBalance(user2.address)).to.be.gt(
      previousBalance.add(etherPerWithdraw).sub(ethers.utils.parseEther("0.01")) // greater than previous balance + claimed ether - ~transaftion fee
    );
    expect(await faucet.getNextPossibleEtherWithdraw(user2.address)).to.be.gte(
      currentTime + lockInterval
    );
  });

  it("Should claim ether again after lock time passed", async () => {
    await deployer.sendTransaction({
      to: faucet.address,
      value: ethers.utils.parseEther("100"),
    });

    const previousBalance = await provider.getBalance(user2.address);

    await faucet.connect(user1).claimEther();

    let currentTime = (await provider.getBlock(provider.getBlockNumber()))
      .timestamp;
    await provider.send("evm_mine", [currentTime + lockInterval]);

    currentTime = (await provider.getBlock(provider.getBlockNumber()))
      .timestamp;

    await expect(faucet.connect(user1).claimEther())
      .to.emit(faucet, "EtherClaimed")
      .withArgs(user1.address, etherPerWithdraw);
    expect(await provider.getBalance(user1.address)).to.be.gt(
      previousBalance
        .add(etherPerWithdraw.mul(2))
        .sub(ethers.utils.parseEther("0.02")) // greater than previous balance + 2x claimed ether - ~transaftion fee
    );
    expect(await faucet.getNextPossibleEtherWithdraw(user1.address)).to.be.gte(
      currentTime + lockInterval
    );
  });

  it("Should withdraw the remainig tokens", async () => {
    await token.transfer(faucet.address, ethers.utils.parseEther("100"));

    const deployerBalanceBefore = await token.balanceOf(deployer.address);
    const faucetBalanceBefore = await token.balanceOf(faucet.address);

    await faucet.withdrawTokens();

    expect(await token.balanceOf(deployer.address)).to.be.equal(
      deployerBalanceBefore.add(faucetBalanceBefore)
    );
    expect(await token.balanceOf(faucet.address)).to.be.equals(0);
  });

  it("Should revert when withdraw the remaining tokens by not the owner", async () => {
    await expect(faucet.connect(user1).withdrawTokens()).to.be.reverted;
  });

  it("Should withdraw the remainig ether", async () => {
    await deployer.sendTransaction({
      to: faucet.address,
      value: ethers.utils.parseEther("100"),
    });

    const deployerBalanceBefore = await provider.getBalance(deployer.address);
    const faucetBalanceBefore = await provider.getBalance(faucet.address);

    await faucet.withdrawEther();

    expect(await provider.getBalance(deployer.address)).to.be.gt(
      deployerBalanceBefore
        .add(faucetBalanceBefore)
        .sub(ethers.utils.parseEther("0.01"))
    );
    expect(await provider.getBalance(faucet.address)).to.be.equals(0);
  });

  it("Should revert when withdraw the remaining ether by not the owner", async () => {
    await expect(faucet.connect(user1).withdrawEther()).to.be.reverted;
  });

  it("Should set lock interval", async () => {
    await faucet.setLockInterval(100);

    expect(await faucet.getLockInterval()).to.be.equal(100);
  });

  it("Should revert when set lock internal by not the owner", async () => {
    await expect(faucet.connect(user1).setLockInterval(100)).to.be.reverted;
  });

  it("Should set tokens per withdraw", async () => {
    await faucet.setTokensPerWithdraw(100);

    expect(await faucet.getTokensPerWithdraw()).to.be.equal(100);
  });

  it("Should revert when set tokens per withdraw by not the owner", async () => {
    await expect(faucet.connect(user1).setTokensPerWithdraw(100)).to.be
      .reverted;
  });

  it("Should set ether per withdraw", async () => {
    await faucet.setEtherPerWithdraw(100);

    expect(await faucet.getEtherPerWithdraw()).to.be.equal(100);
  });

  it("Should revert when set ether per withdraw by not the owner", async () => {
    await expect(faucet.connect(user1).setEtherPerWithdraw(100)).to.be.reverted;
  });
});
