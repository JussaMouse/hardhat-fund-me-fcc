// @ts-nocheck
const { expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

// the ternary operation below says "only run if on a dev chain"
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let deployer;
          let fundMe;
          let mockV3Aggregator;
          const notEnough = ethers.utils.parseEther(".024");
          const enough = ethers.utils.parseEther(".025");
          beforeEach(async function () {
              // deploy FundMe with hh deploy
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });
          describe("constructor", function () {
              it("Sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  expect(response).to.equal(mockV3Aggregator.address);
              });
          });
          // receive/ fallback
          describe("fund", function () {
              it("Errors if the amount sent is < 50 USD", async function () {
                  await expect(
                      fundMe.fund({ value: notEnough })
                  ).to.be.revertedWith("Not enough ETH");
              });
              it("Updates the amount funded data structure", async function () {
                  const initialValue = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  expect(initialValue).to.equal(0);
                  await fundMe.fund({ value: enough });
                  const fundedAmount = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  expect(enough).to.equal(fundedAmount);
              });
              it("Should add the sender's address to the funders array", async function () {
                  await fundMe.fund({ value: enough });
                  const currentFunder0 = await fundMe.getFunder(0);
                  expect(currentFunder0).to.equal(deployer);
              });
          });
          describe("withdraw", function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: enough });
              });
              it("Can withdraw ETH from a single funder", async function () {
                  // arrange
                  const initialFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const initialDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  // act
                  const txResponse = await fundMe.withdraw();
                  const txReceipt = await txResponse.wait(1);
                  // need to record the gas cost of the above tx
                  // used breakpoint/ vscode debugger to inspect the txReceipt
                  // found effectiveGasPrice and gasUsed variables
                  // could have used the ethers docs instead
                  const { effectiveGasPrice, gasUsed } = txReceipt;
                  const gasCost = effectiveGasPrice.mul(gasUsed);

                  const currentFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const currentDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // // assert
                  expect(currentFundMeBalance).to.equal(0);

                  expect(
                      initialFundMeBalance.add(initialDeployerBalance)
                  ).to.equal(currentDeployerBalance.add(gasCost));
              });
              it("Can withdraw ETH from multiple funders", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnected = await fundMe.connect(accounts[i]);
                      await fundMeConnected.fund({ value: enough });
                  }
                  const initialFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const initialDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  const txResponse = await fundMe.withdraw();
                  const txReceipt = await txResponse.wait(1);
                  const { effectiveGasPrice, gasUsed } = txReceipt;
                  const gasCost = effectiveGasPrice.mul(gasUsed);
                  const currentFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const currentDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  expect(currentFundMeBalance).to.equal(0);
                  expect(
                      initialFundMeBalance.add(initialDeployerBalance)
                  ).to.equal(currentDeployerBalance.add(gasCost));

                  await expect(fundMe.getFunder(0)).to.be.reverted;
                  for (i = 1; i < 6; i++) {
                      expect(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          )
                      ).to.equal(0);
                  }
              });
              it("Only allows the owner to withdraw", async function () {
                  await fundMe.fund({ value: enough });
                  const accounts = await ethers.getSigners();
                  const fundMeConnected = await fundMe.connect(accounts[1]);
                  expect(fundMeConnected.withdraw()).to.be.revertedWith(
                      "FundMe__NotOwner()"
                  );
              });
          });
      });
