// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IUniswapV2Router
 * @notice Interface for Uniswap V2 Router and compatible DEX routers
 * @dev Implements the subset of router functions needed for token swaps
 */
interface IUniswapV2Router {
    /**
     * @notice Swap exact amount of input tokens for output tokens
     * @param amountIn The exact amount of input tokens to swap
     * @param amountOutMin The minimum amount of output tokens to receive (slippage protection)
     * @param path The token swap path (e.g., [tokenIn, WETH, tokenOut])
     * @param to The address to receive the output tokens
     * @param deadline The Unix timestamp after which the transaction will revert
     * @return amounts Array of amounts at each step of the swap path
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    /**
     * @notice Get the expected output amounts for a given input
     * @param amountIn The input amount
     * @param path The swap path
     * @return amounts Expected amounts at each step
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
    
    /**
     * @notice Get the required input amounts for a given output
     * @param amountOut The desired output amount
     * @param path The swap path
     * @return amounts Required amounts at each step
     */
    function getAmountsIn(
        uint256 amountOut,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
    
    /**
     * @notice Get the factory address
     * @return The factory contract address
     */
    function factory() external view returns (address);
    
    /**
     * @notice Get the WETH address
     * @return The WETH contract address
     */
    function WETH() external view returns (address);
}
