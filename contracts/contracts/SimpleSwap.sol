// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimpleSwap
 * @dev Simple DEX for testing - uses 1:1 swap ratio
 */
contract SimpleSwap {
    address public owner;
    
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Swap tokens 1:1 ratio (for testing only)
     * Uniswap-compatible interface
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 /* deadline */
    ) external returns (uint256[] memory amounts) {
        require(amountIn > 0, "Amount must be > 0");
        require(path.length >= 2, "Invalid path");
        
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];
        
        // Simple 1:1 swap for testing
        uint256 amountOut = amountIn;
        require(amountOut >= amountOutMin, "Insufficient output");
        
        // Transfer tokens
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(to, amountOut);
        
        emit Swap(to, tokenIn, tokenOut, amountIn, amountOut);
        
        // Return amounts array (Uniswap format)
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;
        
        return amounts;
    }
    
    /**
     * @dev Fund the DEX with liquidity (owner only)
     */
    function addLiquidity(address token, uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }
    
    /**
     * @dev Withdraw tokens (owner only)
     */
    function withdraw(address token, uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        IERC20(token).transfer(msg.sender, amount);
    }
    
    /**
     * @dev Get token balance
     */
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
