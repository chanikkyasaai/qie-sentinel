import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address } from 'viem';
import executorABI from '../contracts/executorABI.json';

const EXECUTOR_ADDRESS = import.meta.env.VITE_EXECUTOR_ADDRESS as Address;

export function useExecutorContract() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  /**
   * Get last trade timestamp
   */
  const useGetLastTradeTime = () => {
    return useReadContract({
      address: EXECUTOR_ADDRESS,
      abi: executorABI,
      functionName: 'lastTradeTime',
    });
  };

  /**
   * Get minimum time between trades
   */
  const useGetMinTimeBetweenTrades = () => {
    return useReadContract({
      address: EXECUTOR_ADDRESS,
      abi: executorABI,
      functionName: 'minTimeBetweenTrades',
    });
  };

  /**
   * Check if executor is paused
   */
  const useIsPaused = () => {
    return useReadContract({
      address: EXECUTOR_ADDRESS,
      abi: executorABI,
      functionName: 'paused',
    });
  };

  /**
   * Get trade history count
   */
  const useGetTradeCount = () => {
    return useReadContract({
      address: EXECUTOR_ADDRESS,
      abi: executorABI,
      functionName: 'tradeCount',
    });
  };

  /**
   * Execute a trade (backend controlled)
   * Note: This would typically only be called by authorized backend wallet
   */
  const executeTrade = async (
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    minAmountOut: bigint,
    deadline: bigint
  ) => {
    return writeContract({
      address: EXECUTOR_ADDRESS,
      abi: executorABI,
      functionName: 'executeTrade',
      args: [tokenIn, tokenOut, amountIn, minAmountOut, deadline],
    });
  };

  /**
   * Get expected output amount for a swap
   */
  const useGetExpectedOutput = (
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint
  ) => {
    return useReadContract({
      address: EXECUTOR_ADDRESS,
      abi: executorABI,
      functionName: 'getExpectedOutput',
      args: [tokenIn, tokenOut, amountIn],
    });
  };

  return {
    // Read hooks
    useGetLastTradeTime,
    useGetMinTimeBetweenTrades,
    useIsPaused,
    useGetTradeCount,
    useGetExpectedOutput,

    // Write functions
    executeTrade,

    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}
