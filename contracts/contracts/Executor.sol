// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IUniswapV2Router.sol";
import "./interfaces/AggregatorV3Interface.sol";

/**
 * @title Executor
 * @author QIE Sentinel Team
 * @notice Executes automated trades based on AI signals from authorized backend
 * @dev This contract:
 *      - Does NOT hold user funds - only spends from Vault allowances
 *      - Integrates with Uniswap V2 compatible DEX routers
 *      - Enforces role-based access control for trade execution
 *      - Implements slippage protection and oracle validation
 *      - Uses SafeERC20 for secure token operations
 *      - Provides audit trail through comprehensive events
 */
contract Executor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    /// @notice Reference to the Vault contract
    IVault public vault;
    
    /// @notice Reference to the DEX router (Uniswap V2 compatible)
    IUniswapV2Router public router;
    
    /// @notice Authorized executor address (backend hot wallet)
    address public authorizedExecutor;
    
    /// @notice Trade execution tracking counter
    uint256 public tradeCount;
    
    /// @notice Default deadline offset for DEX trades (5 minutes)
    uint256 public constant TRADE_DEADLINE = 300;
    
    /// @notice Maximum slippage tolerance in basis points (500 = 5%)
    uint256 public maxSlippageBps;
    
    /// @notice Mapping of token address to Chainlink oracle feed address
    mapping(address => address) public oracleFeeds;
    
    /// @notice Whether oracle validation is required for trades
    bool public oracleValidationEnabled;
    
    // ============ Structs ============
    
    /**
     * @notice Trade execution record
     */
    struct Trade {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
        uint256 strategyId;
    }
    
    /// @notice Mapping of trade ID to trade data
    mapping(uint256 => Trade) public trades;
    
    // ============ Events ============
    
    /**
     * @notice Emitted when a trade is successfully executed
     * @param tradeId Unique trade identifier
     * @param user Address of the user whose funds were traded
     * @param tokenIn Address of input token
     * @param tokenOut Address of output token
     * @param amountIn Amount of input tokens swapped
     * @param amountOut Amount of output tokens received
     * @param timestamp Block timestamp of execution
     * @param strategyId AI strategy identifier
     */
    event TradeExecuted(
        uint256 indexed tradeId,
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp,
        uint256 strategyId
    );
    
    /**
     * @notice Emitted when authorized executor is updated
     * @param executor New authorized executor address
     */
    event ExecutorAuthorized(address indexed executor);
    
    /**
     * @notice Emitted when vault address is set
     * @param vault Vault contract address
     */
    event VaultSet(address indexed vault);
    
    /**
     * @notice Emitted when router address is set
     * @param router Router contract address
     */
    event RouterSet(address indexed router);
    
    /**
     * @notice Emitted when max slippage is updated
     * @param maxSlippageBps New maximum slippage in basis points
     */
    event MaxSlippageUpdated(uint256 maxSlippageBps);
    
    /**
     * @notice Emitted when oracle price validation occurs
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param oraclePrice Price from Chainlink oracle
     * @param routerPrice Price from DEX router
     * @param deviationBps Deviation in basis points
     */
    event OraclePriceValidated(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 oraclePrice,
        uint256 routerPrice,
        uint256 deviationBps
    );
    
    /**
     * @notice Emitted when oracle feed is set for a token
     * @param token Token address
     * @param feed Oracle feed address
     */
    event OracleFeedSet(address indexed token, address indexed feed);
    
    /**
     * @notice Emitted when oracle validation is enabled/disabled
     * @param enabled Whether oracle validation is enabled
     */
    event OracleValidationToggled(bool enabled);
    
    // ============ Modifiers ============
    
    /**
     * @notice Restricts function access to authorized executor only
     */
    modifier onlyExecutorRole() {
        require(msg.sender == authorizedExecutor, "Executor: caller is not authorized executor");
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @notice Initialize the Executor contract
     * @param _vault Address of the Vault contract
     * @param _router Address of the Uniswap V2 compatible router
     * @param _authorizedExecutor Address of the authorized backend executor
     */
    constructor(
        address _vault,
        address _router,
        address _authorizedExecutor
    ) Ownable(msg.sender) {
        require(_vault != address(0), "Executor: invalid vault address");
        require(_router != address(0), "Executor: invalid router address");
        require(_authorizedExecutor != address(0), "Executor: invalid executor address");
        
        vault = IVault(_vault);
        router = IUniswapV2Router(_router);
        authorizedExecutor = _authorizedExecutor;
        maxSlippageBps = 500; // 5% default max slippage
        oracleValidationEnabled = false; // Disabled by default, enable after setting feeds
        
        emit VaultSet(_vault);
        emit RouterSet(_router);
        emit ExecutorAuthorized(_authorizedExecutor);
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Execute a token swap trade on behalf of a user
     * @dev Only callable by authorized executor (backend hot wallet)
     * @param user Address of the user whose funds will be traded
     * @param tokenIn Address of input token to swap from
     * @param tokenOut Address of output token to swap to
     * @param amountIn Amount of input tokens to swap
     * @param amountOutMin Minimum acceptable output amount (slippage protection)
     * @param path Swap path through DEX (e.g., [tokenIn, WETH, tokenOut])
     * @param strategyId AI strategy identifier for tracking
     * @return amountOut Actual amount of output tokens received
     * @custom:security Only authorized executor can call this function
     * @custom:requirements
     *   - User must have sufficient allowance in Vault
     *   - amountOutMin must satisfy slippage requirements
     *   - Oracle price validation must pass
     */
    function executeTrade(
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint256 strategyId
    ) external onlyExecutorRole nonReentrant returns (uint256 amountOut) {
        require(user != address(0), "Executor: invalid user address");
        require(tokenIn != address(0), "Executor: invalid tokenIn address");
        require(tokenOut != address(0), "Executor: invalid tokenOut address");
        require(amountIn > 0, "Executor: amountIn must be greater than 0");
        require(amountOutMin > 0, "Executor: amountOutMin must be greater than 0");
        require(path.length >= 2, "Executor: invalid path length");
        require(path[0] == tokenIn, "Executor: path must start with tokenIn");
        require(path[path.length - 1] == tokenOut, "Executor: path must end with tokenOut");
        
        // 1. Check user's allowance in Vault
        uint256 allowance = vault.getAllowance(user, tokenIn);
        require(allowance >= amountIn, "Executor: insufficient vault allowance");
        
        // 2. Validate oracle price (if available)
        validateOraclePrice(tokenIn, tokenOut, amountIn, amountOutMin);
        
        // 3. Spend allowance from Vault - tokens transferred to Executor
        vault.spendAllowance(user, tokenIn, amountIn);
        
        // 4. Approve router to spend exact amount (guarded approval)
        IERC20(tokenIn).forceApprove(address(router), amountIn);
        
        // 5. Execute swap on DEX router
        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this), // Executor receives output tokens
            block.timestamp + TRADE_DEADLINE
        );
        
        // 6. Verify output amount meets minimum requirement
        amountOut = amounts[amounts.length - 1];
        require(amountOut >= amountOutMin, "Executor: slippage tolerance exceeded");
        
        // 7. Approve Vault to receive output tokens
        IERC20(tokenOut).forceApprove(address(vault), amountOut);
        
        // 8. Transfer output tokens to Vault
        IERC20(tokenOut).safeTransfer(address(vault), amountOut);
        
        // 9. Credit user's balance in Vault
        vault.creditUser(user, tokenOut, amountOut);
        
        // 10. Record trade
        trades[tradeCount] = Trade({
            user: user,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            timestamp: block.timestamp,
            strategyId: strategyId
        });
        
        emit TradeExecuted(
            tradeCount,
            user,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            block.timestamp,
            strategyId
        );
        
        tradeCount++;
        
        return amountOut;
    }
    
    /**
     * @notice Set the authorized executor address
     * @param _executor New executor address
     */
    function setAuthorizedExecutor(address _executor) external onlyOwner {
        require(_executor != address(0), "Executor: invalid executor address");
        authorizedExecutor = _executor;
        
        emit ExecutorAuthorized(_executor);
    }
    
    /**
     * @notice Update the vault contract address
     * @param _vault New vault address
     */
    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Executor: invalid vault address");
        vault = IVault(_vault);
        
        emit VaultSet(_vault);
    }
    
    /**
     * @notice Update the router contract address
     * @param _router New router address
     */
    function setRouter(address _router) external onlyOwner {
        require(_router != address(0), "Executor: invalid router address");
        router = IUniswapV2Router(_router);
        
        emit RouterSet(_router);
    }
    
    /**
     * @notice Update maximum slippage tolerance
     * @param _maxSlippageBps New max slippage in basis points (e.g., 500 = 5%)
     */
    function setMaxSlippage(uint256 _maxSlippageBps) external onlyOwner {
        require(_maxSlippageBps <= 1000, "Executor: slippage too high"); // Max 10%
        maxSlippageBps = _maxSlippageBps;
        
        emit MaxSlippageUpdated(_maxSlippageBps);
    }
    
    /**
     * @notice Set Chainlink oracle feed for a token
     * @param token Token address
     * @param feed Chainlink oracle feed address
     */
    function setOracleFeed(address token, address feed) external onlyOwner {
        require(token != address(0), "Executor: invalid token address");
        require(feed != address(0), "Executor: invalid feed address");
        
        oracleFeeds[token] = feed;
        
        emit OracleFeedSet(token, feed);
    }
    
    /**
     * @notice Enable or disable oracle validation
     * @param enabled Whether to enable oracle validation
     */
    function setOracleValidation(bool enabled) external onlyOwner {
        oracleValidationEnabled = enabled;
        
        emit OracleValidationToggled(enabled);
    }
    
    /**
     * @notice Stop loss mechanism for risk management
     * @dev TODO: Implement automatic position closure when loss threshold reached
     * @param user User whose position to close
     * @param token Token to liquidate
     * @param maxLossPercentage Maximum acceptable loss percentage
     */
    function stopLoss(
        address user,
        address token,
        uint256 maxLossPercentage
    ) external onlyExecutorRole {
        require(user != address(0), "Executor: invalid user");
        require(token != address(0), "Executor: invalid token");
        require(maxLossPercentage > 0 && maxLossPercentage <= 10000, "Executor: invalid loss percentage");
        
        // TODO: Implement stop loss logic
        // 1. Get user's current position value from Vault
        // 2. Calculate current profit/loss vs entry price (from oracle)
        // 3. If loss exceeds maxLossPercentage, trigger liquidation
        // 4. Execute swap to stablecoin or base asset
        // 5. Update user's balance in Vault
        
        revert("Executor: stopLoss not yet implemented");
    }
    
    /**
     * @notice Rebalance user's portfolio based on target allocations
     * @dev TODO: Implement multi-token portfolio rebalancing
     * @param user User whose portfolio to rebalance
     * @param targetTokens Array of target token addresses
     * @param targetPercentages Array of target percentages (basis points, must sum to 10000)
     */
    function rebalance(
        address user,
        address[] calldata targetTokens,
        uint256[] calldata targetPercentages
    ) external onlyExecutorRole {
        require(user != address(0), "Executor: invalid user");
        require(targetTokens.length == targetPercentages.length, "Executor: length mismatch");
        require(targetTokens.length > 0, "Executor: empty arrays");
        
        // TODO: Implement rebalancing logic
        // 1. Calculate total portfolio value across all tokens
        // 2. Determine current allocation percentages
        // 3. Calculate required swaps to reach target allocation
        // 4. Execute swaps in optimal order (minimize gas & slippage)
        // 5. Verify final allocation matches targets within tolerance
        
        revert("Executor: rebalance not yet implemented");
    }
    
    /**
     * @notice Emergency token recovery (only owner)
     * @dev Allows owner to recover tokens accidentally sent to contract
     * @param token Token address to recover
     * @param amount Amount to recover
     */
    function recoverToken(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Executor: invalid token");
        require(amount > 0, "Executor: invalid amount");
        
        IERC20(token).safeTransfer(msg.sender, amount);
    }
    
    /**
     * @notice Get total number of trades executed
     * @return Total trade count
     */
    function getTradeCount() external view returns (uint256) {
        return tradeCount;
    }
    
    /**
     * @notice Get trade data by trade ID
     * @param tradeId Trade identifier
     * @return Trade struct with execution details
     */
    function getTrade(uint256 tradeId) external view returns (Trade memory) {
        require(tradeId < tradeCount, "Executor: trade does not exist");
        return trades[tradeId];
    }
    
    /**
     * @notice Get expected output amounts from DEX router
     * @param amountIn Input token amount
     * @param path Swap path through DEX
     * @return amounts Array of expected amounts at each step
     */
    function getExpectedOutput(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts) {
        return router.getAmountsOut(amountIn, path);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Validate trade price against Chainlink oracle data
     * @dev Compares expected output from oracle vs actual router quote
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param amountOutMin Expected minimum output from router
     * @custom:security Prevents sandwich attacks and price manipulation
     */
    function validateOraclePrice(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) internal {
        // Skip validation if not enabled
        if (!oracleValidationEnabled) {
            return;
        }
        
        // Get oracle feeds for both tokens
        address feedIn = oracleFeeds[tokenIn];
        address feedOut = oracleFeeds[tokenOut];
        
        // If either feed is not set, skip validation
        if (feedIn == address(0) || feedOut == address(0)) {
            return;
        }
        
        // Fetch prices from Chainlink oracles
        uint256 priceIn = getChainlinkPrice(feedIn);
        uint256 priceOut = getChainlinkPrice(feedOut);
        
        require(priceIn > 0, "Executor: invalid oracle price for tokenIn");
        require(priceOut > 0, "Executor: invalid oracle price for tokenOut");
        
        // Calculate expected output based on oracle prices
        // Formula: expectedOut = (amountIn * priceIn) / priceOut
        uint256 expectedOut = (amountIn * priceIn) / priceOut;
        
        // Calculate deviation between router quote and oracle expectation
        uint256 deviation;
        if (amountOutMin > expectedOut) {
            deviation = ((amountOutMin - expectedOut) * 10000) / expectedOut;
        } else {
            deviation = ((expectedOut - amountOutMin) * 10000) / expectedOut;
        }
        
        // Ensure deviation is within acceptable tolerance
        require(deviation <= maxSlippageBps, "Executor: oracle deviation exceeded");
        
        emit OraclePriceValidated(tokenIn, tokenOut, expectedOut, amountOutMin, deviation);
    }
    
    /**
     * @notice Get latest price from Chainlink oracle feed
     * @param feed Chainlink oracle feed address
     * @return price Latest price from oracle (scaled to 18 decimals)
     */
    function getChainlinkPrice(address feed) internal view returns (uint256 price) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed);
        
        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        require(answer > 0, "Executor: invalid oracle price");
        require(updatedAt > 0, "Executor: oracle price not updated");
        require(answeredInRound >= roundId, "Executor: stale oracle data");
        require(block.timestamp - updatedAt <= 3600, "Executor: oracle price too old"); // Max 1 hour old
        
        uint8 decimals = priceFeed.decimals();
        
        // Scale price to 18 decimals for consistency
        if (decimals < 18) {
            price = uint256(answer) * (10 ** (18 - decimals));
        } else if (decimals > 18) {
            price = uint256(answer) / (10 ** (decimals - 18));
        } else {
            price = uint256(answer);
        }
        
        return price;
    }
}
