// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVault
 * @notice Interface for the Vault contract
 * @dev Used by Executor to interact with Vault for fund management
 */
interface IVault {
    /**
     * @notice Get user's balance for a specific token
     * @param user The user address
     * @param token The token address
     * @return The user's balance
     */
    function getBalance(address user, address token) external view returns (uint256);
    
    /**
     * @notice Get executor's allowance for a user's token
     * @param user The user address
     * @param token The token address
     * @return The allowance amount
     */
    function getAllowance(address user, address token) external view returns (uint256);
    
    /**
     * @notice Spend from user's allowance
     * @param user The user whose funds to spend
     * @param token The token to spend
     * @param amount The amount to spend
     */
    function spendAllowance(address user, address token, uint256 amount) external;
    
    /**
     * @notice Credit tokens to a user's balance
     * @param user The user to credit
     * @param token The token to credit
     * @param amount The amount to credit
     */
    function creditUser(address user, address token, uint256 amount) external;
}
