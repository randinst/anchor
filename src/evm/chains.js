// chains.js - Default RPCs and chain IDs for EVM chains
export const DEFAULT_RPCS = {
  ethereum: 'https://eth.llamarpc.com',
  polygon: 'https://polygon-rpc.com',
  base: 'https://mainnet.base.org',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  optimism: 'https://mainnet.optimism.io',
  bsc: 'https://bsc-dataseed.binance.org',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc'
};

export const CHAIN_IDS = {
  ethereum: 1,
  polygon: 137,
  base: 8453,
  arbitrum: 42161,
  optimism: 10,
  bsc: 56,
  avalanche: 43114
};
