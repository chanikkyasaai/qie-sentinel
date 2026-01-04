const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Executor", function () {
  let vault;
  let executor;
  let mockRouter;
  let tokenA;
  let tokenB;
  let owner;
  let backendExecutor;
  let user;
  let user2;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const DEPOSIT_AMOUNT = ethers.parseEther("1000");
  const TRADE_AMOUNT = ethers.parseEther("100");
  const STRATEGY_ID = 1;

  beforeEach(async function () {
    [owner, backendExecutor, user, user2] = await ethers.getSigners();
    
    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA", INITIAL_SUPPLY);
    tokenB = await MockERC20.deploy("Token B", "TKB", INITIAL_SUPPLY);
    await tokenA.waitForDeployment();
    await tokenB.waitForDeployment();
    
    // Deploy Vault
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();
    
    // Deploy mock router
    const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
    mockRouter = await MockRouter.deploy();
    await mockRouter.waitForDeployment();
    
    // Deploy Executor
    const Executor = await ethers.getContractFactory("Executor");
    executor = await Executor.deploy(
      await vault.getAddress(),
      await mockRouter.getAddress(),
      backendExecutor.address
    );
    await executor.waitForDeployment();
    
    // Setup: Set executor in vault
    await vault.approveExecutor(await executor.getAddress());
    
    // Fund router with tokenB for swaps
    await tokenB.approve(await mockRouter.getAddress(), ethers.parseEther("100000"));
    await mockRouter.fundRouter(await tokenB.getAddress(), ethers.parseEther("100000"));
    
    // Fund users with tokens
    await tokenA.transfer(user.address, ethers.parseEther("10000"));
    await tokenA.transfer(user2.address, ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should set correct vault address", async function () {
      expect(await executor.vault()).to.equal(await vault.getAddress());
    });

    it("Should set correct router address", async function () {
      expect(await executor.router()).to.equal(await mockRouter.getAddress());
    });

    it("Should set correct authorized executor", async function () {
      expect(await executor.authorizedExecutor()).to.equal(backendExecutor.address);
    });

    it("Should set default max slippage", async function () {
      expect(await executor.maxSlippageBps()).to.equal(500); // 5%
    });

    it("Should initialize with zero trade count", async function () {
      expect(await executor.tradeCount()).to.equal(0);
    });

    it("Should revert with invalid vault address", async function () {
      const Executor = await ethers.getContractFactory("Executor");
      await expect(
        Executor.deploy(ethers.ZeroAddress, await mockRouter.getAddress(), backendExecutor.address)
      ).to.be.revertedWith("Executor: invalid vault address");
    });

    it("Should revert with invalid router address", async function () {
      const Executor = await ethers.getContractFactory("Executor");
      await expect(
        Executor.deploy(await vault.getAddress(), ethers.ZeroAddress, backendExecutor.address)
      ).to.be.revertedWith("Executor: invalid router address");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to update authorized executor", async function () {
      const newExecutor = user2.address;
      
      await expect(executor.setAuthorizedExecutor(newExecutor))
        .to.emit(executor, "ExecutorAuthorized")
        .withArgs(newExecutor);
      
      expect(await executor.authorizedExecutor()).to.equal(newExecutor);
    });

    it("Should not allow non-owner to update authorized executor", async function () {
      await expect(
        executor.connect(user).setAuthorizedExecutor(user2.address)
      ).to.be.reverted;
    });

    it("Should not allow unauthorized caller to execute trade", async function () {
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];
      
      await expect(
        executor.connect(user).executeTrade(
          user.address,
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          TRADE_AMOUNT,
          ethers.parseEther("90"),
          path,
          STRATEGY_ID
        )
      ).to.be.revertedWith("Executor: caller is not authorized executor");
    });
  });

  describe("Configuration Updates", function () {
    it("Should allow owner to update vault", async function () {
      const newVault = await (await ethers.getContractFactory("Vault")).deploy();
      
      await expect(executor.setVault(await newVault.getAddress()))
        .to.emit(executor, "VaultSet")
        .withArgs(await newVault.getAddress());
    });

    it("Should allow owner to update router", async function () {
      const newRouter = await (await ethers.getContractFactory("MockUniswapV2Router")).deploy();
      
      await expect(executor.setRouter(await newRouter.getAddress()))
        .to.emit(executor, "RouterSet")
        .withArgs(await newRouter.getAddress());
    });

    it("Should allow owner to update max slippage", async function () {
      const newSlippage = 300; // 3%
      
      await expect(executor.setMaxSlippage(newSlippage))
        .to.emit(executor, "MaxSlippageUpdated")
        .withArgs(newSlippage);
      
      expect(await executor.maxSlippageBps()).to.equal(newSlippage);
    });

    it("Should not allow slippage above 10%", async function () {
      await expect(
        executor.setMaxSlippage(1001)
      ).to.be.revertedWith("Executor: slippage too high");
    });
  });

  describe("Trade Execution", function () {
    beforeEach(async function () {
      // User deposits tokenA into vault
      await tokenA.connect(user).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(user).deposit(await tokenA.getAddress(), DEPOSIT_AMOUNT);
      
      // User approves executor allowance
      await vault.connect(user).approveExecutorAllowance(await tokenA.getAddress(), TRADE_AMOUNT);
    });

    it("Should execute trade successfully", async function () {
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];
      const minOutput = ethers.parseEther("90"); // Expecting ~95 with 5% slippage
      
      const tx = await executor.connect(backendExecutor).executeTrade(
        user.address,
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        TRADE_AMOUNT,
        minOutput,
        path,
        STRATEGY_ID
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = executor.interface.parseLog(log);
          return parsed.name === "TradeExecuted";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
    });

    it("Should update user balances correctly", async function () {
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];
      const minOutput = ethers.parseEther("90");
      
      const balanceABefore = await vault.getBalance(user.address, await tokenA.getAddress());
      
      await executor.connect(backendExecutor).executeTrade(
        user.address,
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        TRADE_AMOUNT,
        minOutput,
        path,
        STRATEGY_ID
      );
      
      const balanceAAfter = await vault.getBalance(user.address, await tokenA.getAddress());
      const balanceBAfter = await vault.getBalance(user.address, await tokenB.getAddress());
      
      expect(balanceABefore - balanceAAfter).to.equal(TRADE_AMOUNT);
      expect(balanceBAfter).to.be.gt(minOutput);
    });

    it("Should decrease user allowance", async function () {
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];
      const minOutput = ethers.parseEther("90");
      
      const allowanceBefore = await vault.getAllowance(user.address, await tokenA.getAddress());
      
      await executor.connect(backendExecutor).executeTrade(
        user.address,
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        TRADE_AMOUNT,
        minOutput,
        path,
        STRATEGY_ID
      );
      
      const allowanceAfter = await vault.getAllowance(user.address, await tokenA.getAddress());
      
      expect(allowanceBefore - allowanceAfter).to.equal(TRADE_AMOUNT);
    });

    it("Should increment trade count", async function () {
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];
      const minOutput = ethers.parseEther("90");
      
      const countBefore = await executor.tradeCount();
      
      await executor.connect(backendExecutor).executeTrade(
        user.address,
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        TRADE_AMOUNT,
        minOutput,
        path,
        STRATEGY_ID
      );
      
      expect(await executor.tradeCount()).to.equal(countBefore + 1n);
    });

    it("Should store trade data correctly", async function () {
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];
      const minOutput = ethers.parseEther("90");
      
      const tradeId = await executor.tradeCount();
      
      await executor.connect(backendExecutor).executeTrade(
        user.address,
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        TRADE_AMOUNT,
        minOutput,
        path,
        STRATEGY_ID
      );
      
      const trade = await executor.getTrade(tradeId);
      
      expect(trade.user).to.equal(user.address);
      expect(trade.tokenIn).to.equal(await tokenA.getAddress());
      expect(trade.tokenOut).to.equal(await tokenB.getAddress());
      expect(trade.amountIn).to.equal(TRADE_AMOUNT);
      expect(trade.strategyId).to.equal(STRATEGY_ID);
    });

    it("Should revert with insufficient allowance", async function () {
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];
      const largeAmount = TRADE_AMOUNT + ethers.parseEther("1");
      
      await expect(
        executor.connect(backendExecutor).executeTrade(
          user.address,
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          largeAmount,
          ethers.parseEther("90"),
          path,
          STRATEGY_ID
        )
      ).to.be.revertedWith("Executor: insufficient vault allowance");
    });

    it("Should revert with zero amountIn", async function () {
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];
      
      await expect(
        executor.connect(backendExecutor).executeTrade(
          user.address,
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          0,
          ethers.parseEther("90"),
          path,
          STRATEGY_ID
        )
      ).to.be.revertedWith("Executor: amountIn must be greater than 0");
    });

    it("Should revert with invalid path", async function () {
      const invalidPath = [await tokenA.getAddress()];
      
      await expect(
        executor.connect(backendExecutor).executeTrade(
          user.address,
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          TRADE_AMOUNT,
          ethers.parseEther("90"),
          invalidPath,
          STRATEGY_ID
        )
      ).to.be.revertedWith("Executor: invalid path length");
    });

    it("Should revert if path doesn't start with tokenIn", async function () {
      const wrongPath = [await tokenB.getAddress(), await tokenA.getAddress()];
      
      await expect(
        executor.connect(backendExecutor).executeTrade(
          user.address,
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          TRADE_AMOUNT,
          ethers.parseEther("90"),
          wrongPath,
          STRATEGY_ID
        )
      ).to.be.revertedWith("Executor: path must start with tokenIn");
    });
  });

  describe("View Functions", function () {
    it("Should return expected output amounts", async function () {
      const path = [await tokenA.getAddress(), await tokenB.getAddress()];
      
      const amounts = await executor.getExpectedOutput(TRADE_AMOUNT, path);
      
      expect(amounts.length).to.equal(2);
      expect(amounts[0]).to.equal(TRADE_AMOUNT);
      expect(amounts[1]).to.be.gt(0);
    });

    it("Should return trade count", async function () {
      expect(await executor.getTradeCount()).to.equal(0);
    });
  });

  describe("Placeholder Functions", function () {
    it("Should revert stopLoss (not implemented)", async function () {
      await expect(
        executor.connect(backendExecutor).stopLoss(user.address, await tokenA.getAddress(), 500)
      ).to.be.revertedWith("Executor: stopLoss not yet implemented");
    });

    it("Should revert rebalance (not implemented)", async function () {
      const tokens = [await tokenA.getAddress(), await tokenB.getAddress()];
      const percentages = [5000, 5000];
      
      await expect(
        executor.connect(backendExecutor).rebalance(user.address, tokens, percentages)
      ).to.be.revertedWith("Executor: rebalance not yet implemented");
    });
  });

  describe("Token Recovery", function () {
    it("Should allow owner to recover tokens", async function () {
      const recoveryAmount = ethers.parseEther("10");
      
      // Send tokens to executor accidentally
      await tokenA.transfer(await executor.getAddress(), recoveryAmount);
      
      const ownerBalanceBefore = await tokenA.balanceOf(owner.address);
      
      await executor.recoverToken(await tokenA.getAddress(), recoveryAmount);
      
      const ownerBalanceAfter = await tokenA.balanceOf(owner.address);
      
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(recoveryAmount);
    });

    it("Should not allow non-owner to recover tokens", async function () {
      await expect(
        executor.connect(user).recoverToken(await tokenA.getAddress(), ethers.parseEther("10"))
      ).to.be.reverted;
    });
  });
});
