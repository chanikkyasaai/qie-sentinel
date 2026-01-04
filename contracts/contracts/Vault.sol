// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Vault
 * @author QIE Sentinel Team
 * @notice Securely stores user ERC20 tokens and manages executor permissions for automated trading
 * @dev This contract acts as a secure custody solution that:
 *      - Holds user deposits in segregated per-user, per-token accounting
 *      - Allows users to withdraw their funds at any time
 *      - Grants limited spending allowances to the Executor contract for automated trades
 *      - Implements reentrancy protection and safe token transfer patterns
 *      - Uses OpenZeppelin's SafeERC20 to handle tokens that don't strictly follow ERC20 standard
 */
contract Vault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    /// @notice Tracks each user's balance for each token: user => token => balance
    mapping(address => mapping(address => uint256)) public userBalances;
    
    /// @notice Tracks executor's spending allowance per user per token: user => token => allowance
    mapping(address => mapping(address => uint256)) public executorAllowances;
    
    /// @notice Address of the authorized Executor contract
    address public executor;
    
    // ============ Events ============
    
    /**
     * @notice Emitted when a user deposits tokens into the vault
     * @param user Address of the user making the deposit
     * @param token Address of the ERC20 token deposited
     * @param amount Amount of tokens deposited
     */
    event Deposited(address indexed user, address indexed token, uint256 amount);
    
    /**
     * @notice Emitted when a user withdraws tokens from the vault
     * @param user Address of the user making the withdrawal
     * @param token Address of the ERC20 token withdrawn
     * @param amount Amount of tokens withdrawn
     */
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    
    /**
     * @notice Emitted when the owner sets the executor contract address
     * @param executor Address of the new executor contract
     */
    event ExecutorApproved(address indexed executor);
    
    /**
     * @notice Emitted when a user grants or updates spending allowance for the executor
     * @param user Address of the user setting the allowance
     * @param token Address of the ERC20 token
     * @param amount New allowance amount
     */
    event AllowanceSet(address indexed user, address indexed token, uint256 amount);
    
    /**
     * @notice Emitted when executor spends from a user's allowance
     * @param user Address of the user whose funds are being spent
     * @param token Address of the ERC20 token
     * @param amount Amount spent by executor
     */
    event ExecutorSpent(address indexed user, address indexed token, uint256 amount);
    
    // ============ Constructor ============
    
    /**
     * @notice Initializes the Vault contract
     * @dev Sets the deployer as the initial owner
     */
    constructor() Ownable(msg.sender) {}
    
    // ============ External Functions ============
    
    /**
     * @notice Deposit ERC20 tokens into the vault
     * @dev Tokens must be approved for transfer before calling this function
     * @param token The ERC20 token contract address
     * @param amount The amount of tokens to deposit (in token's smallest unit)
     * @custom:requirements
     *   - amount must be greater than 0
     *   - caller must have approved this contract to spend at least `amount` tokens
     *   - token contract must not be malicious (uses SafeERC20 for protection)
     */
    function deposit(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Vault: amount must be greater than 0");
        require(token != address(0), "Vault: invalid token address");
        
        // Transfer tokens from user to vault using SafeERC20
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Update user's internal balance
        userBalances[msg.sender][token] += amount;
        
        emit Deposited(msg.sender, token, amount);
    }
    
    /**
     * @notice Withdraw ERC20 tokens from the vault
     * @dev Transfers tokens back to the user and updates internal accounting
     * @param token The ERC20 token contract address
     * @param amount The amount of tokens to withdraw (in token's smallest unit)
     * @custom:requirements
     *   - amount must be greater than 0
     *   - user must have sufficient balance in the vault
     */
    function withdraw(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Vault: amount must be greater than 0");
        require(userBalances[msg.sender][token] >= amount, "Vault: insufficient balance");
        
        // Update user balance before transfer (checks-effects-interactions pattern)
        userBalances[msg.sender][token] -= amount;
        
        // Transfer tokens back to user using SafeERC20
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, token, amount);
    }
    
    /**
     * @notice Set or update the authorized Executor contract address
     * @dev Only the contract owner can call this function
     * @param _executor Address of the new Executor contract
     * @custom:requirements
     *   - caller must be the contract owner
     *   - _executor address must not be zero address
     */
    function approveExecutor(address _executor) external onlyOwner {
        require(_executor != address(0), "Vault: invalid executor address");
        executor = _executor;
        
        emit ExecutorApproved(_executor);
    }
    
    /**
     * @notice Set spending allowance for the executor contract
     * @dev Allows users to grant the executor permission to spend up to a certain amount
     * @param token The ERC20 token contract address
     * @param amount The maximum amount the executor can spend on user's behalf
     * @custom:requirements
     *   - executor must be set by owner
     *   - user must have sufficient balance to cover the allowance
     */
    function approveExecutorAllowance(address token, uint256 amount) external {
        require(executor != address(0), "Vault: executor not set");
        require(token != address(0), "Vault: invalid token address");
        require(userBalances[msg.sender][token] >= amount, "Vault: insufficient balance for allowance");
        
        executorAllowances[msg.sender][token] = amount;
        
        emit AllowanceSet(msg.sender, token, amount);
    }
    
    /**
     * @notice Allows executor to spend from user's allowance
     * @dev Can only be called by the authorized executor contract
     * @param user The user whose funds will be spent
     * @param token The ERC20 token to spend
     * @param amount The amount to spend
     * @custom:requirements
     *   - caller must be the authorized executor
     *   - user must have sufficient allowance
     *   - user must have sufficient balance
     */
    function spendAllowance(
        address user,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(msg.sender == executor, "Vault: caller is not executor");
        require(amount > 0, "Vault: amount must be greater than 0");
        require(executorAllowances[user][token] >= amount, "Vault: allowance exceeded");
        require(userBalances[user][token] >= amount, "Vault: insufficient user balance");
        
        // Update allowance and balance
        executorAllowances[user][token] -= amount;
        userBalances[user][token] -= amount;
        
        // Transfer tokens to executor
        IERC20(token).safeTransfer(executor, amount);
        
        emit ExecutorSpent(user, token, amount);
    }
    
    /**
     * @notice Allows executor to credit tokens to a user's balance
     * @dev Used after successful trades to return output tokens to user
     * @param user The user to credit tokens to
     * @param token The ERC20 token to credit
     * @param amount The amount to credit
     * @custom:requirements
     *   - caller must be the authorized executor
     *   - executor must have transferred tokens to vault first
     */
    function creditUser(
        address user,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(msg.sender == executor, "Vault: caller is not executor");
        require(amount > 0, "Vault: amount must be greater than 0");
        require(user != address(0), "Vault: invalid user address");
        
        // Executor must transfer tokens to vault before calling this
        // We trust the executor to handle this correctly
        userBalances[user][token] += amount;
        
        emit Deposited(user, token, amount);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get a user's balance for a specific token
     * @param user The user address to query
     * @param token The token address to query
     * @return The user's balance of the specified token
     */
    function getBalance(address user, address token) external view returns (uint256) {
        return userBalances[user][token];
    }
    
    /**
     * @notice Get the executor's spending allowance for a user's token
     * @param user The user address to query
     * @param token The token address to query
     * @return The remaining allowance amount
     */
    function getAllowance(address user, address token) external view returns (uint256) {
        return executorAllowances[user][token];
    }
    
    /**
     * @notice Get the total balance held by the vault for a specific token
     * @param token The token address to query
     * @return The total balance of the token held in the contract
     */
    function getVaultBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
