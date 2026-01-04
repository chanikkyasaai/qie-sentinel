// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockUniswapV2Router
 * @notice Mock DEX router for testing Executor functionality
 * @dev Simulates Uniswap V2 Router behavior with simplified logic
 */
contract MockUniswapV2Router {
    address public WETH;
    address public factory;
    
    // Mock exchange rate: 1 input token = 0.95 output tokens (simulating 5% trading fee/slippage)
    uint256 public constant MOCK_RATE_NUMERATOR = 95;
    uint256 public constant MOCK_RATE_DENOMINATOR = 100;
    
    constructor() {
        WETH = address(0x1); // Mock WETH address
        factory = address(0x2); // Mock factory address
    }
    
    /**
     * @notice Mock implementation of swapExactTokensForTokens
     * @dev Transfers input tokens and returns output tokens based on mock rate
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "MockRouter: expired");
        require(path.length >= 2, "MockRouter: invalid path");
        require(amountIn > 0, "MockRouter: invalid amountIn");
        
        // Calculate mock output amount (95% of input, simulating trading costs)
        uint256 amountOut = (amountIn * MOCK_RATE_NUMERATOR) / MOCK_RATE_DENOMINATOR;
        require(amountOut >= amountOutMin, "MockRouter: insufficient output amount");
        
        // Transfer input tokens from sender to this contract
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        
        // Transfer output tokens to recipient
        IERC20(path[path.length - 1]).transfer(to, amountOut);
        
        // Build amounts array
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[amounts.length - 1] = amountOut;
        
        // Fill intermediate amounts (simplified)
        for (uint i = 1; i < amounts.length - 1; i++) {
            amounts[i] = amountIn; // Simplified - just use input amount
        }
        
        return amounts;
    }
    
    /**
     * @notice Get expected output amounts for given input
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external pure returns (uint256[] memory amounts) {
        require(path.length >= 2, "MockRouter: invalid path");
        
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        
        // Calculate output for each step
        uint256 currentAmount = amountIn;
        for (uint i = 1; i < path.length; i++) {
            currentAmount = (currentAmount * MOCK_RATE_NUMERATOR) / MOCK_RATE_DENOMINATOR;
            amounts[i] = currentAmount;
        }
        
        return amounts;
    }
    
    /**
     * @notice Get required input amounts for given output
     */
    function getAmountsIn(
        uint256 amountOut,
        address[] calldata path
    ) external pure returns (uint256[] memory amounts) {
        require(path.length >= 2, "MockRouter: invalid path");
        
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        
        // Calculate input for each step (reverse)
        uint256 currentAmount = amountOut;
        for (uint i = path.length - 1; i > 0; i--) {
            currentAmount = (currentAmount * MOCK_RATE_DENOMINATOR) / MOCK_RATE_NUMERATOR;
            amounts[i - 1] = currentAmount;
        }
        
        return amounts;
    }
    
    /**
     * @notice Fund the router with tokens for testing
     * @dev Allows tests to provide liquidity to the mock router
     */
    function fundRouter(address token, uint256 amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }
}
