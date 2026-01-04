const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
  let vault;
  let mockToken;
  let owner;
  let user;
  let user2;
  let executor;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const DEPOSIT_AMOUNT = ethers.parseEther("100");
  const WITHDRAW_AMOUNT = ethers.parseEther("50");

  beforeEach(async function () {
    [owner, user, user2, executor] = await ethers.getSigners();
    
    // Deploy mock ERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock Token", "MTK", INITIAL_SUPPLY);
    await mockToken.waitForDeployment();
    
    // Deploy Vault
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();
    
    // Transfer tokens to users for testing
    await mockToken.transfer(user.address, ethers.parseEther("10000"));
    await mockToken.transfer(user2.address, ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("Should initialize with no executor set", async function () {
      expect(await vault.executor()).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Executor Approval", function () {
    it("Should allow owner to approve executor", async function () {
      await expect(vault.approveExecutor(executor.address))
        .to.emit(vault, "ExecutorApproved")
        .withArgs(executor.address);
      
      expect(await vault.executor()).to.equal(executor.address);
    });

    it("Should not allow non-owner to approve executor", async function () {
      await expect(
        vault.connect(user).approveExecutor(executor.address)
      ).to.be.reverted;
    });

    it("Should not allow zero address as executor", async function () {
      await expect(
        vault.approveExecutor(ethers.ZeroAddress)
      ).to.be.revertedWith("Vault: invalid executor address");
    });
  });

  describe("Deposits", function () {
    beforeEach(async function () {
      // Approve vault to spend user's tokens
      await mockToken.connect(user).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
    });

    it("Should allow users to deposit tokens", async function () {
      await expect(vault.connect(user).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT))
        .to.emit(vault, "Deposited")
        .withArgs(user.address, await mockToken.getAddress(), DEPOSIT_AMOUNT);
      
      expect(await vault.getBalance(user.address, await mockToken.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should transfer tokens from user to vault", async function () {
      const userBalanceBefore = await mockToken.balanceOf(user.address);
      
      await vault.connect(user).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
      
      const userBalanceAfter = await mockToken.balanceOf(user.address);
      expect(userBalanceBefore - userBalanceAfter).to.equal(DEPOSIT_AMOUNT);
      expect(await mockToken.balanceOf(await vault.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should reject deposit with zero amount", async function () {
      await expect(
        vault.connect(user).deposit(await mockToken.getAddress(), 0)
      ).to.be.revertedWith("Vault: amount must be greater than 0");
    });

    it("Should reject deposit with zero token address", async function () {
      await expect(
        vault.connect(user).deposit(ethers.ZeroAddress, DEPOSIT_AMOUNT)
      ).to.be.revertedWith("Vault: invalid token address");
    });

    it("Should reject deposit without token approval", async function () {
      await expect(
        vault.connect(user2).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT)
      ).to.be.reverted;
    });

    it("Should allow multiple deposits from same user", async function () {
      await vault.connect(user).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
      
      await mockToken.connect(user).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(user).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
      
      expect(await vault.getBalance(user.address, await mockToken.getAddress())).to.equal(DEPOSIT_AMOUNT * 2n);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // User deposits tokens first
      await mockToken.connect(user).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(user).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
    });

    it("Should allow users to withdraw their tokens", async function () {
      await expect(vault.connect(user).withdraw(await mockToken.getAddress(), WITHDRAW_AMOUNT))
        .to.emit(vault, "Withdrawn")
        .withArgs(user.address, await mockToken.getAddress(), WITHDRAW_AMOUNT);
      
      expect(await vault.getBalance(user.address, await mockToken.getAddress())).to.equal(DEPOSIT_AMOUNT - WITHDRAW_AMOUNT);
    });

    it("Should transfer tokens from vault to user", async function () {
      const userBalanceBefore = await mockToken.balanceOf(user.address);
      
      await vault.connect(user).withdraw(await mockToken.getAddress(), WITHDRAW_AMOUNT);
      
      const userBalanceAfter = await mockToken.balanceOf(user.address);
      expect(userBalanceAfter - userBalanceBefore).to.equal(WITHDRAW_AMOUNT);
    });

    it("Should reject withdrawal with zero amount", async function () {
      await expect(
        vault.connect(user).withdraw(await mockToken.getAddress(), 0)
      ).to.be.revertedWith("Vault: amount must be greater than 0");
    });

    it("Should reject withdrawal with insufficient balance", async function () {
      await expect(
        vault.connect(user).withdraw(await mockToken.getAddress(), DEPOSIT_AMOUNT + 1n)
      ).to.be.revertedWith("Vault: insufficient balance");
    });

    it("Should allow full withdrawal", async function () {
      await vault.connect(user).withdraw(await mockToken.getAddress(), DEPOSIT_AMOUNT);
      
      expect(await vault.getBalance(user.address, await mockToken.getAddress())).to.equal(0);
    });
  });

  describe("Executor Allowances", function () {
    beforeEach(async function () {
      // Setup: deposit tokens and set executor
      await mockToken.connect(user).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(user).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
      await vault.approveExecutor(executor.address);
    });

    it("Should allow users to set executor allowance", async function () {
      const allowanceAmount = ethers.parseEther("30");
      
      await expect(vault.connect(user).approveExecutorAllowance(await mockToken.getAddress(), allowanceAmount))
        .to.emit(vault, "AllowanceSet")
        .withArgs(user.address, await mockToken.getAddress(), allowanceAmount);
      
      expect(await vault.getAllowance(user.address, await mockToken.getAddress())).to.equal(allowanceAmount);
    });

    it("Should not allow setting allowance greater than balance", async function () {
      await expect(
        vault.connect(user).approveExecutorAllowance(await mockToken.getAddress(), DEPOSIT_AMOUNT + 1n)
      ).to.be.revertedWith("Vault: insufficient balance for allowance");
    });

    it("Should not allow setting allowance if executor not set", async function () {
      const newVault = await (await ethers.getContractFactory("Vault")).deploy();
      
      await expect(
        newVault.connect(user).approveExecutorAllowance(await mockToken.getAddress(), WITHDRAW_AMOUNT)
      ).to.be.revertedWith("Vault: executor not set");
    });
  });

  describe("Executor Spending", function () {
    const allowanceAmount = ethers.parseEther("50");

    beforeEach(async function () {
      // Setup: deposit, set executor, and approve allowance
      await mockToken.connect(user).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(user).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
      await vault.approveExecutor(executor.address);
      await vault.connect(user).approveExecutorAllowance(await mockToken.getAddress(), allowanceAmount);
    });

    it("Should allow executor to spend from allowance", async function () {
      const spendAmount = ethers.parseEther("20");
      
      await expect(vault.connect(executor).spendAllowance(user.address, await mockToken.getAddress(), spendAmount))
        .to.emit(vault, "ExecutorSpent")
        .withArgs(user.address, await mockToken.getAddress(), spendAmount);
      
      expect(await vault.getAllowance(user.address, await mockToken.getAddress())).to.equal(allowanceAmount - spendAmount);
      expect(await vault.getBalance(user.address, await mockToken.getAddress())).to.equal(DEPOSIT_AMOUNT - spendAmount);
    });

    it("Should transfer tokens to executor", async function () {
      const spendAmount = ethers.parseEther("20");
      const executorBalanceBefore = await mockToken.balanceOf(executor.address);
      
      await vault.connect(executor).spendAllowance(user.address, await mockToken.getAddress(), spendAmount);
      
      const executorBalanceAfter = await mockToken.balanceOf(executor.address);
      expect(executorBalanceAfter - executorBalanceBefore).to.equal(spendAmount);
    });

    it("Should not allow non-executor to spend allowance", async function () {
      await expect(
        vault.connect(user2).spendAllowance(user.address, await mockToken.getAddress(), ethers.parseEther("20"))
      ).to.be.revertedWith("Vault: caller is not executor");
    });

    it("Should not allow spending more than allowance", async function () {
      await expect(
        vault.connect(executor).spendAllowance(user.address, await mockToken.getAddress(), allowanceAmount + 1n)
      ).to.be.revertedWith("Vault: allowance exceeded");
    });

    it("Should not allow spending with zero amount", async function () {
      await expect(
        vault.connect(executor).spendAllowance(user.address, await mockToken.getAddress(), 0)
      ).to.be.revertedWith("Vault: amount must be greater than 0");
    });
  });

  describe("Credit User", function () {
    beforeEach(async function () {
      await vault.approveExecutor(executor.address);
      // Give executor some tokens for testing
      await mockToken.transfer(executor.address, ethers.parseEther("1000"));
    });

    it("Should allow executor to credit tokens to user", async function () {
      const creditAmount = ethers.parseEther("25");
      
      // Transfer tokens to vault first (simulating trade result)
      await mockToken.connect(executor).transfer(await vault.getAddress(), creditAmount);
      
      await expect(vault.connect(executor).creditUser(user.address, await mockToken.getAddress(), creditAmount))
        .to.emit(vault, "Deposited")
        .withArgs(user.address, await mockToken.getAddress(), creditAmount);
      
      expect(await vault.getBalance(user.address, await mockToken.getAddress())).to.equal(creditAmount);
    });

    it("Should not allow non-executor to credit users", async function () {
      await expect(
        vault.connect(user).creditUser(user2.address, await mockToken.getAddress(), ethers.parseEther("10"))
      ).to.be.revertedWith("Vault: caller is not executor");
    });

    it("Should not allow crediting zero amount", async function () {
      await expect(
        vault.connect(executor).creditUser(user.address, await mockToken.getAddress(), 0)
      ).to.be.revertedWith("Vault: amount must be greater than 0");
    });

    it("Should not allow crediting to zero address", async function () {
      await expect(
        vault.connect(executor).creditUser(ethers.ZeroAddress, await mockToken.getAddress(), ethers.parseEther("10"))
      ).to.be.revertedWith("Vault: invalid user address");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await mockToken.connect(user).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(user).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
    });

    it("Should return correct user balance", async function () {
      expect(await vault.getBalance(user.address, await mockToken.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should return zero for user with no balance", async function () {
      expect(await vault.getBalance(user2.address, await mockToken.getAddress())).to.equal(0);
    });

    it("Should return correct vault token balance", async function () {
      expect(await vault.getVaultBalance(await mockToken.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should return correct allowance", async function () {
      await vault.approveExecutor(executor.address);
      const allowanceAmount = ethers.parseEther("30");
      await vault.connect(user).approveExecutorAllowance(await mockToken.getAddress(), allowanceAmount);
      
      expect(await vault.getAllowance(user.address, await mockToken.getAddress())).to.equal(allowanceAmount);
    });
  });
});
