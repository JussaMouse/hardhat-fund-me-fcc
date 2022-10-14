const { getNamedAccounts, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { expect } = require("chai");

// the ternary operation below says "ony run if not on a dev chain"
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer;
          const sendValue = ethers.utils.parseEther("0.045");
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract("FundMe", deployer);
              // assuming already deployed
              // assuming we're on a testnet (don't need mock pricefeed)
          });
          it("Allows users to send and withdraw funds", async function () {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              expect(endingBalance).to.equal(0);
          });
      });
