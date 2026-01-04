import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import vaultABI from '../contracts/vaultABI.json';

const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS as Address;

export function useVaultContract() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  /**
   * Get token balance in vault for connected wallet
   */
  const useGetBalance = (tokenAddress: Address, userAddress?: Address) => {
    return useReadContract({
      address: VAULT_ADDRESS,
      abi: vaultABI,
      functionName: 'getBalance',
      args: [tokenAddress, userAddress],
      query: {
        enabled: !!userAddress,
      }
    });
  };

  /**
   * Get total vault balance across all tokens
   */
  const useGetTotalBalance = (userAddress?: Address) => {
    return useReadContract({
      address: VAULT_ADDRESS,
      abi: vaultABI,
      functionName: 'totalUserBalance',
      args: [userAddress],
      query: {
        enabled: !!userAddress,
      }
    });
  };

  /**
   * Check if executor is authorized
   */
  const useIsAuthorized = (executorAddress: Address) => {
    return useReadContract({
      address: VAULT_ADDRESS,
      abi: vaultABI,
      functionName: 'authorizedExecutors',
      args: [executorAddress],
    });
  };

  /**
   * Deposit ETH into vault
   */
  const deposit = async (amount: string) => {
    return writeContract({
      address: VAULT_ADDRESS,
      abi: vaultABI,
      functionName: 'deposit',
      value: parseEther(amount),
    });
  };

  /**
   * Withdraw tokens from vault
   */
  const withdraw = async (tokenAddress: Address, amount: string) => {
    return writeContract({
      address: VAULT_ADDRESS,
      abi: vaultABI,
      functionName: 'withdraw',
      args: [tokenAddress, parseEther(amount)],
    });
  };

  /**
   * Approve token allowance for vault
   */
  const approveToken = async (tokenAddress: Address, amount: string) => {
    // This would typically call the ERC20 approve function
    // For now, returning a placeholder
    return writeContract({
      address: tokenAddress,
      abi: [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ type: 'bool' }]
        }
      ],
      functionName: 'approve',
      args: [VAULT_ADDRESS, parseEther(amount)],
    });
  };

  /**
   * Get token allowance
   */
  const useGetAllowance = (tokenAddress: Address, ownerAddress?: Address) => {
    return useReadContract({
      address: tokenAddress,
      abi: [
        {
          name: 'allowance',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
          ],
          outputs: [{ type: 'uint256' }]
        }
      ],
      functionName: 'allowance',
      args: [ownerAddress, VAULT_ADDRESS],
      query: {
        enabled: !!ownerAddress,
      }
    });
  };

  return {
    // Read hooks
    useGetBalance,
    useGetTotalBalance,
    useIsAuthorized,
    useGetAllowance,

    // Write functions
    deposit,
    withdraw,
    approveToken,

    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}
